"""Reconstruct vector floors and wall segments from full-resolution map plans.

Source pixels are authoring data only: no map image is used by the 3D renderer.
Floor elevations / wall heights are schematic, not surveyed game dimensions.
"""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
import cv2
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import Polygon
from map_geometry_cleanup import remove_stair_hatching, principal_angle, clean_walls, regularize_ring, wall_footprints
from map_stair_connections import connect_stairs
from map_manual_refinements import refine_walls, refine_floor_voids

ROOT = Path.cwd()
OUT = ROOT / 'public/maps/models'
OUT.mkdir(parents=True, exist_ok=True)

# Bounds separate diagrams on each source sheet, not physical world locations.
# Explicit offsets register repeated stairs, elevators and hangar corners.
CONFIG = {
    'garm': {'cuts': [0, 1850, 3650, 5100, 7000], 'offsets': [[0, 0], [0, -1570], [0, -3170], [0, -4770]], 'levels': [4, 3, 2, 1]},
    'tf29': {'cuts': [0, 520, 1350, 2300], 'offsets': [[0, 1760], [0, 802], [0, 0]], 'levels': [3, 2, 1]},
    'zelen': {'cuts': [0, 650, 1170, 1770, 2500], 'offsets': [[0, 1814], [0, 1234], [0, 654], [0, 0]], 'levels': [4, 3, 2, 1]},
    'koller': {'cuts': [0, 760, 1460, 2600], 'offsets': [[0, 1798], [0, 966], [0, 0]], 'levels': [3, 2, 1]},
    'dubai': {'cuts': [0, 1000, 2600, 7400], 'levels': [3, 2, 1]},
    'london': {'cuts': [0, 1190, 2090, 2640, 4170, 5770, 6330, 7940, 9600], 'levels': [8, 7, 6, 5, 4, 3, 2, 1]},
    'ridit': {'cuts': [0, 1190, 1750, 2520, 4250, 5700], 'levels': [5, 4, 3, 2, 1]},
    'bank': {'cuts': [0, 1190, 2260, 3350, 4250, 4990, 5740, 6470, 7180, 8000], 'levels': [9, 8, 7, 6, 5, 4, 3, 2, 1]},
    'rvac': {'cuts': [0, 1190, 2000, 2950, 3960, 4800, 6250, 7800], 'levels': [7, 6, 5, 4, 3, 2, 1]},
    'stedry': {'cuts': [0, 1870, 2670, 3790, 5050, 6350, 7510, 8520, 9000], 'levels': [8, 7, 6, 5, 4, 3, 2, 1]},
}

# Remove stair hatch marks and elevator symbols before wall tracing. Their
# drawn diagonal edges would otherwise become spurious full-height walls.
STAIRS = {
    'tf29': {1: [[617, 1540, 4.5, 6.4, 20]], 2: [[617, 738, 4.5, 6.4, 20]]},
    'zelen': {1: [[688, 2260, 4.3, 5.4, 20]], 2: [[688, 1606, 4.3, 5.4, 20]], 3: [[688, 1026, 4.3, 5.4, 20]], 4: [[688, 446, 4.3, 5.4, 20]]},
    'koller': {2: [[832, 1085, 4.0, 5.0, 30]], 3: [[832, 253, 4.0, 5.0, 30]]},
}

# Reviewed icon-free floor crops. Floor surfaces and registration still use
# original full sheets; generated shading must not create or fill floor voids.
CLEANED_WALLS = {('tf29', 1): 'tf29-level-1-cleaned.png',
                 ('tf29', 2): 'tf29-level-2-cleaned.png',
                 ('bank', 8): 'bank-level-8-cleaned.png'}

