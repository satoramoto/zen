import { describe, expect, it } from 'vitest';
import { initialSignal, signalExamples, signalHeight, surfacePoint, orbitPoint } from './signals';
describe('signal relationships',()=>{
 it('cancels coincident opposite-phase sources at every sampled position and time',()=>{
  for(const x of [-3,0,.8])for(const z of [-2,0,2])for(const time of [0,1,3]) expect(signalHeight('interference',x,z,{a:Math.PI,b:0,time,slice:0})).toBeCloseTo(0);
 });
 it('keeps standing-wave nodes fixed in time for equal travelers',()=>{
  for(const time of [0,.5,2,7]) expect(signalHeight('standing',Math.PI/1.5,0,{a:1,b:1.5,time,slice:0})).toBeCloseTo(0);
 });
 it('translates a nondispersive packet without changing shape',()=>{
  const s={a:0,b:.5,time:0,slice:0};
  for(const x of [-2,0,1])expect(signalHeight('dispersion',x+2,0,{...s,time:2})).toBeCloseTo(signalHeight('dispersion',x,0,s));
 });
 it('closes the rational 3:2 torus orbit after two first-phase turns',()=>{
  const s={a:1.5,b:.3,time:0,slice:0};const p=orbitPoint('torus',s),q=orbitPoint('torus',{...s,time:4*Math.PI});
  p.forEach((v,i)=>expect(q[i]).toBeCloseTo(v));
 });
 it('samples finite geometry across every bounded example',()=>{
  for(const spec of signalExamples)for(const a of [spec.a.min,spec.a.max])for(const b of [spec.b.min,spec.b.max])for(const u of [-Math.PI,0,Math.PI])for(const v of [-Math.PI,0,Math.PI]){
   const s={...initialSignal(spec.id),a,b,time:1};expect(surfacePoint(spec.id,u,v,s).every(Number.isFinite)).toBe(true);
  }
 });
 it('gives a unit sphere at zero mode amplitude',()=>{
  expect(Math.hypot(...surfacePoint('sphere',.7,.9,{a:0,b:1,time:0,slice:0}))).toBeCloseTo(1);
 });
});
