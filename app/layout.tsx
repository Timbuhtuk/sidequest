import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Deus Ex — Achievement Protocol',description:'Личный трекер достижений Mankind Divided. Этапы, решения и прогресс прохождения.',icons:{icon:'/favicon.svg'},openGraph:{title:'Deus Ex — Achievement Protocol',description:'Каждый выбор имеет значение. Твой маршрут к 81 достижению.',type:'website',images:[{url:'/og.png',alt:'Deus Ex — Achievement Protocol'}]},twitter:{card:'summary_large_image',title:'Deus Ex — Achievement Protocol',description:'Личный трекер достижений Mankind Divided.',images:['/og.png']}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ru" className="dark"><body>{children}</body></html>;}