def trace_mask(image):
    r, g, b = [image[:, :, q].astype(float) for q in range(3)]
    colored = (r > 36) & (g > 27) & (r > b * 1.35) & (g > b * 1.18)
    colored |= (r > 65) & (r > g*1.8) & (r > b*2) & (g >= 15)
    near_floor = cv2.dilate(colored.astype('uint8'), np.ones((25, 25), np.uint8)) > 0
    bright = (r > 110) & (g > 90) & (r > b * .92) & near_floor
    mask = (colored | bright).astype('uint8') * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((4, 4), np.uint8))
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    clean = np.zeros_like(mask)
    if hierarchy is None:
        return clean
    for q, contour in enumerate(contours):
        if hierarchy[0][q][3] != -1 or cv2.contourArea(contour) < 600:
            continue
        cv2.drawContours(clean, [contour], -1, 255, -1)
        child = hierarchy[0][q][2]
        while child != -1:
            # Text and tiny symbols must not become holes in the building.
            if cv2.contourArea(contours[child]) > 1300 and min(cv2.minAreaRect(contours[child])[1]) > 25:
                hole_mask = np.zeros_like(mask)
                cv2.drawContours(hole_mask, [contours[child]], -1, 255, -1)
                # Pale machinery and stair symbols are not atrium voids.
                if float(np.median(image[:, :, 0][hole_mask > 0])) < 48:
                    cv2.drawContours(clean, [contours[child]], -1, 0, -1)
            child = hierarchy[0][child][0]
    return clean

def line_mask(image, remove_icons=True):
    r, g, b = [image[:, :, q].astype(float) for q in range(3)]
    mask = ((r > 125) & (g > 105) & (r > b * .92)).astype('uint8') * 255
    # Exclude grey legends and background district outlines.
    gold = ((r > g * 1.04) & (g > b * 1.12) & (r > 85)).astype('uint8') * 255
    nearby = cv2.dilate(gold, np.ones((35, 35), np.uint8))
    if not remove_icons:
        return cv2.bitwise_and(mask, nearby)
    icons = ((r > 180) & (g > 130) & (b < g * .58)).astype('uint8') * 255
    icons = cv2.dilate(icons, np.ones((9, 9), np.uint8))
    return cv2.bitwise_and(cv2.bitwise_and(mask, nearby), cv2.bitwise_not(icons))

def walls_from_mask(mask):
    lines = cv2.HoughLinesP(mask, 1, np.pi / 720, threshold=28, minLineLength=32, maxLineGap=5)
    result = []
    if lines is None:
        return result
    for line in sorted(lines.reshape(-1, 4).tolist(), key=lambda p: -((p[0]-p[2])**2+(p[1]-p[3])**2)):
        a, b = np.array(line[:2], dtype=float), np.array(line[2:], dtype=float)
        length = np.linalg.norm(b-a)
        direction = (b-a) / length
        # Raster shadow sides are vertical; these are not room walls.
        if abs(direction[0]) < .08:
            continue
        duplicate = False
        for old in result:
            c, d = np.array(old[:2]), np.array(old[2:])
            od = d-c
            if abs(np.dot(direction, od) / np.linalg.norm(od)) < .998:
                continue
            distance = abs(direction[0] * (c-a)[1] - direction[1] * (c-a)[0])
            ends = sorted([np.dot(c-a, direction), np.dot(d-a, direction)])
            if distance < 5 and min(length, ends[1]) - max(0, ends[0]) > min(length, np.linalg.norm(od)) * .55:
                duplicate = True
                break
        if not duplicate:
            result.append(line)
    return result

