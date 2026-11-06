import {useEffect,useMemo,useRef,useState} from 'react';
import {Mafs} from 'mafs';
import {DragPoint} from '../signals/DragPoint';
import {displacement,mixWeights,rmsGrid,sampleMode,scatterGrains,settleGrains,type Grain,type ModeShape,type ModeMix,type Pair} from './modes';
import 'mafs/core.css';
import './cymatics.css';
export type CymaticPaint='grains'|'displacement'|'rms';
export interface CymaticFieldProps {shape:ModeShape;mix:ModeMix;cycle:number;playing?:boolean;paint?:CymaticPaint;scatterKey?:number;probe?:Pair;onProbe?:(point:[number,number])=>void}
/** Top-down mode field with cycle-averaged nodal paint and illustrative grain settling. */
export function CymaticField({shape,mix,cycle,playing=false,paint='grains',scatterKey=0,probe,onProbe}:CymaticFieldProps){
 const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),swatches=useRef<HTMLDivElement>(null),grains=useRef<Grain[]>([]),previous=useRef(cycle);const [size,setSize]=useState(400),[palette,setPalette]=useState<number[][]>([]);
 const grid=useMemo(()=>sampleMode(shape,129),[shape.kind,shape.m,shape.n]);const values=useMemo(()=>rmsGrid(grid,shape,mix),[grid,shape,mix]);
 useEffect(()=>{const observer=new ResizeObserver(([e])=>setSize(e.contentRect.width));observer.observe(host.current!);return()=>observer.disconnect();},[]);
 useEffect(()=>{const context=document.createElement('canvas').getContext('2d')!;const sync=()=>setPalette([...swatches.current!.children].map(e=>{context.fillStyle=getComputedStyle(e).color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].slice(0,3);}));sync();const observer=new MutationObserver(sync);for(let node:HTMLElement|null=host.current;node;node=node.parentElement)observer.observe(node,{attributes:true,attributeFilter:['style','class','data-mode','data-theme']});return()=>observer.disconnect();},[]);
 useEffect(()=>{grains.current=scatterGrains(shape.kind,1600,scatterKey+1);if(scatterKey===0)for(let i=0;i<90;i++)settleGrains(grains.current,values,grid.size,shape.kind,1/60);},[shape.kind,shape.m,shape.n,mix.mix,mix.phase,scatterKey]);
 useEffect(()=>{
  if(!palette.length)return;const context=canvas.current!.getContext('2d')!,resolution=512,margin=resolution*.025,span=resolution-2*margin;
  const delta=Math.max(0,Math.min(.1,(cycle-previous.current)*4));previous.current=cycle;if(playing&&paint==='grains')settleGrains(grains.current,values,grid.size,shape.kind,delta);
  const css=(p:number[])=>`rgb(${p.join(' ')})`,blend=(a:number[],b:number[],t:number)=>a.map((v,i)=>v+(b[i]-v)*t);
  context.fillStyle=css(palette[0]);context.fillRect(0,0,resolution,resolution);
  const tile=document.createElement('canvas');tile.width=tile.height=grid.size;const ctx=tile.getContext('2d')!,image=ctx.createImageData(grid.size,grid.size),weights=mixWeights(shape,mix.mix);
  grid.basis.forEach((pair,i)=>{let color=palette[0];if(pair){if(paint==='displacement'){const h=displacement(pair,weights,mix.phase,cycle);color=blend(palette[0],h<0?palette[3]:palette[1],Math.min(1,Math.abs(h)));}else if(paint==='rms')color=blend(palette[0],palette[1],Math.min(1,values[i]/Math.SQRT1_2));else color=blend(palette[0],palette[2],.22*Math.exp(-((values[i]/.025)**2)));}color.forEach((c,j)=>image.data[i*4+j]=Math.round(c));image.data[i*4+3]=255;});ctx.putImageData(image,0,0);context.drawImage(tile,margin,margin,span,span);
  context.strokeStyle=css(palette[4]);context.lineWidth=1;context.beginPath();if(shape.kind==='drum')context.arc(resolution/2,resolution/2,span/2,0,2*Math.PI);else context.rect(margin,margin,span,span);context.stroke();
  if(paint==='grains'){context.fillStyle=css(palette[2]);for(const p of grains.current){context.beginPath();context.arc(margin+(p.x+1)/2*span,margin+(1-p.y)/2*span,.9,0,Math.PI*2);context.fill();}}
 },[grid,values,shape,mix,cycle,playing,paint,scatterKey,palette]);
 return <div className="zen-cymatics__field" ref={host}><canvas ref={canvas} width="512" height="512" aria-label={`${paint==='grains'?'Illustrative grains near low-motion regions':paint==='rms'?'Cycle-averaged displacement magnitude':'Instantaneous signed displacement'} of ${shape.kind}`} data-paint={paint}/>{probe&&onProbe&&<Mafs height={size} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-1/.95,1/.95],y:[-1/.95,1/.95],padding:0}}><DragPoint label="Inspect vibration at a point" point={[...probe]} color="var(--hue-3)" constrain={([x,y])=>{if(shape.kind==='drum'){const r=Math.max(1,Math.hypot(x,y));return [x/r,y/r];}return [Math.max(-1,Math.min(1,x)),Math.max(-1,Math.min(1,y))];}} onMove={onProbe}/></Mafs>}<div ref={swatches} className="zen-cymatics__swatches" aria-hidden="true">{['--surface-1','--hue-1','--hue-2','--hue-3','--border-strong'].map(v=><i key={v} style={{color:`var(${v})`}}/>)}</div></div>;
}
