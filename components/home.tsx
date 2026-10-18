'use client';
import {sitePath} from '@/lib/site-path';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {languageKey,languageOptions,localizedCatalog,parseLocale,type Locale} from '@/lib/i18n';
import {homeCopy} from '@/lib/home-copy';
import FrostpunkLibraryCard from '@/components/frostpunk-library-card';
import ValhallaLibraryCard from '@/components/valhalla-library-card';
import WitcherLibraryCard from '@/components/witcher-library-card';
import {parseState,storageKey,type TrackerState} from '@/lib/tracker-state';

export default function Home(){
  const [locale,setLocale]=useState<Locale>('ru');
  const [saved,setSaved]=useState<TrackerState|null>(null);
  const heroRef=useRef<HTMLElement>(null);
  const c=homeCopy[locale];
  const catalog=localizedCatalog(locale);
  const previewStage=catalog.stages[0];
  const previewAchievements=catalog.achievements.filter(a=>a.stages.includes(previewStage.id)).slice(0,2);
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
    <header className="home-header"><a href={sitePath('/')} className="home-brand" aria-label="SIDEQUEST"><span aria-hidden="true">▗▚</span>SIDEQUEST<span className="home-brand-dot">®</span></a><nav aria-label={c.navigation}><a href="#library">{c.library}</a><a href="#how">{c.how}</a></nav><Select value={locale} onValueChange={changeLanguage}><SelectTrigger className="home-language" aria-label={c.language}><SelectValue>{locale==='uk'?'UA':locale.toUpperCase()}</SelectValue></SelectTrigger><SelectContent className="home-popup">{languageOptions.map(l=><SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></header>
    <main className="home-main">
      <section ref={heroRef} className="home-hero" aria-labelledby="hero-title">
        <img className="home-landscape" src={sitePath('/pixel-world.png')} alt="" width="1672" height="941" fetchPriority="high" draggable={false}/>
        <div className="home-hero-copy">
          <div className="home-kicker"><span className="home-square"/>{c.eyebrow}</div>
          <h1 id="hero-title">{c.headline[0]}<br/><span>{c.headline[1]}</span></h1>
          <p>{c.intro}</p>
          <div className="home-hero-actions"><a className="home-cta" href="#library">{c.choose}<ArrowDown size={18}/></a><a className="home-cta-secondary" href="#how">{c.how}<ArrowDown size={16}/></a></div>
          <p className="home-storage-note">{c.storage}</p>
        </div>
        <aside className="home-preview" aria-label={c.preview}>
          <div className="home-preview-head"><span>{c.preview}</span><span>M01</span></div>
          <div className="home-preview-body">
            <h2>Deus Ex: Mankind Divided</h2>
            <div className="home-preview-stage"><span>{c.currentStage}</span><strong>{previewStage.name}</strong></div>
            <p className="home-preview-label">{c.available}</p>
            <ul>{previewAchievements.map(a=><li key={a.id}><span className="home-preview-square" aria-hidden="true"/><span><strong>{a.name}</strong><span>{a.description}</span></span></li>)}</ul>
            <a href={sitePath('/deus-ex')}>{c.open}<ArrowRight size={18}/></a>
          </div>
        </aside>
      </section>
      <section className="home-library" id="library" aria-labelledby="library-title">
        <div className="home-section-heading"><div><span className="home-kicker">{c.collection}</span><h2 id="library-title">{c.library}</h2></div><span className="home-counter">[ 04 ]</span></div>
        <div className="home-games">
          <a className="home-game" href={sitePath('/deus-ex')} draggable={false}><div className="home-game-art"><img draggable={false} src={sitePath('/deus-ex-og.png')} alt="" width="1536" height="1024" loading="lazy"/></div><div className="home-game-copy"><div className="home-kicker">ACTION RPG · 2016</div><h3>Deus Ex: Mankind Divided</h3><p>{c.gameDescription}</p><div className="home-game-tags"><span>81 {c.achievements}</span><span>{c.dlc}</span></div><div className="home-game-progress"><div><span>{c.progress}</span><span>{saved?saved.earned.length:0} / 81</span></div><Progress value={(saved?.earned.length??0)/81*100} aria-label={c.progress}/></div><span className="home-game-open">{saved?c.continue:c.open}<ArrowRight size={20}/></span></div></a>
          <WitcherLibraryCard locale={locale}/><ValhallaLibraryCard locale={locale}/><FrostpunkLibraryCard locale={locale}/>
        </div>
      </section>
      <section className="home-how" id="how" aria-labelledby="how-title"><div className="home-section-heading"><h2 id="how-title">{c.howTitle}</h2></div><div className="home-principles">{c.steps.map((s,i)=><article key={i}><span className="home-step-number">0{i+1}</span><div><h3>{s.title}</h3><p>{s.description}</p></div></article>)}</div></section>
    </main><footer className="home-footer"><span>{c.footer}</span></footer>
  </div>;
}
