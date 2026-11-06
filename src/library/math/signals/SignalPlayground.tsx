import { useEffect, useId, useRef, useState } from 'react';
import { Coordinates, Line, Mafs, Plot, Text } from 'mafs';
import { DragPoint } from './DragPoint';
import { CrossSection } from './CrossSection';
import { scalarLimit, type SectionAxis, type SurfaceColorMode } from './analysis';
import { SignalSurface, type SignalCamera } from './SignalSurface';
import { boundedParameter, initialSignal, isManifold, signalExamples, signalSpec, type SignalKind, type SignalSpec, type SignalState } from './signals';
import 'mafs/core.css';
import './SignalPlayground.css';

export interface SignalPlaygroundProps { example?: SignalKind }
/** A collection of relationship-first scenes; only the selected GPU scene is mounted. */
export function SignalPlayground({example='interference'}:SignalPlaygroundProps){
  const [selected,setSelected]=useState(example);
  useEffect(()=>setSelected(example),[example]);
  return <section className="zen-signals" aria-label="Signal playground">
    <div className="zen-signals__masthead"><span>Math playground / Signals & spaces</span><span>10 explorable relationships</span></div>
    <nav className="zen-signals__catalog" aria-label="Signal examples">{signalExamples.map((spec,i)=><button key={spec.id} aria-pressed={selected===spec.id} onClick={()=>setSelected(spec.id)}><small>{String(i+1).padStart(2,'0')}</small>{spec.category}</button>)}</nav>
    <SignalScene key={selected} kind={selected}/>
  </section>;
}
function ParameterPad({spec,state,change}:{spec:SignalSpec;state:SignalState;change:(next:Partial<SignalState>)=>void}){
  const norm=(value:number,p:SignalSpec['a'])=>2*(value-p.min)/(p.max-p.min)-1;
  return <div className="zen-signals__pad">
    <Mafs height={200} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-1.3,1.3],y:[-1.25,1.25],padding:0}}>
      <Coordinates.Cartesian xAxis={{lines:false,labels:false}} yAxis={{lines:false,labels:false}}/>
      <Line.Segment point1={[-1,norm(state.b,spec.b)]} point2={[1,norm(state.b,spec.b)]} color="var(--hue-2)" opacity={.25} style="dashed"/>
      <Line.Segment point1={[norm(state.a,spec.a),-1]} point2={[norm(state.a,spec.a),1]} color="var(--hue-2)" opacity={.25} style="dashed"/>
      <Text x={.95} y={-.2} size={11} color="var(--text-3)">a →</Text><Text x={.17} y={1.05} size={11} color="var(--text-3)">b ↑</Text>
      <DragPoint label={`Explore ${spec.a.label} horizontally and ${spec.b.label} vertically`} point={[norm(state.a,spec.a),norm(state.b,spec.b)]} color="var(--hue-2)" constrain={([x,y])=>[Math.max(-1,Math.min(1,x)),Math.max(-1,Math.min(1,y))]} onMove={([x,y])=>change({a:boundedParameter(spec.a,spec.a.min+(x+1)/2*(spec.a.max-spec.a.min)),b:boundedParameter(spec.b,spec.b.min+(y+1)/2*(spec.b.max-spec.b.min))})}/>
    </Mafs>
  </div>;
}
function SignalScene({kind}:{kind:SignalKind}){
  const animated=kind!=='torus4';
  const spec=signalSpec(kind),manifold=isManifold(kind),extent=manifold?Math.PI:4;
  const [state,setState]=useState(()=>initialSignal(kind));
  const [axis,setAxis]=useState<SectionAxis>('u'),[probe,setProbe]=useState(0),[colorMode,setColorMode]=useState<SurfaceColorMode>('solid');
  const [playing,setPlaying]=useState(false),[camera,setCamera]=useState<SignalCamera>('perspective'),[resetKey,setResetKey]=useState(0);
  const [notice,setNotice]=useState(spec.notice),[pinned,setPinned]=useState<SignalState|null>(null);
  const root=useRef<HTMLDivElement>(null);const titleId=useId();
  const change=(next:Partial<SignalState>)=>{setPlaying(false);setState(previous=>({...previous,...next}));};
  useEffect(()=>{
    if(!playing)return;let frame=0,last:number|null=null;
    const tick=(now:number)=>{if(last!==null){const delta=Math.min((now-last)/1000,.05);setState(s=>({...s,time:Math.min(20,s.time+delta)}));}last=now;frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[playing]);
  useEffect(()=>{if(state.time>=20)setPlaying(false);},[state.time]);
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)setPlaying(false);});if(root.current)observer.observe(root.current);
    return()=>{document.removeEventListener('visibilitychange',visibility);observer.disconnect();};
  },[]);
  const format=(value:number)=>Math.abs(value)<.0005?'0.00':value.toFixed(2);
  return <div ref={root} className="zen-signals__scene" data-example={kind} data-playing={playing} aria-labelledby={titleId}>
    <header className="zen-signals__header"><div><p>{spec.category}</p><h1 id={titleId}>{spec.title}</h1><span>{spec.subtitle}</span></div><div className="zen-signals__dimension">{kind==='torus4'?'2D manifold · 4D embedding · 3D projection':manifold?'2D manifold · 3D embedding':'2D spatial field · height as amplitude'}</div></header>
    <div className="zen-signals__workspace">
      <div className="zen-signals__visuals">
        <div className="zen-signals__surface-wrap">
          <div className="zen-signals__surface-heading"><span>{manifold?'Explore the geometry':'Explore the field'} <small>drag to orbit · scroll to zoom</small></span><div role="group" aria-label="Camera view">{(['perspective','top','front'] as const).map(view=><button key={view} aria-pressed={camera===view} onClick={()=>setCamera(view)}>{view}</button>)}<button aria-label="Reset 3D view" onClick={()=>{setCamera('perspective');setResetKey(n=>n+1);}}>↺</button></div></div>
          <div className="zen-signals__color-tools"><div className="zen-signals__segmented" role="group" aria-label="Surface color">{(['solid','signed','magnitude'] as const).map(mode=><button key={mode} aria-pressed={colorMode===mode} onClick={()=>setColorMode(mode)}>{mode==='solid'?'Solid':mode==='signed'?'Signed value':'Magnitude'}</button>)}</div>{colorMode!=='solid'&&<div className="zen-signals__color-key"><span>{kind==='sphere'?'Radial displacement':manifold?'Displayed height':'Amplitude'}{colorMode==='magnitude'?' · absolute value':''}</span><div className="zen-signals__color-ramp" data-mode={colorMode}/><div className="zen-signals__color-labels"><span>{colorMode==='signed'?(-scalarLimit(kind)).toFixed(2):'0'}</span>{colorMode==='signed'&&<span>0</span>}<span>{scalarLimit(kind).toFixed(2)}</span></div></div>}</div>
          <SignalSurface kind={kind} state={state} camera={camera} axis={axis} probe={probe} colorMode={colorMode} resetKey={resetKey}/>
          <div className="zen-signals__legend"><span>Surface</span><span>Section & probe</span>{kind==='torus'&&<span>Phase orbit · last 4π of time</span>}{kind==='interference'&&<span>Source positions</span>}</div>
        </div>
        <CrossSection kind={kind} state={state} axis={axis} probe={probe} pinned={pinned} onAxis={next=>{setAxis(next);setPinned(null);}} onProbe={setProbe} onSlice={slice=>change({slice})}/>
        {kind==='torus'&&<div className="zen-signals__section"><header>Two oscillators, one phase orbit</header><Mafs height={150} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-extent,extent],y:[-1.2,1.2],padding:.2}}><Coordinates.Cartesian/><Plot.OfX y={x=>Math.sin(x+state.time)} color="var(--hue-1)"/><Plot.OfX y={x=>Math.sin(state.a*(x+state.time)+state.b)} color="var(--hue-3)"/></Mafs><p>First: sin(t + offset). Second: sin(ρ(t + offset) + φ). Their phase pair determines the orbit point; these histories are separate from the geometric section above.</p></div>}
      </div>
      <aside className="zen-signals__aside" aria-label="Explore the relationship">
        <h2>Pull on the relationship.</h2><p className="zen-signals__pad-hint">Drag the point. Two quantities change together.</p>
        <ParameterPad spec={spec} state={state} change={change}/>
        <div className="zen-signals__readouts"><span><small>a · {spec.a.label}</small><output aria-label={spec.a.label}>{format(state.a)} <i>{spec.a.unit}</i></output></span><span><small>b · {spec.b.label}</small><output aria-label={spec.b.label}>{format(state.b)} <i>{spec.b.unit}</i></output></span></div>
        <details className="zen-signals__fine"><summary>Fine adjustments</summary>{(['a','b'] as const).map(key=><label key={key}>{spec[key].label}<input type="range" aria-label={`Adjust ${spec[key].label}`} min={spec[key].min} max={spec[key].max} step={spec[key].step} value={state[key]} onChange={e=>change({[key]:boundedParameter(spec[key],Number(e.target.value))})}/></label>)}</details>
        <div className="zen-signals__notice"><small>What to notice</small><p>{notice}</p></div>
        <div className="zen-signals__experiments" role="group" aria-label="Try an experiment">{spec.experiments.map(experiment=><button key={experiment.label} onClick={()=>{change({a:experiment.a,b:experiment.b,time:0});setNotice(experiment.notice);}}><span>{experiment.label}</span><span aria-hidden="true">↗</span></button>)}</div>
      </aside>
    </div>
    <div className="zen-signals__transport">{animated ? <><button className="zen-signals__play" aria-label={playing?'Pause signal':'Play signal'} onClick={()=>{if(state.time>=20)setState(s=>({...s,time:0}));setPlaying(p=>!p);}}>{playing?'Ⅱ Pause':'▶ Play'}</button><label>Time<input aria-label="Signal time" type="range" min="0" max="20" step="0.01" value={state.time} onChange={e=>change({time:Number(e.target.value)})}/><output>{format(state.time)}</output></label></> : <p className="zen-signals__static-hint">Drag the pad to rotate in 4D. Drag the surface to rotate its 3D projection.</p>}<button aria-pressed={!!pinned} onClick={()=>setPinned(p=>p?null:{...state})}>{pinned?'Unpin 2D comparison':'Pin 2D comparison'}</button><button onClick={()=>{change(initialSignal(kind));setNotice(spec.notice);setPinned(null);setAxis('u');setProbe(0);setColorMode('solid');setCamera('perspective');setResetKey(n=>n+1);}}>Reset scene</button></div>
    <div className="zen-signals__equation"><span>The relationship</span><code>{spec.equation}</code></div>
    <details className="zen-signals__limits"><summary>Model & interpretation</summary><p>{spec.limits}</p><p>{animated ? 'Playback starts paused and stops at t = 20. Time is dimensionless.' : 'This geometry is static in time. The two pad quantities rotate it in 4D.'} Camera movement changes the view, not the mathematical state. A pinned comparison freezes only the 2D section trace. Changing section direction clears the comparison. Color encodes amplitude for fields, radial displacement for the sphere, and displayed height for the tori; magnitude is absolute value, not energy. Each color scale stays fixed across time and parameters.</p></details>
  </div>;
}
