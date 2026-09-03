// Model, migration and server-rendered component tests; no browser or shared build.
import './check-witcher.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module, {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const data=require(path.resolve('.checks/witcher/witcher-data.js'));
const model=require(path.resolve('.checks/witcher/witcher-state.js'));
const {retiredStepIds}=require(path.resolve('.checks/witcher/witcher-legacy-steps.js'));
const {copy}=require(path.resolve('.checks/witcher/witcher-copy.js'));
const {achievements,steps,advice,achievementGuidance}=data;
const {freshState,activeRun,mark,changeRun,addRun,saveSnapshot,restoreSnapshot,parseState,availability,recommendedAchievements,stageActionProgress}=model;

assert.equal(steps.length,10);
assert.equal(advice.length,12);
assert.equal(retiredStepIds.length,91);
assert.equal(new Set(retiredStepIds).size,91);
assert(!steps.some(s=>retiredStepIds.includes(s.id)));
assert(!steps.some(s=>s.id.startsWith('complete-')));
for(const step of steps){
  assert(step.goals.length>0);
  for(const id of step.goals){
    const achievement=achievements.find(a=>a.id===id);
    for(const locale of ['ru','uk','en']){
      assert.notEqual(step.title[locale],achievement.name[locale]);
      assert.notEqual(step.detail[locale],achievement.description[locale]);
    }
  }
}
for(const tip of advice){assert(tip.source in data.sources);for(const locale of ['ru','uk','en'])assert(tip.title[locale]&&tip.detail[locale]);}
assert.equal(achievementGuidance('power-overwhelming').actions.length,0);
assert.equal(achievementGuidance('power-overwhelming').tips[0].id,'power-circuit');
assert.equal(achievementGuidance('butcher-of-blaviken').actions.length,0);
const crew=achievementGuidance('full-crew');
assert.deepEqual(crew.actions.map(s=>s.id),['keira-invite','ves-rescue','skellige-succession']);
assert.deepEqual(crew.actions.map(s=>s.stages[0]),['velen','novigrad','skellige']);
assert(crew.partial);
const politics=achievementGuidance('assassin-of-kings');
assert.equal(politics.actions.length,4);
assert.equal(politics.actions.filter(s=>s.before==='isle').length,3);
assert.deepEqual(politics.actions.at(-1).stages,['finale']);
assert.equal(politics.actions.at(-1).before,undefined,'Later conversation must not appear in the pre-Isle checklist');

