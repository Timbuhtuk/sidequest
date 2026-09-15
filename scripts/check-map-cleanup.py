import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union
from map_geometry_cleanup import clean_walls, regularize_ring, wall_footprints

segments = clean_walls([[0, 0, 60, 0], [8, 2, 59, 2], [100, 0, 160, 0]], 0)
assert len(segments) == 2, 'Duplicate observations must merge, but the doorway must remain open'
union = unary_union([Polygon(p['outer'], p['holes']) for p in wall_footprints(segments, 4)])
assert not union.intersects(box(70, -10, 90, 10)), 'Wall cleanup sealed a door gap'
rough = [[0, 0], [100, 0], [100, 80], [68, 80], [68, 74], [62, 74], [62, 80], [0, 80]]
assert len(regularize_ring(rough, 0, hole=True)) == 4, 'Rectangular shaft retained raster teeth'
elbow = [[0, 0], [100, 0], [100, 30], [30, 30], [30, 100], [0, 100]]
assert abs(Polygon(regularize_ring(elbow, 0, hole=True)).area-Polygon(elbow).area) < 1, 'A genuine L-shaped opening was flattened'

models = [json.loads(file.read_text()) for file in Path('public/maps/models').glob('*.json') if file.stem != 'manifest']
for model in models:
    assert model['format'] == 3
    for floor in model['floors']:
        shapes = [Polygon(s['outer'], s['holes']) for s in floor['wallShapes']]
        assert all(p.is_valid and p.area > 0 for p in shapes), f"Invalid wall solid: {model['id']}/{floor['id']}"
        for q, shape in enumerate(shapes):
            for other in shapes[q+1:]:
                assert shape.intersection(other).area < .002, f"Overlapping wall solids: {model['id']}/{floor['id']}"

bank = next(model for model in models if model['id'] == 'bank')
def source_point(floor, p):
    return Point((p[0]+floor['sourceOffset'][0])*bank['scale'], (p[1]+floor['sourceOffset'][1])*bank['scale'])
upper = next(f for f in bank['floors'] if f['id'] == '9')
lobby = next(f for f in bank['floors'] if f['id'] == '8')
walls = unary_union([Polygon(s['outer'], s['holes']) for s in upper['wallShapes']])
assert not walls.intersects(source_point(upper, [385, 415]).buffer(.7)), 'Stair hatching became a full-height wall again'
lobby_surface = unary_union([Polygon(s['outer'], s['holes']) for s in lobby['shapes']])
assert lobby_surface.contains(source_point(lobby, [1430, 1850])), 'Dark red floor was cut out again'
assert not lobby_surface.contains(source_point(lobby, [710, 1700])), 'The actual lobby opening was filled in'
print('PASS: door gaps, rectangular/L-shaped openings, non-overlapping wall solids, bank stair hatching and red-floor regression checks.')
