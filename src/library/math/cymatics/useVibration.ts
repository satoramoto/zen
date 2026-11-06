import {useEffect,useRef,useState} from 'react';
/** Bounded slow-motion cycle shared by all linked drawings; no automatic playback. */
export function useVibration(){
 const [cycle,setCycle]=useState(0),[playing,setPlaying]=useState(false);const root=useRef<HTMLElement>(null);
 useEffect(()=>{if(!playing)return;let frame=0,last=0;const tick=(now:number)=>{if(!last)last=now;if(now-last>=1000/30){const dt=Math.min((now-last)/1000,.1);last=now;setCycle(c=>Math.min(10,c+dt*.25));}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[playing]);
 useEffect(()=>{if(cycle>=10)setPlaying(false);},[cycle]);
 useEffect(()=>{const visibility=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',visibility);const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)setPlaying(false);});if(root.current)observer.observe(root.current);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);};},[]);
 return {cycle,playing,root,scrub:(value:number)=>{setPlaying(false);setCycle(value);},pause:()=>setPlaying(false),toggle:()=>{if(cycle>=10)setCycle(0);setPlaying(p=>!p);}};
}
