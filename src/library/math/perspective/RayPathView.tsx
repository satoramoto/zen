import {useId} from 'react';
import type {V,Trace,Face} from './model/optics';
import './perspective.css';
export interface RayPathViewProps {label:string;faces:Face[];rays:Trace[];glass?:V[];selected?:number;onSelect?(index:number):void}
/** Finite optical surfaces and event markers; rendering never changes the traced path. */
export function RayPathView({label,faces,rays,glass,selected=-1,onSelect}:RayPathViewProps){
 const id=useId(),chief=rays.at(-1),xs=faces.length?faces.flatMap(f=>[f.a.x,f.b.x]):[-40,0],center=(Math.min(...xs)+Math.max(...xs))/2,
 height=Math.max((Math.max(...xs)-Math.min(...xs)+40)/1.5,2*(Math.abs(chief?.points[0].y??0)+10)),width=height*1.5;
 return <svg className="zen-perspective__bench" role="group" aria-label={label} viewBox={`${center-width/2} ${-height/2} ${width} ${height}`}>
  <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="var(--hue-4)"/></marker><linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="var(--hue-1)" stopOpacity=".04"/><stop offset="1" stopColor="var(--hue-1)" stopOpacity=".25"/></linearGradient></defs>
  {glass&&<polygon points={glass.map(p=>`${p.x},${-p.y}`).join(' ')} fill={`url(#${id}-glass)`}/>}
  {faces.map(face=><line key={face.id} x1={face.a.x} y1={-face.a.y} x2={face.b.x} y2={-face.b.y} stroke={face.bevel?'var(--hue-1)':'var(--border-strong)'} strokeWidth={face.bevel?3:1} vectorEffect="non-scaling-stroke"/>)}
  {rays.map((ray,i)=><polyline key={i} points={ray.points.map(p=>`${p.x},${-p.y}`).join(' ')} fill="none" stroke={i===rays.length-1?'var(--hue-4)':'var(--hue-2)'} strokeWidth={i===rays.length-1?2.5:1} opacity={i===rays.length-1?1:.2} vectorEffect="non-scaling-stroke"/>)}
  {chief&&<><circle cx={chief.points[0].x} cy={-chief.points[0].y} r="2" fill="var(--hue-4)"/><text x={chief.points[0].x+4} y={-chief.points[0].y+1}>eye</text>{chief.points.slice(1).map((p,i)=>{const a=chief.points[i],b={x:a.x+(p.x-a.x)*.55,y:a.y+(p.y-a.y)*.55};return <line key={i} x1={a.x} y1={-a.y} x2={b.x} y2={-b.y} stroke="var(--hue-4)" strokeWidth="1" vectorEffect="non-scaling-stroke" markerEnd={`url(#${id})`}/>;})}</>}
  {chief?.events.map((e,i)=><g key={i} className="zen-perspective__handle" role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={`Inspect event ${i+1}: ${e.kind}`} onClick={()=>onSelect?.(i)} onKeyDown={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();onSelect?.(i);}}}><circle cx={e.point.x} cy={-e.point.y} r="5" fill="var(--hue-4)" opacity={i===selected ? .25 : .04}/><circle cx={e.point.x} cy={-e.point.y} r="1.6" fill={i===selected?'var(--hue-3)':'var(--hue-4)'}/></g>)}
  {chief?.events[selected]&&(()=>{const e=chief.events[selected],n=faces.find(f=>f.id===e.face)!.outward;return <line x1={e.point.x-12*n.x} y1={-e.point.y+12*n.y} x2={e.point.x+12*n.x} y2={-e.point.y-12*n.y} stroke="var(--hue-3)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/>;})()}
 </svg>;
}
