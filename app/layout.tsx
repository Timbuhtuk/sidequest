import {sitePath} from '@/lib/site-path';
import type {Metadata} from 'next';
import './globals.css';
import './home.css';
import './home-tessera.css';
import './tracker-progress-summary.css';
import './tracker-sources-dialog.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deus-ex-achievement-protocol.tymofii-pankovsky10.chatgpt.site'),title:'SIDEQUEST — твоя игра, твой темп',description:'Библиотека трекеров достижений. Выбери игру, отмечай прогресс и возвращайся к своему приключению.',icons:{icon:sitePath('/favicon.svg')},openGraph:{title:'SIDEQUEST — Your game. Your pace.',description:'A little companion for big adventures. Game achievement trackers and playthrough guides.',type:'website',url:sitePath('/'),images:[{url:sitePath('/og.png'),alt:'SIDEQUEST — Your game. Your pace.'}]},twitter:{card:'summary_large_image',title:'SIDEQUEST — Your game. Your pace.',description:'Game achievement trackers and playthrough guides.',images:[sitePath('/og.png')]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ru" className="dark"><head><link rel="stylesheet" href={sitePath('/home-tessera-fonts.css')}/></head><body>{children}</body></html>;}
