"""Reviewed architecture corrections in original, full-sheet pixel coordinates."""
import math
from shapely.geometry import Polygon

# TF29 level 2: the east wing contains short door jambs below the automatic
# detector's length threshold. One slab shadow was mistaken for an oblique wall.
# Reference: tf29-raw.png, x 620..935 / y 785..1165.
REPLACED_EAST_LINES = [
    [628.2,811.6,902.8,911.4], [909.1,915,818.9,1163],
    [680.3,788.1,825.7,840.9], [784.8,905.9,744.5,1016.8],
    [738.9,1032.3,709.1,1114.1], [827.4,825.7,812.4,866.8],
    [830.6,820.2,923.1,853.9], [783,1014.1,865,1043.9],
    [848,955,821,1029], [775.8,929.7,849.2,956.3],
    [920.8,854.9,899.2,914.1], [671.4,814.8,724.6,834.2],
    [813,896,829,825],
]
EAST_WALLS = [
    [628,811,902,911],
    [680,788,826,841], [680,788,670,815], [670,815,724,835], [724,835,721,845],
    [826,841,817,866], [817,866,804,862], [804,862,800,874],
    [831,820,923,854], [923,854,902,911], [831,820,810,878],
    [902,911,909,915], [909,915,820,1160],
    [795,872,788,892], [784,905,744,1017], [738,1032,708,1118],
    [775.4,929,849,956], [869,899,863,915], [857,931,849,956],
    [849,956,822,1028.3], [751,998,772,1006], [783,1014,862.5,1043],
]

def refine_walls(model_id, level_id, lines, source_top):
    if (model_id, level_id) != ('tf29', 2):
        return lines
    result = [[a,b+source_top,c,d+source_top] for a,b,c,d in lines]
    for reference in REPLACED_EAST_LINES:
        def distance(line):
            a,b,c,d = line
            x,y,z,w = reference
            return min(max(math.hypot(a-x,b-y),math.hypot(c-z,d-w)),
                       max(math.hypot(a-z,b-w),math.hypot(c-x,d-y)))
        closest = min(range(len(result)), key=lambda q: distance(result[q]))
        if distance(result[closest]) > 12:
            raise ValueError('TF29 east-wing trace changed; review the manual correspondence')
        result.pop(closest)
    result.extend(EAST_WALLS)
    return [[a,b-source_top,c,d-source_top] for a,b,c,d in result]

def refine_floor_voids(model_id, floors, scale):
    if model_id != 'tf29':
        return
    floor = next(f for f in floors if f['id'] == '2')
    dx,dy = floor['sourceOffset']
    # These are shaded occupied rooms, not shafts. Keep the actual central
    # atrium and the explicit stair opening untouched.
    filled = 0
    for shape in floor['shapes']:
        holes = []
        for hole in shape['holes']:
            center = Polygon(hole).centroid
            x,y = center.x/scale-dx, center.y/scale-dy
            false_void = (820 < x < 920 and 820 < y < 890) or (480 < x < 565 and 695 < y < 745)
            if false_void:
                filled += 1
            else:
                holes.append(hole)
        shape['holes'] = holes
    if filled != 2:
        raise ValueError('TF29 shaded-room hole correspondence changed')
