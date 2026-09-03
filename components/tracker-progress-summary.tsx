'use client';

import {Progress} from '@/components/ui/progress';
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from '@/components/ui/tooltip';

type Metric={label:string;value:number;max:number};
type Props={label:string;metrics:readonly [Metric,Metric,Metric];theme?:'deus-ex'|'witcher'|'valhalla'};

// Shared with every game; Deus Ex defines the layout and interaction contract.
export default function TrackerProgressSummary({label,metrics,theme='deus-ex'}:Props){
 const themeClass=`progress-summary-${theme}`;
 return <TooltipProvider delay={150}>
  <div className={`progress-summary ${themeClass}`} role="group" aria-label={label}>
   {metrics.map(metric=>{
    const text=String(metric.value).padStart(2,'0')+' / '+metric.max;
    return <Tooltip key={metric.label}>
     <TooltipTrigger render={<div tabIndex={0}/>} className="progress-summary-trigger" aria-label={metric.label+': '+text}>
      <Progress value={metric.max?metric.value/metric.max*100:0} aria-label={metric.label} aria-valuetext={text}/>
     </TooltipTrigger>
     <TooltipContent className={`progress-summary-tooltip ${themeClass}`} sideOffset={8}>
      <span>{metric.label}</span><strong>{text}</strong>
     </TooltipContent>
    </Tooltip>;
   })}
  </div>
 </TooltipProvider>;
}
