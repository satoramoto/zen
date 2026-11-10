import {eyeImageShift,type StereoViewer,type StereoLayout} from '../../viewer';
export interface FusionTargetsProps {viewer:StereoViewer;layout:StereoLayout;step:'align'|'depth';relief?:number;inverted?:boolean}
/** A complementary cross verifies the intended combination; the visible ring adds relative disparity later. */
export function FusionTargets({viewer,layout,step,relief=4,inverted=false}:FusionTargetsProps){
 const width=layout.widthMm*viewer.pxPerMm,order:(-1|1)[]=layout.mode==='parallel'?[-1,1]:[1,-1];
 return <div className="zen-dot-stereo" data-viewing={layout.mode} data-training={step} style={{gap:layout.gapMm*viewer.pxPerMm,width:2*width+layout.gapMm*viewer.pxPerMm}}>{order.map(eye=>{const shift=step==='depth'?eyeImageShift(viewer,layout,inverted ? .65 : -.65,relief,eye)/width*100:0;return <div key={eye} className="zen-dot-stereo__eye" style={{width}}><svg className="zen-fusion-target" style={{width,height:width}} viewBox="0 0 100 100" role="img" aria-label={`${eye===-1?'Left':'Right'} eye ${step==='align'?'alignment':'visible depth'} target`}>
  <path d="M12 30V12H30M70 12H88V30M88 70V88H70M30 88H12V70" fill="none" stroke="var(--text-2)" strokeWidth="2"/>
  {step==='align'?<><circle cx="50" cy="50" r="28" fill="none" stroke="var(--text-1)" strokeWidth="2"/><path d={eye===-1?'M50 33V67':'M33 50H67'} fill="none" stroke="var(--text-1)" strokeWidth="4"/></>:<><path d="M46 50H54M50 46V54" fill="none" stroke="var(--text-2)" strokeWidth="2"/><circle data-depth-ring cx={50+shift} cy="50" r="25" fill="none" stroke="var(--hue-4)" strokeWidth="4"/></>}
 </svg><small>{eye===-1?'Left eye':'Right eye'}</small></div>;})}</div>;
}
