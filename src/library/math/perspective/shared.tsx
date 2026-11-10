import type {ReactNode} from 'react';
import {cube,edges,type Point} from './model/projection';
import type {ProjectionLine} from './components/ProjectionView/ProjectionView';
export function wireCube(center:Point,size:number,hue:1|2|3|4):ProjectionLine[]{const points=cube(center,size);return edges.map(([a,b])=>({a:points[a],b:points[b],hue}));}
export const floorGrid:ProjectionLine[]=Array.from({length:13},(_,i)=>i-6).flatMap(n=>[{a:{x:n,y:-1.4,z:-4},b:{x:n,y:-1.4,z:8}},{a:{x:-6,y:-1.4,z:n+2},b:{x:6,y:-1.4,z:n+2}}]);
export function QuantityControl({label,value,min,max,step=.1,onChange,unit=''}:{label:string;value:number;min:number;max:number;step?:number;onChange(value:number):void;unit?:string}){return <label className="zen-perspective__quantity"><span>{label}<output>{value.toFixed(step<.1?2:1)}{unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
export function Readout({label,children}:{label:string;children:ReactNode}){return <div><small>{label}</small><output aria-label={label}>{children}</output></div>;}
export function Frame({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:ReactNode}){return <section className="zen-perspective"><header className="zen-perspective__header"><small>Math / {eyebrow}</small><h1>{title}</h1><p>{description}</p></header>{children}</section>;}
