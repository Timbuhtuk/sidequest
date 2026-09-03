import type {Metadata} from 'next';
import './globals.css';
import './home.css';
import './tracker-progress-summary.css';
export const metadata:Metadata={metadataBase:new URL('https://deus-ex-achievement-protocol.tymofii-pankovsky10.chatgpt.site'),title:'SIDEQUEST — твоя игра, твой темп',description:'Библиотека трекеров достижений. Выбери игру, отмечай прогресс и возвращайся к своему приключению.',icons:{icon:'/favicon.svg'},openGraph:{title:'SIDEQUEST — Your game. Your pace.',description:'A little companion for big adventures. Game achievement trackers and playthrough guides.',type:'website',url:'/',images:[{url:'/og.png',alt:'SIDEQUEST — Your game. Your pace.'}]},twitter:{card:'summary_large_image',title:'SIDEQUEST — Your game. Your pace.',description:'Game achievement trackers and playthrough guides.',images:['/og.png']}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ru" className="dark"><body>{children}</body></html>;}
