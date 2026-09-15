"""Compare the three wall updates with their original floor sheets."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

targets = {'tf29': ['1', '2'], 'bank': ['8']}
report = []
for id, levels in targets.items():
    before = json.loads(Path(f'outputs/before-cleaned-walls/{id}.json').read_text())
    after = json.loads(Path(f'public/maps/models/{id}.json').read_text())
    assert before['center'] == after['center']
    for old, new in zip(before['floors'], after['floors']):
        for key in ['id', 'elevation', 'sourceBounds', 'sourceOffset', 'shapes', 'stairs', 'registrationScore']:
            assert old[key] == new[key], f'{id}/{new["id"]}: changed {key}'
        if new['id'] not in levels:
            assert old == new, f'{id}/{new["id"]}: unrequested floor changed'
            continue
        assert old['walls'] != new['walls']
        assert Path('public'+new['wallSource']).is_file()
        left, top, right, bottom = new['sourceBounds']
        source = Image.open(f'public/maps/plans/{id}-raw.png').crop((left, top, right, bottom)).convert('RGB')
        result = Image.new('RGB', (source.width*2, source.height+35), '#10140f')
        for q, floor in enumerate([old, new]):
            part = source.copy()
            draw = ImageDraw.Draw(part)
            for a,b,c,d in floor['walls']:
                p = [(a/after['scale']-floor['sourceOffset'][0]-left, b/after['scale']-floor['sourceOffset'][1]-top),
                     (c/after['scale']-floor['sourceOffset'][0]-left, d/after['scale']-floor['sourceOffset'][1]-top)]
                draw.line(p, fill='#52ffc1', width=2)
            result.paste(part, (q*source.width, 35))
        draw = ImageDraw.Draw(result)
        draw.text((15, 10), f'{id} / {new["id"]} / BEFORE', fill='white')
        draw.text((source.width+15, 10), f'{id} / {new["id"]} / CLEANED SOURCE', fill='white')
        result.save(f'outputs/{id}-{new["id"]}-cleaned-wall-review.png')
        report.append({'model': id, 'floor': new['id'], 'oldWallSegments': len(old['walls']),
                       'newWallSegments': len(new['walls']), 'floorVoidsStairsRegistrationPreserved': True})
Path('outputs/cleaned-wall-update-report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
