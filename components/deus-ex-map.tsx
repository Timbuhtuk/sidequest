'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Box,ChevronRight,Crosshair,Info,Layers3,LocateFixed,Minus,MousePointer2,Plus,Rotate3D,RotateCcw,ZoomIn} from 'lucide-react';
import {mapScenes,mapSources,type MapLocale,type MapMarker,type MapMarkerKind} from '@/lib/dx-map-data';
import './deus-ex-map.css';

type Camera={pitch:number;yaw:number;zoom:number;panX:number;panY:number};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const visitLayer:Record<string,string>={prague1:'visit1',prague2:'visit2',prague3:'visit3'};
const sceneForStage=(stage:string)=>mapScenes.find(scene=>scene.stageIds.includes(stage))||mapScenes[0];

export default function DeusExMap({locale,currentStage}:{locale:MapLocale;currentStage:string}){
  const initialScene=sceneForStage(currentStage);
  const initialLayer=visitLayer[currentStage]||initialScene.layers[0].id;
  const [sceneId,setSceneId]=useState(initialScene.id),[layerId,setLayerId]=useState(initialLayer),[kind,setKind]=useState<MapMarkerKind|'all'>('all');
  const [selectedId,setSelectedId]=useState<string|null>(null),[camera,setCamera]=useState<Camera>({pitch:52,yaw:-2,zoom:initialScene.layers.find(layer=>layer.id===initialLayer)?.initialZoom||.8,panX:0,panY:0});
  const pointer=useRef<{id:number;x:number;y:number;camera:Camera;mode:'rotate'|'pan'}|null>(null);
  const scene=mapScenes.find(item=>item.id===sceneId)||mapScenes[0];
  const layer=scene.layers.find(item=>item.id===layerId)||scene.layers[0];
  const markers=useMemo(()=>scene.markers.filter(item=>(kind==='all'||item.kind===kind)&&(!item.layers||item.layers.includes(layer.id))),[scene,layer.id,kind]);
  const selected=scene.markers.find(item=>item.id===selectedId)||markers[0]||null;
  const tr=(value:Record<MapLocale,string>)=>value[locale];
  const labels={
    all:{ru:'Все',uk:'Усі',en:'All'},mission:{ru:'Миссии',uk:'Місії',en:'Missions'},achievement:{ru:'Достижения',uk:'Досягнення',en:'Achievements'},collectible:{ru:'Предметы',uk:'Предмети',en:'Collectibles'},poi:{ru:'Места',uk:'Місця',en:'Places'},transition:{ru:'Переходы',uk:'Переходи',en:'Connections'},
    map:{ru:'Интерактивная карта',uk:'Інтерактивна карта',en:'Interactive map'},objects:{ru:'Объекты',uk:'Об’єкти',en:'Objects'},layers:{ru:'Слои',uk:'Шари',en:'Layers'},controls:{ru:'Тяни для вращения · Shift + тяни для перемещения · колесо для масштаба',uk:'Тягни для обертання · Shift + тягни для переміщення · колесо для масштабу',en:'Drag to rotate · Shift-drag to pan · wheel to zoom'},reset:{ru:'Сбросить вид',uk:'Скинути вигляд',en:'Reset view'},zoomIn:{ru:'Приблизить',uk:'Наблизити',en:'Zoom in'},zoomOut:{ru:'Отдалить',uk:'Віддалити',en:'Zoom out'},rotateLeft:{ru:'Повернуть влево',uk:'Повернути ліворуч',en:'Rotate left'},rotateRight:{ru:'Повернуть вправо',uk:'Повернути праворуч',en:'Rotate right'},current:{ru:'ТЕКУЩАЯ ЛОКАЦИЯ',uk:'ПОТОЧНА ЛОКАЦІЯ',en:'CURRENT LOCATION'},missionLabel:{ru:'МИССИЯ',uk:'МІСІЯ',en:'MISSION'},achievementLabel:{ru:'СВЯЗАННОЕ ДОСТИЖЕНИЕ',uk:'ПОВ’ЯЗАНЕ ДОСЯГНЕННЯ',en:'RELATED ACHIEVEMENT'},source:{ru:'Основа и сведения: Deus Ex Wiki, CC BY-SA. Позиции интерактивных маркеров адаптированы для трекера.',uk:'Основа й відомості: Deus Ex Wiki, CC BY-SA. Позиції інтерактивних маркерів адаптовані для трекера.',en:'Map base and information: Deus Ex Wiki, CC BY-SA. Interactive marker positions are adapted for this tracker.'}
  };
  function reset(nextLayer=layer){setCamera({pitch:52,yaw:-2,zoom:nextLayer.initialZoom,panX:0,panY:0})}
  function chooseScene(id:string){const next=mapScenes.find(item=>item.id===id)||mapScenes[0],nextLayer=visitLayer[currentStage]&&next.id==='prague'?next.layers.find(item=>item.id===visitLayer[currentStage])||next.layers[0]:next.layers[0];setSceneId(next.id);setLayerId(nextLayer.id);setSelectedId(null);reset(nextLayer)}
  function chooseLayer(id:string){const next=scene.layers.find(item=>item.id===id)||scene.layers[0];setLayerId(next.id);setSelectedId(null);reset(next)}
  function pointerDown(event:React.PointerEvent<HTMLDivElement>){if((event.target as HTMLElement).closest('button,a'))return;event.currentTarget.setPointerCapture(event.pointerId);pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,camera,mode:event.shiftKey||event.button===1?'pan':'rotate'}}
  function pointerMove(event:React.PointerEvent<HTMLDivElement>){const start=pointer.current;if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(start.mode==='pan')setCamera({...start.camera,panX:start.camera.panX+dx,panY:start.camera.panY+dy});else setCamera({...start.camera,yaw:start.camera.yaw+dx*.22,pitch:clamp(start.camera.pitch-dy*.18,18,74)})}
  function pointerUp(event:React.PointerEvent<HTMLDivElement>){if(pointer.current?.id===event.pointerId)pointer.current=null}
  function zoom(delta:number){setCamera(value=>({...value,zoom:clamp(value.zoom+delta,.35,2.2)}))}
  useEffect(()=>{if(selectedId&&!markers.some(item=>item.id===selectedId))setSelectedId(null)},[markers,selectedId]);
  return <section className="dx-map" aria-labelledby="dx-map-title">
    <header className="dx-map-header"><div><span className="eyebrow"><Box size={14}/>{labels.map[locale]}</span><h2 id="dx-map-title">{tr(scene.label)} <b>/ {scene.code}</b></h2><p>{labels.controls[locale]}</p></div><div className="dx-map-scene-tabs" role="tablist" aria-label={labels.map[locale]}>{mapScenes.map(item=><button role="tab" aria-selected={item.id===scene.id} className={item.id===scene.id?'active':''} onClick={()=>chooseScene(item.id)} key={item.id}><span>{item.code}</span>{tr(item.label)}{item.stageIds.includes(currentStage)&&<i title={labels.current[locale]}/>}</button>)}</div></header>
    <div className="dx-map-toolbar"><div className="dx-map-layer-tabs" role="tablist" aria-label={labels.layers[locale]}><span><Layers3 size={14}/>{labels.layers[locale]}</span>{scene.layers.map(item=><button role="tab" aria-selected={item.id===layer.id} onClick={()=>chooseLayer(item.id)} className={item.id===layer.id?'active':''} key={item.id}>{tr(item.label)}</button>)}</div><div className="dx-map-camera-controls"><button onClick={()=>setCamera(value=>({...value,yaw:value.yaw-18}))} title={labels.rotateLeft[locale]} aria-label={labels.rotateLeft[locale]}><Rotate3D/></button><button onClick={()=>setCamera(value=>({...value,yaw:value.yaw+18}))} title={labels.rotateRight[locale]} aria-label={labels.rotateRight[locale]}><Rotate3D className="flip"/></button><button onClick={()=>zoom(-.14)} title={labels.zoomOut[locale]} aria-label={labels.zoomOut[locale]}><Minus/></button><button onClick={()=>zoom(.14)} title={labels.zoomIn[locale]} aria-label={labels.zoomIn[locale]}><Plus/></button><button onClick={()=>reset()} title={labels.reset[locale]} aria-label={labels.reset[locale]}><RotateCcw/></button></div></div>
    <div className="dx-map-workspace">
      <div className="dx-map-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={event=>{event.preventDefault();zoom(event.deltaY<0?.1:-.1)}}>
        <div className="dx-map-grid"/><div className="dx-map-axis axis-x"/><div className="dx-map-axis axis-y"/>
        <div className="dx-map-plane" style={{width:`${layer.planeWidth}%`,aspectRatio:layer.aspectRatio,transform:`translate3d(${camera.panX}px,${camera.panY}px,0) scale(${camera.zoom}) rotateX(${camera.pitch}deg) rotateZ(${camera.yaw}deg)`}}>
          <div className="dx-map-depth depth-3"/><div className="dx-map-depth depth-2"/><div className="dx-map-depth depth-1"/><img src={layer.image} alt={`${tr(scene.label)} — ${tr(layer.label)}`} draggable={false}/>
          {markers.map(item=><button key={item.id} className={`dx-map-marker ${item.kind} ${selected?.id===item.id?'selected':''}`} style={{left:`${item.x}%`,top:`${item.y}%`,transform:`translate(-50%,-50%) translateZ(${item.height||22}px)`}} onClick={event=>{event.stopPropagation();setSelectedId(item.id)}} aria-label={tr(item.title)} title={tr(item.title)}><span/><i>{String(scene.markers.indexOf(item)+1).padStart(2,'0')}</i></button>)}
        </div>
        <div className="dx-map-hud"><span><MousePointer2/>ROT {Math.round(camera.yaw)}°</span><span><ZoomIn/>ZOOM {Math.round(camera.zoom*100)}%</span><span><LocateFixed/>TILT {Math.round(camera.pitch)}°</span></div>
      </div>
      <aside className="dx-map-panel"><div className="dx-map-filter"><span className="eyebrow">{labels.objects[locale]}</span>{(['all','mission','achievement','collectible','poi','transition'] as const).map(value=><button key={value} onClick={()=>setKind(value)} className={kind===value?'active':''}>{labels[value][locale]}<span>{value==='all'?scene.markers.filter(item=>!item.layers||item.layers.includes(layer.id)).length:scene.markers.filter(item=>item.kind===value&&(!item.layers||item.layers.includes(layer.id))).length}</span></button>)}</div>{selected?<MapDetails item={selected} locale={locale}/>:<div className="dx-map-empty"><Crosshair/><p>{labels.controls[locale]}</p></div>}<div className="dx-map-source"><Info/><p>{labels.source[locale]}</p>{mapSources.map(source=><a href={source.href} target="_blank" rel="noreferrer" key={source.href}>{source.label}<ChevronRight/></a>)}</div></aside>
    </div>
  </section>;
}

