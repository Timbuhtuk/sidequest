import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
import * as THREE from 'three';

const out = path.resolve('.checks');
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"commonjs"}');
fs.writeFileSync(path.join(out, 'dx-map-model.js'), ts.transpileModule(fs.readFileSync('lib/dx-map-model.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText);
const require = createRequire(import.meta.url);
const {modelLocations, modelPoint, mapDestination, pragueInteriorMaps} = require(path.join(out, 'dx-map-model.js'));
let floors = 0, solids = 0, holes = 0, points = 0;
const area = ring => Math.abs(ring.reduce((sum, p, i) => {const next = ring[(i+1)%ring.length]; return sum+p[0]*next[1]-next[0]*p[1];}, 0)/2);
function inside(p, ring) {
    let result = false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
        const a=ring[i],b=ring[j];
        if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) result=!result;
    }
    return result;
}
for (const location of modelLocations) {
    const model = JSON.parse(fs.readFileSync(`public/maps/models/${location.id}.json`, 'utf8'));
    assert.equal(model.id, location.id);
    if (model.id === 'prague') {
        const destinations = model.buildings.map(building => mapDestination(model, {building: building.id})).filter(Boolean);
        assert.deepEqual(destinations.sort(), Object.values(pragueInteriorMaps).sort(), 'Each interior must have exactly one linked city volume');
        for (const [place, destination] of Object.entries(pragueInteriorMaps)) {
            assert.equal(mapDestination(model, {place}), destination);
            assert(modelLocations.some(item => item.id === destination), 'Broken interior map link');
        }
        assert.equal(mapDestination(model, {place: 'city-theater'}), null);
        assert.equal(mapDestination(model, {building: 'missing'}), null);
    } else assert.equal(mapDestination(model, {place: 'city-bank'}), null);
    assert(model.kind === 'city' ? model.floors.length === 1 : model.floors.length > 1);
    assert(model.wallHeight > model.slabDepth * 3);
    assert.equal(new Set(model.floors.map(f=>f.id)).size, model.floors.length);
    assert.equal(new Set(model.floors.map(f=>f.elevation)).size, model.floors.length);
    const preview = [];
    for (const floor of model.floors) {
        floors++;
        assert(floor.shapes.length, `${location.id}/${floor.id} missing floors`);
        for (const polygon of floor.shapes) {
            const vector = p => new THREE.Vector2(p[0]-model.center[0], -(p[1]-model.center[1]));
            const shape = new THREE.Shape(polygon.outer.map(vector));
            shape.holes = polygon.holes.map(h => new THREE.Path(h.map(vector)));
            const geometry = new THREE.ExtrudeGeometry(shape, {depth:model.slabDepth,bevelEnabled:false,steps:1,curveSegments:1});
            geometry.rotateX(-Math.PI/2);
            geometry.translate(0,floor.elevation-model.slabDepth,0);
            const position=geometry.getAttribute('position');
            assert(Array.from(position.array).every(Number.isFinite), `Invalid solid ${location.id}/${floor.id}`);
            geometry.computeBoundingBox();
            assert(Math.abs(geometry.boundingBox.max.y-geometry.boundingBox.min.y-model.slabDepth)<.0001);
            let topArea=0;
            for(let i=0;i<position.count;i+=3) {
                const p=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(position,i+j));
                if(p.every(v=>Math.abs(v.y-floor.elevation)<.0001)) topArea+=new THREE.Triangle(...p).getArea();
                if(location.id==='tf29')preview.push({p:p.map(v=>v.toArray()),color:'floor'});
            }
            const expected=area(polygon.outer)-polygon.holes.reduce((sum,h)=>sum+area(h),0);
            assert(Math.abs(topArea-expected)<Math.max(.08,expected*.005),`${location.id}/${floor.id}: triangulation filled a void or lost area (${topArea}/${expected})`);
            holes+=polygon.holes.length;solids++;
            geometry.dispose();
        }
        assert(floor.walls.every(w=>w.length===4&&w.every(Number.isFinite)));
        assert(floor.wallShapes.length || (model.kind === 'city' && model.buildings?.length), `${location.id}/${floor.id}: missing volumes`);
        for(const polygon of [...floor.wallShapes, ...(model.buildings || []).filter(b=>b.floor===floor.id).map(b=>b.shape)]) {
            const outer=polygon.outer.map(p=>new THREE.Vector2(...p));
            const inner=polygon.holes.map(h=>h.map(p=>new THREE.Vector2(...p)));
            const triangles=THREE.ShapeUtils.triangulateShape(outer,inner);
            const vertices=[...outer,...inner.flat()];
            const triangulated=triangles.reduce((sum,indices)=>{
                const [a,b,c]=indices.map(i=>vertices[i]);
                return sum+Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/2;
            },0);
            const expected=area(polygon.outer)-polygon.holes.reduce((sum,h)=>sum+area(h),0);
            assert(Math.abs(triangulated-expected)<Math.max(.003,expected*.001),`${location.id}/${floor.id}: wall joint triangulation changed solid area`);
        }
        if(location.id==='tf29')for(const [x1,z1,x2,z2]of floor.walls){
            preview.push({p:[[x1-model.center[0],floor.elevation,z1-model.center[1]],[x2-model.center[0],floor.elevation,z2-model.center[1]],[x2-model.center[0],floor.elevation+model.wallHeight,z2-model.center[1]],[x1-model.center[0],floor.elevation+model.wallHeight,z1-model.center[1]]],color:'wall'});
        }
    }
    for(const place of location.places) {
        const floor=model.floors.find(f=>f.id===place.floor);
        assert(floor,`${place.id}: missing floor`);
        assert(place.pixel[1]>=floor.sourceBounds[1]&&place.pixel[1]<=floor.sourceBounds[3],`${place.id}: point on wrong source layer`);
        const p=modelPoint(model,place);
        const planar=[p[0]+model.center[0],p[2]+model.center[1]];
        const onFloor=floor.shapes.some(s=>inside(planar,s.outer)&&!s.holes.some(h=>inside(planar,h)));
        assert(onFloor,`${location.id}/${place.id}: label is outside its reconstructed floor`);
        for(const locale of ['ru','uk','en'])assert(place.name[locale]&&place.detail[locale]);
        points++;
    }
    if(location.id==='tf29')fs.writeFileSync('outputs/tf29-solid-preview.json',JSON.stringify(preview));
}
console.log(`PASS: ${modelLocations.length} volumetric models, ${floors} separated floors, ${solids} solids, ${holes} preserved voids, ${points} localized places on geometry.`);
