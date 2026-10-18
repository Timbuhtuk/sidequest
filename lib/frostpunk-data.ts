import catalog from './frostpunk-steam.json';
import type {Locale} from './i18n';
export type Text = Record<Locale,string>;
export const L = (ru:string,uk:string,en:string):Text => ({ru,uk,en});
export const checkedAt = '2026-09-26';
export const scenarios = {
 home:L('Новый дом','Новий дім','A New Home'), arks:L('Ковчеги','Ковчеги','The Arks'), refugees:L('Беженцы','Біженці','The Refugees'), winterhome:L('Падение Винтерхоума','Падіння Вінтергоума','The Fall of Winterhome'), autumn:L('Последняя осень · DLC','Остання осінь · DLC','The Last Autumn · DLC'), edge:L('На краю · DLC','На краю · DLC','On The Edge · DLC'), endless:L('Бесконечный режим','Нескінченний режим','Endless Mode'), any:L('Общие условия','Загальні умови','General conditions'), unknown:L('Сценарий не уточнён','Сценарій не уточнено','Scenario unverified'),
};
export type Scenario = keyof typeof scenarios;
export const stages = [
 {id:'settlement',scenario:'home',name:L('Зажечь город','Запалити місто','Light the city'),hint:L('Тепло, еда и медицина. Сначала выбери цели: ограничения действуют с начала сценария.','Тепло, їжа й медицина. Спочатку обери цілі: обмеження діють від початку сценарію.','Heat, food and healthcare. Choose goals first: restrictions apply from the start.')},
 {id:'londoners',scenario:'home',name:L('Удержать надежду','Зберегти надію','Keep hope alive'),hint:L('Лондонцы и законы цели. Решения отмечай в заметках; обещания нужно выполнить.','Лондонці й закони мети. Записуй рішення в нотатках; обіцянки треба виконати.','Londoners and purpose laws. Record decisions in your notes and keep your promises.')},
 {id:'arrivals',scenario:'home',name:L('Принять беженцев','Прийняти біженців','Welcome refugees'),hint:L('Для целей спасения проверь разведку, места в жилье, лечение и запасы.','Для цілей порятунку перевір розвідку, місця в житлі, лікування й запаси.','For rescue goals, review scouting, shelter, healthcare and stockpiles.')},
 {id:'storm',scenario:'home',name:L('Пережить бурю','Пережити бурю','Survive the storm'),hint:L('Проверь возвращение разведчиков, отопление и запасы перед финальным испытанием.','Перевір повернення розвідників, опалення й запаси перед фінальним випробуванням.','Review scout returns, heating and stockpiles before the final challenge.')},
 ...(['arks','refugees','winterhome','autumn','edge','endless'] as const).map(id=>({id,scenario:id,name:scenarios[id],hint:L('Отдельный сценарий: создай независимое прохождение, чтобы не смешивать отметки.','Окремий сценарій: створи незалежне проходження, щоб не змішувати позначки.','A separate scenario: create an independent playthrough to keep progress separate.')})),
] satisfies {id:string;scenario:Scenario;name:Text;hint:Text}[];
const special:Partial<Record<Scenario,string[]>> = {
 home:['lost-souls','leader','compassionate','united','the-saviour','the-iron-saviour','golden-path','iron-man-new-home','new-home-survivor'],
 arks:['technocrat','conservationist','iron-man-the-arks','the-arks-survivor'],
 refugees:['refugee','iron-man-refugees','refugees-survivor'],
 winterhome:['winterhome','iron-man-fall-of-winterhome','the-winterhome-survivor'],
 autumn:['builder','perfectionist','i-ll-be-home-for-christmas','ducks-in-a-row','no-crunch','bonus-pater-familias','fisher-king','iron-man-the-last-autumn','on-the-waterfront','not-great-not-terrible','the-last-autumn-survivor','emissions-reduction','all-along-the-watchtower','arise-ye-workers','it-was-me-all-along'],
 edge:['this-is-new-london-over','first-steps','bald-mountain','green-thumb','defender-of-the-oppressed','messrs-gabriel','frostland-explorer','contractor','guardian','social-activist','i-see-friends-holding-hands','iron-man-on-the-edge','on-the-edge-survivor','slave-driver'],
 endless:['a-tomb-for-memories','master-archivist','let-there-be-light','rise-of-the-machines','there-was-no-waldo','backup-plan','full-house','hyde-park-corner','walk-on-the-grass','weathering-the-storm','winter-ready','by-the-sweat-of-their-brow','one-more-day-syndrome','endless-social-activist','a-for-effort','endless-slave-driver'],
};
export const achievements = catalog.map(a=>{
 let scenario:Scenario = a.secret?'unknown':'any';
 for(const [group,ids] of Object.entries(special)) if(ids.includes(a.id)) scenario=group as Scenario;
 if(a.id.includes('marathon')) scenario='endless';
 const difficulty = a.id.endsWith('survivor')?'survivor':a.id.endsWith('extreme')?'extreme':a.id.startsWith('iron-man')||a.id==='the-iron-saviour'||a.id.endsWith('hard')?'hard':a.id.endsWith('medium')?'medium':null;
 return {...a,scenario,difficulty,endurance:a.id.includes('marathon')};
});
export type Achievement = typeof achievements[number];
export const steps = [
 {id:'scout-rescues',goals:['lost-souls'],stages:['settlement','londoners','arrivals'],title:L('Проверить доступные места с выжившими','Перевірити доступні місця з уцілілими','Review available survivor sites'),detail:L('Посещай места разведчиками; после находки выбери спасение и проверь прибытие людей в город.','Відвідуй місця розвідниками; після знахідки обери порятунок і перевір прибуття людей до міста.','Explore with scouts; choose rescue when survivors are found and check their arrival in the city.')},
 {id:'rescue-return',goals:['lost-souls'],stages:['arrivals','storm'],title:L('Проверить возвращение спасённых до бури','Перевірити повернення врятованих до бурі','Check rescued people return before the storm'),detail:L('Сверь все обнаруженные группы на карте с прибывшими. Отметка этого шага не подтверждает полноту разведки.','Звір усі знайдені групи на мапі з тими, що прибули. Ця позначка не підтверджує повноту розвідки.','Compare discovered groups with arrivals. This step does not certify that every site was explored.')},
 {id:'medical-capacity',goals:['the-saviour','the-iron-saviour'],stages:['settlement','londoners','arrivals'],title:L('Подготовить лечение к росту населения','Підготувати лікування до зростання населення','Prepare healthcare for population growth'),detail:L('Проверь свободные места, персонал и тепло в лечебных зданиях; не оставляй тяжело больных без помощи.','Перевір вільні місця, персонал і тепло в лікувальних будівлях; не залишай тяжкохворих без допомоги.','Review capacity, staffing and warmth in medical facilities; do not leave gravely ill people untreated.')},
 {id:'storm-stock',goals:['the-saviour','the-iron-saviour'],stages:['arrivals','storm'],title:L('Подготовить еду и уголь к буре','Підготувати їжу й вугілля до бурі','Prepare food and coal for the storm'),detail:L('Сверь прогноз, потребление и запас на оставшиеся дни. Конкретное количество зависит от города и сложности.','Звір прогноз, споживання й запас на решту днів. Кількість залежить від міста та складності.','Compare the forecast, consumption and remaining days. Required stockpiles depend on the city and difficulty.')},
];
export const sources = [{url:'https://steamcommunity.com/stats/323190/achievements/',title:'Steam · Frostpunk achievements',platform:'PC · Steam 323190',checkedAt},{url:'https://store.steampowered.com/app/323190/Frostpunk/',title:'Frostpunk · Steam',platform:'PC · Base game + DLC',checkedAt}];
