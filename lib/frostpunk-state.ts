import {achievements,stages,steps,type Achievement} from './frostpunk-data';
export const storageKey='sidequest.frostpunk.v1';
export type Run={id:string;name:string;stage:string;difficulty:string;mode:string;completedStages:string[];completedSteps:string[];goals:string[];notes:string;deaths:boolean;food:string};
export type State={game:'frostpunk';version:1;earned:string[];runs:Run[];active:string;snapshots:{id:string;name:string;run:Run}[]};
export function freshRun(id='initial',name='01'):Run{return {id,name,stage:'settlement',difficulty:'medium',mode:'endurance',completedStages:[],completedSteps:[],goals:[],notes:'',deaths:false,food:'unknown'}}
export function freshState():State{return {game:'frostpunk',version:1,earned:[],runs:[freshRun()],active:'initial',snapshots:[]}}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function ids(v:unknown,allowed:string[]):string[]{if(!Array.isArray(v)||v.some(id=>typeof id!=='string'||!allowed.includes(id)))throw Error('Invalid IDs');return [...new Set(v)]}
function parseRun(v:unknown):Run{
 if(!object(v)||typeof v.id!=='string'||!v.id||typeof v.name!=='string'||v.name.length>120||!stages.some(s=>s.id===v.stage)||!['easy','medium','hard','extreme','survivor'].includes(String(v.difficulty))||!['endurance','serenity','builders'].includes(String(v.mode))||typeof v.notes!=='string'||v.notes.length>50000||typeof v.deaths!=='boolean'||!['unknown','hunters','hothouses','mixed'].includes(String(v.food)))throw Error('Invalid run');
 return {id:v.id,name:v.name,stage:String(v.stage),difficulty:String(v.difficulty),mode:String(v.mode),notes:v.notes,deaths:v.deaths,food:String(v.food),completedStages:ids(v.completedStages,stages.map(s=>s.id)),completedSteps:ids(v.completedSteps,steps.map(s=>s.id)),goals:ids(v.goals,achievements.map(a=>a.id))};
}
export function parseState(v:unknown):State{
 if(!object(v)||v.game!=='frostpunk'||v.version!==1||!Array.isArray(v.runs)||!v.runs.length||v.runs.length>30||!Array.isArray(v.snapshots)||v.snapshots.length>50)throw Error('Invalid Frostpunk backup');
 const runs=v.runs.map(parseRun);
 if(new Set(runs.map(r=>r.id)).size!==runs.length||!runs.some(r=>r.id===v.active))throw Error('Invalid active run');
 const snapshots=v.snapshots.map(s=>{if(!object(s)||typeof s.id!=='string'||typeof s.name!=='string'||s.name.length>120)throw Error('Invalid snapshot');const run=parseRun(s.run);if(!runs.some(r=>r.id===run.id))throw Error('Unknown run');return {id:s.id,name:s.name,run}});
 if(new Set(snapshots.map(s=>s.id)).size!==snapshots.length)throw Error('Duplicate snapshots');
 return {game:'frostpunk',version:1,earned:ids(v.earned,achievements.map(a=>a.id)),runs,active:String(v.active),snapshots};
}
export function activeRun(state:State){return state.runs.find(r=>r.id===state.active)!}
export function changeRun(state:State,patch:Partial<Run>):State{return {...state,runs:state.runs.map(r=>r.id===state.active?{...r,...patch}:r)}}
export function mark(list:string[],id:string,value:boolean){return value?[...new Set([...list,id])]:list.filter(x=>x!==id)}
export function restore(state:State,id:string):State{const snapshot=state.snapshots.find(s=>s.id===id);if(!snapshot)throw Error('Missing snapshot');return {...state,active:snapshot.run.id,runs:state.runs.map(r=>r.id===snapshot.run.id?structuredClone(snapshot.run):r)}}
export function availability(a:Achievement,run:Run):'now'|'other'|'blocked'|'unknown'{
 const scenario=stages.find(s=>s.id===run.stage)!.scenario;
 if(a.scenario==='unknown')return 'unknown';
 if(a.scenario!=='any'&&a.scenario!==scenario)return 'other';
 const levels=['easy','medium','hard','extreme'];
 if(a.difficulty==='survivor'&&run.difficulty!=='survivor'||a.difficulty&&a.difficulty!=='survivor'&&(run.difficulty==='survivor'||levels.indexOf(run.difficulty)<levels.indexOf(a.difficulty)))return 'other';
 if(a.endurance&&run.mode!=='endurance')return 'other';
 if(['the-saviour','the-iron-saviour','bonus-pater-familias'].includes(a.id)&&run.deaths)return 'blocked';
 if(a.id==='carnivore'&&['hothouses','mixed'].includes(run.food)||a.id==='vegetarian'&&['hunters','mixed'].includes(run.food))return 'blocked';
 return 'now';
}
