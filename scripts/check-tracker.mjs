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
const {freshRun,freshState,parseState,blocker,status,runStatus,setEarned,setRunProgress}=require(path.join(out,'tracker-state.js'));
assert.equal(achievements.length,81);
assert.equal(new Set(achievements.map(a=>a.id)).size,81);
assert.deepEqual(Object.fromEntries(['campaign','system','criminal','breach'].map(g=>[g,achievements.filter(a=>a.group===g).length])),{campaign:46,system:8,criminal:10,breach:17});
for(const a of achievements)for(const id of a.stages)assert(stages.some(s=>s.id===id));
const a=id=>achievements.find(a=>a.id===id);
const original=freshState();original.run.stage='prague2';original.earned=['heated','god'];original.run.books=21;
original.run.completedTasks=['heated'];original.run.completedStages=['dubai'];
original.snapshots=[{id:'before-bank',name:'До банка',createdAt:'2026-09-02T12:00:00Z',run:structuredClone(original.run)}];
assert.deepEqual(parseState(JSON.parse(JSON.stringify(original))),original);
const edited=structuredClone(original);edited.run.decisions.bank='bank';
assert(blocker(a('god'),edited.run));
assert.equal(status(a('god'),edited).tone,'done');
assert.equal(runStatus(a('god'),edited).tone,'blocked');
assert.equal(blocker(a('jim'),edited.run),null);
edited.run.decisions.bank='allison';
assert(blocker(a('jim'),edited.run));assert(blocker(a('tablets'),edited.run));
edited.run.decisions.calibrator='early';assert(blocker(a('family'),edited.run));assert(blocker(a('honor'),edited.run));
edited.run.decisions.boss='switch';assert(blocker(a('pacifist'),edited.run));assert.equal(blocker(a('fox'),edited.run),null);
const restored={...edited,run:structuredClone(edited.snapshots[0].run)};
assert.deepEqual(restored.earned,['heated','god']);assert.equal(restored.run.books,21);assert.equal(restored.run.decisions.bank,undefined);
// Historical unlocks, current-run tasks and completed stages are three independent inputs.
const historical=setEarned(original,['human'],true);
assert.deepEqual(historical.run,original.run);
assert.equal(historical.run.completedTasks.includes('human'),false);
const taskDone=setRunProgress(historical,'tasks',['human'],true);
assert.deepEqual(taskDone.earned,historical.earned);
assert.deepEqual(taskDone.run.completedStages,historical.run.completedStages);
const unlockRemoved=setEarned(taskDone,['human'],false);
assert(unlockRemoved.run.completedTasks.includes('human'));
const taskRemoved=setRunProgress(taskDone,'tasks',['human'],false);
assert(taskRemoved.earned.includes('human'));
const stageDone=setRunProgress(taskDone,'stages',['london'],true);
assert.equal(stageDone.run.stage,'prague2');
assert.deepEqual(stageDone.earned,taskDone.earned);
assert.deepEqual(stageDone.run.completedTasks,taskDone.run.completedTasks);
const moved={...stageDone,run:{...stageDone.run,stage:'credits'}};
assert.deepEqual(moved.run.completedStages,['dubai','london']);
const rewound={...stageDone,run:structuredClone(stageDone.snapshots[0].run)};
assert.deepEqual(rewound.run.completedTasks,['heated']);
assert.deepEqual(rewound.run.completedStages,['dubai']);
assert(rewound.earned.includes('human'));
const restarted={...stageDone,run:freshRun()};
assert.deepEqual(restarted.earned,stageDone.earned);
assert.deepEqual(restarted.run.completedTasks,[]);assert.deepEqual(restarted.run.completedStages,[]);
assert.deepEqual(restarted.snapshots,stageDone.snapshots);
// Legacy version 1 saves retain earned marks and stage; new completion arrays start empty.
const legacy=structuredClone(original);
for(const r of [legacy.run,...legacy.snapshots.map(s=>s.run)]){delete r.completedTasks;delete r.completedStages;}
const migrated=parseState(legacy);
assert.deepEqual(migrated.earned,original.earned);assert.equal(migrated.run.stage,'prague2');
assert.deepEqual(migrated.run.completedTasks,[]);assert.deepEqual(migrated.run.completedStages,[]);
assert.deepEqual(migrated.snapshots[0].run.completedTasks,[]);
assert.deepEqual(parseState(JSON.parse(JSON.stringify(stageDone))),stageDone);
for(const change of [s=>s.run.books=76,s=>s.run.books=-1,s=>s.earned.push('invented'),s=>s.run.flags.kills='maybe',s=>s.run.decisions.bank='both',s=>s.run.counters.emperor=999,s=>s.version=2,s=>s.run.completedTasks=['invented'],s=>s.run.completedStages=['heated'],s=>s.run.completedTasks=null,s=>s.snapshots[0].run.completedStages=['bad-stage']]){
const invalid=structuredClone(original);change(invalid);assert.throws(()=>parseState(invalid));
}
console.log('PASS: 81 achievements, branching, independent unlock/task/stage marks, legacy migration, export/import, new run, snapshot rollback, invalid imports.');
