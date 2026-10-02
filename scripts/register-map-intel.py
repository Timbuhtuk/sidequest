"""Register source map annotations against the original per-floor sheets.

Run from site/. Requires the project's existing .map-tools Python environment.
Raw source coordinates and registration evidence are retained for review.
"""
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path.cwd().parent / '.map-tools'))
import cv2
import numpy as np
from PIL import Image

ROOT = Path('.map-registration')
ROOT.mkdir(exist_ok=True)
data = json.loads(Path('lib/dx-map-intel.json').read_text(encoding='utf8'))

# Reviewed panels on the Gamepressure sheets. Panels are laid out independently;
# their page positions do not describe the alignment of floors in the building.
PANELS = {
 'm1': {'3:0':[0,0,550,400], '2:0':[0,410,565,775], '1:0':[0,780,550,1040], '2:1':[600,0,1020,500], '1:1':[590,510,1040,1280], '2:2':[1050,100,1600,560], '1:2':[1050,580,1600,1040]},
 'm4': {'1:0':[0,80,310,445], '2:0':[315,80,600,445], '3:0':[610,90,890,420], '4:0':[890,80,1200,440]},
 'm5': {'1:0':[0,0,300,625], '2:0':[310,180,800,540], '3:0':[810,100,1200,545]},
 'm7': {'3:0':[0,120,170,400], '2:0':[180,65,600,510], '1:0':[610,60,1200,600]},
 'm12': {'9:0':[380,60,820,440], '8:0':[890,60,1370,465], '7:0':[100,420,620,910], '6:0':[670,550,925,800], '5:0':[960,540,1160,825], '4:0':[1200,550,1410,830], '3:0':[280,940,455,1220], '2:0':[550,920,810,1250], '1:0':[870,890,1480,1270]},
 'm15': {'1:0':[80,170,310,380], '2:0':[340,115,630,460], '3:0':[670,70,1030,460], '4:0':[1040,55,1530,500], '5:0':[80,580,565,1010], '6:0':[570,485,980,840], '7:0':[620,890,860,1160], '8:0':[900,530,1570,1190]},
 'm17': {'1:0':[70,100,630,380], '2:0':[50,390,620,870], '3:0':[660,20,1050,310], '4:0':[675,320,1050,665], '5:0':[630,675,1050,970], '6:0':[1150,220,1560,495], '7:0':[1070,505,1560,920]},
 'm18': {'1:0':[100,65,890,720], '2:0':[1000,25,1500,795], '3:0':[1180,810,1440,1180], '4:0':[880,830,1080,1110], '5:0':[100,660,810,1210]},
 'm24': {'1:0':[0,0,900,630], '2:0':[900,70,1600,540], '3:0':[210,580,900,1211], '4:0':[915,610,1600,1160]},
 'm25': {'8:0':[90,85,470,490], '7:0':[525,100,770,465], '6:0':[820,150,1050,375], '5:0':[1060,0,1550,555], '4:0':[30,555,485,1120], '3:0':[520,610,720,815], '2:0':[670,555,1105,1156], '1:0':[1130,555,1590,1156]},
}

def regions(key, floor, part_index, part):
    panel = PANELS.get(key,{}).get(floor['id']+':'+str(part_index))
    bounds = part['sourceBounds'].copy()
    if key=='m1' and part_index==1:
        if floor['id']=='2': bounds=[0,3500,1550,5300]
        else: bounds=[1300,2600,2900,5300]
    if key=='m24' and floor['id'] in ['2','3','4']:
        left = bounds.copy(); left[2]=1350
        right = bounds.copy(); right[0]=1400
        targets = {'2':[[900,70,1285,535],[1210,100,1600,535]], '3':[[210,580,610,1211],[505,590,910,1140]], '4':[[915,610,1320,1160],[1310,630,1600,875]]}
        return [(left,targets[floor['id']][0]),(right,targets[floor['id']][1])]
    return [(bounds,panel)]

