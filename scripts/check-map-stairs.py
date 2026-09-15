import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
from map_stair_connections import connect_stairs

def floors(count):
    return [{'id': str(q+1), 'elevation': q*5, 'shapes': [{'outer': [[-20, -20], [20, -20], [20, 20], [-20, 20]], 'holes': []}]} for q in range(count)]
mark = {'center': [0, 0], 'width': 4, 'run': 6, 'angle': 0}

# Only a top-level symbol: create a descent, with no imaginary upper level.
fixture = floors(2)
connect_stairs(fixture, {'2': [mark]})
assert len(fixture[0]['stairs']) == 1 and not fixture[1]['stairs']
assert fixture[0]['stairs'][0]['toFloor'] == '2'

# The TF29 case: the third level exists but has no matching stair symbol.
fixture = floors(3)
connect_stairs(fixture, {'1': [mark], '2': [mark]})
assert [len(floor['stairs']) for floor in fixture] == [1, 0, 0]

# Two symbols on upper floors are one connection, not a new descent to cellar.
fixture = floors(3)
connect_stairs(fixture, {'2': [mark], '3': [mark]})
assert [len(floor['stairs']) for floor in fixture] == [0, 1, 0]

expected = {'tf29': [('1', '2')], 'zelen': [('1', '2'), ('2', '3'), ('3', '4')], 'koller': [('2', '3')]}
for file in Path('public/maps/models').glob('*.json'):
    if file.stem == 'manifest':
        continue
    model = json.loads(file.read_text())
    levels = {floor['id']: floor for floor in model['floors']}
    connections = []
    for floor in model['floors']:
        for stair in floor['stairs']:
            target = levels[stair['toFloor']]
            assert stair['rise'] > 0
            assert abs(floor['elevation']+stair['rise']-target['elevation']) < .001
            surface = unary_union([Polygon(s['outer'], s['holes']) for s in target['shapes']])
            assert not surface.contains(Point(stair['center'])), f"{file.stem}: upper slab obscures descending stairs"
            connections.append((floor['id'], target['id']))
    if file.stem in expected:
        assert sorted(connections) == expected[file.stem], f'{file.stem}: duplicate or wrong-direction flight'
    highest = max(model['floors'], key=lambda floor: floor['elevation'])
    assert not highest['stairs'], f'{file.stem}: stairs continue above the building'
print('PASS: top-only descent, paired symbols, disconnected higher floor, 5 real connections and open upper landings.')
