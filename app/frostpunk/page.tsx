import type {Metadata} from 'next';
import FrostpunkTracker from '@/components/frostpunk-tracker';
import {sitePath} from '@/lib/site-path';
import '../deus-ex/shell.css';
import './frostpunk.css';
export const dynamic='force-static';
export const metadata:Metadata={title:'Frostpunk — Журнал капитана | SIDEQUEST',description:'Трекер 115 достижений Frostpunk: сценарии, цели, маршрут и независимые прохождения. PC · Steam · DLC.',openGraph:{title:'Frostpunk | SIDEQUEST',description:'Город должен выжить. Твой маршрут к достижениям.',url:sitePath('/frostpunk'),images:[{url:sitePath('/frostpunk-cover.jpg'),alt:'Frostpunk'}]}};
export default FrostpunkTracker;
