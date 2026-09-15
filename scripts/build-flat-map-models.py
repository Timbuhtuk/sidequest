"""Build interiors solely from individually regenerated, shadow-free floor plans.

White connected wall ribbons become solids directly: no inference from shadows,
icons or long-line detection. Original sheets supply only registration metadata.
"""
import ast,copy,json,sys,shutil
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'.map-tools'))
import cv2
import numpy as np
from PIL import Image,ImageDraw
from shapely.geometry import Polygon
from shapely import set_precision
from map_stair_connections import connect_stairs
from map_flat_registration import register_plan

ROOT=Path.cwd()
SOURCE=ROOT.parent/'map-cleanup'/'flat-v2'
PUBLIC=ROOT/'public/maps/plans/flat-v2'
MODEL=ROOT/'public/maps/models'
STAGING=ROOT/'outputs/flat-models'
STAGING.mkdir(parents=True,exist_ok=True)
PUBLIC.mkdir(parents=True,exist_ok=True)
manifest_file=PUBLIC/'manifest.json' if (PUBLIC/'manifest.json').exists() else SOURCE/'manifest.json'
records=json.loads(manifest_file.read_text())
tree=ast.parse((ROOT/'scripts/build-map-models.py').read_text())
stairs=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='STAIRS' for t in n.targets))

def palette_masks(image):
    data=np.asarray(image.convert('RGB'))
    low=data.min(axis=2); high=data.max(axis=2)
    # Broad bands tolerate imagegen antialiasing and slight gray texture.
    walls=((low>205)&(high-low<40)).astype('uint8')*255
    floor=(high>65).astype('uint8')*255
    count,labels,stats,_=cv2.connectedComponentsWithStats(floor,8)
    for q in range(1,count):
        if stats[q,cv2.CC_STAT_AREA]<40: floor[labels==q]=0
    walls[floor==0]=0
    return floor,walls

def vectorize(mask, pixel_scale, offset, min_area, epsilon, transform=None, frame_offset=(0,0)):
    contours,hierarchy=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None: return []
    result=[]
    def ring(contour):
        pts=cv2.approxPolyDP(contour,epsilon,True).reshape(-1,2)
        points=pts*np.array(pixel_scale)+np.array(frame_offset)
        if transform is not None: points=points@transform[:,:2].T+transform[:,2]
        return (points+np.array(offset)).tolist()
    for q,contour in enumerate(contours):
        if hierarchy[0][q][3]!=-1 or cv2.contourArea(contour)<min_area: continue
        outer=ring(contour)
        if len(outer)<3: continue
        holes=[]; child=hierarchy[0][q][2]
        while child!=-1:
            inner=ring(contours[child])
            if len(inner)>=3 and cv2.contourArea(contours[child])>=min_area: holes.append(inner)
            child=hierarchy[0][child][0]
        solid=set_precision(Polygon(outer,holes).buffer(0),.001)
        pieces=[solid] if solid.geom_type=='Polygon' else list(solid.geoms)
        for piece in pieces:
            if piece.is_empty or piece.geom_type!='Polygon': continue
            result.append({'outer':list(piece.exterior.coords)[:-1],
                           'holes':[list(h.coords)[:-1] for h in piece.interiors]})
    return result

