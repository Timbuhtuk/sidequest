import type {Metadata} from 'next';
import WitcherTracker from '@/components/witcher-tracker';
import './witcher.css';
import './shell.css';
export const metadata:Metadata={title:'Ведьмак 3 — Дневник Пути | SIDEQUEST',description:'Личный трекер достижений, карт гвинта и решений The Witcher 3: Wild Hunt. Steam, основная игра и дополнения.',openGraph:{title:'Ведьмак 3 — Дневник Пути',description:'Достижения. Гвинт. Твой путь.',url:'/witcher-3',images:[{url:'/witcher-cover.jpg',alt:'The Witcher 3: Wild Hunt'}]},twitter:{card:'summary_large_image',title:'Ведьмак 3 — Дневник Пути',description:'Личный помощник в прохождении «Дикой Охоты».',images:['/witcher-cover.jpg']}};
export default WitcherTracker;
