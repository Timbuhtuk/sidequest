'use client';

import {useRef} from 'react';
import {BookOpen} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle,DialogTrigger} from '@/components/ui/dialog';
import {homeCopy} from '@/lib/home-copy';
import type {Locale} from '@/lib/i18n';

export default function HomeHowDialog({locale,variant}:{locale:Locale;variant:'nav'|'hero'})
{
    const c=homeCopy[locale];
    const titleRef=useRef<HTMLHeadingElement>(null);

    return <Dialog modal>
        <DialogTrigger render={<button type="button" />} className={variant==='nav'?'home-how-nav-trigger':'home-cta-secondary'}>
            {c.how}{variant==='hero'&&<BookOpen size={16} aria-hidden="true"/>}
        </DialogTrigger>
        <DialogContent className="home-how-dialog" closeLabel={c.close} initialFocus={titleRef}>
            <DialogTitle ref={titleRef} tabIndex={-1}>{c.howTitle}</DialogTitle>
            <DialogDescription className="sr-only">{c.intro}</DialogDescription>
            <ol className="home-how-steps">
                {c.steps.map((step,i)=><li key={step.title}>
                    <span className="home-how-step-number" aria-hidden="true">0{i+1}</span>
                    <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </li>)}
            </ol>
        </DialogContent>
    </Dialog>;
}
