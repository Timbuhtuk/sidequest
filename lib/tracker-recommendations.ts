import {achievements,type Achievement,type StageId} from './tracker-data';
import type {FlagId,TrackerState} from './tracker-state';

export const flagAchievements:Record<FlagId,string>={kills:'pacifist',alarms:'fox',systemKills:'clean',criminalKills:'conduct',drugs:'drugs'};

export function stageRecommendations(state:TrackerState,catalog:Achievement[]=achievements){
  const eligible=catalog.filter(a=>a.stages.includes(state.run.stage));
  const pending=eligible.filter(a=>!state.earned.includes(a.id));
  const focused=pending.filter(a=>a.stages.length<=2||a.id==='ghost'||(a.kind==='run'&&state.run.stage==='credits'));
  const flexible=pending.filter(a=>!focused.includes(a));
  return {eligible,pending,focused,flexible,earnedHere:eligible.length-pending.length};
}

// Each reminder retains prerequisites for unearned achievements, even if an
// earlier achievement in the same quest chain has already been unlocked.
const reminders:Partial<Record<StageId,{ids:string[];text:string}[]>>={
  dubai:[{ids:[],text:'Дубай нельзя посетить повторно.'},{ids:['adept'],text:'Пройди обучение до завершения задания.'},{ids:['singh'],text:'Спаси Сингха в финале задания.'},{ids:['tablets'],text:'Проверь книги до ухода: они нужны в одной ветке прохождения.'}],
  prague1:[{ids:['time','honor','family'],text:'До встречи с Коллером реши вопрос с ранним калибратором.'},{ids:['tablets'],text:'Проверь книги до ухода: они нужны в одной ветке прохождения.'},{ids:['samizdat','kazdy','family'],text:'Начни нужные побочные задания до отъезда.'}],
  golem:[{ids:['rookery'],text:'Забери золотого пингвина в начале маршрута.'},{ids:['rucker'],text:'Перед разговором с Рукером сохранись.'},{ids:['tablets'],text:'Проверь книги до ухода: они нужны в одной ветке прохождения.'},{ids:['family'],text:'Выполни просьбу Отара до эвакуации.'}],
  prague2:[{ids:['god','jim','tablets'],text:'После M10 сохранись перед выбором между Элисон и банком.'},{ids:['harvester','harvest','tablets'],text:'До полёта в ГАРМ правильно заверши расследование «Жнец».'},{ids:['tablets'],text:'Проверь книги до ухода: они нужны в одной ветке прохождения.'}],
  garm:[{ids:['fox'],text:'Для маршрута без тревог свяжись с Вегой.'},{ids:['driller','fox'],text:'Перед бурением сохранись: рекомендации о его влиянии на тревоги в старых гайдах расходятся.'}],
  prague3:[{ids:[],text:'Полёт в Лондон завершает пражскую часть.'},{ids:['harvest'],text:'Заверши «Последний урожай» до отъезда.'},{ids:['kazdy'],text:'Помоги Самиздату до отъезда.'},{ids:['tablets'],text:'Проверь книги до ухода: они нужны в одной ветке прохождения.'}],
  london:[{ids:['spokes','laputan','jim','pacifist'],text:'Сохранись перед финальными решениями.'},{ids:['pacifist'],text:'Для «Пацифиста» не используй устройство убийства Марченко.'},{ids:['tablets'],text:'Забери последнюю книгу.'}],
  credits:[{ids:['enlightened'],text:'Досмотри титры.'},{ids:[],text:'Перед новым прохождением сохрани копию прогресса.'}],
  system:[{ids:['help','figure'],text:'Прими просьбу ShadowChild.'},{ids:['murder','truth'],text:'Поговори с Нико у входа и собирай улики.'},{ids:['clean'],text:'Соблюдай условие без убийств до финала дополнения.'}],
  criminal:[{ids:['drugs'],text:'Для прохождения без допинга отказывайся от таблетки Делца и не употребляй модифицированную батарею.'},{ids:['objection'],text:'Перед финальным разговором собери улики.'},{ids:['conduct'],text:'Соблюдай условие без убийств до финала дополнения.'}],
};

export function beforeLeaving(state:TrackerState){
  return (reminders[state.run.stage]??[]).filter(r=>!r.ids.length||r.ids.some(id=>!state.earned.includes(id))).map(r=>r.text);
}
