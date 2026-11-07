import {validateViewer,type StereoViewer,type StereoLayout,type FusionMode} from './viewer';
/** Keep the angular target spacing when the estimated seat distance changes. */
export function tunedLayout(viewer:StereoViewer,spacingDegrees:number,availablePx:number,mode:FusionMode):StereoLayout {
 validateViewer(viewer);
 const requested=2*viewer.distanceMm*Math.tan(Math.max(.2,Math.min(5,spacingDegrees))*Math.PI/360);
 const separation=Math.max(1,Math.min(requested,.65*viewer.ipdMm,Math.max(2,availablePx/viewer.pxPerMm)/1.9));
 return {widthMm:separation*.86,gapMm:separation*.14,mode};
}
