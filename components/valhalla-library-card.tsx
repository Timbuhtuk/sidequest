'use client';
import {sitePath} from '@/lib/site-path';
import {useState,useEffect} from 'react';
import {ArrowRight} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {achievements,L,type Locale} from '@/lib/valhalla-data';
import {parseState,storageKey,activeRun,type State} from '@/lib/valhalla-state';
export default function ValhallaLibraryCard({locale}:{locale:Locale}){
 const [saved,setSaved]=useState<State|null>(null);
 useEffect(()=>{const read=()=>{try{const raw=localStorage.getItem(storageKey);setSaved(raw?parseState(JSON.parse(raw)):null)}catch{setSaved(null)}};read();window.addEventListener('focus',read);window.addEventListener('storage',read);window.addEventListener('pageshow',read);return()=>{window.removeEventListener('focus',read);window.removeEventListener('storage',read);window.removeEventListener('pageshow',read)}},[]);
 const t=(v:ReturnType<typeof L>)=>v[locale];
 return <a className="home-game home-valhalla-game" href={sitePath('/ac-valhalla')}><div className="home-game-art"><img src={sitePath('/valhalla-cover.jpg')} alt="" width={460} height={215} draggable={false} loading="lazy"/></div><div className="home-game-copy"><div className="home-kicker">OPEN WORLD RPG · 2020</div><h3>Assassin’s Creed Valhalla</h3><p>{t(L('Достижения, союзы и коллекции основной игры и дополнений.','Досягнення, союзи й колекції основної гри та доповнень.','Achievements, alliances and collections across the base game and DLC.'))}</p><div className="home-game-tags"><span>{achievements.length} {t(L('достижений','досягнень','achievements'))}</span><span>STEAM · BASE + DLC</span></div><div className="home-game-progress"><div><span>{t(L('Достижения получены','Досягнення отримано','Achievements earned'))}</span><span>{saved?.earned.length??0} / {achievements.length}</span></div><Progress aria-label={t(L('Достижения получены','Досягнення отримано','Achievements earned'))} value={(saved?.earned.length??0)/achievements.length*100}/>{saved&&<p className="home-game-run">{activeRun(saved).name}</p>}</div><span className="home-game-open">{saved?t(L('Продолжить прохождение','Продовжити проходження','Continue playthrough')):t(L('Открыть трекер','Відкрити трекер','Open tracker'))}<ArrowRight size={22}/></span></div></a>;
}
