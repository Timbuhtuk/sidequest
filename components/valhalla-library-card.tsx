'use client';
import {useState,useEffect} from 'react';
import {MoveUpRight} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {achievements,L,type Locale} from '@/lib/valhalla-data';
import {parseState,storageKey,activeRun,type State} from '@/lib/valhalla-state';
export default function ValhallaLibraryCard({locale}:{locale:Locale}){
 const [saved,setSaved]=useState<State|null>(null);
 useEffect(()=>{const read=()=>{try{const raw=localStorage.getItem(storageKey);setSaved(raw?parseState(JSON.parse(raw)):null)}catch{setSaved(null)}};read();window.addEventListener('focus',read);window.addEventListener('storage',read);window.addEventListener('pageshow',read);return()=>{window.removeEventListener('focus',read);window.removeEventListener('storage',read);window.removeEventListener('pageshow',read)}},[]);
 const t=(v:ReturnType<typeof L>)=>v[locale];
 return <a className="home-game home-valhalla-game" href="/ac-valhalla" style={{marginTop:28}}><div className="home-game-art"><img src="/valhalla-cover.jpg" alt="Assassin’s Creed Valhalla" width={460} height={215} draggable={false}/><span className="home-game-index">GAME_003</span></div><div className="home-game-copy"><div className="home-kicker">OPEN WORLD RPG · 2020</div><h3>Assassin’s Creed<br/>Valhalla</h3><p>{t(L('Твоя сага: союзы, достижения, тайны Англии и путешествия за её пределы.','Твоя сага: союзи, досягнення, таємниці Англії та мандрівки за її межі.','Your saga: alliances, achievements, England’s mysteries and journeys beyond.'))}</p><div className="home-game-tags"><span>{achievements.length} {t(L('достижений','досягнень','achievements'))}</span><span>STEAM · BASE + DLC</span></div><div className="home-game-progress"><div><span>{t(L('Достижения получены','Досягнення отримано','Achievements earned'))}</span><span>{saved?.earned.length??0} / {achievements.length}</span></div><Progress value={(saved?.earned.length??0)/achievements.length*100}/>{saved&&<p style={{fontSize:10,marginTop:10}}>{activeRun(saved).name}</p>}</div><span className="home-game-open">{saved?t(L('Продолжить прохождение','Продовжити проходження','Continue playthrough')):t(L('Открыть трекер','Відкрити трекер','Open tracker'))}<MoveUpRight size={22}/></span></div></a>;
}
