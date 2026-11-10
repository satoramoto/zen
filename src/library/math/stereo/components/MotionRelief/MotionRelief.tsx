import {useEffect,useMemo,useState} from 'react';
import {ProjectionView,type ProjectionLine,type ProjectionDot} from '../../../perspective/components/ProjectionView/ProjectionView';
import {QuantityControl} from '../../../perspective/shared';
import {illusionHeight,noiseValue,type StereoIllusion} from '../../illusions';
/** One large orthographic view: dragging supplies motion parallax, not binocular fusion. */
export function MotionRelief({illusion,phase=0,seed=1,inverted=false,resetKey=0}:{illusion:StereoIllusion;phase?:number;seed?:number;inverted?:boolean;resetKey?:number}){
 const [turn,setTurn]=useState(18),[mesh,setMesh]=useState(false);
 useEffect(()=>setTurn(18),[resetKey]);
 const geometry=useMemo(()=>{
  const point=(i:number,j:number)=>{const x=2*i/60-1,y=2*j/60-1;return {x,y,z:(inverted?-1:1)*illusionHeight(illusion,x,y,phase)*.5};};
  const dots:ProjectionDot[]=[],lines:ProjectionLine[]=[];
  for(let j=0;j<=60;j++)for(let i=0;i<=60;i++){
   if(noiseValue(i,j,seed)%2)dots.push({point:point(i,j),radius:.006});
   if(mesh){if(j%6===0&&i<60)lines.push({a:point(i,j),b:point(i+1,j),hue:4});if(i%6===0&&j<60)lines.push({a:point(i,j),b:point(i,j+1),hue:4});}
  }
  return {dots,lines};
 },[illusion,phase,seed,inverted,mesh]);
 return <div className="zen-motion-relief"><ProjectionView label="Motion depth surface" settings={{eye:8,focal:8,rotation:turn,pitch:-8,depth:0,forced:false}} projection="Orthographic" extent={1.1} dots={geometry.dots} lines={geometry.lines} onRotate={value=>setTurn(Math.max(-60,Math.min(60,value)))}/><div className="zen-motion-relief__tools"><QuantityControl label="Motion viewpoint" value={turn} min={-60} max={60} unit="°" onChange={setTurn}/><button aria-pressed={mesh} onClick={()=>setMesh(!mesh)}>Show guide mesh</button></div><p>Drag left and right, or focus the drawing and use arrow keys. Depth changes the motion of the dots. This is one enlarged view; no eye crossing or fusion is needed.</p></div>;
}
