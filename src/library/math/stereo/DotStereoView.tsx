import {useEffect,useRef} from 'react';
import {illusionHeight,stereoRaster,type StereoIllusion} from './illusions';
import {eyeImageShift,type StereoViewer,type StereoLayout} from './viewer';
import './stereo.css';
export interface DotStereoViewProps {viewer:StereoViewer;layout:StereoLayout;illusion:StereoIllusion;relief:number;phase?:number;seed?:number;inverted?:boolean;dotMm?:number;heightAt?(x:number,y:number):number}
function palette(canvas:HTMLCanvasElement){const helper=document.createElement('canvas');helper.width=helper.height=1;const ctx=helper.getContext('2d')!;const style=getComputedStyle(canvas);return [style.backgroundColor,style.color].map(color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];});}
function usePainting(ref:React.RefObject<HTMLCanvasElement|null>,paint:()=>void,deps:unknown[]){
 useEffect(()=>{paint();const observer=new MutationObserver(paint);let node:Element|null=ref.current;while(node){observer.observe(node,{attributes:true,attributeFilter:['class','style','data-mode']});node=node.parentElement;}return ()=>observer.disconnect();},deps);
}
function DotImage({viewer:v,layout:l,illusion,relief,phase=0,seed=1,inverted=false,dotMm=.3,heightAt,eye}:{eye:-1|1}&DotStereoViewProps){
 const ref=useRef<HTMLCanvasElement>(null),cssWidth=l.widthMm*v.pxPerMm;
 usePainting(ref,()=>{const canvas=ref.current;if(!canvas)return;const ratio=Math.min(window.devicePixelRatio||1,2),size=Math.max(24,Math.min(1200,Math.round(cssWidth*ratio))),colors=palette(canvas),ctx=canvas.getContext('2d')!;
  canvas.width=canvas.height=size;
  const raster=stereoRaster(size,size,Math.max(.2,Math.min(1.2,dotMm))*size/l.widthMm,seed,eye,(x,y)=>(inverted?-1:1)*(heightAt?heightAt(x,y):illusionHeight(illusion,x,y,phase)),h=>eyeImageShift({...v,pxPerMm:size/l.widthMm},l,h,relief,eye));
  const pixels=ctx.createImageData(size,size);raster.values.forEach((value,i)=>pixels.data.set(colors[value],i*4));ctx.putImageData(pixels,0,0);
 },[v.pxPerMm,v.distanceMm,v.ipdMm,l.widthMm,l.gapMm,l.mode,illusion,relief,phase,seed,inverted,eye,heightAt,dotMm]);
 return <canvas ref={ref} className="zen-dot-stereo__image" style={{width:cssWidth,height:cssWidth}} aria-label={`${eye===-1?'Left':'Right'} eye random-dot image`} role="img"/>;
}
/** Physical image width and gap are preserved in CSS pixels; a parent must fit the layout before rendering. */
export function DotStereoView(props:DotStereoViewProps){const {viewer:v,layout:l}=props,order:(-1|1)[]=l.mode==='parallel'?[-1,1]:[1,-1];return <div className="zen-dot-stereo" data-viewing={l.mode} data-width-mm={l.widthMm} data-gap-mm={l.gapMm} style={{gap:l.gapMm*v.pxPerMm,width:(2*l.widthMm+l.gapMm)*v.pxPerMm}}>{order.map(eye=><div key={eye} className="zen-dot-stereo__eye" style={{width:l.widthMm*v.pxPerMm}}><span className="zen-dot-stereo__mark" aria-hidden>+</span><DotImage {...props} eye={eye}/><small>{eye===-1?'Left eye':'Right eye'}</small></div>)}</div>;}
/** A single educational image, deliberately separate from the physically sized fusion pair. */
export function ReliefPreview({illusion,phase=0,seed=1,inverted=false,reveal=false}:{illusion:StereoIllusion;phase?:number;seed?:number;inverted?:boolean;reveal?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 usePainting(ref,()=>{const canvas=ref.current;if(!canvas)return;canvas.width=canvas.height=240;const ctx=canvas.getContext('2d')!,colors=palette(canvas),image=ctx.createImageData(240,240),noise=stereoRaster(240,240,3,seed,-1,()=>0,()=>0);
  if(reveal)colors.sort((a,b)=>(.2126*a[0]+.7152*a[1]+.0722*a[2])-(.2126*b[0]+.7152*b[1]+.0722*b[2]));
  for(let y=0;y<240;y++)for(let x=0;x<240;x++){const t=reveal?(.5+(inverted?-1:1)*illusionHeight(illusion,2*(x+.5)/240-1,1-2*(y+.5)/240,phase)*.45):noise.values[y*240+x];for(let k=0;k<3;k++)image.data[(y*240+x)*4+k]=Math.round(colors[0][k]*(1-t)+colors[1][k]*t);image.data[(y*240+x)*4+3]=255;}ctx.putImageData(image,0,0);
 },[illusion,phase,seed,inverted,reveal]);
 return <canvas ref={ref} className="zen-stereo-lab__preview" role="img" aria-label={reveal?'Revealed depth map':'Single-eye noise preview'}/>;
}
