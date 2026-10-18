'use client';
/* eslint-disable @next/next/no-img-element -- Static official artwork follows the library export format. */
import {useEffect,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {sitePath} from '@/lib/site-path';
import {L,achievements} from '@/lib/frostpunk-data';
import {storageKey,parseState,type State} from '@/lib/frostpunk-state';
import type {Locale} from '@/lib/i18n';
export default function FrostpunkLibraryCard({locale}:{locale:Locale}){
 const [saved,setSaved]=useState<State|null>(null);
 useEffect(()=>{const read=()=>{try{const raw=localStorage.getItem(storageKey);setSaved(raw?parseState(JSON.parse(raw)):null)}catch{setSaved(null)}};read();window.addEventListener('focus',read);window.addEventListener('pageshow',read);window.addEventListener('storage',read);return()=>{window.removeEventListener('focus',read);window.removeEventListener('pageshow',read);window.removeEventListener('storage',read)}},[]);
 const t=(ru:string,uk:string,en:string)=>L(ru,uk,en)[locale];
 return <a className="home-game home-frostpunk-game" href={sitePath('/frostpunk')}><div className="home-game-art"><img src={sitePath('/frostpunk-cover.jpg')} alt="" width={460} height={215} draggable={false} loading="lazy"/></div><div className="home-game-copy"><div className="home-kicker">SURVIVAL CITY BUILDER · 2018</div><h3>Frostpunk</h3><p>{t('Город должен выжить. Сценарии, трудные решения и маршрут к достижениям среди вечных льдов.','Місто має вижити. Сценарії, складні рішення й маршрут до досягнень серед вічної криги.','The city must survive. Scenarios, difficult choices and a path to achievements in an endless winter.')}</p><div className="home-game-tags"><span>{achievements.length} {t('достижений','досягнень','achievements')}</span><span>STEAM · BASE + DLC</span></div><div className="home-game-progress"><div><span>{t('Достижения получены','Досягнення отримано','Achievements earned')}</span><span>{saved?.earned.length??0} / {achievements.length}</span></div><Progress value={(saved?.earned.length??0)/achievements.length*100} aria-label={t('Достижения получены','Досягнення отримано','Achievements earned')}/></div><span className="home-game-open">{saved?t('Продолжить прохождение','Продовжити проходження','Continue playthrough'):t('Открыть трекер','Відкрити трекер','Open tracker')}<ArrowRight size={22}/></span></div></a>;
}
