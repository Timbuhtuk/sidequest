import assert from 'node:assert/strict';
import fs from 'node:fs';

const intel = JSON.parse(fs.readFileSync('lib/dx-map-intel.json', 'utf8'));
const ids = new Set();
const kinds = new Set(['mission', 'collectible', 'access', 'route', 'loot', 'person', 'location']);
const models = new Map();
for (const file of fs.readdirSync('public/maps/models').filter(file => file.endsWith('.json') && file !== 'manifest.json'))
{
    const model = JSON.parse(fs.readFileSync(`public/maps/models/${file}`, 'utf8'));
    models.set(model.id, model);
}

function inside(point, ring)
{
    let result = false;
    for (let q = 0, e = ring.length-1; q < ring.length; e = q++)
    {
        const a = ring[q], b = ring[e];
        if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) result = !result;
    }
    return result;
}
function distanceToSegment(point, a, b)
{
    const dx = b[0]-a[0], dy = b[1]-a[1];
    const length = dx*dx+dy*dy;
    const value = length ? Math.max(0, Math.min(1, ((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)) : 0;
    return Math.hypot(point[0]-(a[0]+value*dx), point[1]-(a[1]+value*dy));
}
function onGeometry(point, shapes)
{
    if (shapes.some(shape => inside(point, shape.outer) && !shape.holes.some(hole => inside(point, hole)))) return true;
    return shapes.some(shape => [shape.outer, ...shape.holes].some(ring => ring.some((a, q) => distanceToSegment(point, a, ring[(q+1)%ring.length]) < .12)));
}

assert.equal(Object.keys(intel.sources).length, 12);
assert.equal(intel.records.length, Object.values(intel.sources).reduce((sum, source) => sum+source.points, 0));
for (const item of intel.records)
{
    assert(!ids.has(item.id), `Duplicate ${item.id}`); ids.add(item.id);
    assert(kinds.has(item.kind), `${item.id}: invalid kind`);
    assert(intel.colors[item.kind], `${item.id}: missing color`);
    assert(intel.sources[item.sourceMap], `${item.id}: missing source`);
    assert(Number.isInteger(item.sourcePoint) && item.sourcePoint > 0, `${item.id}: invalid source point`);
    assert(['aligned', 'approximate'].includes(item.precision), `${item.id}: invalid precision`);
    assert(item.position.length === 2 && item.position.every(Number.isFinite), `${item.id}: invalid position`);
    for (const locale of ['ru', 'uk', 'en'])
    {
        assert(item.title[locale], `${item.id}: missing ${locale} title`);
        assert(item.detail[locale], `${item.id}: missing ${locale} detail`);
    }
    const model = models.get(item.model);
    assert(model, `${item.id}: unknown model`);
    const floor = model.floors.find(value => value.id === item.floor);
    assert(floor, `${item.id}: unknown floor`);
    const shapes = model.kind === 'city' ? model.buildings.map(building => building.shape) : floor.shapes;
    assert(onGeometry(item.position, shapes), `${item.id}: marker outside geometry`);
}

assert(intel.records.some(item => item.detail.en.includes('Code: 0451.')), 'Dubai 0451 code was not transferred');
assert(intel.records.some(item => item.kind === 'collectible' && item.model === 'prague'), 'Prague collectibles missing');
console.log(`PASS: ${intel.records.length} Gamepressure points from ${Object.keys(intel.sources).length} maps are localized, sourced and attached to model geometry.`);