function MapDetails({item,locale}:{item:MapMarker;locale:MapLocale}){const tr=(value:Record<MapLocale,string>)=>value[locale];const kindLabels={mission:{ru:'МИССИЯ',uk:'МІСІЯ',en:'MISSION'},achievement:{ru:'ДОСТИЖЕНИЕ',uk:'ДОСЯГНЕННЯ',en:'ACHIEVEMENT'},collectible:{ru:'КОЛЛЕКЦИЯ',uk:'КОЛЕКЦІЯ',en:'COLLECTIBLE'},poi:{ru:'ТОЧКА ИНТЕРЕСА',uk:'ТОЧКА ІНТЕРЕСУ',en:'POINT OF INTEREST'},transition:{ru:'ПЕРЕХОД',uk:'ПЕРЕХІД',en:'CONNECTION'}};return <article className="dx-map-details" key={item.id}><span className={`dx-map-kind ${item.kind}`}>{kindLabels[item.kind][locale]}</span><h3>{tr(item.title)}</h3><p className="dx-map-location"><LocateFixed/>{tr(item.location)}</p><p>{tr(item.description)}</p>{item.mission&&<dl><dt>{locale==='ru'?'Миссия':locale==='uk'?'Місія':'Mission'}</dt><dd>{item.mission}</dd></dl>}{item.achievement&&<dl><dt>{locale==='ru'?'Достижение':locale==='uk'?'Досягнення':'Achievement'}</dt><dd>{tr(item.achievement)}</dd></dl>}</article>}
