'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,MoveUpRight} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {languageKey,languageOptions,parseLocale,type Locale} from '@/lib/i18n';
import {homeCopy} from '@/lib/home-copy';
import WitcherLibraryCard from '@/components/witcher-library-card';
import {parseState,storageKey,type TrackerState} from '@/lib/tracker-state';

export default function Home(){
  const [locale,setLocale]=useState<Locale>('ru');
  const [saved,setSaved]=useState<TrackerState|null>(null);
  const heroRef=useRef<HTMLElement>(null);
  const c=homeCopy[locale];
  useEffect(()=>{try{const saved=parseLocale(localStorage.getItem(languageKey));if(saved)setLocale(saved)}catch{}},[]);
  useEffect(()=>{document.documentElement.lang=locale},[locale]);
  useEffect(()=>{
    const read=()=>{try{const raw=localStorage.getItem(storageKey);setSaved(raw?parseState(JSON.parse(raw)):null)}catch{setSaved(null)}};
    read();window.addEventListener('pageshow',read);window.addEventListener('focus',read);window.addEventListener('storage',read);
    return()=>{window.removeEventListener('pageshow',read);window.removeEventListener('focus',read);window.removeEventListener('storage',read)};
  },[]);
  useEffect(()=>{
    const hero=heroRef.current;if(!hero)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine=window.matchMedia('(pointer: fine)');
    let frame=0,pointerX=0,pointerY=0;
    const paint=()=>{frame=0;if(reduced.matches){hero.style.removeProperty('--world-y');hero.style.removeProperty('--frame-y');hero.style.removeProperty('--world-x');return}const scroll=Math.max(0,Math.min(-hero.getBoundingClientRect().top,700));hero.style.setProperty('--world-y',`${Math.round(scroll*.13+pointerY*5)}px`);hero.style.setProperty('--frame-y',`${Math.round(-scroll*.09-pointerY*9)}px`);hero.style.setProperty('--world-x',`${Math.round(pointerX*7)}px`)};
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint)};
    const move=(e:PointerEvent)=>{if(!fine.matches||reduced.matches)return;const box=hero.getBoundingClientRect();pointerX=(e.clientX-box.left)/box.width-.5;pointerY=(e.clientY-box.top)/box.height-.5;schedule()};
    const reset=()=>{pointerX=0;pointerY=0;schedule()};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',reset);reduced.addEventListener('change',schedule);schedule();
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',reset);reduced.removeEventListener('change',schedule)};
  },[]);
  function changeLanguage(value:string|null){const next=parseLocale(value);if(next){setLocale(next);try{localStorage.setItem(languageKey,next)}catch{}}}
  return <div className="home-shell">
    <a className="home-skip" href="#library">{c.library}</a>
    <header className="home-header"><a href="/" className="home-brand" aria-label="SIDEQUEST"><span aria-hidden="true">▗▚</span>SIDEQUEST<span className="home-brand-dot">®</span></a><nav aria-label={c.navigation}><a href="#library">{c.library}</a><a href="#how">{c.how}</a></nav><Select value={locale} onValueChange={changeLanguage}><SelectTrigger className="home-language" aria-label={c.language}><SelectValue>{locale==='uk'?'UA':locale.toUpperCase()}</SelectValue></SelectTrigger><SelectContent className="home-popup">{languageOptions.map(l=><SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></header>
    <main className="home-main">
      <section ref={heroRef} className="home-hero" aria-labelledby="hero-title">
        <img className="home-landscape" src="/pixel-world.png" alt="" width="1672" height="941" fetchPriority="high" draggable={false}/>
        <div className="home-hero-copy"><div className="home-kicker"><span className="home-square"/>{c.eyebrow}</div><h1 id="hero-title">{c.headline[0]}<br/>{c.headline[1]}<br/><span>{c.headline[2]}</span></h1><p>{c.intro}</p><a className="home-cta" href="#library">{c.choose}<ArrowUpRight size={22}/></a></div>
        <div className="home-world" aria-hidden="true"><div className="home-window-bar"><span>UNEXPLORED_WORLD.EXE</span><span>— □ ×</span></div><span className="home-world-coordinate">X: 0001 / Y: ∞</span></div>
        <div className="home-hero-bottom"><span>{c.yourPace}</span><a href="#library">{c.scroll}<ArrowDown size={14}/></a><span>01 — ∞</span></div>
      </section>
      <section className="home-library" id="library"><div className="home-section-heading"><div><span className="home-kicker">01 / {c.collection}</span><h2>{c.library}</h2></div><span className="home-counter">[ 02 ]</span></div><a className="home-game" href="/deus-ex" draggable={false}><div className="home-game-art"><img draggable={false} src="/deus-ex-og.png" alt="Deus Ex: Mankind Divided" width="1536" height="1024"/><span className="home-game-index">GAME_001</span></div><div className="home-game-copy"><div className="home-kicker">ACTION RPG · 2016</div><h3>Deus Ex:<br/>Mankind Divided</h3><p>{c.gameDescription}</p><div className="home-game-tags"><span>81 {c.achievements}</span><span>{c.dlc}</span></div><div className="home-game-progress"><div><span>{c.progress}</span><span>{saved?saved.earned.length:0} / 81</span></div><Progress value={(saved?.earned.length??0)/81*100} aria-label={c.progress}/></div><span className="home-game-open">{saved?c.continue:c.open}<MoveUpRight size={22}/></span></div></a><WitcherLibraryCard locale={locale}/></section>
      <section className="home-how" id="how"><div className="home-section-heading"><div><span className="home-kicker">02 / {c.fieldNotes}</span><h2>{c.howTitle}</h2></div><span className="home-how-sign" aria-hidden="true">[ + ]</span></div><div className="home-principles">{c.steps.map((s,i)=><article key={i}><span className="home-step-number">0{i+1}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div></section>
    </main><footer className="home-footer"><span>{c.footer}</span></footer>
  </div>;
}
