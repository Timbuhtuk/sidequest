import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';

const out=path.resolve('.checks');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'package.json'),'{"type":"commonjs"}');
const source=fs.readFileSync('lib/dx-map-data.ts','utf8');
fs.writeFileSync(path.join(out,'dx-map-data.js'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const require=createRequire(import.meta.url);
const {mapScenes,mapSources}=require(path.join(out,'dx-map-data.js'));

assert.deepEqual(mapScenes.map(scene=>scene.id),['prague','dubai','golem','garm','london']);
assert(mapScenes.flatMap(scene=>scene.markers).length>=20);
assert.equal(new Set(mapScenes.flatMap(scene=>scene.markers.map(marker=>`${scene.id}:${marker.id}`))).size,mapScenes.flatMap(scene=>scene.markers).length);
for(const scene of mapScenes){
  assert(scene.layers.length>0,`${scene.id} needs a map layer`);
  assert(scene.markers.length>0,`${scene.id} needs interactive markers`);
  for(const layer of scene.layers){
    const file=path.join('public',layer.image.replace(/^\//,''));
    assert(fs.existsSync(file),`Missing ${file}`);
    assert(fs.statSync(file).size>100_000,`${file} is not a valid full map asset`);
  }
  for(const marker of scene.markers){
    assert(marker.x>=0&&marker.x<=100&&marker.y>=0&&marker.y<=100,`${scene.id}:${marker.id} is outside the map`);
    for(const field of ['title','location','description'])for(const locale of ['ru','uk','en'])assert(marker[field][locale],`${scene.id}:${marker.id} is missing ${field}.${locale}`);
    if(marker.layers)for(const id of marker.layers)assert(scene.layers.some(layer=>layer.id===id),`${scene.id}:${marker.id} references unknown layer ${id}`);
  }
}
assert.equal(mapSources.length,2);
assert(mapSources.every(source=>source.href.startsWith('https://deusex.fandom.com/')));
console.log('PASS: five map scenes, source assets, localized marker details, layer references and coordinates.');
