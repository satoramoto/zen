import {useEffect,useRef} from 'react';
import {autostereogram} from '../../autostereogram';
import {illusionHeight,type StereoIllusion} from '../../illusions';
import {baseParallax,reliefParallax,type StereoViewer,type StereoLayout} from '../../viewer';
import '../../stereo.css';
export interface StereogramProps {viewer:StereoViewer;layout:StereoLayout;width:number;illusion:StereoIllusion;relief:number;grain?:number;seed?:number;inverted?:boolean}
/** A continuous, repeating random-dot field. The caller owns estimated or measured display scale. */
export function Stereogram({viewer,layout,width,illusion,relief,grain=1.5,seed=1,inverted=false}:StereogramProps){
 const ref=useRef<HTMLCanvasElement>(null),height=Math.min(380,Math.max(210,width*.48));
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const paint=()=>{
   const w=Math.max(8,Math.round(width/grain)),h=Math.max(8,Math.round(height/grain)),scale=w/width;
   const raster=autostereogram(w,h,seed,(x,y)=>{
    const reliefHeight=illusionHeight(illusion,(x-w/2)/(h*.44),(h/2-y)/(h*.44))*(inverted?-1:1);
    return Math.abs(baseParallax(layout)+reliefParallax(viewer,layout,reliefHeight,relief))*viewer.pxPerMm*scale;
   });
   canvas.width=w;canvas.height=h;
   const context=canvas.getContext('2d')!,style=getComputedStyle(canvas),probe=document.createElement('canvas').getContext('2d')!;
   const colors=['--surface-0','--text-2','--hue-4','--hue-1'].map(token=>{probe.clearRect(0,0,1,1);probe.fillStyle=style.getPropertyValue(token);probe.fillRect(0,0,1,1);return probe.getImageData(0,0,1,1).data;});
   const pixels=context.createImageData(w,h);raster.values.forEach((v,i)=>pixels.data.set(colors[v],i*4));context.putImageData(pixels,0,0);
  };
  paint();const observer=new MutationObserver(paint);let node:Element|null=canvas;while(node){observer.observe(node,{attributes:true,attributeFilter:['class','style','data-mode']});node=node.parentElement;}return()=>observer.disconnect();
 },[viewer,layout,width,height,illusion,relief,grain,seed,inverted]);
 return <canvas ref={ref} className="zen-stereogram" role="img" aria-label="Continuous hidden-depth stereogram" style={{width,height}}/>;
}
