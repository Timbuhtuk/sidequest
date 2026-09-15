"""Resolve stair symbols into shared connections between physical floors."""
import math
from shapely.geometry import Polygon, box
from shapely.affinity import rotate, translate
from shapely.ops import unary_union

def connect_stairs(floors, marks):
    ordered = sorted(floors, key=lambda floor: floor['elevation'])
    for floor in floors:
        floor['stairs'] = []
    paired = set()
    for lower, upper in zip(ordered, ordered[1:]):
        used_lower = set()
        for q, high in enumerate(marks.get(upper['id'], [])):
            candidates = []
            for e, low in enumerate(marks.get(lower['id'], [])):
                distance = math.dist(low['center'], high['center'])
                angle = abs((low['angle']-high['angle']+90)%180-90)
                if e not in used_lower and distance <= min(low['width'], high['width'])*.5 and angle < 10:
                    candidates.append((distance, e, low))
            if not candidates:
                continue
            _, e, low = min(candidates, key=lambda item: item[0])
            lower['stairs'].append({**low, 'toFloor': upper['id'], 'rise': upper['elevation']-lower['elevation']})
            used_lower.add(e)
            paired.add((lower['id'], e))
            paired.add((upper['id'], q))
    # A lone symbol on the highest floor describes a descent, never a new
    # level above the building. Symbols already paired must not be duplicated.
    if len(ordered) > 1:
        lower, upper = ordered[-2:]
        for q, high in enumerate(marks.get(upper['id'], [])):
            if (upper['id'], q) not in paired:
                lower['stairs'].append({**high, 'toFloor': upper['id'], 'rise': upper['elevation']-lower['elevation']})

    by_id = {floor['id']: floor for floor in floors}
    for lower in ordered:
        for stair in lower['stairs']:
            upper = by_id[stair['toFloor']]
            # Leave a landing at the arrival end; the descending flights must
            # be visible through the upper slab, including in isolated view.
            opening = box(-stair['width']/2, -stair['run']*.36, stair['width']/2, stair['run']*.52)
            opening = rotate(opening, stair['angle'], origin=(0, 0))
            opening = translate(opening, *stair['center'])
            surface = unary_union([Polygon(shape['outer'], shape['holes']) for shape in upper['shapes']]).difference(opening)
            pieces = [surface] if surface.geom_type == 'Polygon' else list(surface.geoms)
            upper['shapes'] = [{'outer': [[round(x, 3), round(y, 3)] for x, y in piece.exterior.coords[:-1]],
                                'holes': [[[round(x, 3), round(y, 3)] for x, y in ring.coords[:-1]] for ring in piece.interiors]}
                               for piece in pieces if piece.geom_type == 'Polygon' and piece.area > .001]
