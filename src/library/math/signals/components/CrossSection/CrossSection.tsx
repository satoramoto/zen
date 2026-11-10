import { Coordinates, Line, Mafs, Plot } from 'mafs';
import { DragPoint } from '../DragPoint/DragPoint';
import { isManifold, type SignalKind, type SignalState } from '../../signals';
import { scalarLimit, sectionExtent, sectionStats, sectionValue, type SectionAxis } from '../../analysis';

export function CrossSection({kind,state,axis,probe,pinned,onAxis,onProbe,onSlice}:{kind:SignalKind;state:SignalState;axis:SectionAxis;probe:number;pinned:SignalState|null;onAxis:(axis:SectionAxis)=>void;onProbe:(value:number)=>void;onSlice:(value:number)=>void}) {
  const extent=sectionExtent(kind),limit=scalarLimit(kind),manifold=isManifold(kind);
  const names=manifold?['u','v']:['x','z'],moving=axis==='u'?names[0]:names[1],fixed=axis==='u'?names[1]:names[0];
  const value=(x:number)=>sectionValue(kind,axis,x,state),stats=sectionStats(kind,axis,state);
  const clamp=(x:number)=>Math.max(-extent,Math.min(extent,x));
  return <div className="zen-signals__section" aria-label="Cross-sectional analysis">
    <header><span>Cut through the relationship</span><div className="zen-signals__segmented" role="group" aria-label="Section direction">{(['u','v'] as const).map((a,i)=><button key={a} aria-pressed={axis===a} onClick={()=>onAxis(a)}>Along {names[i]}</button>)}</div></header>
    <div className="zen-signals__section-controls"><label>Fixed {fixed}<input aria-label="Section position" type="range" min={-extent} max={extent} step=".01" value={state.slice} onChange={e=>onSlice(Number(e.target.value))}/><output>{state.slice.toFixed(2)}</output></label><label>Probe {moving}<input aria-label="Probe position" type="range" min={-extent} max={extent} step=".01" value={probe} onChange={e=>onProbe(Number(e.target.value))}/><output>{probe.toFixed(2)}</output></label></div>
    <div className="zen-signals__section-grid">
      <div className="zen-signals__locator"><Mafs height={190} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-extent,extent],y:[-extent,extent],padding:.3}}>
        <Coordinates.Cartesian xAxis={{lines:false,labels:false}} yAxis={{lines:false,labels:false}}/>
        <Line.Segment point1={axis==='u'?[-extent,state.slice]:[state.slice,-extent]} point2={axis==='u'?[extent,state.slice]:[state.slice,extent]} color="var(--hue-2)"/>
        <DragPoint label="Move section and probe" point={axis==='u'?[probe,state.slice]:[state.slice,probe]} color="var(--hue-2)" constrain={([u,v])=>[clamp(u),clamp(v)]} onMove={([u,v])=>{onSlice(axis==='u'?v:u);onProbe(axis==='u'?u:v);}}/>
      </Mafs><p>Drag to move the cut and probe.<br/>{names[0]} → · {names[1]} ↑ {manifold?'· parameter map':'· plan view'}</p></div>
      <div className="zen-signals__trace"><Mafs height={190} pan={false} zoom={false} preserveAspectRatio={false} viewBox={{x:[-extent,extent],y:[-limit,limit],padding:.2}}>
        <Coordinates.Cartesian xAxis={{lines:1,labels:n=>Number.isInteger(n)?n:''}} yAxis={{lines:limit<1?.25:1,labels:n=>Number(n.toFixed(2))}}/>
        {pinned&&<Plot.OfX y={x=>sectionValue(kind,axis,x,pinned)} color="var(--text-3)" style="dashed" opacity={.6} domain={[-extent,extent]}/>}
        <Plot.OfX y={value} color="var(--hue-2)" domain={[-extent,extent]} minSamplingDepth={9} maxSamplingDepth={14}/>
        <Line.Segment point1={[probe,-limit]} point2={[probe,limit]} color="var(--hue-2)" opacity={.3} style="dashed"/>
        <DragPoint label="Probe the section trace" point={[probe,value(probe)]} color="var(--hue-2)" constrain={([x])=>[clamp(x),value(clamp(x))]} onMove={([x])=>onProbe(x)}/>
      </Mafs><p>Horizontal: {moving}{manifold?' (radians)':''}. Vertical: {kind==='sphere'?'radial displacement r − 1':manifold?'displayed 3D height':'amplitude'}. {manifold?'This follows a parameter curve, not a planar intersection.':'The translucent plane marks this cut in 3D.'}</p></div>
    </div>
    <div className="zen-signals__stats" aria-label="Section measurements">{[['At probe',value(probe)],['Minimum',stats.min],['Maximum',stats.max],['RMS',stats.rms]].map(([label,n])=><span key={label}><small>{label}</small><output aria-label={String(label)}>{Number(n).toFixed(3)}</output></span>)}</div>
    <p>Min, max and RMS estimated from 513 evenly spaced samples of this visible section. {pinned&&`Dashed: frozen section at ${fixed} = ${pinned.slice.toFixed(2)}, t = ${pinned.time.toFixed(2)}.`}</p>
  </div>;
}
