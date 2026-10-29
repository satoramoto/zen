import { h, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { textNode } from '../../../primitives/Text.model';
import { binProjectedPoints } from '../../model/distribution';

export interface PlotPoint { id: string; x: number; y: number; z?: number; label?: string; hue?: 1|2|3|4|5; outline?: boolean; outlineHue?: 1|2|3|4|5; size?: number; opacity?: number; outlineOpacity?: number }
export interface PlotCamera { zoom: number; x: number; y: number; rotation: number }
export interface PlotBinSummary {
  count: number;
  minNumericId?: string;
  maxNumericId?: string;
  hues: readonly { hue: number|null; count: number; proportion: number }[];
}
export interface PlotViewportProps {
  /** Arrays are immutable: replace an array when its coordinates or styles change. */
  points: readonly PlotPoint[];
  boundsPoints?: readonly PlotPoint[];
  selectedId?: string|null;
  hoveredId?: string|null;
  edges?: readonly [string,string][];
  camera: PlotCamera;
  volume?: boolean;
  labels?: boolean;
  renderMode?: 'auto'|'points'|'density';
  onSelect?(id:string):void;
  onHover?(id:string|null):void;
  onBinHover?(summary:PlotBinSummary|null):void;
  onClearSelection?():void;
  onCameraChange?(camera:PlotCamera):void;
  label?:string;
}
export interface PlotPosition { x:number; y:number }
export interface PlotRect { left:number; top:number; width:number; height:number }
export type ProjectedPoint = PlotPoint & { px:number; py:number };
const clamp = (n:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,n));
const finite = (n:number,fallback:number) => Number.isFinite(n)?n:fallback;
export function boundedCamera(camera:PlotCamera):PlotCamera {
  return { rotation:finite(camera.rotation,0), zoom:clamp(finite(camera.zoom,1),.25,64), x:clamp(finite(camera.x,0),-10000,10000), y:clamp(finite(camera.y,0),-10000,10000) };
}
/** SVG uses xMidYMid meet: remove centered letterboxing before mapping a pointer. */
export function clientToPlotCoordinates(clientX:number,clientY:number,rect:PlotRect):PlotPosition {
  const scale=Math.min(rect.width,rect.height)/1000;
  if (!(scale>0)) return {x:500,y:500};
  return {x:(clientX-rect.left-(rect.width-1000*scale)/2)/scale,y:(clientY-rect.top-(rect.height-1000*scale)/2)/scale};
}
/** Preserve the world position below an anchor in SVG coordinates, except at pan bounds. */
export function zoomAt(camera:PlotCamera,newZoom:number,anchor:PlotPosition={x:500,y:500}):PlotCamera {
  const current=boundedCamera(camera),zoom=clamp(finite(newZoom,current.zoom),.25,64),ratio=zoom/current.zoom;
  return boundedCamera({...current,zoom,x:anchor.x-500-ratio*(anchor.x-500-current.x),y:anchor.y-500-ratio*(anchor.y-500-current.y)});
}
/** Normalize pixel, line and page wheel deltas into a continuous exponential zoom. */
export function wheelZoomFactor(deltaY:number,deltaMode:number,pagePixels:number):number {
  const pixels=deltaY*(deltaMode===1?16:deltaMode===2?Math.max(1,pagePixels):1);
  return Math.exp(-clamp(finite(pixels,0),-500,500)*.002);
}

