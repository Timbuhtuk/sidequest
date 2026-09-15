"""Import the complete reviewed generation set with reproducible provenance."""
import json,shutil
from pathlib import Path
from PIL import Image
source=Path('../map-cleanup/flat-v2')
destination=Path('public/maps/plans/flat-v2')
records=json.loads((source/'manifest.json').read_text())
missing=[r['output'] for r in records if not Path(r['output']).exists() or not Path(r['output']).with_suffix('.json').exists()]
if missing:raise SystemExit('Generation assets/metadata missing: '+str(missing))
manifest=[]
for record in records:
    image=Path(record['output']); metadata=json.loads(image.with_suffix('.json').read_text())
    target=destination/image.name
    shutil.copyfile(image,target)
    item={key:value for key,value in record.items() if key not in ['input','output']}
    item.update(output=target.as_posix(),sourceImage=f'public/maps/plans/{record["model"]}-raw.png',
                generator='builtin-imagegen',prompt=metadata.get('prompt'),inspection=metadata.get('observations',metadata.get('inspection')),
                rasterSize=list(Image.open(image).size))
    item['generationRecord']=metadata
    manifest.append(item)
(destination/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(manifest),'generated plans and prompt records imported')
