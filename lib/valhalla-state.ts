import {achievements,steps,items,stages,events,decisionDefinitions,defaultGoals,type Achievement,type Step,type Text,L,catalogVersion} from './valhalla-data';
export const storageKey='sidequest.valhalla.steam2208920.profile.local.v1';
export type Run={id:string;name:string;mode:'standard';stage:string;completedSteps:string[];completedStages:string[];items:string[];events:string[];decisions:Record<string,string>;goals:string[];notes:string};
export type Snapshot={id:string;name:string;createdAt:string;run:Run};
export type State={version:1;catalogVersion:number;game:'valhalla';platform:'steam-2208920';profile:'local';earned:string[];activeRunId:string;runs:Run[];snapshots:Snapshot[]};
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const freshRun=(name='Первое прохождение',mode:Run['mode']='standard'):Run=>({id:uid(),name,mode,stage:'norway',completedSteps:[],completedStages:[],items:[],events:[],decisions:{},goals:[...defaultGoals],notes:''});
export function freshState():State{const run=freshRun();return{version:1,catalogVersion,game:'valhalla',platform:'steam-2208920',profile:'local',earned:[],activeRunId:run.id,runs:[run],snapshots:[]}}
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
export function availability(a:Achievement,run:Run):Availability{
 if(a.campaign==='saga'&&a.id==='pure-of-heart'&&run.decisions.elk==='used')return{status:'blocked',reasons:[L('В этом забеге использован алтарь лося. Для этой цели начни новый забег в Нифльхейме.','У цьому забігу використано вівтар лося. Для цієї цілі почни новий забіг у Ніфльгеймі.','An Elk Shrine was used in this attempt. Start another Niflheim attempt for this goal.')]};
 if(a.id==='pure-of-heart'&&run.decisions.elk!=='unused')return{status:'unknown',reasons:[L('Уточни, использовались ли алтари лося в текущем забеге.','Уточни, чи використовувалися вівтарі лося в поточному забігу.','Confirm whether any Elk Shrines were used in this attempt.')]};
 return{status:a.stages.includes(run.stage)?'now':'later',reasons:[]};
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
 return{id:text(v.id,100),name:text(v.name,100),mode:one(v.mode,['standard']),stage:one(v.stage,stages.map(s=>s.id)),completedSteps:set(v.completedSteps,steps.map(s=>s.id)),completedStages:set(v.completedStages,stages.map(s=>s.id)),items:set(v.items,items.map(i=>i.id)),events:set(v.events,events.map(e=>e.id)),goals:set(v.goals,achievements.map(a=>a.id)),decisions,notes:text(v.notes,30000)};
}
export function parseState(v:unknown):State{
 if(!object(v)||v.version!==1||v.catalogVersion!==catalogVersion||v.game!=='valhalla'||v.platform!=='steam-2208920'||v.profile!=='local'||!Array.isArray(v.runs)||v.runs.length<1||v.runs.length>30||!Array.isArray(v.snapshots)||v.snapshots.length>100)throw Error('invalid-data');
 const runs=v.runs.map(parseRun);const ids=runs.map(r=>r.id);if(ids.some(x=>!x)||new Set(ids).size!==ids.length||!ids.includes(String(v.activeRunId)))throw Error('invalid-data');
 const snapshots=v.snapshots.map(s=>{if(!object(s))throw Error('invalid-data');const run=parseRun(s.run);if(!ids.includes(run.id))throw Error('invalid-data');const date=text(s.createdAt,50);if(!Number.isFinite(Date.parse(date)))throw Error('invalid-data');return{id:text(s.id,100),name:text(s.name,100),createdAt:date,run}});
 if(new Set(snapshots.map(s=>s.id)).size!==snapshots.length)throw Error('invalid-data');
 return{version:1,catalogVersion,game:'valhalla',platform:'steam-2208920',profile:'local',earned:set(v.earned,achievements.map(a=>a.id)),activeRunId:String(v.activeRunId),runs,snapshots};
}
