import {useEffect,useState} from 'react';
import type {StereoViewer} from '../../viewer';
import '../../../perspective/perspective.css';
import '../../stereo.css';
export interface DisplayCalibrationProps {viewer:StereoViewer;onChange(viewer:StereoViewer):void;confirmed:boolean;onConfirm():void;onInvalidate():void}
/** A measured physical reference. CSS millimetres and devicePixelRatio are not physical screen calibration. */
export function DisplayCalibration({viewer:v,onChange,confirmed,onConfirm,onInvalidate}:DisplayCalibrationProps){
 const [pixels,setPixels]=useState(v.pxPerMm*50);
 return <div className="zen-display-calibration"><h2>Make the screen a measuring instrument.</h2><p>Use a ruler to match the line below to <strong>50 mm</strong> on this monitor. Adjust its pixel length until the two end marks are 50 mm apart.</p><div className="zen-display-calibration__ruler-scroll"><div className="zen-display-calibration__ruler" aria-label="50 mm calibration reference" style={{width:pixels}}><i/><span>50 mm</span><i/></div></div><label className="zen-perspective__quantity"><span>Reference length <output>{pixels.toFixed(0)} CSS px</output></span><input aria-label="Calibration reference pixels" type="range" min={100} max={600} step={1} value={pixels} onChange={e=>{setPixels(Number(e.target.value));onInvalidate();}}/></label><button onClick={()=>{onChange({...v,pxPerMm:pixels/50});onConfirm();}}>{confirmed?'Reconfirm screen scale':'Confirm measured screen scale'}</button><p className="zen-stereo-lab__fine">This is a manual measurement, not automatic monitor detection. Recheck after browser zoom, a display change, or moving the window to another monitor.</p></div>;
}
/** A display change invalidates a measurement; the viewer explicitly rechecks instead of silently stretching the pair. */
export function useDisplayInvalidation(onInvalidate:()=>void){
 useEffect(()=>{
  const snapshot=()=>[window.innerWidth,window.innerHeight,window.devicePixelRatio,window.visualViewport?.scale??1].join(':');let before=snapshot();
  const check=()=>{const after=snapshot();if(after!==before){before=after;onInvalidate();}};
  const fullscreen=()=>onInvalidate();let resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const density=()=>{check();resolution.removeEventListener('change',density);resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);resolution.addEventListener('change',density);};resolution.addEventListener('change',density);
  window.addEventListener('resize',check);window.visualViewport?.addEventListener('resize',check);document.addEventListener('fullscreenchange',fullscreen);
  return ()=>{resolution.removeEventListener('change',density);window.removeEventListener('resize',check);window.visualViewport?.removeEventListener('resize',check);document.removeEventListener('fullscreenchange',fullscreen);};
 },[onInvalidate]);
}