def fetch():
    for key, source in data['sources'].items():
        dest = ROOT / (key+'.html')
        if not dest.exists():
            urllib.request.urlretrieve(source['url'], dest)
        page = dest.read_text(encoding='utf8')
        match = re.search(r'<img src="(/static/mapy/en/gfx/map_\d+\.jpg)"[^>]+width="(\d+)" height="(\d+)"', page)
        if not match:
            raise ValueError(key)
        image = ROOT / (key+'.jpg')
        if not image.exists():
            urllib.request.urlretrieve('https://www.gamepressure.com'+match[1], image)
        size = Image.open(image).size
        points = []
        for q, match in enumerate(re.finditer(r'<div class="gmap-tool" style="left:([\d.]+)%;top:([\d.]+)%">\s*<div[^>]*>(.*?)</div>', page, re.S)):
            points.append({'id':f'gp-{key}-{q+1:02}', 'pixel':[float(match[1])*size[0]/100,float(match[2])*size[1]/100], 'text':html.unescape(re.sub('<[^>]+>', ' ', match[3]))})
        (ROOT/(key+'.json')).write_text(json.dumps({'size':size,'points':points},ensure_ascii=False),encoding='utf8')
        print(key, size, len(points), flush=True)

def register():
    sift = cv2.SIFT_create(nfeatures=18000, contrastThreshold=.015)
    matcher = cv2.BFMatcher()
    report = []
    for key in data['sources']:
        model_id = next(r['model'] for r in data['records'] if r['sourceMap']==key)
        model = json.loads(Path(f'public/maps/models/{model_id}.json').read_text())
        raw = cv2.imread(f'public/maps/plans/{model_id}-raw.png')
        gp = cv2.imread(str(ROOT/(key+'.jpg')))
        for floor in model['floors']:
            for part_index, part in enumerate(floor.get('sourceParts', [floor])):
              for bounds, panel in regions(key,floor,part_index,part):
                gp_mask = None
                if panel:
                    gp_mask = np.zeros(gp.shape[:2],np.uint8)
                    gx0,gy0,gx1,gy1 = panel
                    gp_mask[gy0:gy1,gx0:gx1]=255
                kp_gp, des_gp = sift.detectAndCompute(cv2.cvtColor(gp,cv2.COLOR_BGR2GRAY), gp_mask)
                x0,y0,x1,y1 = bounds
                crop = raw[y0:y1,x0:x1]
                kp, des = sift.detectAndCompute(cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY),None)
                if des is None: continue
                forward = [m for m,n in matcher.knnMatch(des,des_gp,k=2) if m.distance < .75*n.distance]
                reverse = {m.queryIdx:m.trainIdx for m,n in matcher.knnMatch(des_gp,des,k=2) if m.distance < .75*n.distance}
                matches = [m for m in forward if reverse.get(m.trainIdx)==m.queryIdx]
                if len(matches)<4: continue
                src = np.float32([kp[m.queryIdx].pt for m in matches])+[x0,y0]
                dst = np.float32([kp_gp[m.trainIdx].pt for m in matches])
                # A shared orthographic bearing allows uniform scale and rotation.
                # No homography and no nearest-polygon snapping.
                matrix, inliers = cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2,maxIters=10000)
                mask = inliers.ravel().astype(bool)
                count = int(mask.sum())
                residual = np.linalg.norm(src@matrix[:,:2].T+matrix[:,2]-dst,axis=1)
                record = {'map':key,'model':model_id,'floor':floor['id'],'part':part_index,'bounds':bounds,'panel':panel,'offset':part['sourceOffset'],'matrix':matrix.tolist(),'inliers':count,'matches':len(matches),'error':float(np.median(residual[mask])), 'anchors': [{'raw':a.tolist(),'map':b.tolist()} for a,b in zip(src[mask],dst[mask])]}
                report.append(record)
                print(key,model_id,floor['id'],part_index,count,len(matches),round(record['error'],2), flush=True)
    (ROOT/'registration.json').write_text(json.dumps(report),encoding='utf8')

