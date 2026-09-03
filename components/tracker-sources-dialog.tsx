'use client';

import {useRef} from 'react';
import {BookOpen, ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {uniqueTrackerSources, type TrackerSource} from '@/lib/tracker-sources';

export type {TrackerSource} from '@/lib/tracker-sources';

const copy = {
  ru: {title:'Источники', description:'Руководства и справочные материалы. Ссылки открываются в новой вкладке.', close:'Закрыть', checked:'Проверено', empty:'Источники пока не добавлены.', newTab:'Откроется в новой вкладке'},
  uk: {title:'Джерела', description:'Посібники та довідкові матеріали. Посилання відкриваються в новій вкладці.', close:'Закрити', checked:'Перевірено', empty:'Джерела ще не додано.', newTab:'Відкриється в новій вкладці'},
  en: {title:'Sources', description:'Guides and reference materials. Links open in a new tab.', close:'Close', checked:'Checked', empty:'No sources have been added yet.', newTab:'Opens in a new tab'},
};

type Props = {
  locale: 'ru' | 'uk' | 'en';
  theme?: 'deus-ex' | 'witcher' | 'valhalla';
  sources: readonly TrackerSource[];
};

// Mount once inside each game's footer. The trigger owns focus restoration.
export default function TrackerSourcesDialog({locale, theme='deus-ex', sources}: Props) {
  const text = copy[locale];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const items = uniqueTrackerSources(sources);
  const themeClass = `tracker-sources-${theme}`;
  return <Dialog modal>
    <DialogTrigger render={<Button variant="ghost" />} className={`tracker-sources-trigger ${themeClass}`}>
      <BookOpen size={16} aria-hidden="true" />{text.title}
    </DialogTrigger>
    <DialogContent className={`tracker-sources-dialog ${themeClass}`} closeLabel={text.close} initialFocus={titleRef}>
      <DialogTitle ref={titleRef} tabIndex={-1}>{text.title}</DialogTitle>
      <DialogDescription>{text.description}</DialogDescription>
      {items.length ? <ul className="tracker-sources-list">
        {items.map(source => <li key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            <span>{source.title}<span className="sr-only"> — {text.newTab}</span></span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          {source.description && <p>{source.description}</p>}
          {(source.platform || source.checkedAt) && <div className="tracker-sources-meta">
            {source.platform && <span>{source.platform}</span>}
            {source.checkedAt && <span>{text.checked}: <time dateTime={source.checkedAt}>{source.checkedAt}</time></span>}
          </div>}
        </li>)}
      </ul> : <p className="tracker-sources-empty">{text.empty}</p>}
    </DialogContent>
  </Dialog>;
}
