'use client';
import {useState,useEffect} from 'react';
import {MoveUpRight} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {achievements,L,type Locale} from '@/lib/witcher-data';
import {parseState,storageKey,activeRun,type State} from '@/lib/witcher-state';
export default function WitcherLibraryCard({locale}:{locale:Locale}){
 const [saved,setSaved]=useState<State|null>(null);
 useEffect(()=>{const read=()=>{try{const raw=localStorage.getItem(storageKey);setSaved(raw?parseState(JSON.parse(raw)):null)}catch{setSaved(null)}};read();window.addEventListener('focus',read);window.addEventListener('storage',read);window.addEventListener('pageshow',read);return()=>{window.removeEventListener('focus',read);window.removeEventListener('storage',read);window.removeEventListener('pageshow',read)}},[]);
 const t=(v:ReturnType<typeof L>)=>v[locale];
 return <a className="home-game home-witcher-game" href="/witcher-3" style={{marginTop:28}}><div className="home-game-art"><img src="/witcher-cover.jpg" alt="The Witcher 3: Wild Hunt" width={460} height={215} draggable={false}/><span className="home-game-index">GAME_002</span></div><div className="home-game-copy"><div className="home-kicker">OPEN WORLD RPG · 2015</div><h3>The Witcher 3:<br/>Wild Hunt</h3><p>{t(L('Твой дневник Пути: достижения, важные карты гвинта и решения, которые нельзя отложить.','Твій щоденник Шляху: досягнення, важливі карти ґвінту та рішення, які не можна відкласти.','Your journal of the Path: achievements, important Gwent cards and choices that cannot wait.'))}</p><div className="home-game-tags"><span>{achievements.length} {t(L('достижений','досягнень','achievements'))}</span><span>STEAM · COMPLETE EDITION</span></div><div className="home-game-progress"><div><span>{t(L('Достижения получены','Досягнення отримано','Achievements earned'))}</span><span>{saved?.earned.length??0} / {achievements.length}</span></div><Progress value={(saved?.earned.length??0)/achievements.length*100}/>{saved&&<p style={{fontSize:10,marginTop:10}}>{activeRun(saved).name}</p>}</div><span className="home-game-open">{saved?t(L('Продолжить прохождение','Продовжити проходження','Continue playthrough')):t(L('Открыть трекер','Відкрити трекер','Open tracker'))}<MoveUpRight size={22}/></span></div></a>;
}
