"""Render plan-space before/after comparisons from the generated geometry."""
import json
import sys
from PIL import Image, ImageDraw

id = sys.argv[1] if len(sys.argv) > 1 else 'bank'
new = json.load(open(f'public/maps/models/{id}.json'))
old = json.load(open(f'outputs/models-before-cleanup/{id}.json'))
for floor in new['floors']:
    level = floor['id']
    out = Image.new('RGB', (1800, 950), '#10140f')
    for q, model in enumerate([old, new]):
        f = next(f for f in model['floors'] if f['id'] == level)
        points = [p for shape in f['shapes'] for p in shape['outer']]
        minx, miny = [min(p[a] for p in points) for a in [0, 1]]
        maxx, maxy = [max(p[a] for p in points) for a in [0, 1]]
        scale = min(840/(maxx-minx), 840/(maxy-miny))
        def point(p):
            return ((p[0]-minx)*scale+q*900+30, (p[1]-miny)*scale+60)
        draw = ImageDraw.Draw(out)
        draw.text((q*900+30, 20), 'BEFORE' if q == 0 else 'AFTER', fill='white')
        for shape in f['shapes']:
            draw.polygon([point(p) for p in shape['outer']], fill='#655931')
            draw.line([point(p) for p in shape['outer']+[shape['outer'][0]]], fill='#bcaa6d', width=2)
            for hole in shape['holes']:
                draw.polygon([point(p) for p in hole], fill='#10140f')
                draw.line([point(p) for p in hole+[hole[0]]], fill='#bcaa6d', width=2)
        for a, b, c, d in f['walls']:
            draw.line([point([a, b]), point([c, d])], fill='#ffde89', width=2)
    out.save(f'outputs/{id}-{level}-cleanup.png')
