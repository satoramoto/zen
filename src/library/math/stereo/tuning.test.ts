import {describe,it,expect} from 'vitest';
import {tunedLayout} from './tuning';
import {autostereogram} from './autostereogram';
import {baseParallax,reliefParallax} from './viewer';
const viewer={pxPerMm:4,distanceMm:600,ipdMm:64};
describe('visual stereo geometry',()=>{
 it('keeps angular spacing for a changed seat until a physical cap is reached',()=>{
  const a=tunedLayout(viewer,2,800,'parallel'),b=tunedLayout({...viewer,distanceMm:900},2,800,'parallel');
  expect(baseParallax(b)/baseParallax(a)).toBeCloseTo(1.5);
  for(const mode of ['parallel','crossed'] as const){const l=tunedLayout(viewer,5,200,mode);expect((2*l.widthMm+l.gapMm)*4).toBeLessThanOrEqual(200);expect(Math.abs(baseParallax(l))).toBeLessThan(viewer.ipdMm);}
 });
 it('changes the period in opposite directions for the same relief in crossed viewing',()=>{
  const p=tunedLayout(viewer,2,800,'parallel'),c={...p,mode:'crossed' as const};
  expect(Math.abs(baseParallax(p)+reliefParallax(viewer,p,-1,4))).toBeLessThan(Math.abs(baseParallax(p)));
  expect(Math.abs(baseParallax(c)+reliefParallax(viewer,c,-1,4))).toBeGreaterThan(Math.abs(baseParallax(c)));
 });
});
describe('continuous stereogram constraints',()=>{
 it('every pixel repeats at the requested period on a flat plane',()=>{
  const {values}=autostereogram(240,30,7,()=>40);
  for(let y=0;y<30;y++)for(let x=0;x<200;x++)expect(values[y*240+x]).toBe(values[y*240+x+40]);
  expect(new Set(values).size).toBe(4);
 });
 it('is deterministic and encodes relief as changing correspondences',()=>{
  const flat=autostereogram(240,30,7,()=>40),depth=autostereogram(240,30,7,x=>x>80&&x<160?36:40);
  expect(depth.values).toEqual(autostereogram(240,30,7,x=>x>80&&x<160?36:40).values);
  expect(depth.values).not.toEqual(flat.values);
  expect(autostereogram(240,30,8,()=>40).values).not.toEqual(flat.values);
 });
});
