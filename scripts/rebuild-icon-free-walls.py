"""Rebuild interior wall solids from the icon-free, transparent source sheets.

The sheet is a perspective illustration. Its surviving bright pixels describe
wall *edges*, not filled rooms. Existing registered floor slabs remain the
floor authority; stair treads and letterforms never become full-height walls.
"""
import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.map-tools'))
import cv2
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

from map_geometry_cleanup import clean_walls, principal_angle
from map_source_recovery import connect_wall_corners


SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
CATALOG = ROOT / 'map-compare/catalog.json'
MAP_IMAGES = ROOT / 'map-compare/dist'
MODELS = SITE / 'public/maps/models'
OUTPUT = SITE / 'outputs/icon-free-wall-review'


def sheet_paths():
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    result = {}
    for location in catalog['locations']:
        for floor in location['floors']:
            if floor['id'] != 'full':
                continue
            variant = next((item for item in floor['variants'] if item['kind'] == 'transparent'), None)
            if variant:
                result[location['id']] = MAP_IMAGES / variant['src']
    return result


def source_polygon_mask(floor, model, bounds, offset):
    left, top, right, bottom = bounds
    image = Image.new('L', (right-left, bottom-top), 0)
    draw = ImageDraw.Draw(image)
    scale = model['scale']
    dx, dy = offset

    def pixel(point):
        return (point[0]/scale-dx-left, point[1]/scale-dy-top)

    for shape in floor['shapes']:
        draw.polygon([pixel(p) for p in shape['outer']], fill=255)
        for hole in shape['holes']:
            draw.polygon([pixel(p) for p in hole], fill=0)
    mask = np.asarray(image)
    return cv2.dilate(mask, np.ones((43, 43), np.uint8))


def mask_known_stairs(mask, floor, model, bounds, offset):
    left, top = bounds[:2]
    for stair in floor['stairs']:
        x = stair['center'][0]/model['scale']-offset[0]-left
        y = stair['center'][1]/model['scale']-offset[1]-top
        width = stair['width']/model['scale']+22
        run = stair['run']/model['scale']+22
        corners = cv2.boxPoints(((x, y), (width, run), stair['angle'])).astype('int32')
        cv2.fillPoly(mask, [corners], 0)
    return mask


def architectural_lines(image, floor, model, bounds, offset):
    rgba = np.asarray(image.crop(bounds).convert('RGBA')).astype(np.int16)
    r, g, b, alpha = [rgba[:, :, q] for q in range(4)]
    visible = alpha > 0
    gold = visible & (r > 180) & (g > 145) & (g-b > 32) & (r-g < 58)
    white = visible & (r > 170) & (g > 170) & (b > 165) & (abs(r-g) < 30) & (abs(g-b) < 32)
    pink = visible & (r-g > 26) & (b > g-28) & (r > 190)
    # Stair flights retain warm pink treads after background removal. Suppress
    # neighbouring white strokes, while preserving the gold shaft boundary.
    stair_pixels = cv2.dilate(pink.astype('uint8'), np.ones((11, 11), np.uint8)) > 0
    candidate = (gold | (white & ~stair_pixels)).astype('uint8')*255
    candidate &= source_polygon_mask(floor, model, bounds, offset)
    candidate = mask_known_stairs(candidate, floor, model, bounds, offset)
    return candidate


def wall_segments(mask):
    lines = cv2.HoughLinesP(mask, 1, np.pi/720, threshold=13, minLineLength=11, maxLineGap=3)
    if lines is None:
        return []
    raw = lines.reshape(-1, 4).tolist()
    # Trace every orientation. Excluding vertical source strokes created many
    # of the missing partitions in the previous reconstruction.
    axis = principal_angle(raw)
    fitted = clean_walls(raw, axis, min_length=10)
    # Endpoint gaps left by anti-aliasing should meet perpendicular walls;
    # small door openings between collinear segments remain untouched.
    return connect_wall_corners(fitted, tolerance=4)


