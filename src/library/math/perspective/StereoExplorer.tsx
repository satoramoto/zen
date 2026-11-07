import {useEffect,useState} from 'react';
import {Coordinates,Mafs,Line,Point as MafsPoint} from 'mafs';
import {DragPoint} from '../signals/DragPoint';
import {StereoPair} from './StereoPair';
import {Frame,QuantityControl,Readout,wireCube} from './shared';
import {disparity,type StereoSettings} from './model/stereo';
import type {Point} from './model/projection';
import type {ProjectionLine} from './ProjectionView';
import 'mafs/core.css';
export interface StereoExplorerProps {example?:'depth'|'convergence'|'parallax'}
const defaults:StereoSettings={separation:.65,cameraX:0,convergence:8,focal:3};
const targets:Point[]=[{x:-1.1,y:0,z:4},{x:0,y:0,z:8},{x:1.5,y:0,z:12}];
export function StereoExplorer({example='depth'}:StereoExplorerProps){
 const [s,setS]=useState(defaults),[points,setPoints]=useState(targets),[active,setActive]=useState(0),[crossed,setCrossed]=useState(false),[mode,setMode]=useState(example);
 const load=(key:typeof example)=>{setMode(key);setS({...defaults,separation:key==='parallax'?0:.65});setPoints(targets);setActive(key==='convergence'?1:0);setCrossed(false);};useEffect(()=>load(example),[example]);
 const probe=points[active],setProbe=(point:Point)=>setPoints(previous=>previous.map((p,i)=>i===active?point:p));
 const lines:ProjectionLine[]=points.flatMap((p,i)=>wireCube(p,.8,(i+1) as 1|2|3));
 for(let z=2;z<=14;z+=2)lines.push({a:{x:-3,y:-1,z},b:{x:3,y:-1,z}});
 for(let x=-3;x<=3;x++)lines.push({a:{x,y:-1,z:2},b:{x,y:-1,z:14}});
 const delta=disparity(probe,s);
 return <Frame eyebrow="Perspective / binocular depth" title="One world. Two slightly different stories." description="Move a target in depth and compare where it lands in each eye. The same shared geometry also explains why nearby things slide faster when you move sideways.">
  <nav className="zen-perspective__tabs" aria-label="Stereo experiments">{([['depth','Depth becomes disparity'],['convergence','Choose the zero plane'],['parallax','One eye · motion parallax']] as const).map(([key,label])=><button key={key} aria-pressed={mode===key} onClick={()=>load(key)}>{label}</button>)}<button aria-pressed={crossed} onClick={()=>setCrossed(!crossed)}>Swap for crossed viewing</button></nav>
  <StereoPair settings={s} lines={lines} probe={probe} onProbeChange={setProbe} crossed={crossed}/>
  <div className="zen-perspective__legend"><span style={{color:'var(--hue-1)'}}>01 · near target</span><span style={{color:'var(--hue-2)'}}>02 · middle target</span><span style={{color:'var(--hue-3)'}}>03 · far target</span><span>Wireframes expose alignment; hidden edges remain visible.</span></div>
  <div className="zen-perspective__split"><article className="zen-perspective__card"><header><h2>Look down on the rays</h2><small>sideways → · depth ↑</small></header><Mafs height={300} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-4,4],y:[-1,15],padding:0}}><Coordinates.Cartesian xAxis={{labels:false}} yAxis={{labels:false}}/><Line.Segment point1={[-4,s.convergence]} point2={[4,s.convergence]} color="var(--hue-4)" style="dashed"/>{([-1,1] as const).map(eye=><g key={eye}><Line.Segment point1={[s.cameraX+eye*s.separation/2,0]} point2={[probe.x,probe.z]} color={eye===-1?'var(--hue-1)':'var(--hue-3)'} opacity={.8}/><MafsPoint x={s.cameraX+eye*s.separation/2} y={0} color={eye===-1?'var(--hue-1)':'var(--hue-3)'}/></g>)}<DragPoint label="Move stereo target sideways and in depth" point={[probe.x,probe.z]} constrain={([x,z])=>[Math.max(-3,Math.min(3,x)),Math.max(2,Math.min(14,z))]} onMove={([x,z])=>setProbe({...probe,x,z})} color="var(--hue-4)"/></Mafs><p>The dashed line is the zero-disparity plane. Drag the bright point across it.</p></article><article className="zen-perspective__card"><header><h2>Read the relationship</h2><small>left x − right x</small></header><div className="zen-perspective__tabs" style={{paddingInline:20}}>{['Near','Middle','Far'].map((name,i)=><button key={name} aria-pressed={active===i} onClick={()=>setActive(i)}>{name} target</button>)}</div><div className="zen-perspective__readouts"><Readout label="Image disparity">{delta.toFixed(3)}</Readout><Readout label="Relative to zero plane">{s.separation===0?'No stereo baseline':Math.abs(delta)<.0005?'On the plane':delta>0?'In front':'Behind'}</Readout></div><p>Disparity = f b (1/z − 1/z₀). Separation b gives the eyes different views. Choosing z₀ shifts the two images oppositely; it does not rotate the cameras.</p><p>For motion parallax, set separation to zero and move the viewpoint sideways. Near targets travel farther across the image than far ones.</p></article></div>
  <div className="zen-perspective__controls"><QuantityControl label="Target depth" value={probe.z} min={2} max={14} onChange={z=>setProbe({...probe,z})}/><QuantityControl label="Eye separation" value={s.separation} min={0} max={1.5} step={.01} onChange={separation=>setS({...s,separation})}/><QuantityControl label="Zero-disparity depth" value={s.convergence} min={2} max={14} onChange={convergence=>setS({...s,convergence})}/><QuantityControl label="Viewpoint sideways" value={s.cameraX} min={-2} max={2} step={.05} onChange={cameraX=>setS({...s,cameraX})}/></div>
  <details className="zen-perspective__limits"><summary>Explore without trying to fuse the pictures</summary><p>The diagrams and numerical disparity are sufficient to explore every relationship. Optional parallel or crossed viewing is not physically calibrated and does not guarantee fusion. This model uses parallel pinhole cameras and off-axis image shifts, not toe-in. Target coordinates are schematic world units, not a prescription for eye spacing or a head-mounted display. This wireframe view illustrates projection and disparity, not surface occlusion or a physiological model of depth perception.</p></details>
 </Frame>;
}
