export type MapLocale = 'ru' | 'uk' | 'en';
export type MapText = Record<MapLocale, string>;
export type PlanPoint = [number, number];
export type FloorShape = {outer: PlanPoint[]; holes: PlanPoint[][]};
export type ModelFloor = {
    id: string;
    elevation: number;
    sourceBounds: [number, number, number, number];
    sourceOffset: PlanPoint;
    registrationScore: number;
    shapes: FloorShape[];
    walls: [number, number, number, number][];
    wallShapes: FloorShape[];
    stairs: {center: PlanPoint; width: number; run: number; angle: number; rise: number; toFloor: string}[];
};
export type MapModel = {
    id: string;
    kind?: 'city';
    sourceTransform?: [number, number, number, number, number, number];
    buildings?: {id: string; floor: string; height: number; shape: FloorShape}[];
    format: number;
    source: string;
    sourceImage: string;
    sourceSize: PlanPoint;
    scale: number;
    center: PlanPoint;
    registration: 'landmarks' | 'automatic';
    slabDepth: number;
    wallHeight: number;
    wallWidth: number;
    floors: ModelFloor[];
};
export type ModelPlace = {
    id: string;
    floor: string;
    pixel: PlanPoint;
    name: MapText;
    detail: MapText;
    kind: 'room' | 'stairs' | 'lift' | 'landmark';
};
export type ModelLocation = {id: string; name: MapText; stageIds: string[]; places: ModelPlace[]};

export const mapText = (ru: string, uk: string, en: string): MapText => ({ru, uk, en});
const t = mapText;
const room = (id: string, floor: number, pixel: PlanPoint, name: MapText, detail?: MapText, kind: ModelPlace['kind'] = 'room'): ModelPlace => ({
    id, floor: String(floor), pixel, name, kind,
    detail: detail || t('Помещение обозначено на исходной схеме. Выбери этот этаж, чтобы рассмотреть входы и соседние комнаты.', 'Приміщення позначене на вихідній схемі. Вибери цей поверх, щоб розглянути входи й сусідні кімнати.', 'This room is labelled on the source plan. Isolate its floor to inspect entrances and adjacent rooms.'),
});

