import json
import math
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union

model = json.loads(Path('public/maps/models/prague.json').read_text())
polygons = [Polygon(b['shape']['outer'], b['shape']['holes']) for b in model['buildings']]
assert all(p.is_valid and p.area > 0 for p in polygons)
assert abs(sum(p.area for p in polygons)-unary_union(polygons).area) < .01, 'Overlapping building volumes'
assert all(b['height'] > model['slabDepth'] for b in model['buildings'])
assert not model['floors'][0]['stairs'], 'The city overview cannot imply stair connections'
m = model['sourceTransform']
def planar(x, y):
    return Point((m[0]*x+m[1]*y+m[2])*model['scale'], (m[3]*x+m[4]*y+m[5])*model['scale'])
# Witnesses read from the original high-resolution city plan.
for name, pixel in [('Chikane courtyard', (4040, 830)), ('Capek square', (2180, 3150)), ('Railway', (2510, 2490))]:
    assert not unary_union(polygons).contains(planar(*pixel)), f'{name} was filled by a building'
for name, pixel in [('Bank', (730, 1080)), ('Zelen', (1780, 2720)), ('Theater', (5150, 2070))]:
    assert unary_union(polygons).contains(planar(*pixel)), f'{name} missing'
# Rotation and uniform resizing must preserve right angles and distances.
u = (m[0], m[3]); v = (m[1], m[4])
assert abs(u[0]*v[0]+u[1]*v[1]) < 1e-10
assert abs(math.hypot(*u)-math.hypot(*v)) < 1e-10
print(f'PASS: {len(polygons)} valid non-overlapping city volumes; courtyard, square and railway remain open; source coordinates preserve angles.')
