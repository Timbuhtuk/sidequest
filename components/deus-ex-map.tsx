'use client';
import {sitePath} from '@/lib/site-path';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowDownToLine, Box, ChevronRight, Crosshair, ExternalLink, Eye, KeyRound, Layers3, MapPin, Minus, Plus, RotateCcw, RotateCw, ScanLine, Search, Tags} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Toggle} from '@/components/ui/toggle';
import {mapText as t, modelLocations, mapDestination, pragueInteriorMaps, type MapLocale, type MapModel, type ModelPlace} from '@/lib/dx-map-model';
import {accessForLocation, mapAccessSources, type MapAccessEntry} from '@/lib/dx-map-access';
import {intelForLocation, mapIntelColors, mapIntelSources, type MapIntelKind, type MapIntelPoint} from '@/lib/dx-map-intel';
import type {MapSceneController, MapSelection, SceneOptions} from './deus-ex-map-scene';
import './deus-ex-map.css';

const labels = {
    title: t('Объёмная карта', 'Об’ємна мапа', 'Spatial map'),
    location: t('Локация', 'Локація', 'Location'),
    backCity: t('К карте Праги', 'До мапи Праги', 'Back to Prague'),
    cityPick: t('Нажми на здание с подробной картой, чтобы войти внутрь.', 'Натисни на будівлю з докладною мапою, щоб увійти всередину.', 'Select a building with an interior map to open it.'),
    floor: t('Уровень', 'Рівень', 'Level'),
    all: t('Все этажи', 'Усі поверхи', 'All floors'),
    explode: t('Разнести этажи', 'Рознести поверхи', 'Separate floors'),
    xray: t('Просвечивание', 'Просвічування', 'X-ray'),
    walls: t('Стены', 'Стіни', 'Walls'),
    buildings: t('Здания', 'Будівлі', 'Buildings'),
    city: t('Общий план', 'Загальний план', 'City overview'),
    cityAccuracy: t('Экспериментальный макет по очищенным контурам с исправлениями по оригиналу. Показаны внешние объёмы кварталов; высота условная, внутренние этажи здесь не моделируются.', 'Експериментальний макет за очищеними контурами з виправленнями за оригіналом. Показані зовнішні об’єми кварталів; висота умовна, внутрішні поверхи тут не моделюються.', 'Experimental model from cleaned outlines, corrected against the original. It shows exterior block volumes with schematic heights; interior floors are not modelled here.'),
    building: t('Квартал', 'Квартал', 'City block'),
    buildingDetail: t('Объём построен по контуру на плане. Открытые дворы оставлены вырезами. Высота условная и не указывает число этажей; для названных мест выбери метку на карте.', 'Об’єм побудований за контуром на плані. Відкриті подвір’я залишені вирізами. Висота умовна й не вказує кількість поверхів; для названих місць вибери позначку на мапі.', 'This mass is built from its plan outline, with open courtyards cut out. Height is schematic and does not imply a floor count. Select a map label for named places.'),
    lineSource: t('Очищенные линии', 'Очищені лінії', 'Cleaned line art'),
    vectorSource: t('Выровненные контуры', 'Вирівняні контури', 'Rectified outlines'),
    names: t('Подписи', 'Підписи', 'Labels'),
    top: t('Вид сверху', 'Вигляд зверху', 'Top view'),
    reset: t('Весь макет', 'Увесь макет', 'Fit model'),
    zoomIn: t('Приблизить', 'Наблизити', 'Zoom in'),
    zoomOut: t('Отдалить', 'Віддалити', 'Zoom out'),
    left: t('Повернуть влево', 'Повернути ліворуч', 'Rotate left'),
    right: t('Повернуть вправо', 'Повернути праворуч', 'Rotate right'),
    controls: t('Тяни — вращение · правая кнопка — перемещение · колесо — масштаб. На телефоне: один палец — вращение, два — масштаб и перемещение.', 'Тягни — обертання · права кнопка — переміщення · колесо — масштаб. На телефоні: один палець — обертання, два — масштаб і переміщення.', 'Drag to orbit · right-drag to pan · scroll to zoom. Touch: one finger to orbit, two to zoom and pan.'),
    loading: t('Строим макет…', 'Будуємо макет…', 'Building model…'),
    error: t('Не удалось открыть 3D-макет. Повтори загрузку или открой исходный план.', 'Не вдалося відкрити 3D-макет. Повтори завантаження або відкрий вихідний план.', 'Could not open the 3D model. Retry or open the source plan.'),
    retry: t('Повторить', 'Повторити', 'Retry'),
    objects: t('Места на карте', 'Місця на мапі', 'Places on the map'),
    pick: t('Нажми на помещение, стену или метку', 'Натисни на приміщення, стіну або позначку', 'Select a floor, wall or marker'),
    source: t('Исходная схема · полное разрешение', 'Вихідна схема · повна роздільність', 'Source plan · full resolution'),
    accuracy: t('Контуры восстановлены по полноразмерной схеме. Мелкие проёмы и детали ещё требуют сверки. Высота стен и расстояние между этажами условные: на планах нет этих размеров.', 'Контури відновлені за повнорозмірною схемою. Дрібні отвори й деталі ще потребують перевірки. Висота стін і відстань між поверхами умовні: на планах немає цих розмірів.', 'Footprints are reconstructed from the full-resolution plan. Small openings and details still need verification. Wall heights and floor spacing are schematic: these dimensions are absent from the plans.'),
    draft: t('Совмещение этажей этого макета ещё требует ручной сверки. Для изучения планировки выбери отдельный уровень.', 'Суміщення поверхів цього макета ще потребує ручної перевірки. Для вивчення планування вибери окремий рівень.', 'Floor alignment in this model still needs manual verification. Select a single level to explore its layout.'),
    draftShort: t('Черновая реконструкция', 'Чорнова реконструкція', 'Draft reconstruction'),
    model: t('Макет по схеме', 'Макет за схемою', 'Plan reconstruction'),
    focus: t('Показать крупнее', 'Показати ближче', 'Focus here'),
    isolate: t('Выделить этот этаж', 'Виділити цей поверх', 'Highlight this floor'),
    wall: t('Перегородка', 'Перегородка', 'Wall segment'),
    space: t('Участок этажа', 'Ділянка поверху', 'Floor area'),
    spaceDetail: t('Рассмотри форму помещения, соседние перегородки и проёмы. Разнеси этажи или включи просвечивание, чтобы увидеть пространство внутри.', 'Розглянь форму приміщення, сусідні перегородки й отвори. Рознеси поверхи або ввімкни просвічування, щоб побачити простір усередині.', 'Inspect the floor outline, surrounding partitions and openings. Separate the floors or enable X-ray to reveal the space inside.'),
    access: t('Коды и пароли', 'Коди й паролі', 'Codes and passwords'),
    accessSearch: t('Поиск по месту или коду', 'Пошук за місцем або кодом', 'Search place or code'),
    accessAll: t('Все', 'Усі', 'All'),
    keycodes: t('Коды', 'Коди', 'Codes'),
    passwords: t('Пароли', 'Паролі', 'Passwords'),
    keycode: t('Код', 'Код', 'Keycode'),
    password: t('Пароль', 'Пароль', 'Password'),
    accessFloor: t('Коды этажа', 'Коди поверху', 'Floor access'),
    accessFloorHint: t('Сводка по этажу. Точные точки замков на схеме не подтверждены.', 'Перелік для поверху. Точні точки замків на схемі не підтверджені.', 'Level summary. Exact lock positions are not confirmed on the plan.'),
    accessUnknown: t('Этаж не указан', 'Поверх не вказано', 'Floor unspecified'),
    accessPlace: t('Место по источнику', 'Місце за джерелом', 'Source location'),
    accessApprox: t('Точная точка не отмечена на плане.', 'Точну точку не позначено на плані.', 'Exact position is not marked on the plan.'),
    accessEmpty: t('Для этого фильтра записей нет.', 'Для цього фільтра записів немає.', 'No records match this filter.'),
    accessSource: t('Источник кодов', 'Джерело кодів', 'Code source'),
    intel: t('Данные Gamepressure', 'Дані Gamepressure', 'Gamepressure map data'),
    intelSearch: t('Поиск по точкам карты', 'Пошук за точками мапи', 'Search map points'),
    intelAll: t('Все', 'Усі', 'All'),
    intelMission: t('Задания', 'Завдання', 'Missions'),
    intelCollectible: t('Коллекции', 'Колекції', 'Collectibles'),
    intelAccess: t('Доступ', 'Доступ', 'Access'),
    intelRoute: t('Проходы', 'Проходи', 'Routes'),
    intelLoot: t('Снаряжение', 'Спорядження', 'Equipment'),
    intelPerson: t('Персонажи', 'Персонажі', 'Characters'),
    intelLocation: t('Места', 'Місця', 'Places'),
    intelSource: t('Открыть исходную карту', 'Відкрити вихідну мапу', 'Open source map'),
    intelApproximate: t('Эта точка привязана к ближайшему контуру этажа; её положение приблизительное.', 'Ця точка прив’язана до найближчого контуру поверху; її положення приблизне.', 'This point is aligned to the nearest floor outline; its position is approximate.'),
};

