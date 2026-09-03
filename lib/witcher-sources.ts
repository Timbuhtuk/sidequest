import {L, sources, checkedAt, type Locale, type Source, type Text} from './witcher-data';
import type {TrackerSource} from './tracker-sources';

// Presentation only: keep source IDs, URLs and gameplay relations in the catalog.
const titles: Record<Source, Text> = {
  steam: L('Steam · Достижения The Witcher 3', 'Steam · Досягнення The Witcher 3', 'Steam · The Witcher 3 achievements'),
  crew: L('Gamer Guides · Сбор союзников', 'Gamer Guides · Збір союзників', 'Gamer Guides · Gathering allies'),
  gwent: L('Gamer Guides · Руководство по гвинту', 'Gamer Guides · Посібник із ґвінту', 'Gamer Guides · Gwent guide'),
  masquerade: L('Gamer Guides · Вопрос жизни и смерти', 'Gamer Guides · Питання життя і смерті', 'Gamer Guides · A Matter of Life and Death'),
  difficulty: L('Gamer Guides · Уровни сложности', 'Gamer Guides · Рівні складності', 'Gamer Guides · Difficulty options'),
  spirit: L('Witcher Wiki · Лесной дух', 'Witcher Wiki · Лісовий дух', 'Witcher Wiki · Woodland Spirit'),
  guide: L('XboxAchievements · Справочные условия', 'XboxAchievements · Довідкові умови', 'XboxAchievements · Achievement reference'),
};
const xboxNote = L(
  'Используется для уточнения игровых условий. Набор достижений Xbox не объединяется с каталогом Steam.',
  'Використовується для уточнення ігрових умов. Набір досягнень Xbox не об’єднується з каталогом Steam.',
  'Used to clarify gameplay requirements. The Xbox achievement set is not merged into the Steam catalog.',
);

export function witcherSources(locale: Locale): TrackerSource[] {
  return (Object.keys(sources) as Source[]).map(id => ({
    url: sources[id].url,
    title: titles[id][locale],
    checkedAt,
    ...(id === 'steam' ? {platform: 'Steam · 292030'} : {}),
    ...(id === 'guide' ? {description: xboxNote[locale]} : {}),
  }));
}