def apply():
    from shapely.geometry import Polygon, Point, box
    from shapely.ops import unary_union
    rows = json.loads((ROOT/'registration.json').read_text())
    models = {r['model']:json.loads(Path(f"public/maps/models/{r['model']}.json").read_text()) for r in rows}
    sources = {key:json.loads((ROOT/(key+'.json')).read_text(encoding='utf8')) for key in data['sources']}
    geometries = {}
    for q,r in enumerate(rows):
        r['id'] = f"{r['map']}-{r['floor']}-{r['part']}-{q}"
        if r['map']=='m25' and r['floor']=='2': r['panel']=PANELS['m25']['2:0']
        model=models[r['model']]
        r['sourceSize']=sources[r['map']]['size']
        matrix=np.array(r['matrix'])
        assert np.linalg.det(matrix[:,:2]) > .01, r['id']
        if model.get('kind')=='city': continue
        floor=next(f for f in model['floors'] if f['id']==r['floor'])
        # Used only to disambiguate overlapping sheet panels, never to move a point.
        shapes=[]
        for shape in floor['shapes']:
            ring=np.array(shape['outer'])/model['scale']-r['offset']
            polygon=Polygon(ring).buffer(0).intersection(box(*r['bounds']))
            if not polygon.is_empty: shapes.append(polygon)
        geometries[r['id']]=unary_union(shapes)
    changed_floor=0; moved=0; unresolved=[]; diagnostics=[]
    for item in data['records']:
        source=next(p for p in sources[item['sourceMap']]['points'] if p['id']==item['id'])
        pixel=np.array(source['pixel'])
        candidates=[]
        for r in rows:
            if r['map']!=item['sourceMap']: continue
            if r['panel']:
                x0,y0,x1,y1=r['panel']
                if not (x0<=pixel[0]<=x1 and y0<=pixel[1]<=y1): continue
            matrix=np.array(r['matrix'])
            raw=np.linalg.solve(matrix[:,:2],pixel-matrix[:,2])
            x0,y0,x1,y1=r['bounds']
            if not (x0-20<=raw[0]<=x1+20 and y0-20<=raw[1]<=y1+20): continue
            distance=0 if r['model']=='prague' else geometries[r['id']].distance(Point(raw))*np.linalg.norm(matrix[:,0])
            candidates.append((distance,r,raw))
        if not candidates:
            unresolved.append(item['id']); continue
        candidates.sort(key=lambda c:c[0])
        distance,r,raw=candidates[0]
        model=models[r['model']]
        plan=raw+np.array(r['offset'])
        if model.get('sourceTransform'):
            matrix=np.array(model['sourceTransform']).reshape(2,3)
            plan=matrix[:,:2]@raw+matrix[:,2]
        position=np.round(plan*model['scale'],4).tolist()
        delta=float(np.linalg.norm(np.array(item['position'])-position))
        changed_floor+=item['floor']!=r['floor']; moved+=delta>.2
        diagnostics.append({'id':item['id'],'floor':r['floor'],'registration':r['id'],'pixel':pixel.tolist(),'raw':raw.tolist(),'distance':round(distance,1),'delta':round(delta,1),'candidates':len(candidates)})
        item.update(floor=r['floor'],position=position,precision='aligned',sourcePixel=pixel.tolist(),registration=r['id'])
        for locale,phrase in [('ru',' Положение уточнено по контуру этажа.'),('uk',' Положення уточнене за контуром поверху.'),('en',' Position is aligned to the floor outline.')]:
            item['detail'][locale]=item['detail'][locale].replace(phrase,'').replace(f" · №{item['sourcePoint']}.",'.')
    (ROOT/'point-review.json').write_text(json.dumps(diagnostics,indent=2),encoding='utf8')
    print('Moved',moved,'changed floors',changed_floor,'unresolved',unresolved)
    print('Ambiguous panels',[(r['id'],r['floor'],r['distance']) for r in diagnostics if r['candidates']>1])
    assert not unresolved, 'Review missing panels before applying data'
    # Retain measurements so future checks can verify the transform rather than
    # merely checking whether a misplaced marker happens to touch a polygon.
    Path('scripts/fixtures').mkdir(exist_ok=True)
    Path('scripts/fixtures/dx-map-registration.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    Path('lib/dx-map-intel.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')

if __name__=='__main__':
    if '--fetch' in sys.argv: fetch()
    if '--register' in sys.argv: register()
    if '--apply' in sys.argv: apply()