const intelLabelKeys: Record<MapIntelKind, keyof typeof labels> = {
    mission: 'intelMission', collectible: 'intelCollectible', access: 'intelAccess', route: 'intelRoute',
    loot: 'intelLoot', person: 'intelPerson', location: 'intelLocation',
};

export default function DeusExMap({locale, currentStage}: {locale: MapLocale; currentStage: string})
{
    const [locationId, setLocationId] = useState(() => (modelLocations.find(item => item.stageIds.includes(currentStage)) || modelLocations[0]).id);
    const [model, setModel] = useState<MapModel | null>(null);
    const [options, setOptions] = useState<SceneOptions>({floor: 'all', exploded: false, xray: false, labels: true, walls: true, intelKind: 'all', intelQuery: ''});
    const [selection, setSelection] = useState<MapSelection | null>(null);
    const [accessQuery, setAccessQuery] = useState('');
    const [accessKind, setAccessKind] = useState<'all' | 'keycode' | 'password'>('all');
    const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);
    const [selectedIntelId, setSelectedIntelId] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const host = useRef<HTMLDivElement>(null);
    const controller = useRef<MapSceneController | null>(null);
    const pendingOptions = useRef(options);
    pendingOptions.current = options;
    const location = modelLocations.find(item => item.id === locationId)!;
    const selectedPlace = location.places.find(item => item.id === selection?.place);
    const access = accessForLocation(locationId);
    const intel = intelForLocation(locationId);
    const selectedAccess = access.find(item => item.id === selectedAccessId);
    const selectedIntel = intel.find(item => item.id === selectedIntelId);
    const selectedPlaceAccess = selectedPlace ? access.filter(item => item.place === selectedPlace.id) : [];
    const query = accessQuery.trim().toLocaleLowerCase();
    const visibleAccess = access.filter(item => (accessKind === 'all' || item.kind === accessKind) &&
        (options.floor === 'all' || item.floor === options.floor) &&
        (!query || `${item.label} ${item.secret} ${item.region || ''}`.toLocaleLowerCase().includes(query)));
    const intelQuery = options.intelQuery.trim().toLocaleLowerCase();
    const visibleIntel = intel.filter(item => (options.intelKind === 'all' || item.kind === options.intelKind) &&
        (options.floor === 'all' || item.floor === options.floor) &&
        (!intelQuery || `${item.title.ru} ${item.title.uk} ${item.title.en} ${item.sourceMap}`.toLocaleLowerCase().includes(intelQuery)));
    const city = model?.kind === 'city';
    const places = location.places.filter(item => options.floor === 'all' || item.floor === options.floor);
    const text = (key: keyof typeof labels) => labels[key][locale];

    useEffect(() => {
        const abort = new AbortController();
        let disposed = false;
        let instance: MapSceneController | null = null;
        setStatus('loading'); setModel(null); setSelection(null); setSelectedAccessId(null); setSelectedIntelId(null);
        async function load()
        {
            try
            {
                const [response, engine] = await Promise.all([fetch(sitePath(`/maps/models/${locationId}.json?geometry=6-icon-free-walls`), {signal: abort.signal}), import('./deus-ex-map-scene')]);
                if (!response.ok) throw new Error('Map model unavailable');
                const next = await response.json() as MapModel;
                if (disposed || !host.current) return;
                if (next.format !== 3 || !next.floors.length) throw new Error('Unsupported map model');
                const initial = {...pendingOptions.current, floor: next.registration === 'automatic' ? next.floors[next.floors.length-1].id : 'all'};
                setOptions(initial);
                instance = engine.createMapScene(host.current, next, location.places, accessForLocation(locationId), intelForLocation(locationId), locale, hit => {
                    if (disposed) return;
                    const destination = mapDestination(next, hit);
                    if (destination) setLocationId(destination);
                    else
                    {
                        setSelectedAccessId(null);
                        setSelectedIntelId(hit.intel || null);
                        setSelection(hit);
                        if (hit.kind === 'access' || hit.kind === 'intel') setOptions(value => ({...value, floor: hit.floor}));
                    }
                }, () => {if (!disposed) setStatus('error');});
                controller.current = instance;
                instance.update(initial, null); instance.reset();
                setModel(next); setStatus('ready');
            }
            catch (error) {if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) setStatus('error');}
        }
        void load();
        return () => {disposed = true; abort.abort(); instance?.dispose(); controller.current = null;};
    }, [locationId, locale, attempt, location.places]);
    useEffect(() => {controller.current?.update(options, selectedIntel?.id || selectedAccess?.place || selection?.place || selection?.building || (selection?.kind === 'access' ? `access-floor-${selection.floor}` : null));}, [options, selection, selectedAccess?.place, selectedIntel?.id]);

    function chooseFloor(floor: string)
    {
        const next = {...options, floor};
        setOptions(next); setSelection(null); setSelectedAccessId(null); setSelectedIntelId(null);
        controller.current?.update(next, null);
    }
    function choosePlace(place: ModelPlace)
    {
        setSelectedAccessId(null); setSelectedIntelId(null);
        const destination = model && mapDestination(model, {place: place.id});
        if (destination) {setLocationId(destination); return;}
        const next = {...options, floor: place.floor};
        setOptions(next); setSelection({floor: place.floor, place: place.id, kind: 'place'});
        controller.current?.update(next, place.id); controller.current?.focus(place.id);
    }
    function chooseAccess(entry: MapAccessEntry)
    {
        setSelectedAccessId(entry.id); setSelectedIntelId(null);
        const place = location.places.find(item => item.id === entry.place);
        const floor = entry.floor && model?.floors.some(item => item.id === entry.floor) ? entry.floor : 'all';
        const next = {...options, floor};
        setOptions(next);
        setSelection(place ? {floor: place.floor, place: place.id, kind: 'place'} : null);
        controller.current?.update(next, place?.id || null);
        if (place) controller.current?.focus(place.id);
    }
    function chooseIntel(entry: MapIntelPoint)
    {
        setSelectedAccessId(null); setSelectedIntelId(entry.id);
        const next = {...options, floor: entry.floor};
        setOptions(next); setSelection({floor: entry.floor, intel: entry.id, kind: 'intel'});
        controller.current?.update(next, entry.id); controller.current?.focus(entry.id);
    }
    function toggle(key: 'exploded' | 'xray' | 'walls' | 'labels', pressed: boolean)
    {
        const next = {...options, [key]: pressed};
        setOptions(next); controller.current?.update(next, selectedIntel?.id || selectedAccess?.place || selection?.place || selection?.building || null);
        if (key === 'exploded') controller.current?.reset();
    }
    return <section className="dx-model" aria-labelledby="dx-model-title">
        <header className="dx-model-heading">
            <div>{Object.values(pragueInteriorMaps).includes(locationId) && <Button variant="ghost" onClick={() => setLocationId('prague')}><ArrowLeft/>{text('backCity')}</Button>}<span className="eyebrow"><Box size={14}/>{text('title')}</span><h2 id="dx-model-title">{location.name[locale]}</h2></div>
            <Select value={locationId} onValueChange={value => {if (value) setLocationId(value);}}>
                <SelectTrigger className="dx-model-select" aria-label={text('location')}><SelectValue>{location.name[locale]}</SelectValue></SelectTrigger>
                <SelectContent>{modelLocations.map(item => <SelectItem value={item.id} key={item.id}>{item.name[locale]}</SelectItem>)}</SelectContent>
            </Select>
        </header>
        {model?.registration === 'automatic' && <p className="dx-model-notice">{text('draftShort')} · {text('draft')}</p>}
        {city && <p className="dx-model-notice">{text('cityAccuracy')}</p>}
        <div className="dx-model-toolbar">
            {city ? <div className="dx-model-floors"><Box size={17}/><span>{text('city')}</span></div> : <div className="dx-model-floors" aria-label={text('floor')}><Layers3 size={17}/>
                <Button variant="ghost" aria-pressed={options.floor === 'all'} onClick={() => chooseFloor('all')} disabled={!model}>{text('all')}</Button>
                {model?.floors.map(floor => <Button key={floor.id} variant="ghost" aria-label={`${text('floor')} ${floor.id}`} aria-pressed={floor.id === options.floor} onClick={() => chooseFloor(floor.id)}>{floor.id.padStart(2, '0')}</Button>)}
            </div>}
            <div className="dx-model-toggles">
                {!city && <Toggle pressed={options.exploded} onPressedChange={value => toggle('exploded', value)} title={text('explode')}><Layers3/>{text('explode')}</Toggle>}
                <Toggle pressed={options.xray} onPressedChange={value => toggle('xray', value)} title={text('xray')}><Eye/>{text('xray')}</Toggle>
                <Toggle pressed={options.walls} onPressedChange={value => toggle('walls', value)} title={text(city ? 'buildings' : 'walls')}><Box/>{text(city ? 'buildings' : 'walls')}</Toggle>
                <Toggle pressed={options.labels} onPressedChange={value => toggle('labels', value)} title={text('names')}><Tags/>{text('names')}</Toggle>
            </div>
        </div>
        <div className="dx-model-workspace">
            <div className="dx-model-stage">
                <div ref={host} className="dx-model-canvas"/>
                <div className="dx-model-stamp" aria-hidden="true">DX / SPATIAL ARCHIVE <span>{locationId.toUpperCase()} · {options.floor === 'all' ? 'ALL' : `L${options.floor}`}</span></div>
                {status !== 'ready' && <div className="dx-model-state" role="status"><Box size={32}/><p>{text(status === 'error' ? 'error' : 'loading')}</p>{status === 'error' && <><Button variant="outline" onClick={() => setAttempt(value => value+1)}>{text('retry')}</Button><a href={sitePath(`/maps/plans/${locationId}-raw.png`)} target="_blank" rel="noreferrer">{text('source')}</a></>}</div>}
                <div className="dx-model-camera">
                    <Button variant="ghost" size="icon" title={text('left')} aria-label={text('left')} onClick={() => controller.current?.rotate(-1)}><RotateCcw/></Button>
                    <Button variant="ghost" size="icon" title={text('right')} aria-label={text('right')} onClick={() => controller.current?.rotate(1)}><RotateCw/></Button><i/>
                    <Button variant="ghost" size="icon" title={text('zoomOut')} aria-label={text('zoomOut')} onClick={() => controller.current?.zoom(1.2)}><Minus/></Button>
                    <Button variant="ghost" size="icon" title={text('zoomIn')} aria-label={text('zoomIn')} onClick={() => controller.current?.zoom(1/1.2)}><Plus/></Button><i/>
                    <Button variant="ghost" size="icon" title={text('top')} aria-label={text('top')} onClick={() => controller.current?.reset(true)}><ArrowDownToLine/></Button>
                    <Button variant="ghost" size="icon" title={text('reset')} aria-label={text('reset')} onClick={() => controller.current?.reset()}><ScanLine/></Button>
                </div>
            </div>
            <aside className="dx-model-panel">
                <span className="eyebrow">{text('objects')} <b>{places.length || model?.floors.length || '—'}</b></span>
                {selectedAccess ? <article className="dx-model-detail dx-model-access-detail">
                    <span className="dx-model-level">{text(selectedAccess.kind)} · {selectedAccess.floor ? `${text('floor')} ${selectedAccess.floor}` : text('accessUnknown')}</span>
                    <h3>{selectedAccess.label}</h3>
                    <strong className="dx-model-secret">{selectedAccess.secret}</strong>
                    <p>{selectedAccess.place ? (location.places.find(item => item.id === selectedAccess.place)?.name[locale] || selectedAccess.label) : `${text('accessPlace')}: ${selectedAccess.region || selectedAccess.label}`}</p>
                    {!selectedAccess.place && <p>{text('accessApprox')}</p>}
                    {selectedAccess.note && <p>{selectedAccess.note}</p>}
                    <a href={mapAccessSources[selectedAccess.kind]} target="_blank" rel="noreferrer">{text('accessSource')} <ExternalLink size={13}/></a>
                </article> : selectedIntel ? <article className="dx-model-detail dx-model-intel-detail">
                    <span className="dx-model-level">{text(intelLabelKeys[selectedIntel.kind])} · {selectedIntel.sourceMap.toUpperCase()} · {text('floor')} {selectedIntel.floor}</span>
                    <h3>{selectedIntel.title[locale]}</h3>
                    {locale !== 'en' && selectedIntel.title.en !== selectedIntel.title[locale] && <p className="dx-model-en">({selectedIntel.title.en})</p>}
                    <p>{selectedIntel.detail[locale]}</p>
                    {selectedIntel.precision === 'approximate' && <p className="dx-model-intel-precision">{text('intelApproximate')}</p>}
                    <Button variant="ghost" onClick={() => chooseIntel(selectedIntel)}><Crosshair/>{text('focus')}</Button>
                    <a href={mapIntelSources[selectedIntel.sourceMap].url} target="_blank" rel="noreferrer">{text('intelSource')} <ExternalLink size={13}/></a>
                </article> : selection ? <article className="dx-model-detail">
                    <span className="dx-model-level">{city ? text('city') : `${text('floor')} ${selection.floor}`}</span>
                    <h3>{selectedPlace ? selectedPlace.name[locale] : selection.kind === 'access' ? text('accessFloor') : selection.building ? `${text('building')} ${selection.building.replace('block-', '')}` : text(selection.kind === 'wall' ? 'wall' : city ? 'city' : 'space')}</h3>
                    {selectedPlace && locale !== 'en' && <p className="dx-model-en">({selectedPlace.name.en})</p>}
                    <p>{selectedPlace ? selectedPlace.detail[locale] : text(selection.kind === 'access' ? 'accessFloorHint' : selection.building ? 'buildingDetail' : city ? 'cityAccuracy' : 'spaceDetail')}</p>
                    {selectedPlaceAccess.length > 0 && <div className="dx-model-place-secrets">{selectedPlaceAccess.map(item => <button type="button" key={item.id} onClick={() => chooseAccess(item)}><span>{text(item.kind)}</span><strong>{item.secret}</strong><small>{item.label}</small></button>)}</div>}
                    {!city && <Button variant="outline" onClick={() => chooseFloor(selection.floor)}><Layers3/>{text('isolate')}</Button>}
                    {selectedPlace && <Button variant="ghost" onClick={() => choosePlace(selectedPlace)}><Crosshair/>{text('focus')}</Button>}
                </article> : <div className="dx-model-pick"><Crosshair/><p>{text(city ? 'cityPick' : 'pick')}</p></div>}
                <div className="dx-model-place-list">
                    {places.length ? places.map(place => <Button variant="ghost" key={place.id} className={selectedPlace?.id === place.id ? 'selected' : ''} onClick={() => choosePlace(place)}><span className="dx-model-place-floor">{place.floor.padStart(2, '0')}</span><span>{place.name[locale]}</span><ChevronRight/></Button>) : model?.floors.map(floor => <Button variant="ghost" key={floor.id} onClick={() => chooseFloor(floor.id)}><Layers3/><span>{text('floor')} {floor.id}</span><ChevronRight/></Button>)}
                </div>
                <section className="dx-model-intel" aria-label={text('intel')}>
                    <div className="dx-model-access-heading"><span className="eyebrow"><MapPin size={14}/>{text('intel')}</span><b>{visibleIntel.length} / {intel.length}</b></div>
                    <label className="dx-model-access-search"><Search size={15}/><input type="search" value={options.intelQuery} onChange={event => setOptions(value => ({...value, intelQuery: event.target.value}))} placeholder={text('intelSearch')} aria-label={text('intelSearch')}/></label>
                    <div className="dx-model-intel-tabs" role="group" aria-label={text('intel')}>
                        <button type="button" aria-pressed={options.intelKind === 'all'} onClick={() => setOptions(value => ({...value, intelKind: 'all'}))}>{text('intelAll')}</button>
                        {(['mission', 'collectible', 'access', 'route', 'loot', 'person', 'location'] as const).filter(kind => intel.some(item => item.kind === kind)).map(kind => <button type="button" key={kind} aria-pressed={options.intelKind === kind} onClick={() => setOptions(value => ({...value, intelKind: kind}))}>{text(intelLabelKeys[kind])}</button>)}
                    </div>
                    <div className="dx-model-intel-list">{visibleIntel.length ? visibleIntel.map(item => <button type="button" key={item.id} className={selectedIntelId === item.id ? 'selected' : ''} onClick={() => chooseIntel(item)}><i style={{backgroundColor: mapIntelColors[item.kind]}}/><span><strong>{item.title[locale]}</strong><small>{item.sourceMap.toUpperCase()} · {text('floor')} {item.floor}</small></span><ChevronRight size={13}/></button>) : <p>{text('accessEmpty')}</p>}</div>
                </section>
                <section className="dx-model-access" aria-label={text('access')}>
                    <div className="dx-model-access-heading"><span className="eyebrow"><KeyRound size={14}/>{text('access')}</span><b>{visibleAccess.length} / {access.length}</b></div>
                    <label className="dx-model-access-search"><Search size={15}/><input type="search" value={accessQuery} onChange={event => setAccessQuery(event.target.value)} placeholder={text('accessSearch')} aria-label={text('accessSearch')}/></label>
                    <div className="dx-model-access-tabs" role="group" aria-label={text('access')}>
                        {(['all', 'keycode', 'password'] as const).map(kind => <button type="button" key={kind} aria-pressed={accessKind === kind} onClick={() => setAccessKind(kind)}>{text(kind === 'all' ? 'accessAll' : kind === 'keycode' ? 'keycodes' : 'passwords')}</button>)}
                    </div>
                    <div className="dx-model-access-list">{visibleAccess.length ? visibleAccess.map(item => <button type="button" key={item.id} className={selectedAccessId === item.id ? 'selected' : ''} onClick={() => chooseAccess(item)}><span className="dx-model-access-code">{item.secret}</span><span className="dx-model-access-name">{item.label}<small>{item.floor ? `${text('floor')} ${item.floor}` : text('accessUnknown')}</small></span><ChevronRight size={13}/></button>) : <p>{text('accessEmpty')}</p>}</div>
                    <div className="dx-model-access-sources"><a href={mapAccessSources.keycode} target="_blank" rel="noreferrer">{text('keycodes')} <ExternalLink size={12}/></a><a href={mapAccessSources.password} target="_blank" rel="noreferrer">{text('passwords')} <ExternalLink size={12}/></a></div>
                </section>
                {model && <div className="dx-model-sources"><span>{model.registration === 'automatic' || city ? text('draftShort') : text('model')}</span><p>{text(city ? 'cityAccuracy' : 'accuracy')}</p>{model.registration === 'automatic' && <p>{text('draft')}</p>}<a href={sitePath(model.sourceImage)} target="_blank" rel="noreferrer">{text('source')}<ExternalLink size={13}/></a><a href={model.source} target="_blank" rel="noreferrer">Deus Ex Wiki<ExternalLink size={13}/></a></div>}
            </aside>
        </div>
        <p className="dx-model-help">{text('controls')}</p>
    </section>;
}
