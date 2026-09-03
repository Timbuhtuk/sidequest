import {achievements,decisions,stages,type Achievement,type DecisionId,type StageId} from './tracker-data';
export type Flag = 'unknown'|'clear'|'broken';
export type FlagId = 'kills'|'alarms'|'systemKills'|'criminalKills'|'drugs';
// completedTasks is inactive history from the retired per-achievement step checkbox.
// Keep its original key for lossless version-1 imports and snapshot round-trips.
// It never confirms an achievement, a prerequisite, a stage or a new concrete step.
export type Run = {stage:StageId;completedTasks:readonly string[];completedStages:StageId[];difficulty:'normal'|'ngplus'|'permadeath';goals:string[];flags:Record<FlagId,Flag>;decisions:Partial<Record<DecisionId,string>>;books:number;counters:Record<string,number>;notes:string};
export type Snapshot = {id:string;name:string;createdAt:string;run:Run};
export type TrackerState = {version:1;earned:string[];run:Run;snapshots:Snapshot[];spoilers:boolean};
export const freshRun=():Run=>({stage:'dubai',completedTasks:[],completedStages:[],difficulty:'normal',goals:['pacifist','fox'],flags:{kills:'unknown',alarms:'unknown',systemKills:'unknown',criminalKills:'unknown',drugs:'unknown'},decisions:{},books:0,counters:{},notes:''});
export const freshState=():TrackerState=>({version:1,earned:[],run:freshRun(),snapshots:[],spoilers:false});
export const storageKey='dx-achievement-protocol-v1';
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const toggleIds=(current:string[],ids:string[],done:boolean)=>done?[...new Set([...current,...ids])]:current.filter(id=>!ids.includes(id));
export function setEarned(state:TrackerState,ids:string[],earned:boolean):TrackerState{return {...state,earned:toggleIds(state.earned,ids,earned)}}
export function setRunProgress(state:TrackerState,kind:'stages',ids:string[],completed:boolean):TrackerState{
  if(kind!=='stages')throw Error('Некорректные отметки прохождения.');
  return {...state,run:{...state.run,completedStages:toggleIds(state.run.completedStages,ids,completed) as StageId[]}};
}
function parseIds(v:unknown,valid:string[]):string[]{
  if(v===undefined)return [];
  if(!Array.isArray(v)||!v.every(id=>typeof id==='string'&&valid.includes(id)))throw Error('Некорректные отметки прохождения.');
  return [...new Set(v)] as string[];
}
function parseRun(v:unknown):Run{
  if(!record(v)||!stages.some(s=>s.id===v.stage)||!['normal','ngplus','permadeath'].includes(String(v.difficulty))||!record(v.flags)||!record(v.decisions)||!record(v.counters)||!Array.isArray(v.goals)||!v.goals.every(x=>['pacifist','fox'].includes(x))||typeof v.notes!=='string'||v.notes.length>10000||!Number.isInteger(v.books)||Number(v.books)<0||Number(v.books)>75)throw Error('Некорректное состояние прохождения.');
  for(const key of Object.keys(freshRun().flags))if(!['unknown','clear','broken'].includes(String(v.flags[key])))throw Error('Некорректные условия прохождения.');
  for(const [key,value] of Object.entries(v.decisions)){const d=decisions.find(x=>x.id===key);if(!d||!d.options.some(x=>x.value===value))throw Error('Некорректное сюжетное решение.');}
  for(const [key,value] of Object.entries(v.counters)){const a=achievements.find(x=>x.id===key);if(!a?.counter||typeof value!=='number'||!Number.isInteger(value)||value<0||value>a.counter)throw Error('Некорректный счётчик.');}
  return {stage:v.stage as StageId,completedTasks:parseIds(v.completedTasks,achievements.map(a=>a.id)),completedStages:parseIds(v.completedStages,stages.map(s=>s.id)) as StageId[],difficulty:v.difficulty as Run['difficulty'],goals:[...new Set(v.goals)] as string[],flags:Object.fromEntries(Object.keys(freshRun().flags).map(k=>[k,(v.flags as Record<string,unknown>)[k]])) as Run['flags'],decisions:{...v.decisions} as Run['decisions'],books:Number(v.books),counters:{...v.counters} as Run['counters'],notes:v.notes};
}
export function parseState(value:unknown):TrackerState{
  if(!record(value)||value.version!==1||!Array.isArray(value.earned)||!value.earned.every(id=>typeof id==='string'&&achievements.some(a=>a.id===id))||typeof value.spoilers!=='boolean'||!Array.isArray(value.snapshots)||value.snapshots.length>12)throw Error('Это не файл прогресса Achievement Protocol версии 1.');
  const snapshots=value.snapshots.map((v:unknown)=>{
    if(!record(v)||typeof v.id!=='string'||v.id.length>100||typeof v.name!=='string'||v.name.length>100||typeof v.createdAt!=='string'||Number.isNaN(Date.parse(v.createdAt)))throw Error('Некорректная контрольная точка.');
    return {id:v.id,name:v.name,createdAt:v.createdAt,run:parseRun(v.run)};
  });
  if(new Set(snapshots.map(s=>s.id)).size!==snapshots.length)throw Error('Повторяющиеся контрольные точки.');
  return {version:1,earned:[...new Set(value.earned)] as string[],run:parseRun(value.run),snapshots,spoilers:value.spoilers};
}
export function blocker(a:Achievement,run:Run):string|null{
  const d=run.decisions;
  if(['honor','family'].includes(a.id)&&d.calibrator==='early')return 'В этой ветке выбран ранний калибратор.';
  if(a.id==='time'&&d.calibrator==='normal')return 'Первая встреча с Коллером уже состоялась.';
  if(a.id==='god'&&d.bank==='bank')return 'Выбрана банковская ветка.';
  if(['jim','tablets'].includes(a.id)&&d.bank==='allison')return 'Выбрана Элисон: банковское хранилище недоступно.';
  if(a.id==='jim'&&d.antidote==='no')return 'В этой ветке нет противоядия.';
  if(a.id==='family'&&(d.otar==='no'||d.gallois==='no'))return 'Не выполнена цепочка услуг Отару.';
  if(['harvest','tablets'].includes(a.id)&&d.harvester==='no')return 'Нужная ветка «Последнего урожая» не открыта.';
  if(a.id==='kazdy'&&d.samizdat==='no')return 'Не оказана ранняя помощь Самиздату.';
  if(a.id==='pacifist'&&(run.flags.kills==='broken'||['switch','lethal'].includes(d.boss||'')))return 'В текущей ветке отмечено убийство.';
  if(a.id==='fox'&&run.flags.alarms==='broken')return 'В текущей ветке отмечена тревога.';
  if(a.id==='clean'&&run.flags.systemKills==='broken')return 'В System Rift отмечено убийство.';
  if(a.id==='conduct'&&run.flags.criminalKills==='broken')return 'В A Criminal Past отмечено убийство.';
  if(a.id==='drugs'&&run.flags.drugs==='broken')return 'Отмечено использование таблетки или батареи.';
  if(a.id==='never'&&run.difficulty!=='permadeath')return 'Требуется отдельный режим с одной жизнью.';
  return null;
}
export function status(a:Achievement,state:TrackerState):{label:string;tone:string;detail?:string}{
  if(state.earned.includes(a.id))return {label:'Получено',tone:'done'};
  return runStatus(a,state);
}
export function runStatus(a:Achievement,state:TrackerState):{label:string;tone:string;detail?:string}{
  if(state.earned.includes(a.id))return {label:'Получено',tone:'done'};
  const blocked=blocker(a,state.run);if(blocked)return {label:a.id==='never'?'Другое прохождение':'Закрыто выбором',tone:'blocked',detail:blocked};
  const stage=stages.find(s=>s.id===state.run.stage)!;
  if(a.group!==stage.group)return {label:groupsLabel(a.group),tone:'later'};
  if(a.kind==='run')return {label:state.run.stage==='credits'?'Проверь получение':'На всё прохождение',tone:'long'};
  if(a.stages.includes(state.run.stage))return {label:'Доступно сейчас',tone:'now'};
  if(a.group==='campaign'&&Math.max(...a.stages.map(s=>stages.findIndex(x=>x.id===s)))<stages.findIndex(s=>s.id===state.run.stage))return {label:'Проверь пропуск',tone:'missed'};
  return {label:'Позже по сюжету',tone:'later'};
}
function groupsLabel(g:string){return g==='campaign'?'Основная кампания':g==='system'?'System Rift':g==='criminal'?'A Criminal Past':'Breach';}
