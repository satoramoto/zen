import {expect,it} from 'vitest';
import {baseParallax,depthRange,eyeImageShift,fitStereoLayout,reliefParallax,vergenceAngle,vergenceDistance,radiansPerArcminute,type StereoViewer,type StereoLayout} from './viewer';
import {illusionHeight,stereoRaster} from './illusions';
const v:StereoViewer={pxPerMm:4,distanceMm:600,ipdMm:64};
it('includes physical image-center separation in the fused reference distance',()=>{
 expect(vergenceDistance(v,28)).toBeCloseTo(1066.6666667);expect(vergenceDistance(v,-28)).toBeCloseTo(417.3913043);expect(vergenceDistance(v,0)).toBe(600);expect(vergenceDistance(v,64)).toBe(Infinity);
});
it('projects each eye onto the physical screen for both viewing orders',()=>{
 for(const mode of ['parallel','crossed'] as const){const l={widthMm:24,gapMm:4,mode};for(const h of [-1,0,1]){
  const q=baseParallax(l)+reliefParallax(v,l,h,8),Z=vergenceDistance(v,q),left=-v.ipdMm/2*(1-v.distanceMm/Z),right=v.ipdMm/2*(1-v.distanceMm/Z);
  expect(right-left).toBeCloseTo(q);expect((eyeImageShift(v,l,h,8,1)-eyeImageShift(v,l,h,8,-1))/v.pxPerMm+baseParallax(l)).toBeCloseTo(q);
  expect((vergenceAngle(v,baseParallax(l))-vergenceAngle(v,q))/radiansPerArcminute).toBeCloseTo(h*8);
 }}
});
it('retains physical geometry across DPI and fits without requesting divergence',()=>{
 for(const distanceMm of [300,600,1200])for(const ipdMm of [45,64,80])for(const mode of ['parallel','crossed'] as const){const viewer={...v,distanceMm,ipdMm},l=fitStereoLayout(viewer,100,400,mode)!;const range=depthRange(viewer,l,20);expect(range.near).toBeGreaterThan(0);expect(range.far).toBeGreaterThan(range.plane);expect(Number.isFinite(range.far)).toBe(true);}
 const l:StereoLayout={widthMm:24,gapMm:4,mode:'parallel'};expect(eyeImageShift({...v,pxPerMm:8},l,1,8,1)).toBeCloseTo(2*eyeImageShift(v,l,1,8,1));expect(fitStereoLayout(v,24,50,'parallel')).toBeNull();
});
it('keeps a neutral image border and reverses depth without changing the noise seed',()=>{
 for(const k of ['ring','bowl','saddle','ripples','message'] as const){expect(illusionHeight(k,1,0)).toBeCloseTo(0);expect(Math.abs(illusionHeight(k,.2,.3))).toBeLessThanOrEqual(1);}
 const a=stereoRaster(40,40,2,7,-1,()=>0,()=>0),b=stereoRaster(40,40,2,7,1,()=>0,()=>0);expect(a.values).toEqual(b.values);
 const shifted=stereoRaster(40,40,2,7,1,()=>1,()=>3);expect(shifted.values[20*40+23]).toBe(a.values[20*40+20]);
});
