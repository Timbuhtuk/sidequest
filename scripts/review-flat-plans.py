"""Source comparisons for generated assets; never alters the generated images."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'.map-tools'))
import cv2
import numpy as np
from PIL import Image,ImageDraw
from map_source_recovery import architectural_mask

root=Path('public/maps/plans/flat-v2')
records=json.loads((root/'manifest.json').read_text())
review=Path('outputs/flat-review'); review.mkdir(exist_ok=True)
report=[]
for record in records:
    path=Path(record['output'])
    if not path.exists(): continue
    source=Image.open(record['sourceImage']).convert('RGB').crop(record['bounds'])
    generated=Image.open(path).convert('RGB')
    resized=generated.resize(source.size,Image.Resampling.LANCZOS)
    pixels=np.array(resized)
    target=((pixels.min(axis=2)>205)&(pixels.max(axis=2)-pixels.min(axis=2)<40)).astype('uint8')
    original=architectural_mask(np.array(source))
    distance=cv2.distanceTransform(1-target,cv2.DIST_L2,3)
    reverse=cv2.distanceTransform((original==0).astype('uint8'),cv2.DIST_L2,3)
    samples=distance[original>0]; backwards=reverse[target>0]
    metrics={'model':record['model'],'floor':record['floor'],
             'sourceCoverage8px':round(float(np.mean(samples<8)),3),
             'generatedSupport8px':round(float(np.mean(backwards<8)),3),
             'sourceMedianDistance':round(float(np.median(samples)),2),
             'aspectRatio':round((generated.width/generated.height)/(source.width/source.height),3)}
    report.append(metrics)
    tile=Image.new('RGB',(1200,630),'#171b17')
    for q,image in enumerate([source,generated]):
        image.thumbnail((590,590))
        tile.paste(image,(q*600+(600-image.width)//2,35))
    ImageDraw.Draw(tile).text((12,10),str(metrics),fill='white')
    tile.save(review/f'{record.get("key",record["model"]+"-"+record["floor"])}.jpg')
(review/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
