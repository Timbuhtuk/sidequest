import uk from './locales/uk.json';
import en from './locales/en.json';
import {achievements,decisions,groups,sources,stages} from './tracker-data';

export type Locale = 'uk' | 'ru' | 'en';
export const languageKey = 'dx-achievement-protocol-language';
export const languageOptions = [
  {value:'uk',label:'UA · Українська'},
  {value:'ru',label:'RU · Русский'},
  {value:'en',label:'EN · English'},
];
export const dateLocales:Record<Locale,string>={uk:'uk-UA',ru:'ru-RU',en:'en-GB'};
export function parseLocale(value:unknown):Locale|null{
  if(value==='ua')return 'uk';
  return value==='uk'||value==='ru'||value==='en'?value:null;
}
export function createTranslator(locale:Locale){
  const dictionary:Record<string,string>=locale==='uk'?uk:locale==='en'?en:{};
  return (text:string):string=>{
    if(locale==='ru'||!text.trim())return text;
    const key=text.trim(),translated=dictionary[key];
    if(translated===undefined)return text;
    return (text.match(/^\s*/)?.[0]||'')+translated+(text.match(/\s*$/)?.[0]||'');
  };
}
export function localizedCatalog(locale:Locale){
  const t=createTranslator(locale);
  const english=createTranslator('en');
  return {
    achievements:achievements.map(a=>({...a,name:locale==='en'?english(a.name):`${t(a.name)} (${english(a.name)})`,description:t(a.description),tip:t(a.tip),category:t(a.category)})),
    stages:stages.map(s=>({...s,name:t(s.name),short:t(s.short),mission:t(s.mission),subtitle:t(s.subtitle),before:t(s.before)})),
    decisions:decisions.map(d=>({...d,title:t(d.title),note:t(d.note),options:d.options.map(o=>({...o,label:t(o.label)}))})),
    groups:{...groups,campaign:t(groups.campaign),system:t(groups.system),criminal:t(groups.criminal)},
    sources:{...sources,steam:sources.steam.replace('l=russian','l='+({ru:'russian',uk:'ukrainian',en:'english'}[locale]))},
  };
}
