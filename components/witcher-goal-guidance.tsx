'use client';

import {ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {achievementGuidance, stages, type Locale} from '@/lib/witcher-data';
import {translator} from '@/lib/witcher-copy';

type Props={
  achievementId:string;
  locale:Locale;
  completedSteps:readonly string[];
  disabled:boolean;
  visible:(id:string,secret?:boolean)=>boolean;
  onToggle:(id:string,checked:boolean)=>void;
  onOpenStep:(id:string)=>void;
  onRevealTip:(id:string)=>void;
};

export default function WitcherGoalGuidance({achievementId,locale,completedSteps,disabled,visible,onToggle,onOpenStep,onRevealTip}:Props){
  const t=translator(locale);
  const {actions,tips,partial}=achievementGuidance(achievementId);
  return <>
    {actions.length>0&&<section className="wt-goal-actions" aria-labelledby={`wt-actions-${achievementId}`}>
      <h3 id={`wt-actions-${achievementId}`} className="wt-dialog-subtitle">{t('checkedSteps')}</h3>
      {partial&&<p className="wt-helper">{t('partialActions')}</p>}
      {stages.map(stage=>{
        const group=actions.filter(s=>s.stages[0]===stage.id);
        return group.length>0&&<div className="wt-action-stage" key={stage.id}>
          <h4>{stage.name[locale]}</h4>
          {group.map(step=><div className="wt-check-row" key={step.id}>
            <Checkbox disabled={disabled} checked={completedSteps.includes(step.id)} onCheckedChange={v=>onToggle(step.id,v===true)} aria-label={`${t('markStep')}: ${visible(step.id,step.secret)?step.title[locale]:t('hiddenStep')}`}/>
            <span>{visible(step.id,step.secret)?step.title[locale]:t('hiddenStep')}</span>
            <Button variant="ghost" size="icon" aria-label={t('details')} onClick={()=>onOpenStep(step.id)}><ChevronRight size={14}/></Button>
          </div>)}
        </div>;
      })}
    </section>}
    {tips.length>0&&<section className="wt-goal-tips" aria-labelledby={`wt-tips-${achievementId}`}>
      <h3 id={`wt-tips-${achievementId}`} className="wt-dialog-subtitle">{t('advice')}</h3>
      {tips.map(tip=><div key={tip.id}>{visible(tip.id,tip.secret)?<p>{tip.detail[locale]}</p>:<><p>{t('hiddenDesc')}</p><Button variant="ghost" onClick={()=>onRevealTip(tip.id)}>{t('reveal')}</Button></>}</div>)}
    </section>}
  </>;
}