// Coordinates refer to the ORIGINAL full-resolution sheet, never percentages
// of a thumbnail. The same floor registration transforms geometry and places.
export const modelLocations: ModelLocation[] = [
    {id: 'prague', name: t('Прага · общий план', 'Прага · загальний план', 'Prague · city overview'), stageIds: ['prague1', 'prague2', 'prague3'], places: [
        room('city-bank', 1, [730, 1080], t('Банк «Пэлисейд»', 'Банк «Палісейд»', 'Palisade Property Bank'), t('Банк в западной части Чиста-Чтврть. Внутренние этажи доступны отдельным макетом «Банк Пэлисейд» в выборе локации.', 'Банк у західній частині Чиста-Чтврть. Внутрішні поверхи доступні окремим макетом банку у виборі локації.', 'The bank in western Čistá Čtvrť. Its interior floors are available as a separate bank model in the location selector.'), 'landmark'),
        room('city-zelen', 1, [1780, 2720], t('Апартаменты «Зелень»', 'Апартаменти «Зелень»', 'Zelen Apartments'), t('Дом Дженсена в Преказке. Для квартир и лестниц открой отдельный макет апартаментов «Зелень».', 'Будинок Дженсена в Преказці. Для квартир і сходів відкрий окремий макет апартаментів «Зелень».', 'Jensen’s apartment building in Překážka. Open the separate Zelen Apartments model for rooms and staircases.'), 'landmark'),
        room('city-koller', 1, [2680, 3420], t('«Машина времени»', '«Машина часу»', 'The Time Machine'), t('Книжный магазин в Преказке. Под ним расположено убежище Коллера; внутренний макет доступен отдельно.', 'Книжкова крамниця у Преказці. Під нею розташоване сховище Коллера; внутрішній макет доступний окремо.', 'Bookshop in Překážka, above Koller’s workshop. The interior model is available separately.'), 'landmark'),
        room('city-church', 1, [1700, 3510], t('Церковь Бога-машины', 'Церква Бога-машини', 'Church of the MachineGod'), t('Церковь в юго-западной части Преказки. На этом общем плане показан только внешний объём комплекса.', 'Церква у південно-західній частині Преказки. Цей загальний план показує лише зовнішній об’єм комплексу.', 'Church in southwestern Překážka. This overview shows only the exterior mass of the complex.'), 'landmark'),
        room('city-hlavni', 1, [2070, 630], t('Апартаменты «Главни, 33»', 'Апартаменти «Главні, 33»', '33 Hlavní Apartments'), t('Жилой комплекс на северной стороне улицы Главни. Здесь показан его внешний контур.', 'Житловий комплекс на північному боці вулиці Главні. Тут показаний його зовнішній контур.', 'Residential complex on the north side of Hlavní Street. This model shows its exterior footprint.'), 'landmark'),
        room('city-dovoz', 1, [2600, 670], t('Вход в ОГ-29', 'Вхід до ОГ-29', 'TF29 entrance'), t('Контора Praha Dovoz скрывает вход в подземный штаб. Сам штаб показан отдельным макетом ОГ-29.', 'Контора Praha Dovoz приховує вхід до підземного штабу. Сам штаб показаний окремим макетом ОГ-29.', 'The Praha Dovoz storefront conceals the underground headquarters entrance. Open the separate TF29 model to explore the headquarters.'), 'landmark'),
        room('city-chikane', 1, [3990, 515], t('Площадка Чикане', 'Майданчик Чикане', 'Chikane’s Place'), t('Комплекс Чикане в северо-восточной части города. Открытый центральный двор сохранён в геометрии.', 'Комплекс Чикане у північно-східній частині міста. Відкрите центральне подвір’я збережене в геометрії.', 'Chikane’s compound in the northeast. Its open central courtyard is preserved in the geometry.'), 'landmark'),
        room('city-libuse', 1, [4200, 1500], t('Апартаменты «Либуше»', 'Апартаменти «Лібуше»', 'Libuše Apartments'), t('Жилой комплекс рядом со станцией «Пилигрим». Общая схема показывает расположение здания, без внутренней планировки.', 'Житловий комплекс біля станції «Пілігрим». Загальна схема показує розташування будівлі, без внутрішнього планування.', 'Apartment building near Pilgrim Station. The overview shows its position without an interior floor plan.'), 'landmark'),
        room('city-theater', 1, [5150, 2070], t('Театр Двали', 'Театр Двалі', 'Dvali Theater'), t('Театр в восточной части района красных фонарей. Высота и фасады этого объёма условные; этажи не восстановлены по общей схеме.', 'Театр у східній частині району червоних ліхтарів. Висота й фасади цього об’єму умовні; поверхи не відновлені за загальною схемою.', 'The theater in the eastern Red Light District. Height and facades are schematic; this overview does not reconstruct its interior floors.'), 'landmark'),
    ]},
    {id: 'tf29', name: t('Штаб ОГ-29', 'Штаб ОГ-29', 'TF29 Headquarters'), stageIds: ['prague1', 'prague2', 'prague3'], places: [
        room('shooting', 1, [292, 1815], t('Стрелковый тир', 'Стрілецький тир', 'Shooting range')),
        room('briefing', 1, [465, 1670], t('Зал брифингов', 'Зала брифінгів', 'Briefing room')),
        room('forensic', 1, [827, 1580], t('Криминалистика', 'Криміналістика', 'Forensic')),
        room('cafe', 1, [790, 1840], t('Кафе', 'Кафе', 'Café')),
        room('infirmary', 1, [612, 1970], t('Медпункт', 'Медпункт', 'Infirmary')),
        room('cells', 1, [645, 2130], t('Камеры задержания', 'Камери затримання', 'Holding cells')),
        room('stairs-lower', 1, [617, 1510], t('Лестница на верхний уровень', 'Сходи на верхній рівень', 'Stairs to the upper level'), undefined, 'stairs'),
        room('lift-base', 1, [437, 1940], t('Лифт к выходу', 'Ліфт до виходу', 'Exit elevator'), t('Лифт соединяет подземный штаб с конторой Praha Dovoz на уровне 3.', 'Ліфт сполучає підземний штаб із конторою Praha Dovoz на рівні 3.', 'The elevator connects the underground headquarters to the Praha Dovoz storefront on level 3.'), 'lift'),
        room('director', 2, [774, 1088], t('Кабинет директора', 'Кабінет директора', 'Director’s office')),
        room('nsn', 2, [800, 996], t('Комната NSN', 'Кімната NSN', 'NSN')),
        room('servers', 2, [862, 977], t('Серверная', 'Серверна', 'Servers')),
        room('cyber', 2, [511, 825], t('Отдел киберпреступлений', 'Відділ кіберзлочинів', 'Cyber Crimes Unit')),
        room('organized', 2, [460, 943], t('Организованная преступность', 'Організована злочинність', 'Organized Crime Unit')),
        room('counter', 2, [567, 1160], t('Контртеррористический отдел', 'Контртерористичний відділ', 'Counter-Terrorism Unit')),
        room('dovoz', 3, [404, 303], t('Контора Praha Dovoz', 'Контора Praha Dovoz', 'Praha Dovoz storefront'), undefined, 'landmark'),
    ]},
    {id: 'zelen', name: t('Апартаменты «Зелень»', 'Апартаменти «Зелень»', 'Zelen Apartments'), stageIds: ['prague1', 'prague2', 'prague3'], places: [
        room('adam', 4, [696, 159], t('Квартира Дженсена', 'Квартира Дженсена', 'Adam’s apartment')),
        room('41', 4, [558, 438], t('Квартира 41', 'Квартира 41', 'Apartment 41')),
        room('31', 3, [563, 1020], t('Квартира 31', 'Квартира 31', 'Apartment 31')),
        room('32', 3, [788, 956], t('Квартира 32', 'Квартира 32', 'Apartment 32')),
        room('21', 2, [558, 1585], t('Квартира 21', 'Квартира 21', 'Apartment 21')),
        room('22', 2, [789, 1532], t('Квартира 22', 'Квартира 22', 'Apartment 22')),
        room('23', 2, [663, 1314], t('Квартира 23', 'Квартира 23', 'Apartment 23')),
        room('courtyard', 1, [647, 2120], t('Внутренний двор', 'Внутрішній двір', 'Courtyard')),
        room('stairs-zelen', 1, [688, 2242], t('Лестница в жилые этажи', 'Сходи на житлові поверхи', 'Residential staircase'), undefined, 'stairs'),
    ]},
    {id: 'koller', name: t('«Машина времени»', '«Машина часу»', 'The Time Machine'), stageIds: ['prague1', 'prague2', 'prague3'], places: [
        room('bookshop', 2, [799, 1010], t('Книжный магазин', 'Книжкова крамниця', 'Main floor')),
        room('backstore', 2, [500, 1100], t('Подсобка', 'Підсобка', 'Backstore')),
        room('upper', 3, [736, 217], t('Верхний этаж магазина', 'Верхній поверх крамниці', 'Second floor')),
        room('office', 3, [719, 445], t('Кабинет управляющего', 'Кабінет керівника', 'Manager’s office')),
        room('workshop', 1, [699, 2180], t('Убежище Коллера', 'Сховище Коллера', 'Koller’s workshop'), t('Подземная часть «Машины времени». Высота туннеля и помещений в модели условная.', 'Підземна частина «Машини часу». Висота тунелю й приміщень у моделі умовна.', 'The underground part of The Time Machine. Tunnel and room heights are schematic.'), 'landmark'),
        room('lift-koller', 1, [632, 2345], t('Лифт в магазин', 'Ліфт у крамницю', 'Bookshop elevator'), undefined, 'lift'),
    ]},
    {id: 'garm', name: t('Комплекс G.A.R.M.', 'Комплекс G.A.R.M.', 'G.A.R.M. Facility'), stageIds: ['garm'], places: [
        room('hangar1', 1, [706, 5890], t('Ангар 1', 'Ангар 1', 'Hangar 1')),
        room('hangar2', 1, [1940, 5960], t('Ангар 2', 'Ангар 2', 'Hangar 2')),
        room('tunnel', 1, [1320, 5905], t('Туннель между ангарами', 'Тунель між ангарами', 'Connecting tunnel'), undefined, 'landmark'),
        room('ice', 1, [740, 6630], t('Ледяная пещера', 'Крижана печера', 'Ice cavern'), undefined, 'landmark'),
        room('offices', 3, [2133, 2240], t('Верхние помещения', 'Верхні приміщення', 'Upper rooms')),
        room('helipad', 4, [2425, 242], t('Вертолётная площадка', 'Гелікоптерний майданчик', 'Helipad'), undefined, 'landmark'),
    ]},
    {id: 'bank', name: t('Банк «Пэлисейд»', 'Банк «Палісейд»', 'Palisade Property Bank'), stageIds: ['prague1', 'prague2', 'prague3'], places: []},
    {id: 'dubai', name: t('Дубай', 'Дубай', 'Dubai'), stageIds: ['dubai'], places: []},
    {id: 'ridit', name: t('Станция «Ридит»', 'Станція «Рідіт»', 'Ridit Station'), stageIds: ['golem'], places: []},
    {id: 'rvac', name: t('Рвач-Роу', 'Рвач-Роу', 'RVAC Row'), stageIds: ['golem'], places: []},
    {id: 'stedry', name: t('Штедры', 'Штедри', 'Štědrý'), stageIds: ['golem'], places: []},
    {id: 'london', name: t('Лондон · Apex Centre', 'Лондон · Apex Centre', 'London · Apex Centre'), stageIds: ['london'], places: []},
];

