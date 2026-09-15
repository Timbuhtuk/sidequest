"""Validate staged regenerated interiors before replacing deployed assets."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'.map-tools'))
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union

directory=Path('outputs/flat-models')
models=[json.loads(p.read_text()) for p in directory.glob('*.json') if p.stem not in ['report','prague','manifest']]
sources=set(); floors=0
for model in models:
    assert model['reconstruction']=='generated-flat-plans-v2'
    for floor in model['floors']:
        floors+=1
        assert floor['walls']==[], 'Legacy line inference leaked into regenerated geometry'
        for part in floor['generatedParts']:
            assert Path('public'+part['source']).is_file(), part['source']
            sources.add(Path(part['source']).name)
        surface=unary_union([Polygon(s['outer'],s['holes']) for s in floor['shapes']])
        assert surface.is_valid and surface.area>0
        walls=[Polygon(s['outer'],s['holes']) for s in floor['wallShapes']]
        assert walls and all(w.is_valid and w.area>0 for w in walls), f'{model["id"]}/{floor["id"]}: wall topology'
        for q,wall in enumerate(walls):
            assert all(wall.intersection(other).area<.002 for other in walls[q+1:]), f'{model["id"]}/{floor["id"]}: doubled overlapping wall solids'
        for stair in floor['stairs']:
            target=next(f for f in model['floors'] if f['id']==stair['toFloor'])
            top=unary_union([Polygon(s['outer'],s['holes']) for s in target['shapes']])
            assert not top.contains(Point(stair['center'])), 'Upper slab blocks stairs'
if '--complete' in sys.argv:
    records=json.loads(Path('public/maps/plans/flat-v2/manifest.json').read_text())
    assert sources=={Path(r['output']).name for r in records}, 'A source plan is missing or obsolete'
    assert len(models)==10 and floors==54
print(f'PASS: {len(models)} regenerated interiors, {floors} floors, {len(sources)} generated inputs, valid wall solids and open stair landings.')
