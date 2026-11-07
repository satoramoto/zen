/** Physical units are mm; pxPerMm is measured in CSS pixels, independent of backing-store DPR. */
export interface StereoViewer {pxPerMm:number;distanceMm:number;ipdMm:number}
export type FusionMode='parallel'|'crossed';
export interface StereoLayout {widthMm:number;gapMm:number;mode:FusionMode}
export const radiansPerArcminute=Math.PI/10800;
export function validateViewer(v:StereoViewer){if(!Number.isFinite(v.pxPerMm)||v.pxPerMm<=0||!Number.isFinite(v.distanceMm)||v.distanceMm<=0||!Number.isFinite(v.ipdMm)||v.ipdMm<=0)throw new Error('Physical scale, viewing distance and eye spacing must be positive.');}
export function fitStereoLayout(v:StereoViewer,widthMm:number,availablePx:number,mode:FusionMode):StereoLayout|null{
 validateViewer(v);const gapMm=4,limit=mode==='parallel'?.72*v.ipdMm-gapMm:50;
 const width=Math.min(widthMm,limit,(availablePx/v.pxPerMm-gapMm)/2);
 return Number.isFinite(width)&&width>=10?{widthMm:width,gapMm,mode}:null;
}
export function baseParallax(layout:StereoLayout){return (layout.mode==='parallel'?1:-1)*(layout.widthMm+layout.gapMm);}
/** Right-eye screen position minus left-eye screen position, including the panel separation. */
export function vergenceDistance(v:StereoViewer,parallaxMm:number){return parallaxMm<v.ipdMm?v.distanceMm*v.ipdMm/(v.ipdMm-parallaxMm):Infinity;}
export function vergenceAngle(v:StereoViewer,parallaxMm:number){return 2*Math.atan((v.ipdMm-parallaxMm)/(2*v.distanceMm));}
/** Bound relative relief to a fraction of the base convergence, never requesting divergent rays. Not a comfort guarantee. */
export function effectiveRelief(v:StereoViewer,l:StereoLayout,arcminutes:number){return Math.max(0,Math.min(20,arcminutes,vergenceAngle(v,baseParallax(l))*.35/radiansPerArcminute));}
export function reliefParallax(v:StereoViewer,l:StereoLayout,height:number,arcminutes:number){
 const base=baseParallax(l),angle=vergenceAngle(v,base)-Math.max(-1,Math.min(1,height))*effectiveRelief(v,l,arcminutes)*radiansPerArcminute;
 return v.ipdMm-2*v.distanceMm*Math.tan(angle/2)-base;
}
export function eyeImageShift(v:StereoViewer,l:StereoLayout,height:number,arcminutes:number,eye:-1|1){return eye*reliefParallax(v,l,height,arcminutes)*v.pxPerMm/2;}
export function depthRange(v:StereoViewer,l:StereoLayout,arcminutes:number){const base=baseParallax(l);return {near:vergenceDistance(v,base+reliefParallax(v,l,-1,arcminutes)),plane:vergenceDistance(v,base),far:vergenceDistance(v,base+reliefParallax(v,l,1,arcminutes)),relief:effectiveRelief(v,l,arcminutes)};}
