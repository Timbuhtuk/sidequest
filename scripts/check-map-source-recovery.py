"""Regression checks for color filtering, short walls, corners and reviewed voids."""
import sys,json,math
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'.map-tools'))
import cv2
import numpy as np
from shapely.geometry import LineString,Polygon,Point
from shapely.ops import unary_union
from map_source_recovery import architectural_mask,recover_walls,connect_wall_corners

# The same gold occurs in wall tops and map icons. A color filter alone cannot
# distinguish them. Keep a thin wall and a short jamb, reject the filled symbol.
source=np.zeros((180,240,3),dtype=np.uint8)
source[:]=[54,47,29]
cv2.line(source,(20,30),(200,30),(246,212,101),2)
cv2.line(source,(20,30),(20,50),(246,212,101),2)
cv2.circle(source,(115,110),15,(246,212,101),-1)
mask=architectural_mask(source)
assert np.count_nonzero(mask[29:32,30:190]) > 350, 'Gold wall was filtered as an icon'
assert not np.any(mask[95:126,100:131]), 'Icon became wall evidence'
shapes=[{'outer':[[0,0],[240,0],[240,180],[0,180]],'holes':[]}]
walls,_=recover_walls(mask,[],shapes,0)
solid=unary_union([LineString([w[:2],w[2:]]).buffer(2) for w in walls])
assert solid.contains(Point(80,30)) and solid.contains(Point(20,41)), 'Long wall or short jamb was lost'
assert not solid.intersects(Point(115,110).buffer(18)), 'Icon produced a wall'
corners=connect_wall_corners([[0,0,38,0],[40,2,40,40],[60,0,100,0]])
solid=unary_union([LineString([w[:2],w[2:]]).buffer(1) for w in corners])
assert solid.contains(Point(40,0)), 'Corner did not join'
assert not solid.contains(Point(50,0)), 'Collinear doorway was sealed'

records=json.loads(Path('scripts/reviewed-floor-shadows.json').read_text())
for record in records:
    model=json.loads(Path(f'public/maps/models/{record["model"]}.json').read_text())
    floor=next(f for f in model['floors'] if f['id']==record['floor'])
    x,y=record['point']; dx,dy=floor['sourceOffset']
    surface=unary_union([Polygon(s['outer'],s['holes']) for s in floor['shapes']])
    assert surface.contains(Point((x+dx)*model['scale'],(y+dy)*model['scale'])), f'Shadow hole returned: {record}'
print(f'PASS: golden walls, short jamb, icon exclusion, corner join, open doorway and {len(records)} reviewed floor shadows.')
