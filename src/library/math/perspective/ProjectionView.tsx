import {useRef,type PointerEvent} from 'react';
import {camera,clipSegment,clipPolygon,imagePoint,imageToCamera,unCamera,type Point,type Settings,type Projection} from './model/projection';
import './perspective.css';
export interface ProjectionLine {a:Point;b:Point;hue?:1|2|3|4;dashed?:boolean;faint?:boolean}
export interface ProjectionFace {points:Point[];hue?:1|2|3|4}
export interface ProjectionViewProps {
 label:string; lines:ProjectionLine[]; faces?:ProjectionFace[]; settings:Settings; projection?:Projection; probe?:Point;
 onProbeChange?(point:Point):void; onRotate?(degrees:number):void;
 /** Image-plane half-height; the drawing has a 3:2 aspect ratio. */
 extent?:number;
 /** Off-axis image shift, used for parallel stereo cameras. */
 imageOffset?:{x:number;y:number};
}
/** Theme-colored, near-clipped wire geometry with an invertible image-plane probe. */
export function ProjectionView({label,lines,faces=[],settings,projection='Perspective',probe,onProbeChange,onRotate,extent=1.4,imageOffset={x:0,y:0}}:ProjectionViewProps){
 const svg=useRef<SVGSVGElement>(null),drag=useRef<{kind:'probe'|'orbit';x:number;rotation:number}|null>(null);
 const projected=(p:Point)=>{const q=imagePoint(p,settings.focal,projection);return q?{x:q.x+imageOffset.x,y:q.y+imageOffset.y}:null;};
 const q=probe?projected(camera(probe,settings)):null;
 const change=(x:number,y:number)=>{if(!probe||!onProbeChange)return;const z=camera(probe,settings).z;const next=unCamera(imageToCamera({x:Math.max(-extent*1.5,Math.min(extent*1.5,x))-imageOffset.x,y:Math.max(-extent,Math.min(extent,y))-imageOffset.y},z,settings.focal,projection),settings);onProbeChange(next);};
 const start=(event:PointerEvent,kind:'probe'|'orbit')=>{if(event.button!==0)return;event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drag.current={kind,x:event.clientX,rotation:settings.rotation};};
 return <svg ref={svg} className="zen-perspective__projection" viewBox={`${-extent*1.5} ${-extent} ${extent*3} ${extent*2}`} role="group" aria-label={label} tabIndex={onRotate?0:undefined} aria-description={onRotate?'Drag the background or focus this frame and use left/right arrows to turn the scene.':undefined} onKeyDown={e=>{if(e.target!==e.currentTarget||!onRotate)return;const direction=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(direction){e.preventDefault();onRotate(Math.max(-75,Math.min(75,settings.rotation+direction*2)));}}}
  onPointerDown={e=>{if(onRotate)start(e,'orbit');}} onPointerMove={e=>{const d=drag.current;if(!d)return;if(d.kind==='orbit'){onRotate?.(Math.max(-75,Math.min(75,d.rotation+(e.clientX-d.x)*.35)));return;}const matrix=svg.current?.getScreenCTM();if(matrix){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());change(p.x,-p.y);}}}
  onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>

  <path d={`M${-extent*1.5} 0H${extent*1.5}M0 ${-extent}V${extent}`} className="zen-perspective__axis"/>
  {faces.map(face=>({...face,points:clipPolygon(face.points.map(p=>camera(p,settings)))})).filter(face=>face.points.length>2).sort((a,b)=>b.points.reduce((n,p)=>n+p.z,0)/b.points.length-a.points.reduce((n,p)=>n+p.z,0)/a.points.length).map((face,i)=><polygon key={i} points={face.points.map(p=>projected(p)).filter(p=>p!==null).map(p=>`${p.x},${-p.y}`).join(' ')} fill={`var(--hue-${face.hue??1})`} opacity=".07"/>)}
  {lines.map((line,i)=>{const clipped=clipSegment(camera(line.a,settings),camera(line.b,settings));if(!clipped)return null;const a=projected(clipped[0]),b=projected(clipped[1]);return a&&b?<line key={i} fill="none" x1={a.x} y1={-a.y} x2={b.x} y2={-b.y} stroke={line.hue?`var(--hue-${line.hue})`:'var(--border-strong)'} strokeWidth={line.hue?1.8:1} vectorEffect="non-scaling-stroke" strokeDasharray={line.dashed?'5 5':undefined} opacity={line.faint ? .25 : line.hue ? .9 : .4}/> : null;})}
  {q&&<g transform={`translate(${q.x} ${-q.y})`} role={onProbeChange?'button':undefined} tabIndex={onProbeChange?0:undefined} aria-label={`Move probe in ${label}`} aria-description="Drag or use arrow keys. The camera-space depth stays fixed." className="zen-perspective__handle" onPointerDown={e=>{if(onProbeChange)start(e,'probe');}} onKeyDown={e=>{const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0;if(dx||dy){e.preventDefault();change(q.x+dx*.04,q.y+dy*.04);}}}>
   <circle r={extent*.09} fill="var(--hue-4)" opacity=".12"/><circle r={extent*.025} fill="var(--hue-4)" stroke="var(--surface-0)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
  </g>}
 </svg>;
}