const oldPrep=['check-difficulty','first-gwent','buy-orchard-cards','power-circuit','keira-quests','keira-invite','ves-rescue','masquerade-save','zoltan-reward','high-stakes-save','skellige-succession','allies-checklist','political-prep','spirit-save','hos-auction','hos-wedding','hos-painting','baw-golyat','baw-branch'];
const oldIds=[...oldPrep,...achievements.map(a=>`complete-${a.id}`)];
let legacy=freshState();
legacy=changeRun(legacy,{completedSteps:oldIds,completedStages:['orchard'],items:['zoltan'],events:['masquerade'],decisions:{keira:'kaer',ves:'alive',ruler:'supported'},notes:'Keep my notes',goals:['power-overwhelming','full-crew']});
legacy=mark(legacy,'earned',['butcher-of-blaviken'],true);
legacy=saveSnapshot(legacy,'Legacy checkpoint');
legacy=addRun(legacy,'Second legacy run','standard');
legacy=changeRun(legacy,{completedSteps:['complete-power-overwhelming','power-circuit'],notes:'Second branch'});
legacy=saveSnapshot(legacy,'Second checkpoint');
legacy.catalogVersion=1;
for(const run of [...legacy.runs,...legacy.snapshots.map(s=>s.run)])delete run.retiredSteps;
const original=structuredClone(legacy);
const migrated=parseState(legacy);
assert.deepEqual(legacy,original,'Migration cannot mutate the input or backup');
assert.equal(migrated.catalogVersion,2);
assert.deepEqual(migrated.earned,original.earned,'Old condition-actions must never award an achievement');
assert.equal(migrated.activeRunId,original.activeRunId);
for(let i=0;i<original.runs.length;i++){
  const before=original.runs[i],after=migrated.runs[i];
  assert.deepEqual(after.completedSteps,before.completedSteps.filter(id=>steps.some(s=>s.id===id)));
  assert.deepEqual(after.retiredSteps,before.completedSteps.filter(id=>retiredStepIds.includes(id)));
  for(const key of Object.keys(before).filter(k=>k!=='completedSteps'))assert.deepEqual(after[key],before[key],key);
}
assert(!migrated.runs[0].completedSteps.some(id=>id.startsWith('politics-')),'The old bundled political mark does not fill newly split steps');
assert.equal(migrated.snapshots[0].run.retiredSteps.length,2);
assert.equal(migrated.snapshots[1].run.retiredSteps.length,91);
assert.deepEqual(parseState(JSON.parse(JSON.stringify(migrated))),migrated,'Migration and export/import are idempotent');
const restored=restoreSnapshot(migrated,migrated.snapshots[1].id);
assert.deepEqual(activeRun(restored),migrated.snapshots[1].run);
assert.deepEqual(restored.earned,migrated.earned);
const ng=addRun(migrated,'New NG+','ngplus');
assert.deepEqual(activeRun(ng).retiredSteps,[]);
assert.deepEqual(activeRun(ng).completedSteps,[]);
assert.deepEqual(ng.earned,migrated.earned);
for(const version of [1,2])for(const field of ['completedSteps','retiredSteps']){
  const bad=structuredClone(migrated);bad.catalogVersion=version;bad.runs[0][field]=['complete-invented-achievement'];
  assert.throws(()=>parseState(bad),'Unknown IDs remain invalid');
}
assert.throws(()=>mark(migrated,'completedSteps',['complete-power-overwhelming'],true));
assert.equal(availability(achievements.find(a=>a.id==='full-crew'),migrated.runs[0]).status,'unknown');
for(const id of ['assassin-of-kings','last-action-hero','kling-of-the-clink']){
  const run={...migrated.runs[0],stage:'finale',decisions:{},completedSteps:steps.map(s=>s.id)};
  assert.equal(availability(achievements.find(a=>a.id===id),run).status,'unknown','Incomplete chains never become confirmed through retired or active checklists');
}
const emptyStage={...activeRun(migrated),stage:'hos'};
assert.equal(stageActionProgress(emptyStage).active.length,0);
assert.equal(stageActionProgress(emptyStage).allMarked,false,'An empty chain must not mean completed');
const now=recommendedAchievements(migrated);
assert(now.some(a=>a.id==='power-overwhelming'),'A simple selected goal remains in Now despite old duplicate marks');
assert(!now.some(a=>migrated.earned.includes(a.id)));
assert.equal(new Set(now.map(a=>a.id)).size,now.length);
let earnedGoal=changeRun(freshState(),{stage:'allies',goals:['full-crew','assassin-of-kings']});
earnedGoal=mark(earnedGoal,'earned',['full-crew'],true);
assert(!recommendedAchievements(earnedGoal).some(a=>a.id==='full-crew'),'An earned selected/default goal must not be recommended');
assert(!stageActionProgress(activeRun(earnedGoal),earnedGoal.earned).active.some(s=>s.goals.every(id=>id==='full-crew')));
assert(stageActionProgress(activeRun(earnedGoal),earnedGoal.earned).active.some(s=>s.goals.includes('assassin-of-kings')),'Keep steps for other unearned goals');
// Exercise shared-prerequisite filtering without inventing a production gameplay relation.
const shared=steps.find(s=>s.id==='politics-eye-for-eye'),originalGoals=shared.goals;
try{
  shared.goals=['full-crew','assassin-of-kings'];
  assert(stageActionProgress(activeRun(earnedGoal),earnedGoal.earned).active.includes(shared),'An earned goal cannot hide a prerequisite needed by another unearned goal');
  const both=mark(earnedGoal,'earned',['assassin-of-kings'],true);
  assert(!stageActionProgress(activeRun(both),both.earned).active.includes(shared));
  assert.deepEqual(activeRun(both).completedSteps,[],'Earned marks never prove prerequisite completion');
}finally{shared.goals=originalGoals;}
const corruptHistory=structuredClone(migrated);corruptHistory.runs[0].retiredSteps=null;
assert.throws(()=>parseState(corruptHistory));