def polygons(mask, angle):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    result = []
    if hierarchy is None:
        return result
    for q, c in enumerate(contours):
        if hierarchy[0][q][3] != -1 or cv2.contourArea(c) < 500:
            continue
        poly = {'outer': cv2.approxPolyDP(c, 2.8, True).reshape(-1, 2).tolist(), 'holes': []}
        child = hierarchy[0][q][2]
        while child != -1:
            h = cv2.approxPolyDP(contours[child], 2.8, True).reshape(-1, 2).tolist()
            if len(h) >= 3:
                poly['holes'].append(h)
            child = hierarchy[0][child][0]
        # Pixel contours can touch themselves at a diagonal corner. Resolve
        # those contacts before triangulation rather than sealing a void.
        outer = regularize_ring(poly['outer'], angle)
        holes = [regularize_ring(hole, angle, hole=True) for hole in poly['holes']]
        valid = Polygon(outer, holes).buffer(0)
        pieces = [valid] if valid.geom_type == 'Polygon' else list(valid.geoms)
        for piece in pieces:
            if piece.geom_type != 'Polygon' or piece.area < 250:
                continue
            result.append({'outer': [list(p) for p in list(piece.exterior.coords)[:-1]],
                           'holes': [[list(p) for p in list(ring.coords)[:-1]] for ring in piece.interiors]})
    return result

def register_layers(masks):
    """Translation only: source sheets use a shared scale and bearing.

    Common wall runs determine the offset. Score is retained for review;
    automatically registered locations are explicitly labelled drafts in UI.
    """
    scale = .14
    small = [cv2.resize(m, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) for m in masks]
    reference = max(range(len(small)), key=lambda q: np.count_nonzero(small[q]))
    ref = small[reference]
    offsets = [[0, 0] for _ in masks]
    scores = [1.0 for _ in masks]
    pad = max(max(m.shape) for m in small)
    canvas = cv2.copyMakeBorder(ref, pad, pad, pad, pad, cv2.BORDER_CONSTANT)
    canvas = cv2.GaussianBlur(canvas, (5, 5), 0)
    for q, template in enumerate(small):
        if q == reference:
            continue
        template = cv2.GaussianBlur(template, (5, 5), 0)
        correlation = cv2.matchTemplate(canvas, template, cv2.TM_CCORR_NORMED)
        _, score, _, location = cv2.minMaxLoc(correlation)
        offsets[q] = [round((location[0]-pad)/scale), round((location[1]-pad)/scale)]
        scores[q] = round(score, 3)
    return offsets, scores

