"""Recover source-supported wall strokes without interpreting icons as architecture."""
import math
import json
from pathlib import Path
import cv2
import numpy as np
from shapely.geometry import LineString, Polygon, Point
from shapely.ops import unary_union
from map_geometry_cleanup import remove_stair_hatching, clean_walls

def architectural_mask(image):
    r,g,b = [image[:,:,q].astype(float) for q in range(3)]
    bright = ((r > 125) & (g > 105) & (r > b*.92)).astype('uint8')*255
    gold = ((r > g*1.04) & (g > b*1.12) & (r > 85)).astype('uint8')*255
    yellow = ((r > 180) & (g > 130) & (b < g*.58)).astype('uint8')*255
    # Icons have broad filled areas; golden wall tops are thin strokes. The old
    # color-only exclusion erased both. Opening removes walls from this mask.
    icons = cv2.morphologyEx(yellow, cv2.MORPH_CLOSE, np.ones((3,3),np.uint8))
    icons = cv2.morphologyEx(icons, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
    icons = cv2.dilate(icons, np.ones((7,7),np.uint8))
    mask = cv2.bitwise_and(bright, cv2.dilate(gold,np.ones((35,35),np.uint8)))
    mask[icons > 0] = 0
    return remove_stair_hatching(image,mask)

def recover_walls(mask, lines, shapes, angle, protected=None):
    detected = cv2.HoughLinesP(mask,1,np.pi/720,threshold=8,minLineLength=8,maxLineGap=2)
    if detected is None: return lines, []
    candidates=[]
    for line in detected.reshape(-1,4).tolist():
        a,b,c,d=line
        delta=math.atan2(d-b,c-a)-angle
        # Short text strokes are not wall evidence; accept the plan's two axes.
        if abs(math.sin(2*delta)) > .13: continue
        candidates.append(line)
    candidates=clean_walls(candidates,angle,min_length=8)
    floor=unary_union([Polygon(s['outer'],s['holes']) for s in shapes]).buffer(10)
    # Generated cleanup references sometimes displace a wall or invent a short
    # stroke. Retain it only when the original sheet supports its position.
    nearby=cv2.dilate(mask,np.ones((5,5),np.uint8))
    supported=[]
    for line in lines:
        segment=LineString([line[:2],line[2:]])
        samples=np.linspace(line[:2],line[2:],max(2,int(segment.length)))
        points=np.rint(samples).astype(int)
        valid=(points[:,0]>=0)&(points[:,0]<mask.shape[1])&(points[:,1]>=0)&(points[:,1]<mask.shape[0])
        evidence=np.zeros(len(points),dtype=bool)
        evidence[valid]=nearby[points[valid,1],points[valid,0]]>0
        if evidence.mean() >= .55 or (protected is not None and segment.intersects(protected)):
            supported.append(line)
    result=list(supported)
    additions=[]
    existing=unary_union([LineString([p[:2],p[2:]]) for p in supported]).buffer(4,cap_style=2)
    for candidate in candidates:
        segment=LineString([candidate[:2],candidate[2:]])
        if protected is not None and segment.intersects(protected): continue
        if segment.intersection(floor).length < segment.length*.95: continue
        uncovered=segment.difference(existing)
        parts=[uncovered] if uncovered.geom_type == 'LineString' else list(getattr(uncovered,'geoms',[]))
        for part in parts:
            if part.geom_type != 'LineString' or part.length < 8: continue
            start=segment.project(Point(part.coords[0]))
            end=segment.project(Point(part.coords[-1]))
            lo,hi=sorted([start,end])
            # Rejoin the known stroke at the clipping boundary, without growing
            # across an unobserved doorway at the source candidate's endpoints.
            a=segment.interpolate(max(0,lo-4)); b=segment.interpolate(min(segment.length,hi+4))
            stroke=[a.x,a.y,b.x,b.y]
            result.append(stroke); additions.append(stroke)
        existing=unary_union([existing,segment.buffer(4,cap_style=2)])
    return result, additions

def connect_wall_corners(lines, tolerance=5):
    result=[list(line) for line in lines]
    for q,line in enumerate(lines):
        a=np.array(line[:2],float); b=np.array(line[2:],float); direction=b-a
        for end,point in enumerate([a,b]):
            best=None
            for e,other in enumerate(lines):
                if q == e: continue
                c=np.array(other[:2],float); d=np.array(other[2:],float); cross=d-c
                determinant=direction[0]*cross[1]-direction[1]*cross[0]
                if abs(determinant) < np.linalg.norm(direction)*np.linalg.norm(cross)*.5: continue
                t,u=np.linalg.solve(np.column_stack((direction,-cross)),c-a)
                junction=a+t*direction
                distance=np.linalg.norm(junction-point)
                margin=tolerance/np.linalg.norm(cross)
                if -margin <= u <= 1+margin and distance <= tolerance and (best is None or distance < best[0]):
                    best=(distance,junction)
            if best is not None: result[q][end*2:end*2+2]=best[1].tolist()
    return result

def fill_reviewed_shadows(model_id, floors, scale):
    records=json.loads(Path(__file__).with_name('reviewed-floor-shadows.json').read_text())
    filled=0
    for record in records:
        if record['model'] != model_id: continue
        floor=next(f for f in floors if f['id']==record['floor'])
        dx,dy=floor['sourceOffset']; x,y=record['point']
        point=Point((x+dx)*scale,(y+dy)*scale)
        found=0
        for shape in floor['shapes']:
            keep=[]
            for hole in shape['holes']:
                if Polygon(hole).contains(point): found+=1
                else: keep.append(hole)
            shape['holes']=keep
        if found != 1: raise ValueError(f'Review shadow correspondence: {model_id}/{floor["id"]} {record["point"]}')
        filled+=found
    return filled