export function modelPoint(model: MapModel, place: ModelPlace): [number, number, number]
{
    const floor = model.floors.find(item => item.id === place.floor)!;
    const [x, y] = place.pixel;
    const m = model.sourceTransform;
    const point = m ? [m[0]*x+m[1]*y+m[2], m[3]*x+m[4]*y+m[5]] : [x, y];
    return [(point[0] + floor.sourceOffset[0]) * model.scale - model.center[0], floor.elevation,
        (point[1] + floor.sourceOffset[1]) * model.scale - model.center[1]];
}

export const pragueInteriorMaps: Record<string, string> = {
    'city-bank': 'bank',
    'city-zelen': 'zelen',
    'city-koller': 'koller',
    'city-dovoz': 'tf29',
};

export function mapDestination(model: MapModel, selection: {place?: string; building?: string}): string | null
{
    if (model.id !== 'prague') return null;
    if (selection.place) return pragueInteriorMaps[selection.place] || null;
    const building = model.buildings?.find(item => item.id === selection.building);
    if (!building) return null;
    const inside = (point: PlanPoint, ring: PlanPoint[]) => {
        let result = false;
        for (let q = 0, e = ring.length-1; q < ring.length; e = q++)
        {
            const a = ring[q], b = ring[e];
            if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) result = !result;
        }
        return result;
    };
    // Resolve the volume from source landmarks, not unstable generated block IDs.
    const city = modelLocations.find(item => item.id === 'prague')!;
    for (const place of city.places)
    {
        if (!pragueInteriorMaps[place.id] || place.floor !== building.floor) continue;
        const p = modelPoint(model, place);
        const point: PlanPoint = [p[0]+model.center[0], p[2]+model.center[1]];
        if (inside(point, building.shape.outer) && !building.shape.holes.some(hole => inside(point, hole)))
            return pragueInteriorMaps[place.id];
    }
    return null;
}