manifest = []
sources = {s['id']: s for s in json.loads((ROOT/'public/maps/plans/sources.json').read_text(encoding='utf-8-sig'))}
for id, config in CONFIG.items():
    if len(sys.argv) > 1 and id not in sys.argv[1:]:
        continue
    image = np.asarray(Image.open(ROOT/f'public/maps/plans/{id}-raw.png').convert('RGB'))
    slices = [image[a:b] for a, b in zip(config['cuts'], config['cuts'][1:])]
    masks = [trace_mask(part) for part in slices]
    wall_sources = []
    for q, part in enumerate(slices):
        name = CLEANED_WALLS.get((id, config['levels'][q]))
        if name:
            cleaned = Image.open(ROOT/'public/maps/plans/cleaned'/name).convert('RGB')
            if abs(cleaned.width/cleaned.height-part.shape[1]/part.shape[0]) > .003:
                raise ValueError(f'Cleaned map aspect ratio changed: {name}')
            wall_sources.append(np.array(cleaned.resize((part.shape[1], part.shape[0]), Image.Resampling.LANCZOS)))
        else:
            wall_sources.append(part)
    original_wall_masks = [remove_stair_hatching(part, line_mask(part)) for part in slices]
    wall_masks = [remove_stair_hatching(part, line_mask(part, remove_icons=(id, config['levels'][q]) not in CLEANED_WALLS))
                  for q, part in enumerate(wall_sources)]
    for q, level_id in enumerate(config['levels']):
        for x, y, width, run, angle in STAIRS.get(id, {}).get(level_id, []):
            box = cv2.boxPoints(((x, y-config['cuts'][q]), (width/.055+8, run/.055+8), angle)).astype(np.int32)
            cv2.fillPoly(wall_masks[q], [box], 0)
            cv2.fillPoly(original_wall_masks[q], [box], 0)
    if 'offsets' in config:
        offsets = [[x, y + config['cuts'][q]] for q, (x, y) in enumerate(config['offsets'])]
        scores = [1.0] * len(slices)
    elif (OUT/f'{id}.json').exists():
        previous = json.loads((OUT/f'{id}.json').read_text(encoding='utf-8'))
        offsets = [[floor['sourceOffset'][0], floor['sourceOffset'][1]+config['cuts'][q]] for q, floor in enumerate(previous['floors'])]
        scores = [floor['registrationScore'] for floor in previous['floors']]
    else:
        offsets, scores = register_layers(wall_masks)
    scale = .055
    levels = []
    stair_marks = {}
    preview = Image.new('RGB', (600 * len(slices), 720), '#111611')
    pd = ImageDraw.Draw(preview)
    for q, mask in enumerate(masks):
        dx, dz = offsets[q]
        def point(p):
            return [round((p[0]+dx)*scale, 3), round((p[1]+dz)*scale, 3)]
        raw_lines = walls_from_mask(wall_masks[q])
        angle = principal_angle(walls_from_mask(original_wall_masks[q]))
        shapes = polygons(mask, angle)
        wall_lines = clean_walls(raw_lines, angle)
        wall_lines = refine_walls(id, config['levels'][q], wall_lines, config['cuts'][q])
        footprint = wall_footprints(wall_lines, .18/scale)
        level = {'id': str(config['levels'][q]), 'elevation': (config['levels'][q]-1)*5.0,
                 'sourceBounds': [0, config['cuts'][q], image.shape[1], config['cuts'][q+1]],
                 'sourceOffset': [dx, dz-config['cuts'][q]], 'registrationScore': scores[q],
                 'shapes': [{'outer': [point(p) for p in s['outer']], 'holes': [[point(p) for p in h] for h in s['holes']]} for s in shapes],
                 'walls': [[*point(w[:2]), *point(w[2:])] for w in wall_lines]}
        level['wallShapes'] = [{'outer': [point(p) for p in s['outer']], 'holes': [[point(p) for p in h] for h in s['holes']]} for s in footprint]
        if (id, config['levels'][q]) in CLEANED_WALLS:
            level['wallSource'] = '/maps/plans/cleaned/'+CLEANED_WALLS[(id, config['levels'][q])]
        stair_marks[level['id']] = [{'center': point([x, y-config['cuts'][q]]), 'width': width, 'run': run, 'angle': angle}
                                   for x, y, width, run, angle in STAIRS.get(id, {}).get(config['levels'][q], [])]
        levels.append(level)
        p = Image.fromarray(mask).convert('RGB')
        draw = ImageDraw.Draw(p)
        for wall in wall_lines:
            draw.line(wall, fill='#ffcb6f', width=5)
        p.thumbnail((590, 660)); preview.paste(p, (q*600, 40))
        pd.text((q*600+10, 10), f'{id} / level {level["id"]} / {scores[q]}', fill='white')
    connect_stairs(levels, stair_marks)
    refine_floor_voids(id, levels, scale)
    all_points = np.array([p for level in levels for shape in level['shapes'] for p in shape['outer']])
    center = ((all_points.min(axis=0)+all_points.max(axis=0))/2).tolist()
    model = {'id': id, 'format': 3, 'source': sources[id+'-raw']['page'], 'sourceImage': sources[id+'-raw']['url'],
             'sourceSize': [image.shape[1], image.shape[0]], 'scale': scale, 'center': center,
             'registration': 'landmarks' if 'offsets' in config else 'automatic',
             'slabDepth': .35, 'wallHeight': 2.8, 'wallWidth': .18, 'floors': levels}
    (OUT/f'{id}.json').write_text(json.dumps(model, separators=(',', ':')), encoding='utf-8')
    preview.save(ROOT/f'outputs/{id}-vector-review.png')
    manifest.append({'id': id, 'floors': len(levels), 'polygons': sum(len(f['shapes']) for f in levels), 'walls': sum(len(f['walls']) for f in levels), 'scores': scores})
    print(manifest[-1])
if len(sys.argv) == 1:
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')