def wall_shapes(segments, floor, model, bounds, offset):
    if not segments:
        return []
    left, top = bounds[:2]
    scale = model['scale']
    dx, dy = offset
    def point(x, y):
        return ((x+left+dx)*scale, (y+top+dy)*scale)
    centerlines = [LineString([point(a, b), point(c, d)]) for a, b, c, d in segments]
    solid = unary_union([line.buffer(model['wallWidth']/2, cap_style=2, join_style=2) for line in centerlines])
    pieces = [solid] if solid.geom_type == 'Polygon' else list(solid.geoms)
    result = []
    for piece in pieces:
        if piece.is_empty or piece.area < .005:
            continue
        simplified = piece.simplify(.025, preserve_topology=True)
        if simplified.geom_type != 'Polygon' or not simplified.is_valid:
            simplified = piece
        result.append({'outer': [[round(x, 3), round(y, 3)] for x, y in simplified.exterior.coords[:-1]],
                       'holes': [[[round(x, 3), round(y, 3)] for x, y in ring.coords[:-1]] for ring in simplified.interiors]})
    return result


def merge_wall_shapes(shapes):
    """A floor may occupy several source panels; merge their shared walls."""
    solid = unary_union([Polygon(item['outer'], item['holes']) for item in shapes])
    pieces = [solid] if solid.geom_type == 'Polygon' else list(solid.geoms)
    return [{'outer': [[round(x, 3), round(y, 3)] for x, y in piece.exterior.coords[:-1]],
             'holes': [[[round(x, 3), round(y, 3)] for x, y in ring.coords[:-1]] for ring in piece.interiors]}
            for piece in pieces if piece.geom_type == 'Polygon' and piece.area > .005]


def review_image(image, floor, model, bounds, mask, segments, name):
    crop = image.crop(bounds).convert('RGBA')
    base = Image.new('RGBA', crop.size, '#161917')
    base.alpha_composite(crop)
    draw = ImageDraw.Draw(base)
    for a, b, c, d in segments:
        draw.line([(a, b), (c, d)], fill='#53f4c8', width=2)
    base.convert('RGB').save(OUTPUT / f'{name}-{floor["id"]}.png')


def build(model_id, sheet, apply):
    path = MODELS / f'{model_id}.json'
    model = json.loads(path.read_text(encoding='utf-8'))
    source = Image.open(sheet).convert('RGBA')
    if source.size != tuple(model['sourceSize']):
        raise ValueError(f'{model_id}: transparent sheet resolution differs from the model')
    report = []
    for floor in model['floors']:
        parts = floor.get('sourceParts') or floor.get('generatedParts') or [{'sourceBounds': floor['sourceBounds'], 'sourceOffset': floor['sourceOffset']}]
        shapes = []
        segment_count = 0
        for part in parts:
            bounds = part['sourceBounds']
            offset = part['sourceOffset']
            mask = architectural_lines(source, floor, model, bounds, offset)
            segments = wall_segments(mask)
            shapes.extend(wall_shapes(segments, floor, model, bounds, offset))
            segment_count += len(segments)
            if segments:
                review_image(source, floor, model, bounds, mask, segments, f'{model_id}-{bounds[1]}')
        if not shapes:
            raise ValueError(f'{model_id}/{floor["id"]}: no wall contours')
        old_count = len(floor['wallShapes'])
        floor['wallShapes'] = merge_wall_shapes(shapes)
        floor['walls'] = []
        floor['sourceParts'] = [{'sourceBounds': part['sourceBounds'], 'sourceOffset': part['sourceOffset']} for part in parts]
        floor.pop('wallSource', None)
        floor.pop('generatedParts', None)
        floor.pop('floorSource', None)
        report.append({'model': model_id, 'floor': floor['id'], 'oldSolids': old_count,
                       'solids': len(floor['wallShapes']), 'segments': segment_count, 'source': str(sheet.relative_to(ROOT))})
    model['reconstruction'] = 'icon-free-source-wall-edges'
    model['wallTrace'] = 'transparent wall lines, stair tread suppression, full-orientation fitting'
    if apply:
        path.write_text(json.dumps(model, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('models', nargs='*')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sheets = sheet_paths()
    selected = args.models or [item for item in sheets if item in {'bank','dubai','garm','koller','london','ridit','rvac','stedry','tf29','zelen'}]
    report = []
    for model_id in selected:
        report.extend(build(model_id, sheets[model_id], args.apply))
    (OUTPUT / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'models': len(selected), 'floors': len(report),
                      'oldSolids': sum(item['oldSolids'] for item in report),
                      'solids': sum(item['solids'] for item in report),
                      'segments': sum(item['segments'] for item in report)}, indent=2))


if __name__ == '__main__':
    main()
