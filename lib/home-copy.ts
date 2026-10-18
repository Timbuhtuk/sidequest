import type {Locale} from './i18n';

type Copy = {
    progress:string; continue:string; language:string;
    library:string; how:string; close:string; eyebrow:string; headline:string[]; intro:string;
    choose:string; yourPace:string; collection:string; achievements:string;
    dlc:string; gameDescription:string; open:string; howTitle:string;
    preview:string; currentStage:string; available:string; storage:string;
    steps:{title:string; description:string}[]; footer:string; back:string;
};

export const homeCopy:Record<Locale,Copy> = {
    ru: {
        progress:'Достижения получены', continue:'Продолжить прохождение',
        language:'Язык', library:'Библиотека игр', how:'Как это работает', close:'Закрыть',
        eyebrow:'ТРЕКЕРЫ ДОСТИЖЕНИЙ И ПРОХОЖДЕНИЙ',
        headline:['Не упускай важное.', 'Играй в своём темпе.'],
        intro:'Выбери этап игры, проверь доступные достижения и важные решения. Отмечай выполненное вручную — свой маршрут всегда под рукой.',
        choose:'Выбрать игру', yourPace:'ТВОЯ ИГРА. ТВОЙ ТЕМП.', collection:'ВЫБЕРИ СВОЙ МИР',
        achievements:'достижение', dlc:'Кампания + DLC + Breach',
        gameDescription:'Достижения, электронные книги и важные развилки от Дубая до финала.',
        open:'Открыть трекер', howTitle:'Три шага к своему маршруту',
        preview:'ПРИМЕР ТРЕКЕРА', currentStage:'Текущий этап', available:'Доступно на этом этапе',
        storage:'Без регистрации. Прогресс хранится в этом браузере; перенос — через экспорт в трекере.',
        steps:[
            {title:'Выбери игру', description:'Открой трекер из библиотеки. Для каждой игры — свой маршрут и отдельный прогресс.'},
            {title:'Укажи этап', description:'Посмотри доступные достижения и предупреждения перед важными решениями.'},
            {title:'Отмечай выполненное', description:'Обновляй достижения и этапы вручную. Экспортируй прогресс, чтобы перенести его в другой браузер.'},
        ],
        footer:'МАЛЕНЬКИЙ ПОМОЩНИК ДЛЯ БОЛЬШИХ ПРИКЛЮЧЕНИЙ.', back:'К ИГРАМ',
    },
    uk: {
        progress:'Досягнення отримано', continue:'Продовжити проходження',
        language:'Мова', library:'Бібліотека ігор', how:'Як це працює', close:'Закрити',
        eyebrow:'ТРЕКЕРИ ДОСЯГНЕНЬ І ПРОХОДЖЕНЬ',
        headline:['Не пропускай важливе.', 'Грай у своєму темпі.'],
        intro:'Обери етап гри, перевір доступні досягнення та важливі рішення. Відмічай виконане вручну — твій маршрут завжди під рукою.',
        choose:'Обрати гру', yourPace:'ТВОЯ ГРА. ТВІЙ ТЕМП.', collection:'ОБЕРИ СВІЙ СВІТ',
        achievements:'досягнення', dlc:'Кампанія + DLC + Breach',
        gameDescription:'Досягнення, електронні книги та важливі розгалуження від Дубая до фіналу.',
        open:'Відкрити трекер', howTitle:'Три кроки до свого маршруту',
        preview:'ПРИКЛАД ТРЕКЕРА', currentStage:'Поточний етап', available:'Доступно на цьому етапі',
        storage:'Без реєстрації. Прогрес зберігається в цьому браузері; перенесення — через експорт у трекері.',
        steps:[
            {title:'Обери гру', description:'Відкрий трекер із бібліотеки. Для кожної гри — свій маршрут і окремий прогрес.'},
            {title:'Укажи етап', description:'Переглянь доступні досягнення та попередження перед важливими рішеннями.'},
            {title:'Відмічай виконане', description:'Оновлюй досягнення й етапи вручну. Експортуй прогрес, щоб перенести його в інший браузер.'},
        ],
        footer:'МАЛЕНЬКИЙ ПОМІЧНИК ДЛЯ ВЕЛИКИХ ПРИГОД.', back:'ДО ІГОР',
    },
    en: {
        progress:'Achievements earned', continue:'Continue playthrough',
        language:'Language', library:'Game library', how:'How it works', close:'Close',
        eyebrow:'ACHIEVEMENT & PLAYTHROUGH TRACKERS',
        headline:["Don't miss a thing.", 'Play at your pace.'],
        intro:'Choose your current stage, check available achievements and important choices. Mark your progress manually and keep your next steps close.',
        choose:'Choose a game', yourPace:'YOUR GAME. YOUR PACE.', collection:'CHOOSE YOUR WORLD',
        achievements:'achievements', dlc:'Campaign + DLC + Breach',
        gameDescription:'Achievements, eBooks and important choices from Dubai to the finale.',
        open:'Open tracker', howTitle:'Three steps to your own route',
        preview:'TRACKER EXAMPLE', currentStage:'Current stage', available:'Available at this stage',
        storage:'No account needed. Progress stays in this browser; export it from the tracker to take it with you.',
        steps:[
            {title:'Choose a game', description:'Open a tracker from the library. Each game has its own route and separate progress.'},
            {title:'Set your stage', description:'Check available achievements and warnings before important choices.'},
            {title:'Mark your progress', description:'Update achievements and stages manually. Export your progress to move it to another browser.'},
        ],
        footer:'A LITTLE COMPANION FOR BIG ADVENTURES.', back:'TO THE GAMES',
    },
};
