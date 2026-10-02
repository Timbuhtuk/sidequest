import assert from 'node:assert/strict';
import fs from 'node:fs';

const intel = JSON.parse(fs.readFileSync('lib/dx-map-intel.json', 'utf8'));
const registrations = JSON.parse(fs.readFileSync('scripts/fixtures/dx-map-registration.json', 'utf8'));
const ids = new Set();
const kinds = new Set(['mission', 'collectible', 'access', 'route', 'loot', 'person', 'location']);
const models = new Map();
for (const file of fs.readdirSync('public/maps/models').filter(file => file.endsWith('.json') && file !== 'manifest.json'))
{
    const model = JSON.parse(fs.readFileSync(`public/maps/models/${file}`, 'utf8'));
    models.set(model.id, model);
}
const byRegistration = new Map(registrations.map(item => [item.id, item]));
function project(matrix, point)
{
    return matrix.map(row => row[0]*point[0]+row[1]*point[1]+row[2]);
}
function inverse(matrix, point)
{
    const [[a,b,tx],[c,d,ty]] = matrix;
    const x = point[0]-tx, y = point[1]-ty, determinant = a*d-b*c;
    return [(d*x-b*y)/determinant, (a*y-c*x)/determinant];
}
for (const r of registrations)
{
    const [[a,b],[c,d]] = r.matrix;
    assert(a*d-b*c > .01, `${r.id}: collapsed or reflected registration`);
    assert(r.anchors.length >= 3, `${r.id}: insufficient reference landmarks`);
    const distinct = new Set(r.anchors.map(anchor => anchor.map.map(Math.round).join(',')));
    assert(distinct.size >= 3, `${r.id}: repeated destination features`);
    const residuals = r.anchors.map(anchor => Math.hypot(...project(r.matrix, anchor.raw).map((v,q) => v-anchor.map[q]))).sort((a,b) => a-b);
    assert(residuals[Math.floor(residuals.length/2)] < 1.5, `${r.id}: reference landmarks no longer align`);
    assert(residuals.at(-1) < 4, `${r.id}: inconsistent reference landmark`);
    const model = models.get(r.model), floor = model.floors.find(f => f.id === r.floor);
    assert(floor, `${r.id}: missing floor`);
    const part = (floor.sourceParts || [floor])[r.part];
    assert.deepEqual(r.offset, part.sourceOffset, `${r.id}: model registration changed; recalibrate points`);
}
assert.equal(Object.keys(intel.sources).length, 12);
assert.equal(intel.records.length, Object.values(intel.sources).reduce((sum, source) => sum+source.points, 0));
for (const item of intel.records)
{
    assert(!ids.has(item.id), `Duplicate ${item.id}`); ids.add(item.id);
    assert(kinds.has(item.kind) && intel.colors[item.kind], `${item.id}: invalid kind`);
    assert(intel.sources[item.sourceMap], `${item.id}: missing source`);
    assert(Number.isInteger(item.sourcePoint) && item.sourcePoint > 0, `${item.id}: invalid annotation index`);
    assert(['aligned', 'approximate'].includes(item.precision), `${item.id}: invalid precision`);
    assert(item.position.length === 2 && item.position.every(Number.isFinite), `${item.id}: invalid position`);
    for (const locale of ['ru', 'uk', 'en'])
    {
        assert(item.title[locale], `${item.id}: missing ${locale} title`);
        assert(item.detail[locale], `${item.id}: missing ${locale} detail`);
    }
    const model = models.get(item.model), r = byRegistration.get(item.registration);
    assert(r && r.map === item.sourceMap && r.model === item.model && r.floor === item.floor, `${item.id}: mismatched sheet/floor registration`);
    assert(item.sourcePixel.length === 2 && item.sourcePixel.every((v,q) => Number.isFinite(v) && v >= 0 && v <= r.sourceSize[q]), `${item.id}: invalid source pixel`);
    const raw = inverse(r.matrix, item.sourcePixel);
    const plan = model.sourceTransform ? project([model.sourceTransform.slice(0,3), model.sourceTransform.slice(3)], raw) : raw.map((v,q) => v+r.offset[q]);
    // A street, doorway or shaft may lie outside the extracted floor polygon.
    // Moving it onto a polygon must fail, even if that looks geometrically valid.
    assert(Math.hypot(...plan.map((v,q) => v*model.scale-item.position[q])) < .0001, `${item.id}: position no longer matches source (snapped or wrong transform)`);
}
// Independently reviewed floor assignments on the source sheets.
for (const [id, floor] of [['gp-m1-02','2'], ['gp-m12-38','7'], ['gp-m17-11','4'], ['gp-m17-30','5'], ['gp-m18-31','5'], ['gp-m25-01','8']])
    assert.equal(intel.records.find(item => item.id === id)?.floor, floor, `${id}: wrong source floor`);
assert(intel.records.some(item => item.detail.en.includes('Code: 0451.')), 'Dubai 0451 code was not transferred');
console.log(`PASS: ${intel.records.length} points match source pixels through ${registrations.length} per-panel transforms; landmarks, floors and localization verified.`);
