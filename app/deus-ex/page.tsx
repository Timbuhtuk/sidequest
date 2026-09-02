import type {Metadata} from 'next';
import Tracker from '@/components/deus-ex-tracker';
import './shell.css';
export const metadata:Metadata={title:'Deus Ex — Achievement Protocol | SIDEQUEST',description:'Личный трекер 81 достижения Deus Ex: Mankind Divided. Этапы, решения и прогресс прохождения.',openGraph:{title:'Deus Ex — Achievement Protocol',description:'Твой маршрут к 81 достижению Mankind Divided.',url:'/deus-ex',images:[{url:'/deus-ex-og.png',alt:'Deus Ex — Achievement Protocol'}]},twitter:{card:'summary_large_image',title:'Deus Ex — Achievement Protocol',description:'Твой маршрут к 81 достижению Mankind Divided.',images:['/deus-ex-og.png']}};
export default Tracker;
