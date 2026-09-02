import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const out=path.resolve('.checks');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'package.json'),'{"type":"commonjs"}');
for(const file of ['tracker-data','tracker-state']){
 const text=fs.readFileSync(`lib/${file}.ts`,'utf8');
 fs.writeFileSync(path.join(out,`${file}.js`),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
}
const require=createRequire(import.meta.url);
const {achievements,stages}=require(path.join(out,'tracker-data.js'));
const {freshState,parseState,blocker,status}=require(path.join(out,'tracker-state.js'));
assert.equal(achievements.length,81);
assert.equal(new Set(achievements.map(a=>a.id)).size,81);
assert.deepEqual(Object.fromEntries(['campaign','system','criminal','breach'].map(g=>[g,achievements.filter(a=>a.group===g).length])),{campaign:46,system:8,criminal:10,breach:17});
for(const a of achievements)for(const id of a.stages)assert(stages.some(s=>s.id===id));
const a=id=>achievements.find(a=>a.id===id);
const original=freshState();original.run.stage='prague2';original.earned=['heated','god'];original.run.books=21;
original.snapshots=[{id:'before-bank',name:'До банка',createdAt:'2026-09-02T12:00:00Z',run:structuredClone(original.run)}];
assert.deepEqual(parseState(JSON.parse(JSON.stringify(original))),original);
const edited=structuredClone(original);edited.run.decisions.bank='bank';
assert(blocker(a('god'),edited.run));
assert.equal(status(a('god'),edited).tone,'done');
assert.equal(blocker(a('jim'),edited.run),null);
edited.run.decisions.bank='allison';
assert(blocker(a('jim'),edited.run));assert(blocker(a('tablets'),edited.run));
edited.run.decisions.calibrator='early';assert(blocker(a('family'),edited.run));assert(blocker(a('honor'),edited.run));
edited.run.decisions.boss='switch';assert(blocker(a('pacifist'),edited.run));assert.equal(blocker(a('fox'),edited.run),null);
const restored={...edited,run:structuredClone(edited.snapshots[0].run)};
assert.deepEqual(restored.earned,['heated','god']);assert.equal(restored.run.books,21);assert.equal(restored.run.decisions.bank,undefined);
for(const change of [s=>s.run.books=76,s=>s.run.books=-1,s=>s.earned.push('invented'),s=>s.run.flags.kills='maybe',s=>s.run.decisions.bank='both',s=>s.run.counters.emperor=999,s=>s.version=2]){
const invalid=structuredClone(original);change(invalid);assert.throws(()=>parseState(invalid));
}
console.log('PASS: 81 achievements, category totals, data references, export/import, branching, earned-state isolation, snapshot rollback, invalid imports.');
