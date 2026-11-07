import {useCallback,useEffect,useRef,useState} from 'react';
import {Frame,QuantityControl} from '../perspective/shared';
import {FusionTargets} from './FusionTargets';
import {Stereogram} from './Stereogram';
import {DisplayCalibration,useDisplayInvalidation} from './DisplayCalibration';
import {tunedLayout} from './tuning';
import {stereoIllusions,type StereoIllusion} from './illusions';
import {type FusionMode,type StereoViewer} from './viewer';
import './stereo.css';
export interface StereoTunerProps {illusion?:StereoIllusion;onMotion?():void}
/** Visual, self-reported fusion setup. Distance and display scale remain estimates unless measured. */
export function StereoTuner({illusion='ring',onMotion}:StereoTunerProps){
 const [viewer,setViewer]=useState<StereoViewer>({pxPerMm:3.8,distanceMm:600,ipdMm:64}),[mode,setMode]=useState<FusionMode>('parallel');
 const [step,setStep]=useState<'align'|'depth'|'pattern'>('align'),[spacing,setSpacing]=useState(2.4),[relief,setRelief]=useState(3),[grain,setGrain]=useState(1.5),[kind,setKind]=useState(illusion),[inverted,setInverted]=useState(false),[rest,setRest]=useState(false),[measured,setMeasured]=useState(false),[recheck,setRecheck]=useState(false),[width,setWidth]=useState(600);
 const stage=useRef<HTMLDivElement>(null);
 useEffect(()=>setKind(illusion),[illusion]);
 useEffect(()=>{const observer=new ResizeObserver(()=>setWidth(Math.max(120,(stage.current?.clientWidth??648)-48)));if(stage.current)observer.observe(stage.current);return()=>observer.disconnect();},[]);
 const invalidate=useCallback(()=>{setMeasured(false);setRecheck(true);setRest(true);setStep('align');},[]);useDisplayInvalidation(invalidate);
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setRest(true);};const hidden=()=>{if(document.hidden)setRest(true);};window.addEventListener('keydown',escape);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',hidden);};},[]);
 const layout=tunedLayout(viewer,spacing,width,mode),period=(layout.widthMm+layout.gapMm)*viewer.pxPerMm;
 const resume=()=>{setRest(false);setRecheck(false);};
 return <Frame eyebrow="Stereo / look & tune" title="Settle in. Find the depth." description="Stay in your normal seat. Adjust the picture to you, then keep that setting as the pattern appears.">
  <div className="zen-perspective__tabs" aria-label="Viewing method"><button aria-pressed={mode==='parallel'} onClick={()=>{setMode('parallel');setStep('align');}}>Look through · parallel</button><button aria-pressed={mode==='crossed'} onClick={()=>{setMode('crossed');setStep('align');}}>Cross-eyed</button>{onMotion&&<button onClick={onMotion}>Explore with motion instead</button>}</div>
  <div className="zen-tuner__layout"><article className="zen-perspective__card"><header><h2>{step==='align'?'Bring the two halves into one cross':step==='depth'?'Keep the cross steady. Find the ring.':stereoIllusions[kind].label}</h2><small>{mode==='parallel'?'Look beyond the screen':'Converge in front of the screen'}</small></header>
   <div ref={stage} className="zen-tuner__stage" data-step={step} data-period={period}>
    {rest?<div className="zen-tuner__rest"><h2>{recheck?'Screen changed. Find your alignment again.':'Take a moment.'}</h2><p>Look normally around the room. Your slider settings are kept.</p><button onClick={resume}>Return to the target</button></div>:<><div className="zen-tuner__anchors" aria-hidden="true" style={{gap:Math.max(0,period-18)}}><span>│</span><span>─</span></div><div className="zen-tuner__picture">{step==='pattern'?<Stereogram viewer={viewer} layout={layout} width={width} illusion={kind} relief={relief} grain={grain} inverted={inverted}/>:<FusionTargets viewer={viewer} layout={layout} step={step} relief={relief} inverted={inverted}/>}</div></>}
   </div>
   <div className="zen-tuner__actions"><button onClick={()=>rest?resume():setRest(true)}>{rest?'Resume':'Rest · Esc'}</button>{step!=='align'&&<button onClick={()=>{setStep('align');resume();}}>Find the cross again</button>}{step==='align'?<button disabled={rest} onClick={()=>setStep('depth')}>I see one steady cross</button>:step==='depth'?<button disabled={rest} onClick={()=>setStep('pattern')}>Keep this setting · reveal pattern</button>:<button aria-pressed={inverted} onClick={()=>setInverted(!inverted)}>Reverse depth</button>}</div>
   <p className="zen-tuner__hint">{step==='align'?'The middle image should have both bars: +. The outer copies can remain.':step==='depth'?'The ring should separate in depth from the center cross. Start shallow.':'Use the two marks above the pattern to recover the same alignment. The hidden shape is in the center.'}</p>
  </article><aside className="zen-perspective__card zen-tuner__controls"><h2>Your seat, your setting</h2>
   <svg viewBox="0 0 320 100" className="zen-tuner__seat" role="img" aria-label="Estimated sitting distance from the screen"><path d="M275 15V75M255 80H295" fill="none" stroke="var(--text-2)" strokeWidth="3"/><circle data-seat cx={250-viewer.distanceMm*.16} cy="35" r="12" fill="none" stroke="var(--hue-4)" strokeWidth="3"/><path d={`M${250-viewer.distanceMm*.16} 50v25h28`} fill="none" stroke="var(--hue-4)" strokeWidth="3"/><path d={`M${267-viewer.distanceMm*.16} 35H260`} stroke="var(--border-strong)" strokeDasharray="3 4"/></svg>
   <QuantityControl label="Sitting distance" value={viewer.distanceMm/10} min={30} max={120} step={1} unit=" cm · estimate" onChange={value=>setViewer({...viewer,distanceMm:value*10})}/><p>Roughly how far is your face from the screen? This resizes the target spacing for your seat. Adjust by feel below.</p>
   <QuantityControl label="Target spacing" value={spacing} min={.6} max={4} step={.05} onChange={setSpacing}/><p>Slide left to bring the targets closer together. Keep both eyes open and your head level. Stop where the middle cross feels steady.</p>
   {step!=='align'&&<><QuantityControl label="Depth strength" value={relief} min={0} max={8} step={.5} onChange={setRelief}/><p>Start at zero, then add a little depth while keeping the center steady.</p></>}
   {step==='pattern'&&<QuantityControl label="Pattern grain" value={grain} min={1} max={3} step={.25} onChange={setGrain}/>}
   <p className="zen-tuner__instruction">{mode==='parallel'?'Look through the screen as if looking at something farther away. Let the two circles overlap.':'Look toward a point in front of the screen. You can use a fingertip between your face and screen, then lower it while keeping the middle image.'}</p><p>If it feels uncomfortable, rest or reduce spacing. Advancing is your report; we cannot detect whether the images fused.</p>
  </aside></div>
  {step==='pattern'&&<nav className="zen-perspective__tabs" aria-label="Hidden shapes">{Object.entries(stereoIllusions).map(([key,item])=><button key={key} aria-pressed={kind===key} onClick={()=>setKind(key as StereoIllusion)}>{item.label}</button>)}</nav>}
  <details className="zen-perspective__limits"><summary>Optional measurements · {measured?'screen scale measured':'screen scale estimated'}</summary><p>Sliders find a subjective viewing setting; they do not measure your eyes or monitor. The distance is your estimate, screen scale starts at 3.8 CSS pixels/mm, and eye spacing at 64 mm. For physical dimensions, match the ruler and enter your own measurements. Recheck after moving to another monitor.</p><DisplayCalibration viewer={viewer} onChange={setViewer} confirmed={measured} onConfirm={()=>{setMeasured(true);setStep('align');setRest(false);setRecheck(false);}} onInvalidate={()=>setMeasured(false)}/><QuantityControl label="Eye spacing" value={viewer.ipdMm} min={45} max={80} step={1} unit=" mm" onChange={value=>setViewer({...viewer,ipdMm:value})}/><p>The target spacing is bounded by the available width and estimated eye spacing. A large requested value may reach that cap. This is a shallow-relief stereogram, not a general scene renderer.</p></details>
 </Frame>;
}
