import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const out=path.resolve('.checks');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'package.json'),'{"type":"commonjs"}');
for(const file of ['tracker-data','tracker-state','i18n']){
 const text=fs.readFileSync(`lib/${file}.ts`,'utf8');
 fs.writeFileSync(path.join(out,`${file}.js`),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
}
fs.mkdirSync(path.join(out,'locales'),{recursive:true});
for(const locale of ['uk','en'])fs.copyFileSync(`lib/locales/${locale}.json`,path.join(out,'locales',`${locale}.json`));
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

const {createTranslator,localizedCatalog,parseLocale,languageKey}=require(path.join(out,'i18n.js'));
assert.equal(parseLocale('ua'),'uk');assert.equal(parseLocale('uk'),'uk');assert.equal(parseLocale('en'),'en');assert.equal(parseLocale('fr'),null);
assert.notEqual(languageKey,require(path.join(out,'tracker-state.js')).storageKey);
const dictionaries=Object.fromEntries(['uk','en'].map(l=>[l,JSON.parse(fs.readFileSync(`lib/locales/${l}.json`,'utf8'))]));
assert.deepEqual(Object.keys(dictionaries.uk).sort(),Object.keys(dictionaries.en).sort());
// Every authored Russian string must have both translations, including import errors and status explanations.
for(const file of ['app/page.tsx','lib/tracker-data.ts','lib/tracker-state.ts']){
 const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const visit=n=>{
  if((ts.isStringLiteral(n)||ts.isJsxText(n))&&/[А-Яа-яЁё]/.test(n.text)){
   const key=n.text.trim();for(const l of ['uk','en'])assert(dictionaries[l][key],`Missing ${l}: ${key}`);
   if(ts.isJsxText(n))assert.fail(`Untranslated JSX text in ${file}: ${key}`);
  }
  ts.forEachChild(n,visit);
 };visit(sf);
}
const savedBefore=JSON.stringify(original);
for(const locale of ['ru','uk','en']){
 const t=createTranslator(locale),catalog=localizedCatalog(locale);
 assert.deepEqual(catalog.achievements.map(a=>({id:a.id,stages:a.stages,group:a.group,kind:a.kind,counter:a.counter})),achievements.map(a=>({id:a.id,stages:a.stages,group:a.group,kind:a.kind,counter:a.counter})));
 assert.equal(catalog.achievements.length,81);
 assert.deepEqual(catalog.stages.map(s=>s.id),stages.map(s=>s.id));
 assert.equal(JSON.stringify(original),savedBefore);
 if(locale!=='ru'){
  assert.notEqual(t('Получено достижений'),'Получено достижений');
  assert.equal(t(' Экспорт '),' '+dictionaries[locale]['Экспорт']+' ');
  for(const a of catalog.achievements)for(const key of ['name','description','tip','category'])assert(a[key].length>0);
 }
 if(locale==='en')assert(!/[А-Яа-яЁё]/.test(JSON.stringify(catalog)),'Russian text leaked into the English catalog');
}
assert(localizedCatalog('uk').achievements.some(a=>a.name.toLocaleLowerCase('uk').includes('калібратор')||a.description.toLocaleLowerCase('uk').includes('калібратор')));
assert(localizedCatalog('en').achievements.some(a=>a.name.toLocaleLowerCase('en').includes('heated')));
console.log('PASS: complete UA/RU/EN dictionaries, translated catalog/search text, stable IDs, independent language preference and preserved progress.');
