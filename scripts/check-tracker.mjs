import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const out=path.resolve('.checks');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'package.json'),'{"type":"commonjs"}');
for(const file of ['tracker-data','book-goals','tracker-state','tracker-recommendations','i18n']){
 const text=fs.readFileSync(`lib/${file}.ts`,'utf8');
 fs.writeFileSync(path.join(out,`${file}.js`),ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
}
fs.mkdirSync(path.join(out,'locales'),{recursive:true});
for(const locale of ['uk','en'])fs.copyFileSync(`lib/locales/${locale}.json`,path.join(out,'locales',`${locale}.json`));
fs.copyFileSync('lib/book-goals.json',path.join(out,'book-goals.json'));
const require=createRequire(import.meta.url);
const {achievements,stages,sources}=require(path.join(out,'tracker-data.js'));
const {bookGoals}=require(path.join(out,'book-goals.js'));
const {freshRun,freshState,parseState,blocker,status,runStatus,setBookCollected,setEarned,setRunProgress}=require(path.join(out,'tracker-state.js'));
assert.equal(achievements.length,81);
assert.equal(new Set(achievements.map(a=>a.id)).size,81);
assert.equal(sources.booksGuide,'https://steamcommunity.com/sharedfiles/filedetails/?id=2270958276');
assert.equal(new Set(Object.values(sources)).size,Object.keys(sources).length);
assert.equal(bookGoals.length,75);
assert.equal(new Set(bookGoals.map(book=>book.id)).size,75);
assert.deepEqual(Object.fromEntries(['dubai','prague1','golem','prague2','garm','prague3','london'].map(stage=>[stage,bookGoals.filter(book=>book.stage===stage).length])),{dubai:1,prague1:38,golem:12,prague2:16,garm:3,prague3:2,london:3});
assert.deepEqual(Object.fromEntries(['campaign','system','criminal','breach'].map(g=>[g,achievements.filter(a=>a.group===g).length])),{campaign:46,system:8,criminal:10,breach:17});
for(const a of achievements)for(const id of a.stages)assert(stages.some(s=>s.id===id));
const a=id=>achievements.find(a=>a.id===id);
const guided=['time','rookery','driller','neon','ticket','cult','honor','samizdat','kazdy','jim','family','harvester','harvest','spokes'];
for(const id of guided){assert(a(id).steps.length>=4,`${id} needs a useful multi-step route`);assert(a(id).warnings.length>=1,`${id} needs a failure warning`)}
assert.equal(a('cult').steps.length,7);assert(a('cult').warnings.some(text=>text.includes('Либорио')));
const original=freshState();original.run.stage='prague2';original.earned=['heated','god'];original.run.collectedBooks=bookGoals.slice(0,21).map(book=>book.id);original.run.books=original.run.collectedBooks.length;
original.run.completedTasks=['heated'];original.run.completedStages=['dubai'];
original.snapshots=[{id:'before-bank',name:'До банка',createdAt:'2026-09-02T12:00:00Z',run:structuredClone(original.run)}];
assert.deepEqual(parseState(JSON.parse(JSON.stringify(original))),original);
const oneBook=setBookCollected(freshState(),['book-01'],true);
assert.deepEqual(oneBook.run.collectedBooks,['book-01']);
assert.equal(oneBook.run.books,1);
assert.equal(setBookCollected(oneBook,['book-01'],false).run.books,0);
const legacyBooks=JSON.parse(JSON.stringify(original));delete legacyBooks.run.collectedBooks;legacyBooks.run.books=3;
const migratedBooks=parseState(legacyBooks);
assert.deepEqual(migratedBooks.run.collectedBooks,['book-01','book-02','book-03']);
assert.equal(migratedBooks.run.books,3);
const edited=structuredClone(original);edited.run.decisions.bank='bank';
assert(blocker(a('god'),edited.run));
assert.equal(status(a('god'),edited).tone,'done');
assert.equal(runStatus(a('god'),edited).tone,'done');
assert.equal(runStatus(a('god'),edited).detail,undefined);
assert.equal(blocker(a('jim'),edited.run),null);
edited.run.decisions.bank='allison';
assert(blocker(a('jim'),edited.run));assert(blocker(a('tablets'),edited.run));
edited.run.decisions.calibrator='early';assert(blocker(a('family'),edited.run));assert(blocker(a('honor'),edited.run));
edited.run.decisions.boss='switch';assert(blocker(a('pacifist'),edited.run));assert.equal(blocker(a('fox'),edited.run),null);
const restored={...edited,run:structuredClone(edited.snapshots[0].run)};
assert.deepEqual(restored.earned,['heated','god']);assert.equal(restored.run.books,21);assert.equal(restored.run.decisions.bank,undefined);
// Retired duplicate-task history is import-only and independent of active progress.
const historical=setEarned(original,['human'],true);
assert.deepEqual(historical.run,original.run);
assert.equal(historical.run.completedTasks.includes('human'),false);
const taskDone=parseState({...historical,run:{...historical.run,completedTasks:['heated','human']}});
assert.deepEqual(taskDone.earned,historical.earned);
assert.deepEqual(taskDone.run.completedStages,historical.run.completedStages);
const unlockRemoved=setEarned(taskDone,['human'],false);
assert(unlockRemoved.run.completedTasks.includes('human'));
assert.throws(()=>setRunProgress(taskDone,'tasks',['human'],false));
assert.throws(()=>setRunProgress(historical,'tasks',['human'],true));
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
console.log('PASS: 81 achievements, branching, inactive task history, independent achievement/stage marks, legacy migration, export/import, new run, snapshot rollback, invalid imports.');

const {stageRecommendations,beforeLeaving}=require(path.join(out,'tracker-recommendations.js'));
const dubai=freshState();
const before=stageRecommendations(dubai);
const learned=setEarned(dubai,['adept'],true);
assert(before.focused.some(a=>a.id==='adept'));
assert(!stageRecommendations(learned).pending.some(a=>a.id==='adept'));
assert(!beforeLeaving(learned).some(text=>text.includes('обучение')));
assert(beforeLeaving(learned).some(text=>text.includes('Сингха')));
assert.equal(stageRecommendations(learned).earnedHere,before.earnedHere+1);
const removed=setEarned(learned,['adept'],false);
assert(stageRecommendations(removed).focused.some(a=>a.id==='adept'));
const oldTasks=parseState({...dubai,run:{...dubai.run,completedTasks:['adept']}});
assert(stageRecommendations(oldTasks).focused.some(a=>a.id==='adept'));
assert.equal(runStatus(a('adept'),oldTasks).tone,'now');
const full=setEarned(dubai,achievements.map(a=>a.id),true);
assert.equal(stageRecommendations(full).pending.length,0);
assert.equal(stageRecommendations(full).earnedHere,stageRecommendations(full).eligible.length);
assert(beforeLeaving(full).every(text=>!text.includes('обучение')&&!text.includes('книги')&&!text.includes('Сингха')));
const replay={...learned,run:freshRun()};
assert(!stageRecommendations(replay).pending.some(a=>a.id==='adept'));
assert(!stageRecommendations({...learned,run:structuredClone(dubai.run)}).pending.some(a=>a.id==='adept'));
const booksDone=setEarned({...dubai,run:{...dubai.run,stage:'prague2'}},['harvester'],true);
assert(beforeLeaving(booksDone).some(text=>text.includes('Жнец')),'Keep prerequisites for still-unearned achievements');
for(const stage of stages){
 const state={...full,run:{...full.run,stage:stage.id}};
 assert.equal(stageRecommendations(state).pending.length,0);
 for(const achievement of achievements)assert.equal(runStatus(achievement,state).tone,'done');
}
console.log('PASS: earned achievements leave recommendations, undo restores them, legacy task marks are ignored, completed stages stay independent, prerequisite reminders are retained.');

// Every former task ID remains valid history, including inside saved checkpoints.
const allLegacy=structuredClone(original);
allLegacy.run.completedTasks=achievements.map(a=>a.id);
allLegacy.run.decisions={bank:'allison',calibrator:'early',otar:'no',gallois:'no'};
allLegacy.run.notes='Historical save note';
allLegacy.run.counters.emperor=3;
allLegacy.snapshots[0].run=structuredClone(allLegacy.run);
const loadedLegacy=parseState(JSON.parse(JSON.stringify(allLegacy)));
assert.deepEqual(loadedLegacy,allLegacy);
for(const stage of stages){
 const saved={...loadedLegacy,run:{...loadedLegacy.run,stage:stage.id}};
 const noHistory={...saved,run:{...saved.run,completedTasks:[]}};
 assert.deepEqual(stageRecommendations(saved),stageRecommendations(noHistory));
 assert.deepEqual(beforeLeaving(saved),beforeLeaving(noHistory));
 for(const achievement of achievements)assert.deepEqual(runStatus(achievement,saved),runStatus(achievement,noHistory));
}
// Simple goals have instructions and remain actionable without any step model.
assert(a('heated').tip && stageRecommendations(freshState()).focused.some(a=>a.id==='heated'));
// A historical duplicate cannot satisfy the real multi-stage Otar prerequisites.
assert(blocker(a('family'),loadedLegacy.run));
const otarRoute={...loadedLegacy,earned:[],run:{...loadedLegacy.run,stage:'golem',decisions:{calibrator:'normal',otar:'yes',gallois:'yes'}}};
assert.equal(blocker(a('family'),otarRoute.run),null);
assert(beforeLeaving(otarRoute).some(text=>text.includes('Отара')));
assert(!otarRoute.earned.includes('family'));
const dxUI=fs.readFileSync('components/deus-ex-tracker.tsx','utf8');
assert(!/completedTasks|Шаг выполнен/.test(dxUI),'Retired duplicate steps must not return to the interface or calculations');
console.log('PASS: all retired step IDs round-trip as inactive history; simple instructions and factual cross-stage conditions remain independent.');

const {createTranslator,localizedCatalog,parseLocale,languageKey}=require(path.join(out,'i18n.js'));
assert.equal(parseLocale('ua'),'uk');assert.equal(parseLocale('uk'),'uk');assert.equal(parseLocale('en'),'en');assert.equal(parseLocale('fr'),null);
assert.notEqual(languageKey,require(path.join(out,'tracker-state.js')).storageKey);
const dictionaries=Object.fromEntries(['uk','en'].map(l=>[l,JSON.parse(fs.readFileSync(`lib/locales/${l}.json`,'utf8'))]));
assert.deepEqual(Object.keys(dictionaries.uk).sort(),Object.keys(dictionaries.en).sort());
// Every authored Russian string must have both translations, including import errors and status explanations.
for(const file of ['components/deus-ex-tracker.tsx','lib/tracker-data.ts','lib/tracker-state.ts','lib/tracker-recommendations.ts']){
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
