"""Straighten raster wall edges without rounding corners or joining door gaps."""
import math
import numpy as np
from shapely.geometry import Polygon,LineString


def simplify_ring(ring,tolerance):
    points=np.asarray(ring.coords[:-1],float)
    anchors=[]
    for q,point in enumerate(points):
        incoming=point-points[q-1]; outgoing=points[(q+1)%len(points)]-point
        a=np.linalg.norm(incoming); b=np.linalg.norm(outgoing)
        if min(a,b)<1e-9: continue
        turn=math.acos(float(np.clip(incoming.dot(outgoing)/(a*b),-1,1)))
        # Protect real corners and wall end caps before removing raster waves.
        if turn>math.radians(55) and max(a,b)>=tolerance:
            anchors.append(q)
    if len(anchors)<2: return list(ring.coords)
    result=[]
    for q,start in enumerate(anchors):
        end=anchors[(q+1)%len(anchors)]
        arc=points[start:end+1] if end>start else np.vstack([points[start:],points[:end+1]])
        result.extend(list(LineString(arc).simplify(tolerance).coords)[:-1])
    return result if len(result)>=3 else list(ring.coords)


def fit_ring(original, simplified, tolerance, axis):
    source=np.asarray(original.coords[:-1],float)
    corners=np.asarray(simplified.coords[:-1],float)
    nearest=[int(np.argmin(np.linalg.norm(source-p,axis=1))) for p in corners]
    lines=[]
    for q,start in enumerate(nearest):
        end=nearest[(q+1)%len(nearest)]
        points=source[start:end+1] if end>start else np.vstack([source[start:],source[:end+1]])
        a=corners[q]; b=corners[(q+1)%len(corners)]
        direction=b-a
        length=np.linalg.norm(direction)
        direction/=max(length,1e-9)
        center=(a+b)/2
        if length>tolerance*6 and len(points)>2:
            # Uniform samples avoid giving a pixel staircase more weight than
            # an already straight section of the same physical length.
            samples=[]
            for first,last in zip(points[:-1],points[1:]):
                count=max(1,int(np.ceil(np.linalg.norm(last-first)/max(tolerance/2,.001))))
                samples.extend(first+(last-first)*t for t in np.arange(count)/count)
            samples=np.asarray(samples)
            center=samples.mean(axis=0)
            _,_,vectors=np.linalg.svd(samples-center,full_matrices=False)
            direction=vectors[0]
            if direction.dot(b-a)<0: direction=-direction
            angle=math.atan2(direction[1],direction[0])
            snapped=axis+round((angle-axis)/(math.pi/4))*math.pi/4
            if abs(angle-snapped)<math.radians(2):
                direction=np.array([math.cos(snapped),math.sin(snapped)])
        normal=np.array([-direction[1],direction[0]])
        lines.append((normal,float(normal.dot(center))))
    result=[]
    for q,corner in enumerate(corners):
        before=lines[q-1]; after=lines[q]
        matrix=np.array([before[0],after[0]])
        point=corner
        if abs(np.linalg.det(matrix))>.08:
            candidate=np.linalg.solve(matrix,np.array([before[1],after[1]]))
            if np.linalg.norm(candidate-corner)<tolerance*2:
                point=candidate
        result.append(point.tolist())
    return result


def straighten_polygon(polygon, tolerance):
    simplified=polygon.simplify(tolerance,preserve_topology=True)
    anchored=Polygon(simplify_ring(polygon.exterior,tolerance),
                     [simplify_ring(h,tolerance) for h in polygon.interiors])
    if anchored.is_valid and not anchored.is_empty:
        simplified=anchored
    if simplified.geom_type!='Polygon' or len(simplified.interiors)!=len(polygon.interiors):
        return polygon
    # Dominant architectural axis; diagonals and genuinely oblique edges remain.
    angles=[]; weights=[]
    for ring in [simplified.exterior,*simplified.interiors]:
        points=np.asarray(ring.coords,float)
        for edge in np.diff(points,axis=0):
            length=np.linalg.norm(edge)
            if length>tolerance*10:
                angles.append(math.atan2(edge[1],edge[0])%(math.pi/2)); weights.append(length)
    axis=0.
    if angles:
        scores=[sum(w for a,w in zip(angles,weights) if abs(math.atan2(math.sin(4*(a-b)),math.cos(4*(a-b)))/4)<math.radians(3)) for b in angles]
        seed=angles[int(np.argmax(scores))]
        near=[(a,w) for a,w in zip(angles,weights) if abs(math.atan2(math.sin(4*(a-seed)),math.cos(4*(a-seed)))/4)<math.radians(3)]
        axis=math.atan2(sum(w*math.sin(4*a) for a,w in near),sum(w*math.cos(4*a) for a,w in near))/4
    fitted=Polygon(fit_ring(polygon.exterior,simplified.exterior,tolerance,axis),
                   [fit_ring(a,b,tolerance,axis) for a,b in zip(polygon.interiors,simplified.interiors)])
    for candidate in [fitted,simplified]:
        if (candidate.is_valid and not candidate.is_empty and
            len(candidate.interiors)==len(polygon.interiors) and
            abs(candidate.area-polygon.area)<polygon.area*.18 and
            candidate.boundary.hausdorff_distance(polygon.boundary)<tolerance*2.5):
            return candidate
    return polygon


def smooth_shapes(shapes, tolerance):
    original=[Polygon(s['outer'],s['holes']) for s in shapes]
    result=[straighten_polygon(p,tolerance) for p in original]
    # Never join independent pieces (especially opposite door jambs).
    for q in range(len(result)):
        for e in range(q):
            old_gap=original[q].distance(original[e])
            overlaps=result[q].intersection(result[e]).area>original[q].intersection(original[e]).area+.001
            if overlaps or (old_gap>0 and result[q].distance(result[e])<min(old_gap*.5,tolerance*.2)):
                result[q]=original[q]; result[e]=original[e]
    return [{'outer':list(p.exterior.coords)[:-1],
             'holes':[list(h.coords)[:-1] for h in p.interiors]} for p in result]