type ProjectionEntry={rotation:number;volume:boolean;bounds:readonly PlotPoint[];result:ProjectedPoint[]};
const projectionCache=new WeakMap<readonly PlotPoint[],ProjectionEntry[]>();
/** Project into one fixed drawing plane. Cache is bounded per immutable point array. */
export function projectPoints(points:readonly PlotPoint[],rotation:number,volume:boolean,boundsPoints:readonly PlotPoint[]=points):ProjectedPoint[] {
  const entries=projectionCache.get(points)??[];
  const cached=entries.find(e=>e.rotation===rotation&&e.volume===volume&&e.bounds===boundsPoints);
  if(cached)return cached.result;
  const angle=finite(rotation,0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const project=(p:PlotPoint)=>({px:volume?p.x*cos-p.y*sin:p.x,py:volume?(p.x*sin+p.y*cos)*.45-(p.z??0)*1.7:p.y});
  let minX=0,maxX=1,minY=0,maxY=1;
  for(const point of boundsPoints){const b=project(point);minX=Math.min(minX,b.px);maxX=Math.max(maxX,b.px);minY=Math.min(minY,b.py);maxY=Math.max(maxY,b.py);}
  const scale=Math.min(900/(maxX-minX+2),900/(maxY-minY+2));
  const result=points.map(p=>{const b=project(p);return {...p,px:500+(b.px-(minX+maxX)/2)*scale,py:500+(b.py-(minY+maxY)/2)*scale};});
  projectionCache.set(points,[{rotation,volume,bounds:boundsPoints,result},...entries].slice(0,4));
  return result;
}
const screenPosition=(p:ProjectedPoint,c:PlotCamera)=>({x:c.x+500+(p.px-500)*c.zoom,y:c.y+500+(p.py-500)*c.zoom});
const onScreen=(p:ProjectedPoint,c:PlotCamera)=>{const v=screenPosition(p,c);return v.x>=-24&&v.x<=1024&&v.y>=-24&&v.y<=1024;};
function renderData(p:PlotViewportProps){
  const camera=boundedCamera(p.camera),projected=projectPoints(p.points,camera.rotation,!!p.volume,p.boundsPoints);
  const visible=projected.filter(v=>onScreen(v,camera));
  const density=p.renderMode==='density'||visible.length>6000||(p.renderMode!=='points'&&visible.length>4000);
  return {camera,projected,byId:new Map(projected.map(v=>[v.id,v])),visible,density,bins:density?binProjectedPoints(projected,camera,{binSize:24}).bins:[]};
}
type RenderData=ReturnType<typeof renderData>;
type RenderEntry={bounds:PlotViewportProps['boundsPoints'];volume:boolean;mode:PlotViewportProps['renderMode'];data:RenderData};
const renderCache=new WeakMap<readonly PlotPoint[],RenderEntry[]>();
/** Hover and pin changes reuse geometry, culling, counts and identity lookup. */
function dataFor(p:PlotViewportProps):RenderData {
  const entries=renderCache.get(p.points)??[],camera=boundedCamera(p.camera);
  const cached=entries.find(e=>e.bounds===p.boundsPoints&&e.volume===!!p.volume&&e.mode===p.renderMode&&e.data.camera.zoom===camera.zoom&&e.data.camera.x===camera.x&&e.data.camera.y===camera.y&&e.data.camera.rotation===camera.rotation);
  if(cached)return cached.data;
  const data=renderData(p);
  renderCache.set(p.points,[{bounds:p.boundsPoints,volume:!!p.volume,mode:p.renderMode,data},...entries].slice(0,2));
  return data;
}

function indicator(v:ProjectedPoint,camera:PlotCamera,kind:'selection'|'hover'):Node {
  const pos=screenPosition(v,camera),r=Math.max(7,Math.min(22,(v.size??4)*camera.zoom+5));
  return h('g',{'data-indicator':kind,'pointer-events':'none'},
    h('circle',{cx:String(pos.x),cy:String(pos.y),r:String(r),class:`zen-math-viewport__${kind}`}),
    textNode({as:'text',role:'caption'},{x:String(clamp(pos.x+r+5,12,950)),y:String(clamp(pos.y-r-5,18,985)),class:'zen-math-viewport__label'},v.label??v.id),
  );
}
export function plotViewportView(p:PlotViewportProps):Node {
  const {camera,byId,visible,density,bins}=dataFor(p);
  const selected=p.selectedId?byId.get(p.selectedId):undefined,hovered=p.hoveredId?byId.get(p.hoveredId):undefined;
  const maxBinCount=bins.reduce((max,bin)=>Math.max(max,bin.count),1);
  const marks=density?bins.map(bin=>{
    const dominant=bin.hues.reduce<{hue:number|null;count:number;proportion:number}|undefined>((a,b)=>!a||b.count>a.count?b:a,undefined);
    const opacity=.15+.85*Math.log1p(bin.count)/Math.log1p(maxBinCount);
    return h('g',{'data-bin-id':bin.id,'data-bin-x':String(bin.x+bin.width/2),'data-bin-y':String(bin.y+bin.height/2)},
      h('title',{},`${bin.count} objects in this cell. Click to zoom; no individual object selected.`),
      h('rect',{x:String(bin.x),y:String(bin.y),width:String(bin.width),height:String(bin.height),class:'zen-math-viewport__bin','data-hue':String(dominant?.hue??0),opacity:String(opacity)}),
    );
  }):visible.map(v=>{
    const r=v.size??4;return h('g',{'data-point-id':v.id,'data-selected':String(p.selectedId===v.id)},
      h('circle',{cx:String(v.px),cy:String(v.py),r:String(Math.max(7/camera.zoom,r+2)),fill:'transparent'}),
      h('circle',{cx:String(v.px),cy:String(v.py),r:String(r),class:'zen-math-viewport__point','data-hue':String(v.hue??0),opacity:String(v.opacity??1)}),
      v.outline?h('rect',{x:String(v.px-r-3),y:String(v.py-r-3),width:String(2*r+6),height:String(2*r+6),class:'zen-math-viewport__outline',style:`stroke: var(--hue-${v.outlineHue??2})`,opacity:String(v.outlineOpacity??1)}):null,
      p.labels&&visible.length<=2500?textNode({as:'text',role:'caption'},{x:String(v.px+r+5),y:String(v.py-r-5),class:'zen-math-viewport__label'},v.label??v.id):null,
    );
  });
  const edges=(p.edges??[]).flatMap(([a,b])=>{const x=byId.get(a),y=byId.get(b);if(!x||!y)return [];const sx=screenPosition(x,camera),sy=screenPosition(y,camera);return [h('line',{x1:String(sx.x),y1:String(sx.y),x2:String(sy.x),y2:String(sy.y),class:'zen-math-viewport__edge'})];});
  return wire(h('svg',{class:'zen-math-viewport',viewBox:'0 0 1000 1000',preserveAspectRatio:'xMidYMid meet',role:'group','aria-label':p.label??'Mathematical plot',tabindex:'0','data-render-mode':density?'density':'points','data-visible-count':String(visible.length)},
    h('title',{},p.label??'Mathematical plot'),
    h('desc',{},'Hover to inspect, click to pin. Drag to pan; scroll to zoom at the pointer. Plus and minus zoom, arrows move selection, Home fits, Escape clears the pin. Density cells summarize multiple objects; click a cell to zoom.'),
    h('g',{},edges),
    h('g',density?{}:{transform:`translate(${camera.x} ${camera.y}) translate(500 500) scale(${camera.zoom}) translate(-500 -500)`},marks),
    selected&&onScreen(selected,camera)?indicator(selected,camera,'selection'):null,
    hovered&&hovered.id!==p.selectedId&&onScreen(hovered,camera)?indicator(hovered,camera,'hover'):null,
  ),{on:{pointerdown:'down',pointermove:'move',pointerup:'up',pointercancel:'cancel',lostpointercapture:'cancel',pointerleave:'leave',wheel:'wheel',keydown:'key'}});
}

type Drag={x:number;y:number;camera:PlotCamera;id:string|null;bin:PlotPosition|null;pointerId:number;moved:boolean};
const drags=new WeakMap<EventTarget,Drag>();
const hoverStates=new WeakMap<EventTarget,{id:string|null;binId:string|null}>();
const liveCameras=new WeakMap<EventTarget,{source:PlotCamera;current:PlotCamera}>();
function liveCamera(target:EventTarget|null,source:PlotCamera):PlotCamera {
  if(!target)return boundedCamera(source);
  const state=liveCameras.get(target);
  if(state?.source===source)return state.current;
  const current=boundedCamera(source);liveCameras.set(target,{source,current});return current;
}
function emitCamera(target:EventTarget|null,p:PlotViewportProps,next:PlotCamera){
  const camera=boundedCamera(next);if(target)liveCameras.set(target,{source:p.camera,current:camera});p.onCameraChange?.(camera);
}
function pointedElement(e:PointerEvent):Element|null{return e.target instanceof Element?e.target:null;}
function hover(target:EventTarget,p:PlotViewportProps,id:string|null,binId:string|null){
  const previous=hoverStates.get(target);
  if(previous?.id===id&&previous?.binId===binId)return;
  hoverStates.set(target,{id,binId});
  if(!previous||previous.id!==id)p.onHover?.(id);
  if(!previous||previous.binId!==binId){const bin=binId?dataFor(p).bins.find(b=>b.id===binId):undefined;p.onBinHover?.(bin?{count:bin.count,minNumericId:bin.minNumericId,maxNumericId:bin.maxNumericId,hues:bin.hues}:null);}
}
function release(svg:SVGSVGElement,id:number){if(svg.hasPointerCapture?.(id))svg.releasePointerCapture(id);}
/** Native Tree listeners are installed on the SVG (not React's passive synthetic wheel listener). */
export function plotViewportHandlers(p:PlotViewportProps):Handlers {
  return {
    down:(e:PointerEvent)=>{
      if(e.button!==0)return;
      const svg=e.currentTarget as SVGSVGElement,element=pointedElement(e),bin=element?.closest('[data-bin-id]');
      svg.focus();svg.setPointerCapture(e.pointerId);
      drags.set(svg,{x:e.clientX,y:e.clientY,camera:{...liveCamera(svg,p.camera)},id:element?.closest('[data-point-id]')?.getAttribute('data-point-id')??null,bin:bin?{x:Number(bin.getAttribute('data-bin-x')),y:Number(bin.getAttribute('data-bin-y'))}:null,pointerId:e.pointerId,moved:false});
    },
    move:(e:PointerEvent)=>{
      const target=e.currentTarget!,drag=drags.get(target);
      if(!drag){const element=pointedElement(e);hover(target,p,element?.closest('[data-point-id]')?.getAttribute('data-point-id')??null,element?.closest('[data-bin-id]')?.getAttribute('data-bin-id')??null);return;}
      if(e.pointerId!==drag.pointerId)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(dx,dy)>4;
      if(drag.moved){hover(target,p,null,null);const rect=(target as SVGSVGElement).getBoundingClientRect(),scale=Math.min(rect.width,rect.height)/1000;if(scale>0)emitCamera(target,p,{...drag.camera,x:drag.camera.x+dx/scale,y:drag.camera.y+dy/scale});}
    },
    up:(e:PointerEvent)=>{
      const target=e.currentTarget!,drag=drags.get(target);if(!drag||e.pointerId!==drag.pointerId)return;
      const moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4;drags.delete(target);release(target as SVGSVGElement,e.pointerId);
      if(!moved){if(drag.id)p.onSelect?.(drag.id);else if(drag.bin)emitCamera(target,p,zoomAt(liveCamera(target,p.camera),liveCamera(target,p.camera).zoom*2,drag.bin));}
    },
    cancel:(e:PointerEvent)=>{const target=e.currentTarget!,drag=drags.get(target);if(drag&&drag.pointerId===e.pointerId){drags.delete(target);release(target as SVGSVGElement,e.pointerId);}hover(target,p,null,null);},
    leave:(e:PointerEvent)=>hover(e.currentTarget!,p,null,null),
    wheel:(e:WheelEvent)=>{
      e.preventDefault();const svg=e.currentTarget as SVGSVGElement,rect=svg.getBoundingClientRect();
      const anchor=clientToPlotCoordinates(e.clientX,e.clientY,rect),current=liveCamera(svg,p.camera);
      hover(svg,p,null,null);emitCamera(svg,p,zoomAt(current,current.zoom*wheelZoomFactor(e.deltaY,e.deltaMode,rect.height),anchor));
    },
    key:(e:KeyboardEvent)=>{
      if(['+','=','-','Home','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
      const current=liveCamera(e.currentTarget,p.camera);
      if(e.key==='Home')emitCamera(e.currentTarget,p,{...current,x:0,y:0,zoom:1});
      else if(['+','=','-'].includes(e.key))emitCamera(e.currentTarget,p,zoomAt(current,current.zoom*(e.key==='-'?.8:1.25)));
      else if(e.key==='Escape')p.onClearSelection?.();
      else if(e.key.startsWith('Arrow')){const i=p.points.findIndex(x=>x.id===p.selectedId),j=clamp(i+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1),0,p.points.length-1);if(p.points[j])p.onSelect?.(p.points[j].id);}
    },
  };
}