const modules=new Map();
function loadLocal(file){
  const absolute=path.resolve(file);
  const resolved=[absolute,absolute+'.ts',absolute+'.tsx',absolute+'.json'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  assert(resolved,`Missing component dependency: ${file}`);
  if(resolved.endsWith('.json'))return JSON.parse(fs.readFileSync(resolved,'utf8'));
  if(modules.has(resolved))return modules.get(resolved).exports;
  const mod=new Module(resolved);mod.filename=resolved;mod.paths=Module._nodeModulePaths(path.dirname(resolved));
  modules.set(resolved,mod);
  const nativeRequire=mod.require.bind(mod);
  mod.require=specifier=>specifier.startsWith('@/')?loadLocal(path.resolve(specifier.slice(2))):specifier.startsWith('.')?loadLocal(path.resolve(path.dirname(resolved),specifier)):nativeRequire(specifier);
  const output=ts.transpileModule(fs.readFileSync(resolved,'utf8'),{fileName:resolved,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  mod._compile(output,resolved);
  return mod.exports;
}
function loadComponent(file){return loadLocal(file).default;}
const Guidance=loadComponent('components/witcher-goal-guidance.tsx');
function renderGuidance(id,locale='ru',visible=()=>true){return renderToStaticMarkup(React.createElement(Guidance,{achievementId:id,locale,completedSteps:[],disabled:false,visible,onToggle(){},onOpenStep(){}}));}
for(const locale of ['ru','uk','en']){
  for(const id of ['power-overwhelming','butcher-of-blaviken','david-and-golyat','walked-the-path']){
    const html=renderGuidance(id,locale);
    assert(!html.includes('wt-goal-actions'),'No empty actions block');
    assert(!html.includes('role="checkbox"'),'No extra action checkbox for a simple goal');
    assert(!html.includes(copy.checkedSteps[locale]));
    assert(!html.includes('0/0')&&!html.includes('0/1'));
  }
  const html=renderGuidance('full-crew',locale);
  assert.equal((html.match(/role="checkbox"/g)||[]).length,3);
  assert.equal((html.match(/class="wt-action-stage"/g)||[]).length,3);
  assert(html.includes(copy.partialActions[locale]));
  const hidden=renderGuidance('full-crew',locale,()=>false);
  for(const step of crew.actions)assert(!hidden.includes(step.title[locale]),'Secret steps stay hidden');
}
const Tracker=loadComponent('components/witcher-tracker.tsx');
const html=renderToStaticMarkup(React.createElement(Tracker));
assert(html.includes('Цели в этой локации'));
assert(!html.includes('Запланируй круг по местам Силы'),'Advice is not a checkable Now task');
assert(html.includes('tracker-sources-trigger'),'Keep the footer sources entry');
assert(html.includes('progress-summary'),'Keep the shared summary');
const ui=fs.readFileSync('components/witcher-tracker.tsx','utf8');
assert(ui.includes("achievementGuidance(selectedAchievement.id).actions.length>0?t('nextCheck'):t('achievementCheck')"),'No action-warning for an achievement without actions');
assert(ui.includes('actionProgress.allMarked'),'Guard the empty-chain completion message');
assert(ui.includes('stageSteps.length>0&&<div className="wt-before-row"'),'Hide fake remaining counts without actual actions');
console.log('PASS: audited actions/advice, cross-stage groups, old-save and snapshot migration, strict IDs, independent recommendations and RU/UK/EN rendered empty-state safeguards.');
