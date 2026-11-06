import {describe,it,expect} from 'vitest';
import {initialSignal,surfacePoint} from './signals';
import {sectionPoint,sectionValue,sectionStats,colorPosition} from './analysis';
describe('cross-sectional analysis',()=>{
 it('maps both cut directions onto the same spatial surface',()=>{
  const state={...initialSignal('interference'),slice:1.2};
  expect(sectionPoint('interference','u',.7,state)).toEqual(surfacePoint('interference',.7,1.2,state));
  expect(sectionPoint('interference','v',.7,state)).toEqual(surfacePoint('interference',1.2,.7,state));
 });
 it('reports zero across a cancelled field in either direction',()=>{
  const state={...initialSignal('interference'),a:Math.PI,b:0};
  for(const axis of ['u','v'] as const)expect(sectionStats('interference',axis,state).rms).toBeCloseTo(0);
 });
 it('measures spherical displacement rather than equatorial height',()=>{
  const state={...initialSignal('sphere'),a:.4,b:0,time:0,slice:0};
  expect(sectionValue('sphere','u',0,state)).toBeCloseTo(.4);
  expect(sectionValue('sphere','u',Math.PI/2,state)).toBeCloseTo(-.4);
 });
 it('keeps a signed midpoint and maps equal magnitudes to the same color',()=>{
  expect(colorPosition(0,1.5,'signed')).toBe(.5);
  expect(colorPosition(-1.5,1.5,'signed')).toBe(0);
  expect(colorPosition(1.5,1.5,'signed')).toBe(1);
  expect(colorPosition(-.7,1.5,'magnitude')).toBe(colorPosition(.7,1.5,'magnitude'));
  expect(colorPosition(5,1.5,'magnitude')).toBe(1);
 });
});
