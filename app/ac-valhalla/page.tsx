import {sitePath} from '@/lib/site-path';
import type {Metadata} from 'next';
import ValhallaTracker from '@/components/valhalla-tracker';
import './valhalla.css';
import './shell.css';
import './theme.css';
export const dynamic = 'force-static';
export const metadata:Metadata={title:'Assassin’s Creed Valhalla — Сага викинга | SIDEQUEST',description:'Трекер 92 достижений Assassin’s Creed Valhalla: маршрут, рыбалка, дополнения и независимые прохождения. Steam.',openGraph:{title:'Assassin’s Creed Valhalla | SIDEQUEST',description:'Достижения, маршрут и коллекция.',url:sitePath('/ac-valhalla'),images:[{url:sitePath('/valhalla-cover.jpg'),alt:'Assassin’s Creed Valhalla'}]}};
export default ValhallaTracker;
