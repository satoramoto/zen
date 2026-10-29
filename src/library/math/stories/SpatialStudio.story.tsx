import { useMemo, useState, useRef, useEffect, type ReactNode } from 'react';
import { ActionButton, Checkbox, Disclosure, Group, Region, Screen, Select, Slider, Text } from '../../index';
import { ButtonFace } from '../../components/core/ActionButton/ActionButton';
import { DistributionPlot } from '../view/DistributionPlot';
import { MathInspector } from '../view/MathInspector';
import { ExpressionField } from '../view/ExpressionField';
import { PlotViewport, type PlotPoint } from '../view/PlotViewport/PlotViewport';
import { defaultExperiment, createIntegerPoints, integerProperties, evaluatePredicate, validateDomain, serializeExperiment, parseExperiment, type StudioExperiment, type MathLayer, type ExperimentSnapshot, type Predicate, validateExperiment, describePredicate, parsePredicate } from '../model';
import './SpatialStudio.css';
const layouts=['grid','snake','line','ulam','volume'] as const;
const names=['Grid','Alternating rows','Number line','Ulam spiral','Volume'];
const param=(name:string,min:number,max:number,value:number)=>({name,kind:'int' as const,min,max,defaultValue:value,steps:max-min+1});
const predicateText=describePredicate;
function simplePredicate(t:string):Predicate|null {try{return parsePredicate(t);}catch{return null;}}
/** App-level progressive disclosure composed from Zen controls. */
function Section({title,children,initial=false}:{title:string;children:ReactNode;initial?:boolean}) {
 const [open,setOpen]=useState(initial);
 return <Group name={title} label={false} direction="column" gap={3}>
  <div className="zen-studio-section-heading"><Text weight="strong">{title}</Text><Disclosure aria-label={title} expanded={open} onChange={setOpen}/></div>
  {open&&children}
 </Group>;
}
/** Application-specific acceptance fixture. Generic mathematical views remain independently exported. */
export function SpatialStudio({initialLayout='grid',initialCount=400}:{initialLayout?:typeof layouts[number];initialCount?:number}){
 const [experiment,setExperiment]=useState<StudioExperiment>(()=>({...defaultExperiment(),relations:'divisors',domain:{start:1,end:initialCount,step:1},placement:{...defaultExperiment().placement,kind:initialLayout,width:initialCount>400?Math.ceil(Math.sqrt(initialCount)):20}}));
 const [history,setHistory]=useState<StudioExperiment[]>([]),[future,setFuture]=useState<StudioExperiment[]>([]);
 const [snapshots,setSnapshots]=useState<ExperimentSnapshot[]>([]),[message,setMessage]=useState('Local exact arithmetic · no Sage connection');
 const [range,setRange]=useState({start:'1',end:String(initialCount),step:'1'}),[rangeError,setRangeError]=useState(''),[jump,setJump]=useState('36'),[jumpError,setJumpError]=useState('');
 const [expression,setExpression]=useState('n % 7 == 1'),[expressionError,setExpressionError]=useState(''),[combine,setCombine]=useState(0),[left,setLeft]=useState(0),[right,setRight]=useState(1);
 const [record,setRecord]=useState(false),[panel,setPanel]=useState('layers'),[viewsOpen,setViewsOpen]=useState(false),[openLayer,setOpenLayer]=useState<string|null>(null);
 const [hoveredId,setHoveredId]=useState<string|null>(null);
 const [binPreview,setBinPreview]=useState<{count:number;minNumericId?:string;maxNumericId?:string;hues:readonly {hue:number|null;count:number;proportion:number}[]}|null>(null);
 const [distributionLayer,setDistributionLayer]=useState(0);
 const {labels,sizeByDivisors,onlyMatches,renderMode='auto'}=experiment.view??{labels:false,sizeByDivisors:false,onlyMatches:false};
 useEffect(()=>{setJump(experiment.selectedId??'');setJumpError('');},[experiment.selectedId]);
 const upload=useRef<HTMLInputElement>(null);
 const update=(next:StudioExperiment,undo=true)=>{if(undo){setHistory(h=>[...h.slice(-49),experiment]);setFuture([]);}setExperiment(next);};
 const patch=(part:Partial<StudioExperiment>,undo=true)=>update({...experiment,...part},undo);
 const points=useMemo(()=>createIntegerPoints(experiment.domain,experiment.placement),[experiment.domain,experiment.placement]);
 const memberships=useMemo(()=>points.map(p=>experiment.layers.map(l=>evaluatePredicate(p.n,l.predicate))),[points,experiment.layers]);
 const visible=useMemo(()=>points.flatMap((p,i)=>{if(experiment.placement.kind==='volume'&&experiment.slice!==null&&p.z!==experiment.slice)return [];const layers=experiment.layers.filter((l,j)=>l.visible&&memberships[i][j]);if(onlyMatches&&!layers.length)return [];const filled=layers.filter(l=>l.channel==='fill').at(-1);return [{...p,label:p.id,hue:filled?.hue,outline:layers.some(l=>l.channel==='outline'),outlineHue:layers.filter(l=>l.channel==='outline').at(-1)?.hue,outlineOpacity:layers.filter(l=>l.channel==='outline').at(-1)?.opacity,opacity:filled?.opacity??.6,size:sizeByDivisors?Math.min(9,2+integerProperties(p.n).divisors.length*.3):4} satisfies PlotPoint];}),[points,memberships,experiment.layers,experiment.slice,experiment.placement.kind,onlyMatches,sizeByDivisors]);
 const pointsById=useMemo(()=>new Map(points.map(p=>[p.id,p])),[points]);
 const selected=experiment.selectedId?pointsById.get(experiment.selectedId):undefined;
 const inspected=(hoveredId?pointsById.get(hoveredId):undefined)??selected;
 const props=useMemo(()=>inspected?integerProperties(inspected.n):null,[inspected]);
 const layerCounts=useMemo(()=>experiment.layers.map((_,i)=>memberships.reduce((sum,m)=>sum+Number(m[i]),0)),[memberships,experiment.layers]);
 const activeDistributionLayer=experiment.layers[Math.min(distributionLayer,experiment.layers.length-1)];
 const distributionBins=useMemo(()=>{
  const count=Math.min(32,points.length), bins=Array.from({length:count},(_,i)=>({id:String(i),label:'',count:0,total:0,start:0,end:0}));
  for(let i=0;i<points.length;i++){
   const b=bins[Math.min(count-1,Math.floor(i*count/points.length))];
   if(!b.total)b.start=points[i].n;b.end=points[i].n;b.total++;
   if(memberships[i][Math.min(distributionLayer,experiment.layers.length-1)])b.count++;
  }
  return bins.map(b=>({...b,label:`${b.start.toLocaleString()}–${b.end.toLocaleString()}`}));
 },[points,memberships,distributionLayer,experiment.layers.length]);
 const plotCamera=useMemo(()=>({zoom:experiment.camera.zoom,x:experiment.camera.panX,y:experiment.camera.panY,rotation:experiment.camera.yaw}),[experiment.camera]);

 const related=useMemo(()=>inspected&&experiment.relations!=='none'?visible.filter(p=>p.id!==inspected.id&&(experiment.relations==='divisors'?inspected.n%Number(p.id)===0:Number(p.id)%inspected.n===0)):[],[visible,inspected,experiment.relations]);
 const edges=useMemo<[string,string][]>(()=>inspected?related.slice(0,500).map(p=>[inspected.id,p.id]):[],[related,inspected]);
 const clearPin=()=>{patch({selectedId:null},false);setJump('');};

 const setLayer=(id:string,part:Partial<MathLayer>)=>patch({layers:experiment.layers.map(l=>l.id===id?{...l,...part}:l)});
 const select=(id:string)=>{setHoveredId(null);setBinPreview(null);patch({selectedId:id},false);setJump(id);setJumpError('');};
 const restore=(e:StudioExperiment)=>{setHoveredId(null);setBinPreview(null);update(e);setRange({start:String(e.domain.start),end:String(e.domain.end),step:String(e.domain.step)});setJump(e.selectedId??'');setRangeError('');};
 const fit=()=>patch({camera:{...experiment.camera,zoom:1,panX:0,panY:0}},false);
 const addLayer=(predicate:Predicate,label:string)=>{if(experiment.layers.length>=8){setExpressionError('Keep at most eight layers in this edition.');return;}const candidate:StudioExperiment={...experiment,layers:[...experiment.layers,{id:crypto.randomUUID(),label:label.slice(0,160),predicate,visible:true,hue:((experiment.layers.length%4)+1) as 1|2|3|4,opacity:1,channel:'fill'}]};const error=validateExperiment(candidate);if(error){setExpressionError('This combination is too deeply nested. Use simpler operands.');return;}update(candidate);setExpressionError('');};
 const save=()=>{try{const blob=new Blob([serializeExperiment(experiment,snapshots)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='integer-study.zen-math.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Experiment exported, including captured views.');}catch(error){setMessage(error instanceof Error?error.message:'Could not export experiment.');}};
 const allIds=useMemo(()=>new Set(visible.map(p=>p.id)),[visible]);
 const applyRange=()=>{
  if(!Object.values(range).every(v=>/^\d+$/.test(v))){setRangeError('Use positive whole numbers.');return;}
  const domain={start:Number(range.start),end:Number(range.end),step:Number(range.step)};
  const error=validateDomain(domain);if(error){setRangeError(error);return;}
  const ps=createIntegerPoints(domain,experiment.placement);
  patch({domain,selectedId:ps.some(p=>p.id===experiment.selectedId)?experiment.selectedId:ps[0]?.id??null,slice:null});
  setRangeError('');setHoveredId(null);setBinPreview(null);setMessage('Range applied.');
 };
 const goTo=()=>{const id=String(Number(jump));if(!/^\d+$/.test(jump)||!points.some(p=>p.id===id)){setJumpError('Choose an integer in the current domain.');return;}select(id);};
 const factorization=props?.factors.map(f=>`${f.prime}${f.exponent>1?'^'+f.exponent:''}`).join(' × ')||'1';
 const capture=()=>{setSnapshots(v=>[...v.slice(-11),{id:crypto.randomUUID(),name:`${names[layouts.indexOf(experiment.placement.kind)]} · ${experiment.selectedId??'none'}`,experiment:structuredClone(experiment)}]);setViewsOpen(true);setMessage('View captured. Export your experiment to keep it.');};
 return <div className="zen-studio-story">
 <Screen name="Spatial studio" className="zen-studio-screen" areas={['canvas tools']} columns="minmax(0, 1fr) 19rem" rows="minmax(0, 1fr)"
 header={<div className="zen-studio-header">
  <Group name="Study title" label={false} direction="column" gap={1}><Text as="h1" role="heading" className="zen-studio-title">Spatial studio</Text><Text tone="secondary">An integer study</Text></Group>
  <Group name="History and views" label={false} toolbar wrap>
   <ActionButton tone="quiet" disabled={!history.length} onPress={()=>{const prev=history.at(-1)!;setHistory(history.slice(0,-1));setFuture(f=>[experiment,...f]);setExperiment(prev);setRange({start:String(prev.domain.start),end:String(prev.domain.end),step:String(prev.domain.step)});}}>Undo</ActionButton>
   <ActionButton tone="quiet" disabled={!future.length} onPress={()=>{setHistory(h=>[...h,experiment]);setExperiment(future[0]);setRange({start:String(future[0].domain.start),end:String(future[0].domain.end),step:String(future[0].domain.step)});setFuture(future.slice(1));}}>Redo</ActionButton>
   <ActionButton onPress={capture}>Capture view</ActionButton>
   <ActionButton tone="quiet" onPress={()=>setViewsOpen(!viewsOpen)}>{`Views (${snapshots.length})`}</ActionButton>
  </Group>
 </div>}
 footer={<div className="zen-studio-status"><Text role="caption" tone="muted" aria-live="polite">{message}</Text><Text role="caption" tone="muted">{visible.length.toLocaleString()} of {points.length.toLocaleString()} integers</Text></div>}>
 <Region area="canvas" name="Integer canvas" className="zen-studio-canvas" gap={3}>
  <div className="zen-studio-canvas-heading">
   <Group name="Current domain" label={false} direction="column" gap={1}><Text role="heading">{names[layouts.indexOf(experiment.placement.kind)]}</Text><Text role="caption" tone="secondary">{experiment.domain.start} ≤ n ≤ {experiment.domain.end}{experiment.domain.step!==1?` · step ${experiment.domain.step}`:''}</Text></Group>
   <Group name="Plot navigation" label={false} toolbar><ActionButton tone="quiet" label="Zoom out" onPress={()=>patch({camera:{...experiment.camera,zoom:Math.max(.25,experiment.camera.zoom*.8)}},false)}>−</ActionButton><Text role="caption" tone="secondary">{Math.round(experiment.camera.zoom*100)}%</Text><ActionButton tone="quiet" label="Zoom in" onPress={()=>patch({camera:{...experiment.camera,zoom:Math.min(64,experiment.camera.zoom*1.25)}},false)}>+</ActionButton><ActionButton tone="quiet" onPress={fit}>Fit view</ActionButton></Group>
  </div>
  <div className="zen-studio-plot"><PlotViewport points={visible} boundsPoints={points} edges={edges} selectedId={experiment.selectedId} camera={plotCamera} hoveredId={hoveredId} onHover={id=>{setHoveredId(id);if(id)setBinPreview(null);}} onBinHover={bin=>{setBinPreview(bin);if(bin)setHoveredId(null);}} onClearSelection={clearPin} renderMode={renderMode} volume={experiment.placement.kind==='volume'} labels={labels} onSelect={select} onCameraChange={c=>patch({camera:{...experiment.camera,zoom:c.zoom,panX:c.x,panY:c.y}},false)}/></div>
  <Group name="Legend" label={false} wrap gap={4}>{experiment.layers.filter(l=>l.visible).map(l=><Text key={l.id} role="caption" tone="secondary"><Text tone={l.hue}>{l.channel==='outline'?'□':'●'}</Text> {l.label}</Text>)}</Group>
  {experiment.selectedId&&!allIds.has(experiment.selectedId)&&<Text role="caption" tone="warning">Selection {experiment.selectedId} is outside the current filter or slice.</Text>}
  {labels&&visible.length>2500&&<Text role="caption" tone="muted">Narrow the range or slice to show labels (2,500 points or fewer).</Text>}
  {related.length>500&&<Text role="caption" tone="muted">Showing 500 of {related.length.toLocaleString()} relationships. Narrow the range for all links.</Text>}
  {binPreview?<div className="zen-studio-selection" aria-live="off"><Group name="Density cell" label={false} direction="column" gap={1}><Text role="heading">{binPreview.count.toLocaleString()} integers in this cell</Text><Text role="caption" tone="secondary">Integer IDs {binPreview.minNumericId}–{binPreview.maxNumericId} · click to zoom in</Text><Text role="caption" tone="muted">{binPreview.hues.map(h=>`${h.hue===null?'Uncolored':`Hue ${h.hue}`}: ${h.count} (${Math.round(h.proportion*100)}%)`).join(' · ')}</Text></Group></div>:inspected&&props?<div className="zen-studio-selection">
   <div className="zen-studio-selection-value"><Text role="caption" tone="muted">{hoveredId?`Preview · pinned ${selected?.id??'none'}`:'Pinned'}</Text><Text role="numeral">{inspected.id}</Text></div>
   <Group name="Selected facts" label={false} direction="column" gap={1}><Text role="math">{factorization}</Text><Text role="caption" tone="secondary">{props.divisorCount} divisors{props.isSquare?' · perfect square':''}{props.isPrime?' · prime':''}</Text></Group>
   <Select label="Canvas relationships" items={['No links','Divisors','Multiples']} index={['none','divisors','multiples'].indexOf(experiment.relations)} onChange={i=>patch({relations:(['none','divisors','multiples'] as const)[i]})}/>
   <ActionButton tone="quiet" onPress={()=>setPanel('inspect')}>Inspect integer →</ActionButton>
   {hoveredId?<ActionButton tone="quiet" onPress={()=>select(hoveredId)}>Pin {hoveredId}</ActionButton>:<ActionButton tone="quiet" onPress={clearPin}>Unpin</ActionButton>}
  </div>:<Text role="caption" tone="secondary">Hover to preview an integer. Click to pin it. Scroll to zoom; drag to pan.</Text>}
  <Text role="caption" tone="muted">{renderMode==='density'?'Density cells show exact counts and last-fill composition. Click a cell to zoom.':'Hover previews · click pins · scroll zooms at pointer · drag pans · Esc unpins. Large views aggregate automatically.'}</Text>
  {viewsOpen&&<Group name="Captured views" direction="column" gap={3}><Text role="caption" tone="muted">Saved settings for comparison. Export the experiment to keep them.</Text><Group name="View bookmarks" label={false} wrap>{snapshots.length?snapshots.map(s=><ButtonFace key={s.id} onClick={()=>restore(structuredClone(s.experiment))}>{s.name}</ButtonFace>):<Text tone="secondary">No views yet. Capture a view as you explore.</Text>}</Group></Group>}
 </Region>
 <Region area="tools" name="Study controls" className="zen-studio-tools" view={panel} onView={setPanel} gap={5}>
  <Region.View id="setup" label="Setup">
   <Group name="Integer domain" direction="column" gap={3}>
    <div className="zen-studio-range"><ExpressionField id="domain-start" label="Start" value={range.start} onChange={start=>setRange({...range,start})} onCommit={applyRange}/><ExpressionField id="domain-end" label="End" value={range.end} onChange={end=>setRange({...range,end})} onCommit={applyRange}/><ExpressionField id="domain-step" label="Step" value={range.step} onChange={step=>setRange({...range,step})} onCommit={applyRange}/></div>
    {rangeError&&<Text tone="danger" ariaRole="alert">{rangeError}</Text>}
    <ActionButton onPress={applyRange}>Apply range</ActionButton>
    <Text role="caption" tone="muted">Up to 100,000 integers, from 1 to 1,000,000.</Text>
    <ActionButton tone="quiet" onPress={()=>restore({...experiment,domain:{start:1,end:100000,step:1},placement:{kind:'grid',width:316,depth:10},slice:null,selectedId:'36',camera:{...experiment.camera,zoom:1,panX:0,panY:0}})}>Explore 100,000 integers</ActionButton>
   </Group>
   <Group name="Placement" direction="column" gap={3}>
    <Select label="Placement" items={names} index={layouts.indexOf(experiment.placement.kind)} onChange={i=>patch({placement:{...experiment.placement,kind:layouts[i]},slice:null,camera:{...experiment.camera,zoom:1,panX:0,panY:0}})}/>
    {['grid','snake','volume'].includes(experiment.placement.kind)&&<Slider param={param('Columns',2,1000,20)} value={experiment.placement.width} onChange={width=>patch({placement:{...experiment.placement,width},slice:null},false)} layout="row" length="auto"/>}
    {experiment.placement.kind==='volume'&&<><Slider param={param('Rows per plane',2,30,10)} value={experiment.placement.depth} onChange={depth=>patch({placement:{...experiment.placement,depth},slice:null},false)} layout="row" length="auto"/><Slider param={param('Rotation',0,360,35)} value={experiment.camera.yaw} onChange={yaw=>patch({camera:{...experiment.camera,yaw}},false)} layout="row" length="auto"/><Slider param={param('Depth slice',-1,Math.max(0,...points.map(p=>p.z)),-1)} value={experiment.slice??-1} display={experiment.slice===null?'All planes':String(experiment.slice)} onChange={slice=>patch({slice:slice<0?null:slice},false)} layout="row" length="auto"/></>}
   </Group>
   <Section key="Display options" title="Display options">
    <Select label="Canvas rendering" items={['Automatic detail','Individual integers','Density cells']} index={['auto','points','density'].indexOf(renderMode)} onChange={i=>patch({view:{labels,sizeByDivisors,onlyMatches,renderMode:(['auto','points','density'] as const)[i]}})}/>
    <Text role="caption" tone="muted">Dense views combine points into cells. Zoom in to reveal individual integers. Density summarizes fill colors; outlines remain available in point view.</Text>
    <Checkbox checked={labels} onChange={labels=>patch({view:{labels,sizeByDivisors,onlyMatches,renderMode}})}>Show integer labels</Checkbox>
    <Checkbox checked={onlyMatches} onChange={onlyMatches=>patch({view:{labels,sizeByDivisors,onlyMatches,renderMode}})}>Show matching integers only</Checkbox>
    <Checkbox checked={sizeByDivisors} onChange={sizeByDivisors=>patch({view:{labels,sizeByDivisors,onlyMatches,renderMode}})}>Size by number of divisors</Checkbox>
   </Section>
   <Section key="Experiment file" title="Experiment file">
    <Group name="File actions" label={false} wrap><ActionButton onPress={save}>Export experiment</ActionButton><ActionButton onPress={()=>upload.current?.click()}>Open experiment</ActionButton></Group>
    <Text role="caption" tone="muted">JSON stores the domain, layout, layers, view settings and captured views.</Text>
    <ActionButton tone="quiet" onPress={()=>setRecord(!record)}>{record?'Hide definition':'Show definition'}</ActionButton>
    {record&&<Text as="pre" role="code" tabIndex={0} aria-label="Experiment JSON" className="zen-studio-json">{JSON.stringify({format:'zen-spatial-studio',version:1,experiment,snapshots},null,2)}</Text>}
   </Section>
   <Section key="Navigation help" title="Navigation help"><Text role="caption" tone="secondary">Hover to preview, click to pin, or Escape to unpin. Scroll to zoom at the pointer; drag to pan. Focus the plot and use arrow keys to select, + / − to zoom, and Home to fit. Density cells zoom on click.</Text></Section>
  </Region.View>
  <Region.View id="layers" label="Layers">
   <Group name="Patterns" label={false} direction="column" gap={1}><Text role="heading">Patterns</Text><Text role="caption" tone="secondary">Overlay sets of integers to compare their structure.</Text></Group>
   <div className="zen-studio-layers">{experiment.layers.map((l,i)=><div key={l.id} className="zen-studio-layer">
    <div className="zen-studio-layer-row"><Checkbox checked={l.visible} onChange={visible=>setLayer(l.id,{visible})}>{l.label}</Checkbox><Text tone={l.hue} aria-hidden="true">{l.channel==='outline'?'□':'●'}</Text><Disclosure aria-label={`Edit ${l.label}`} expanded={openLayer===l.id} onChange={open=>setOpenLayer(open?l.id:null)}/></div>
    <Text role="caption" tone="muted">{layerCounts[i]} matches · {l.channel}</Text>
    {openLayer===l.id&&<Group name={`${l.label} settings`} label={false} direction="column" gap={3}>
     <Text role="code" size="caption" tone="secondary">{predicateText(l.predicate)}</Text>
     <Slider param={{name:'Opacity',kind:'float',min:0,max:1,defaultValue:1}} label={`${l.label} opacity`} value={l.opacity} onChange={opacity=>setLayer(l.id,{opacity})} layout="row" length="auto"/>
     <Group name={`${l.label} appearance`} label={false} wrap><Select label={`${l.label} channel`} items={['Fill','Outline']} index={l.channel==='fill'?0:1} onChange={i=>setLayer(l.id,{channel:i?'outline':'fill'})}/><Select label={`${l.label} hue`} items={['Hue 1','Hue 2','Hue 3','Hue 4']} index={l.hue-1} onChange={i=>setLayer(l.id,{hue:(i+1) as MathLayer['hue']})}/></Group>
     <Group name={`${l.label} order`} label={false} toolbar wrap><ActionButton tone="quiet" label={`Move ${l.label} up`} disabled={i===0} onPress={()=>{const ls=[...experiment.layers];[ls[i-1],ls[i]]=[ls[i],ls[i-1]];patch({layers:ls});}}>Move up</ActionButton><ActionButton tone="quiet" label={`Remove ${l.label}`} onPress={()=>patch({layers:experiment.layers.filter(x=>x.id!==l.id)})}>Remove</ActionButton></Group>
    </Group>}
   </div>)}</div>
   <Text role="caption" tone="muted">Later layers take priority within each channel.</Text>
   {activeDistributionLayer&&<Section key="Number distribution" title="Number distribution">
    <Select label="Distribution pattern" items={experiment.layers.map(l=>l.label)} index={Math.min(distributionLayer,experiment.layers.length-1)} onChange={setDistributionLayer}/>
    <DistributionPlot label={`${activeDistributionLayer.label} prevalence`} bins={distributionBins} hue={activeDistributionLayer.hue} startLabel={String(experiment.domain.start)} endLabel={String(experiment.domain.end)} onSelect={id=>{const b=distributionBins[Number(id)];if(!b)return;restore({...experiment,domain:{start:b.start,end:b.end,step:experiment.domain.step},selectedId:String(b.start),slice:null,camera:{...experiment.camera,zoom:1,panX:0,panY:0}});setMessage(`Focused ${b.label}. Undo returns to the full range.`);}}/>
    <Text role="caption" tone="secondary">Share matching in each integer interval · 0–100%. Uses the entire study, independent of camera, slice and visibility. Click a bar to focus its range; Undo returns.</Text>
   </Section>}
   <Section key="Add a pattern" title="Add a pattern">
    <ExpressionField id="predicate" label="Predicate" value={expression} onChange={v=>{setExpression(v);setExpressionError('');}} error={expressionError} description="n % k == r, is_square(n), is_cube(n), is_prime(n)"/>
    <ActionButton onPress={()=>{const p=simplePredicate(expression.trim());if(!p){setExpressionError('Use one of the supported expressions.');return;}addLayer(p,expression.trim());}}>Add layer</ActionButton>
   </Section>
   {experiment.layers.length>=2&&<Section key="Combine patterns" title="Combine patterns">
    <Select label="Left operand" items={experiment.layers.map(l=>l.label)} index={Math.min(left,experiment.layers.length-1)} onChange={setLeft}/><Select label="Set operation" items={['Intersection','Union','Difference','Exclusive or']} index={combine} onChange={setCombine}/><Select label="Right operand" items={experiment.layers.map(l=>l.label)} index={Math.min(right,experiment.layers.length-1)} onChange={setRight}/>
    <ActionButton onPress={()=>{const a=experiment.layers[Math.min(left,experiment.layers.length-1)],b=experiment.layers[Math.min(right,experiment.layers.length-1)];addLayer({kind:(['and','or','difference','xor'] as const)[combine],left:a.predicate,right:b.predicate},`Combination ${experiment.layers.length+1}`);}}>Add combination</ActionButton>
    {expressionError&&<Text role="caption" tone="danger" ariaRole="alert">{expressionError}</Text>}
    <Text role="caption" tone="muted">Copies the operand definitions. Hiding a layer does not change its membership.</Text>
   </Section>}
  </Region.View>
  <Region.View id="inspect" label="Inspect">
   <ExpressionField id="selected-integer" label="Go to integer" value={jump} onChange={v=>{setJump(v);setJumpError('');}} error={jumpError} onCommit={goTo} description="Enter to select an integer in this study."/>
   {inspected&&props&&<>
    <MathInspector title={hoveredId?"Integer preview":"Pinned integer"} value={inspected.id} domain="ℤ⁺" properties={[{label:'Factorization',value:factorization},{label:'Divisors',value:String(props.divisorCount)},{label:'Position',value:`(${inspected.x}, ${inspected.y}${experiment.placement.kind==='volume'?`, ${inspected.z}`:''})`}]} memberships={experiment.layers.map(l=>({id:l.id,label:l.label,expression:predicateText(l.predicate),matches:evaluatePredicate(inspected.n,l.predicate),hue:l.hue}))}/>
    <Section key="Divisors and relationships" title="Divisors and relationships" initial>
     <Group name="Divisors" label={false} wrap>{props.divisors.map(d=><ButtonFace key={d} disabled={!points.some(p=>p.n===d)} onClick={()=>select(String(d))}>{d}</ButtonFace>)}</Group>
     <Select label="Relationship lines" items={['None','Divisors','Multiples']} index={['none','divisors','multiples'].indexOf(experiment.relations)} onChange={i=>patch({relations:(['none','divisors','multiples'] as const)[i]})}/>
     <Text role="caption" tone="muted">Connections stay within visible points.</Text>
    </Section>
   </>}
  </Region.View>
 </Region>
 </Screen>
 <input hidden ref={upload} type="file" accept=".json" aria-label="Open experiment file" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('Experiment file must be smaller than 1 MB.');const imported=parseExperiment(await file.text());restore(imported.experiment);setSnapshots(imported.snapshots);setMessage('Experiment restored.');}catch(error){setMessage(error instanceof Error?error.message:'Could not open experiment.');}e.target.value='';}}/>
 </div>;
}