selected=set(sys.argv[1:]) or {r['model'] for r in records}
missing=[r['output'] for r in records if r['model'] in selected and not Path(r['output']).is_file()]
if missing: raise SystemExit('Missing generated floor plans: '+', '.join(missing))
report=[]
for model_id in sorted(selected):
    model=json.loads((MODEL/f'{model_id}.json').read_text())
    floors=[]; marks={}
    for old in model['floors']:
        scale=model['scale']
        floor=copy.deepcopy(old)
        floor['shapes']=[]; floor['wallShapes']=[]; floor['generatedParts']=[]
        for record in [r for r in records if r['model']==model_id and r['floor']==old['id']]:
            file=Path(record['output'])
            image=Image.open(file).convert('RGB')
            left,top,right,bottom=record['bounds']
            width=right-left; height=bottom-top
            ratio=(image.width/image.height)/(width/height)
            frame=np.array([[width/image.width,0,0],[0,height/image.height,0]],float)
            if abs(ratio-1)>.035:
                # Imagegen letterboxes extreme-aspect sheets. Remove only this
                # black padding in coordinate space, preserving shape proportions.
                uniform=max(width/image.width,height/image.height)
                frame=np.array([[uniform,0,(width-image.width*uniform)/2],
                                [0,uniform,(height-image.height*uniform)/2]])
            mask,wall_mask=palette_masks(image)
            original=np.array(Image.open(ROOT/f'public/maps/plans/{model_id}-raw.png').convert('RGB').crop(record['bounds']))
            alignment,alignment_report=register_plan(original,wall_mask,frame)
            # Transform is fitted in source pixels and applied in world units.
            pixel_scale=[frame[0,0]*scale,frame[1,1]*scale]
            frame_offset=frame[:,2]*scale
            dx,dy=record.get('sourceOffset',old['sourceOffset'])
            offset=[(dx+left)*scale,(dy+top)*scale]
            groups=[(mask,wall_mask,alignment,alignment_report)]
            # Separate drawings on one sheet may be independently reframed by
            # generation. Register disconnected buildings independently only
            # when a whole-sheet fit cannot explain their source positions.
            if not alignment_report['accepted'] and alignment_report['afterCoverage']<.65:
                count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
                large=[q for q in range(1,count) if stats[q,cv2.CC_STAT_AREA]>4000]
                if 2<=len(large)<=8:
                    groups=[]
                    for q in range(1,count):
                        if stats[q,cv2.CC_STAT_AREA]<40: continue
                        m=np.where(labels==q,mask,0).astype('uint8')
                        w=np.where(labels==q,wall_mask,0).astype('uint8')
                        fit,metrics=register_plan(original,w,frame) if q in large else (alignment,alignment_report)
                        groups.append((m,w,fit,metrics))
            component_fits=[]
            for m,w,fit,metrics in groups:
                world_alignment=fit.copy(); world_alignment[:,2]*=scale
                floor['shapes'].extend(vectorize(m,pixel_scale,offset,40,1.1,world_alignment,frame_offset))
                floor['wallShapes'].extend(vectorize(w,pixel_scale,offset,5,.65,world_alignment,frame_offset))
                component_fits.append({'pixelTransform':fit.tolist(),'alignment':metrics})
            source=f'/maps/plans/flat-v2/{file.name}'
            floor['generatedParts'].append({'source':source,'sourceBounds':record['bounds'],
                                            'sourceOffset':[dx,dy],'sourceRasterSize':[image.width,image.height],
                                            'pixelTransform':alignment.tolist(),'rasterFrame':frame.tolist(),'alignment':alignment_report,
                                            'componentTransforms':component_fits})
            if file.resolve()!=(PUBLIC/file.name).resolve(): shutil.copyfile(file,PUBLIC/file.name)
        if not floor['shapes'] or not floor['wallShapes']: raise ValueError(f'Empty regenerated floor: {model_id}/{old["id"]}')
        # The actual wall ribbons, including short ends and junctions, are now
        # authoritative. Legacy centerline observations must not resurrect gaps.
        floor['walls']=[]
        bounds=[part['sourceBounds'] for part in floor['generatedParts']]
        floor['sourceBounds']=[min(b[0] for b in bounds),min(b[1] for b in bounds),
                               max(b[2] for b in bounds),max(b[3] for b in bounds)]
        floor['wallSource']=floor['generatedParts'][0]['source']
        floor['floorSource']=floor['wallSource']
        floor['stairs']=[]
        marks[old['id']]=[{'center':[(x+old['sourceOffset'][0])*scale,(y+old['sourceOffset'][1])*scale],
                          'width':w,'run':run,'angle':angle}
                         for x,y,w,run,angle in stairs.get(model_id,{}).get(int(old['id']),[])]
        floors.append(floor)
        report.append({'model':model_id,'floor':old['id'],'source':floor['wallSource'],
                       'wallSolids':len(floor['wallShapes']),'floorSolids':len(floor['shapes']),
                       'voids':sum(len(s['holes']) for s in floor['shapes'])})
    connect_stairs(floors,marks)
    model['floors']=floors
    model['reconstruction']='generated-flat-plans-v2'
    points=np.array([p for f in floors for s in f['shapes'] for p in s['outer']])
    model['center']=((points.min(axis=0)+points.max(axis=0))/2).tolist()
    # Stage for source comparison and topology checks before replacing live data.
    (STAGING/f'{model_id}.json').write_text(json.dumps(model,separators=(',',':')))
    print(model_id, len(floors),'floors staged')
(STAGING/'report.json').write_text(json.dumps(report,indent=2))
