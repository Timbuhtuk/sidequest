"""Validate geometry rebuilt from the current icon-free comparison maps."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.map-tools'))
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union

models = Path(__file__).resolve().parents[1] / 'public/maps/models'
ids = ['bank', 'dubai', 'garm', 'koller', 'london', 'ridit', 'rvac', 'stedry', 'tf29', 'zelen']
floor_count = 0
stair_count = 0
for model_id in ids:
    model = json.loads((models / f'{model_id}.json').read_text(encoding='utf-8'))
    assert model['reconstruction'] == 'icon-free-source-wall-edges', model_id
    by_id = {floor['id']: floor for floor in model['floors']}
    highest = max(model['floors'], key=lambda floor: floor['elevation'])
    assert not highest['stairs'], f'{model_id}: a flight extends above the top floor'
    for floor in model['floors']:
        floor_count += 1
        assert floor['sourceParts'] and not floor['walls'], f'{model_id}/{floor["id"]}: stale source'
        surface = unary_union([Polygon(s['outer'], s['holes']) for s in floor['shapes']])
        assert surface.is_valid and surface.area > 0, f'{model_id}/{floor["id"]}: invalid slab'
        walls = [Polygon(s['outer'], s['holes']) for s in floor['wallShapes']]
        assert walls and all(w.is_valid and w.area > 0 for w in walls), f'{model_id}/{floor["id"]}: invalid wall'
        merged = unary_union(walls)
        assert sum(w.area for w in walls)-merged.area < .002, f'{model_id}/{floor["id"]}: stacked walls'
        for stair in floor['stairs']:
            stair_count += 1
            target = by_id[stair['toFloor']]
            assert target['elevation'] > floor['elevation'], f'{model_id}: wrong stair direction'
            upper = unary_union([Polygon(s['outer'], s['holes']) for s in target['shapes']])
            assert not upper.contains(Point(stair['center'])), f'{model_id}: staircase blocked by slab'
            assert not merged.contains(Point(stair['center'])), f'{model_id}: staircase blocked by wall'

assert floor_count == 54
print(f'PASS: {len(ids)} interiors, {floor_count} valid floors, {stair_count} open stair connections, no overlapping wall solids.')
