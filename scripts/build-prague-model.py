"""Line-art experiment: vectorize, validate against the source, rectify, extrude.

Run from site/. OpenCV and Shapely live in the workspace's .map-tools.
The generated intermediate is versioned; rebuilding never calls imagegen.
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
import cv2
import numpy as np
from PIL import Image, ImageDraw
from shapely import affinity
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT = Path('public/maps')
lines = np.array(Image.open(ROOT / 'plans/prague-lines.png').convert('L'))
h, w = lines.shape
source_image = Image.open(ROOT / 'plans/prague-raw.png').convert('RGB')
source = np.array(source_image.resize((w, h), Image.Resampling.LANCZOS))
# The raw source uses solid ochre for building footprints, black for open space.
occupied = ((source[:, :, 0] > 65) & (source[:, :, 1] > 55)).astype('uint8')
occupied = cv2.morphologyEx(occupied, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
ink = (lines < 140).astype('uint8')
ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))

def parts(geometry):
    if geometry.is_empty:
        return []
    return [geometry] if geometry.geom_type == 'Polygon' else [p for p in geometry.geoms if p.geom_type == 'Polygon']

def vectorize(mask):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    result = []
    if hierarchy is None:
        return result
    for q, contour in enumerate(contours):
        if hierarchy[0][q][3] != -1 or cv2.contourArea(contour) < 60:
            continue
        outer = cv2.approxPolyDP(contour, 1.6, True).reshape(-1, 2)
        holes = []
        child = hierarchy[0][q][2]
        while child != -1:
            if cv2.contourArea(contours[child]) > 80:
                ring = cv2.approxPolyDP(contours[child], 1.6, True).reshape(-1, 2)
                if len(ring) >= 3:
                    holes.append(ring)
            child = hierarchy[0][child][0]
        if len(outer) >= 3:
            result.extend(parts(Polygon(outer, holes).buffer(0)))
    return result

# Flood white regions; the unbounded exterior and black-source courtyards are
# rejected. A closed line does not by itself imply a building.
count, regions, stats, _ = cv2.connectedComponentsWithStats(1-ink, 8)
accepted = np.zeros((h, w), np.uint8)
accepted_regions = 0
for q in range(1, count):
    x, y, width, height, area = stats[q]
    if area < 100 or x == 0 or y == 0 or x+width == w or y+height == h:
        continue
    region = regions == q
    if occupied[region].mean() >= .72:
        accepted[region] = 1
        accepted_regions += 1

# Restore the ink-width boundary lost by filling white interiors, and dissolve
# shared internal outlines before any extrusion to avoid doubled wall volumes.
generated = unary_union(vectorize(accepted)).buffer(1.7, join_style=2).buffer(-.2, join_style=2)
reference = vectorize(occupied)
footprints = []
reviews = []
for q, original in enumerate(reference):
    if original.area < 130:
        continue
    candidates = [p for p in parts(generated) if p.intersection(original).area > p.area*.5]
    candidate = unary_union(candidates)
    intersection = candidate.intersection(original).area
    union = candidate.union(original).area
    score = intersection/union if union else 0
    # Corrections use the full-coverage source mask, never invented connections.
    chosen = candidate if score >= .82 else original
    footprints.extend(parts(chosen))
    reviews.append({'sourceRegion': q, 'iou': round(score, 4), 'contour': 'generated' if score >= .82 else 'source-corrected'})

footprints = [Polygon(p.exterior, [r for r in p.interiors if Polygon(r).area > 80]).simplify(1.5, preserve_topology=True)
              for p in parts(unary_union(footprints)) if p.area > 130]

# Eye estimate: 20 degrees clockwise in the source. Long bank/railway edges
# confirm the plan is already orthographic; no guessed perspective stretch.
segments = cv2.HoughLinesP(ink*255, 1, np.pi/1800, 50, minLineLength=100, maxLineGap=5)
angles = []
for x1, y1, x2, y2 in segments.reshape(-1, 4):
    angle = math.degrees(math.atan2(y2-y1, x2-x1)) % 90
    if 10 < angle < 30:
        angles.append((angle, math.hypot(x2-x1, y2-y1)))
angle = sum(a*weight for a, weight in angles)/sum(weight for _, weight in angles)
theta = math.radians(-angle)
c, s = math.cos(theta), math.sin(theta)
rectified = [affinity.rotate(p, -angle, origin=(0, 0)) for p in footprints]
scale = .17
bounds = unary_union(rectified).bounds
center = [(bounds[0]+bounds[2])*scale/2, (bounds[1]+bounds[3])*scale/2]

def shape(p):
    ring = lambda coords: [[round(x*scale, 4), round(y*scale, 4)] for x, y in list(coords)[:-1]]
    return {'outer': ring(p.exterior.coords), 'holes': [ring(r.coords) for r in p.interiors]}

# A schematic ground plinth connects streets; building courtyards remain open
# above it. It is not presented as a traced interior floor or accessible route.
ground = unary_union(rectified).buffer(30, join_style=2).buffer(-24, join_style=2)
floor = {'id': '1', 'elevation': 0, 'sourceBounds': [0, 0, 6000, 4000], 'sourceOffset': [0, 0],
         'registrationScore': 1, 'shapes': [shape(p) for p in parts(ground)], 'walls': [], 'wallShapes': [], 'stairs': []}
buildings = [{'id': f'block-{q+1:02}', 'floor': '1', 'height': 6, 'shape': shape(p)} for q, p in enumerate(rectified)]
model = {'id': 'prague', 'format': 3, 'kind': 'city',
         'source': 'https://deusex.fandom.com/wiki/File:Praha_overmap_flat_02.png',
         'sourceImage': '/maps/plans/prague-raw.png', 'sourceSize': [6000, 4000],
         'sourceTransform': [c*w/6000, -s*h/4000, 0, s*w/6000, c*h/4000, 0],
         'scale': scale, 'center': center, 'registration': 'landmarks',
         'slabDepth': .35, 'wallHeight': 6, 'wallWidth': .18, 'floors': [floor], 'buildings': buildings}
(ROOT / 'models/prague.json').write_text(json.dumps(model, separators=(',', ':')), encoding='utf-8')

def svg(polygons, path):
    box = unary_union(polygons).bounds
    commands = []
    for p in polygons:
        rings = [p.exterior, *p.interiors]
        commands.append(' '.join('M '+' L '.join(f'{x:.2f},{y:.2f}' for x, y in list(r.coords)[:-1])+' Z' for r in rings))
    paths = ''.join(f'<path d="{d}"/>' for d in commands)
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box[0]-10} {box[1]-10} {box[2]-box[0]+20} {box[3]-box[1]+20}"><rect x="{box[0]-10}" y="{box[1]-10}" width="100%" height="100%" fill="white"/><g fill="none" stroke="black" stroke-width="1.4" stroke-linejoin="miter">{paths}</g></svg>', encoding='utf-8')

svg(footprints, ROOT / 'plans/prague-vector.svg')
svg(rectified, ROOT / 'plans/prague-top.svg')
report = {'visualAngleEstimate': 20, 'measuredRotationDegrees': round(angle, 3), 'perspectiveCorrection': 'none: source is an orthographic plan',
          'generatedSize': [w, h], 'acceptedClosedRegions': accepted_regions, 'buildings': len(buildings),
          'generatedFootprints': sum(r['contour'] == 'generated' for r in reviews),
          'sourceCorrectedFootprints': sum(r['contour'] != 'generated' for r in reviews), 'review': reviews}
Path('docs/prague-line-map-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
# Inspectable comparison: green is retained vector geometry over the source.
review = Image.fromarray(source).convert('RGBA')
draw = ImageDraw.Draw(review)
for p in footprints:
    draw.line(list(p.exterior.coords), fill='#5affad', width=2)
    for r in p.interiors:
        draw.line(list(r.coords), fill='#5affad', width=2)
review.convert('RGB').save('outputs/prague-vector-review.png')
print(json.dumps({k: v for k, v in report.items() if k != 'review'}))
