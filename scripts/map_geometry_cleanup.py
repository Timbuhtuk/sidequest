"""Plan-space cleanup. All distances are full-resolution source pixels."""
import math
import cv2
import numpy as np
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union

def remove_stair_hatching(image, mask):
    r, g, b = [image[:, :, q].astype(float) for q in range(3)]
    grey = ((r > 120) & (g > 105) & (b > 90) & (abs(r-g) < 115) & (abs(g-b) < 38)).astype('uint8')*255
    # Thin white wall tops disappear here; broad stair ramps remain.
    grey = cv2.morphologyEx(grey, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    grey = cv2.morphologyEx(grey, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(grey, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    regions = np.zeros_like(mask)
    for contour in contours:
        area = cv2.contourArea(contour)
        rect = cv2.minAreaRect(contour)
        short, long = sorted(rect[1])
        if area < 180 or short < 12 or long < 24:
            continue
        cv2.drawContours(regions, [contour], -1, 255, -1)
    regions = cv2.dilate(regions, np.ones((7, 7), np.uint8))
    # Keep the gold outline of the stairwell; suppress white hatch strokes.
    hatch = (regions > 0) & (abs(r-g) < 115) & (abs(g-b) < 42)
    clean = mask.copy()
    clean[hatch] = 0
    return clean

def principal_angle(lines):
    if not lines:
        return math.radians(20)
    longest = sorted(lines, key=lambda p: -math.hypot(p[2]-p[0], p[3]-p[1]))[:80]
    x = y = 0.
    for a, b, c, d in longest:
        angle = math.atan2(d-b, c-a)
        weight = math.hypot(c-a, d-b)**2
        x += math.cos(4*angle)*weight
        y += math.sin(4*angle)*weight
    return math.atan2(y, x)/4

def clean_walls(lines, angle):
    """Cluster duplicate observations of the same wall, keeping door gaps."""
    basis = np.array([[math.cos(angle), -math.sin(angle)], [math.sin(angle), math.cos(angle)]])
    groups = []
    diagonal = []
    for line in sorted(lines, key=lambda p: -math.hypot(p[2]-p[0], p[3]-p[1])):
        a, b = np.array(line[:2])@basis, np.array(line[2:])@basis
        d = b-a
        axis = int(abs(d[1]) > abs(d[0]))
        length = abs(d[axis])
        if length < 25:
            continue
        if abs(d[1-axis])/length > .12:
            diagonal.append(line)
            continue
        coordinate = (a[1-axis]+b[1-axis])/2
        lo, hi = sorted([a[axis], b[axis]])
        found = next((group for group in groups if group['axis'] == axis and abs(group['coord']-coordinate) < 8), None)
        if found is None:
            found = {'axis': axis, 'coord': coordinate, 'weight': length, 'intervals': []}
            groups.append(found)
        else:
            found['coord'] = (found['coord']*found['weight']+coordinate*length)/(found['weight']+length)
            found['weight'] += length
        found['intervals'].append([lo, hi])
    result = []
    for group in groups:
        intervals = []
        for lo, hi in sorted(group['intervals']):
            if intervals and lo <= intervals[-1][1]+5:
                intervals[-1][1] = max(intervals[-1][1], hi)
            else:
                intervals.append([lo, hi])
        for lo, hi in intervals:
            a, b = np.zeros(2), np.zeros(2)
            a[group['axis']], b[group['axis']] = lo, hi
            a[1-group['axis']] = b[1-group['axis']] = group['coord']
            result.append([*(a@basis.T), *(b@basis.T)])
    # Preserve genuine oblique walls while rejecting near-identical observations.
    for line in diagonal:
        segment = LineString([line[:2], line[2:]])
        if not any(segment.intersection(LineString([old[:2], old[2:]]).buffer(7, cap_style=2)).length > segment.length*.75 for old in result):
            result.append(line)
    return result

def regularize_ring(ring, angle, hole=False):
    basis = np.array([[math.cos(angle), -math.sin(angle)], [math.sin(angle), math.cos(angle)]])
    rotated = np.array(ring, dtype=float)@basis
    original = Polygon(rotated).buffer(0)
    if original.geom_type != 'Polygon' or original.area < 1:
        return ring
    bounds = original.envelope
    # Pillar shadows make rectangular shafts look serrated in a color mask.
    rectangular = hole and original.area/bounds.area > .9
    if rectangular:
        rotated = np.array(bounds.exterior.coords[:-1])
    else:
        simplified = original.simplify(9 if hole else 6, preserve_topology=True)
        rotated = np.array(simplified.exterior.coords[:-1])
    count = len(rotated)
    parents = [list(range(count)), list(range(count))]
    def root(axis, q):
        while parents[axis][q] != q:
            q = parents[axis][q]
        return q
    for q in range(count):
        e = (q+1)%count
        delta = abs(rotated[e]-rotated[q])
        if delta[0] > delta[1]*4:
            parents[1][root(1, e)] = root(1, q)
        elif delta[1] > delta[0]*4:
            parents[0][root(0, e)] = root(0, q)
    snapped = rotated.copy()
    for axis in [0, 1]:
        for key in {root(axis, q) for q in range(count)}:
            indices = [q for q in range(count) if root(axis, q) == key]
            snapped[indices, axis] = rotated[indices, axis].mean()
    candidate = Polygon(snapped)
    if not candidate.is_valid or abs(candidate.area-original.area) > original.area*.15 or candidate.hausdorff_distance(original) > (60 if rectangular else 22):
        candidate = original.simplify(6, preserve_topology=True)
    return (np.array(candidate.exterior.coords[:-1])@basis.T).tolist()

def wall_footprints(lines, width):
    if not lines:
        return []
    solid = unary_union([LineString([line[:2], line[2:]]).buffer(width/2, cap_style=2, join_style=2) for line in lines])
    pieces = [solid] if solid.geom_type == 'Polygon' else list(solid.geoms)
    return [{'outer': [list(p) for p in piece.exterior.coords[:-1]],
             'holes': [[list(p) for p in ring.coords[:-1]] for ring in piece.interiors]} for piece in pieces if piece.geom_type == 'Polygon']
