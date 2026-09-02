import {achievements,steps,items,stages,events,decisionDefinitions,defaultGoals,type Achievement,type Step,type Text,L,catalogVersion} from './witcher-data';
export const storageKey='sidequest.witcher3.steam292030.profile.local.v1';
export type Run={id:string;name:string;mode:'standard'|'ngplus';stage:string;completedSteps:string[];completedStages:string[];items:string[];events:string[];decisions:Record<string,string>;difficulty:'unknown'|'death'|'hard'|'other';difficultyBroken:'unknown'|'yes'|'no';goals:string[];notes:string};
export type Snapshot={id:string;name:string;createdAt:string;run:Run};
export type State={version:1;catalogVersion:number;game:'witcher3';platform:'steam-292030';profile:'local';earned:string[];activeRunId:string;runs:Run[];snapshots:Snapshot[]};
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const freshRun=(name='Первое прохождение',mode:Run['mode']='standard'):Run=>({id:uid(),name,mode,stage:'orchard',completedSteps:[],completedStages:[],items:[],events:[],decisions:{},difficulty:'unknown',difficultyBroken:'unknown',goals:[...defaultGoals],notes:''});
export function freshState():State{const run=freshRun();return{version:1,catalogVersion,game:'witcher3',platform:'steam-292030',profile:'local',earned:[],activeRunId:run.id,runs:[run],snapshots:[]}}
export const activeRun=(s:State)=>s.runs.find(r=>r.id===s.activeRunId)!;
export function changeRun(state:State,patch:Partial<Run>):State{return{...state,runs:state.runs.map(r=>r.id===state.activeRunId?{...r,...patch,id:r.id}:r)}}
export function mark(state:State,layer:'earned'|'completedSteps'|'completedStages'|'items',ids:string[],value:boolean):State{
 const allowed=layer==='earned'?achievements:layer==='completedSteps'?steps:layer==='completedStages'?stages:items;
 if(ids.some(id=>!allowed.some(x=>x.id===id)))throw Error('invalid-id');
 const existing=layer==='earned'?state.earned:activeRun(state)[layer];
 const result=value?[...new Set([...existing,...ids])]:existing.filter(id=>!ids.includes(id));
 return layer==='earned'?{...state,earned:result}:changeRun(state,{[layer]:result});
}
export function addRun(state:State,name:string,mode:Run['mode']):State{if(state.runs.length>=30)throw Error('run-limit');const run=freshRun(name.trim()||'Playthrough',mode);return{...state,activeRunId:run.id,runs:[...state.runs,run]}}
export function saveSnapshot(state:State,name:string):State{if(state.snapshots.length>=100)throw Error('snapshot-limit');return{...state,snapshots:[{id:uid(),name:name.trim()||activeRun(state).name,createdAt:new Date().toISOString(),run:structuredClone(activeRun(state))},...state.snapshots]}}
export function restoreSnapshot(state:State,id:string):State{const snapshot=state.snapshots.find(s=>s.id===id);if(!snapshot)throw Error('invalid-id');return{...state,activeRunId:snapshot.run.id,runs:state.runs.map(r=>r.id===snapshot.run.id?structuredClone(snapshot.run):r)}}
export type Tri=true|false|null;
export type Expr={fact:string;equals:string}|{all:Expr[]}|{any:Expr[]}|{not:Expr}|{atLeast:number;of:Expr[]};
export function evaluate(e:Expr,facts:Record<string,string|undefined>):Tri{
 if('fact'in e){const v=facts[e.fact];return v===undefined||v==='unknown'?null:v===e.equals}
 if('not'in e){const r=evaluate(e.not,facts);return r===null?null:!r}
 const list='all'in e?e.all:'any'in e?e.any:e.of;const values=list.map(x=>evaluate(x,facts));
 if('all'in e)return values.includes(false)?false:values.includes(null)?null:true;
 if('any'in e)return values.includes(true)?true:values.includes(null)?null:false;
 const n=values.filter(x=>x===true).length;return n>=e.atLeast?true:n+values.filter(x=>x===null).length<e.atLeast?false:null;
}
export type Availability={status:'now'|'later'|'conditions'|'blocked'|'mode'|'unknown';reasons:Text[]};
const needInfo=L('Уточни решения и историю сложности. Неизвестное условие не считается выполненным.','Уточни рішення та історію складності. Невідома умова не вважається виконаною.','Confirm decisions and difficulty history. Unknown conditions are not treated as satisfied.');
const rollback=L('Возможен возврат к сохранению игры и точке трекера до события либо новое прохождение.','Можна повернутися до збереження гри та точки трекера до події або почати нове проходження.','Reload a game save and tracker checkpoint from before the event, or start another playthrough.');
export function availability(a:Achievement,run:Run):Availability{
 const reasons:Text[]=[];let blocked=false,unknown=false,mode=false,condition=false;
 const decision=(key:string,good:string,message:Text)=>{const value=evaluate({fact:key,equals:good},run.decisions);if(value===false){blocked=true;reasons.push(message)}else if(value===null){unknown=true;reasons.push(needInfo)}};
 if(a.id==='walked-the-path'||a.id==='ran-the-gauntlet'){
  if(run.difficulty==='unknown'||run.difficultyBroken==='unknown'){unknown=true;reasons.push(needInfo)}
  if(run.difficulty==='other'||(a.id==='walked-the-path'&&run.difficulty==='hard')){mode=true;reasons.push(L('Начальная сложность не подходит для этой цели.','Початкова складність не підходить для цієї цілі.','Starting difficulty does not qualify for this goal.'))}
  if(run.difficultyBroken==='yes'){
   if(run.difficulty==='unknown'){unknown=true;reasons.push(needInfo)}
   else if(a.id==='ran-the-gauntlet'&&run.difficulty==='death'){unknown=true;reasons.push(L('Сложность снижалась с «На смерть!». Неизвестно, опускалась ли она ниже «Боль и страдания!»: для этой цели нужна отдельная проверка.','Складність знижувалась із «Маршу смерті!». Невідомо, чи опускалася вона нижче «Кров і зламані кістки!»: перевір окремо.','Difficulty was lowered from Death March. It is unknown whether it dropped below Blood and Broken Bones; check separately.'))}
   else {blocked=true;reasons.push(L('Подтверждено понижение ниже выбранного порога сложности.','Підтверджено зниження нижче обраного порогу складності.','A drop below the selected difficulty threshold was confirmed.'))}
  }
 }
 if(a.id==='full-crew'){
  decision('keira','kaer',L('Союзница не отправилась в крепость.','Союзниця не вирушила до фортеці.','The sorceress did not go to the fortress.'));
  decision('ves','alive',L('Не выполнено условие спасения союзницы.','Не виконано умову порятунку союзниці.','The ally’s rescue condition failed.'));
  decision('ruler','supported',L('Не поддержан ни один из наследников.','Не підтримано жодного зі спадкоємців.','Neither sibling was supported.'));
  if(!run.completedSteps.includes('allies-checklist')){condition=true;reasons.push(L('Проверь все семь необходимых союзников: одних решений недостаточно.','Перевір усіх сімох необхідних союзників: самих рішень недостатньо.','Verify all seven required allies; decisions alone do not confirm recruitment.'))}
 }
 if(a.id==='kingmaker')decision('ruler','supported',L('В этой ветке отказались от участия в выборе правителя.','У цій гілці відмовилися від участі у виборі правителя.','This branch declined the succession quest.'));
 if(a.id==='woodland-spirit')decision('spirit','kill',L('Выбран ритуал: условие охоты не выполнено.','Обрано ритуал: умову полювання не виконано.','The ritual was chosen instead of the required hunt.'));
 if(a.id==='last-action-hero'&&run.decisions.ending==='prison'||a.id==='kling-of-the-clink'&&run.decisions.ending==='medal'){blocked=true;reasons.push(L('Подтверждён альтернативный финал этой ветки.','Підтверджено альтернативний фінал цієї гілки.','The alternative ending was confirmed in this branch.'))}
 if(['last-action-hero','kling-of-the-clink','assassin-of-kings'].includes(a.id)&&!run.completedSteps.includes(`complete-${a.id}`)){unknown=true;reasons.push(L('Полная цепочка условий ещё не проверена; сверяйся с источником.','Повний ланцюжок умов ще не перевірено; звіряйся з джерелом.','The complete prerequisite chain is not verified; consult the source.'))}
 if(a.id==='card-collector'){
  const lost=items.filter(i=>['milva','dandelion','foltest-steel','emhyr-relentless','francesca-queen','eredin-destroyer'].includes(i.id)&&i.event&&run.events.includes(i.event)&&!run.items.includes(i.id));
  if(lost.length){unknown=true;reasons.push(L('Подтверждено завершение турнира, но обязательные карты не отмечены. Сверь инвентарь: отсутствие отметки не доказывает потерю карты.','Підтверджено завершення турніру, але обов’язкові карти не позначені. Перевір інвентар: відсутність позначки не доводить втрату карти.','A tournament is confirmed closed, but required cards are unmarked. Check your inventory: an absent mark does not prove a lost card.'))}
  else {unknown=true;reasons.push(L('Проверяются только 11 приоритетных карт, не полный набор.','Перевіряються лише 11 пріоритетних карт, не повний набір.','Only 11 priority cards are tracked, not the complete set.'))}
 }
 if(blocked)reasons.push(rollback);
 return{status:blocked?'blocked':mode?'mode':unknown?'unknown':condition?'conditions':a.stages.includes(run.stage as never)?'now':'later',reasons};
}
export function stepAvailability(s:Step,run:Run):Availability{
 const linked=s.goals.map(id=>achievements.find(a=>a.id===id)!).map(a=>availability(a,run));
 if(linked.every(a=>a.status==='blocked'||a.status==='mode'))return{status:'blocked',reasons:linked.flatMap(a=>a.reasons)};
 if(s.before&&run.events.includes(s.before)&&!run.completedSteps.includes(s.id))return{status:'unknown',reasons:[L('Событие уже подтверждено. Уточни, было ли это действие выполнено до перехода.','Подію вже підтверджено. Уточни, чи виконано цю дію до переходу.','The event is already confirmed. Check whether this action was completed beforehand.')]};
 return{status:s.stages.includes(run.stage as never)?'now':'later',reasons:[]};
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function text(v:unknown,max:number){if(typeof v!=='string'||v.length>max)throw Error('invalid-data');return v}
function set(v:unknown,allowed:string[],max=2000):string[]{if(!Array.isArray(v)||v.length>max||v.some(x=>typeof x!=='string'||!allowed.includes(x))||new Set(v).size!==v.length)throw Error('invalid-data');return [...v]}
function one<T extends string>(v:unknown,allowed:readonly T[]):T{if(typeof v!=='string'||!allowed.includes(v as T))throw Error('invalid-data');return v as T}
function parseRun(v:unknown):Run{
 if(!object(v)||!object(v.decisions))throw Error('invalid-data');const decisions:Record<string,string>={};
 for(const [k,value]of Object.entries(v.decisions)){const def=decisionDefinitions.find(d=>d.id===k);if(!def)throw Error('invalid-data');decisions[k]=one(value,['unknown',...def.options.map(o=>o[0])])}
 return{id:text(v.id,100),name:text(v.name,100),mode:one(v.mode,['standard','ngplus']),stage:one(v.stage,stages.map(s=>s.id)),completedSteps:set(v.completedSteps,steps.map(s=>s.id)),completedStages:set(v.completedStages,stages.map(s=>s.id)),items:set(v.items,items.map(i=>i.id)),events:set(v.events,events.map(e=>e.id)),goals:set(v.goals,achievements.map(a=>a.id)),difficulty:one(v.difficulty,['unknown','death','hard','other']),difficultyBroken:one(v.difficultyBroken,['unknown','yes','no']),decisions,notes:text(v.notes,30000)};
}
export function parseState(v:unknown):State{
 if(!object(v)||v.version!==1||v.catalogVersion!==catalogVersion||v.game!=='witcher3'||v.platform!=='steam-292030'||v.profile!=='local'||!Array.isArray(v.runs)||v.runs.length<1||v.runs.length>30||!Array.isArray(v.snapshots)||v.snapshots.length>100)throw Error('invalid-data');
 const runs=v.runs.map(parseRun);const ids=runs.map(r=>r.id);if(ids.some(x=>!x)||new Set(ids).size!==ids.length||!ids.includes(String(v.activeRunId)))throw Error('invalid-data');
 const snapshots=v.snapshots.map(s=>{if(!object(s))throw Error('invalid-data');const run=parseRun(s.run);if(!ids.includes(run.id))throw Error('invalid-data');const date=text(s.createdAt,50);if(!Number.isFinite(Date.parse(date)))throw Error('invalid-data');return{id:text(s.id,100),name:text(s.name,100),createdAt:date,run}});
 if(new Set(snapshots.map(s=>s.id)).size!==snapshots.length)throw Error('invalid-data');
 return{version:1,catalogVersion,game:'witcher3',platform:'steam-292030',profile:'local',earned:set(v.earned,achievements.map(a=>a.id)),activeRunId:String(v.activeRunId),runs,snapshots};
}
