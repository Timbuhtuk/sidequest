"""Regression: raster noise becomes straight walls, doorways/voids stay open."""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'.map-tools'))
from shapely.geometry import Polygon,Point
from shapely.affinity import rotate
from map_contour_smoothing import straighten_polygon,smooth_shapes

edge=[(x,math.sin(x*.4)*.7) for x in range(101)]
wall=Polygon(edge+[(x,y+5) for x,y in reversed(edge)])
result=straighten_polygon(wall,2.5)
assert len(result.exterior.coords)<=7, 'Long wall still follows raster waviness'
assert result.is_valid and .9<result.area/wall.area<1.1
assert result.boundary.hausdorff_distance(wall.boundary)<2

rotated=straighten_polygon(rotate(wall,23),2.5)
assert len(rotated.exterior.coords)<=7, 'Oblique walls must also straighten'
notch=Polygon([(0,0),(80,0),(80,5),(45,5),(45,22),(40,22),(40,5),(0,5)])
assert straighten_polygon(notch,2.5).contains(Point(42,19)), 'T junction lost'
ring=Polygon([(0,0),(80,0),(80,50),(0,50)], [[(5,5),(5,45),(75,45),(75,5)]])
assert len(straighten_polygon(ring,2.5).interiors)==1, 'Courtyard filled'
thin=Polygon([(0,0),(100,0),(100,1),(0,1)])
assert straighten_polygon(thin,2.5).area>90, 'Thin wall erased'
parts=[{'outer':[(0,0),(40,0),(40,5),(0,5)],'holes':[]},
       {'outer':[(44,0),(84,0),(84,5),(44,5)],'holes':[]}]
pieces=[Polygon(p['outer'],p['holes']) for p in smooth_shapes(parts,2.5)]
assert pieces[0].distance(pieces[1])>=3.9, 'Doorway joined'
print('PASS: straight and oblique wall profiles, thin walls, T junction, courtyard and door gap.')
