import {describe,it,expect} from 'vitest';
import {solidMesh,intersectMesh} from './geometry';
import {phasorSum,primesThrough,eulerProduct} from './foundations';
import {zeta,firstZeros} from './complex';
describe('plane intersections',()=>{
 it('measures an offset sphere section',()=>{const s=intersectMesh(solidMesh('sphere'),{normal:[0,1,0],offset:.4});expect(s.closed).toBe(true);expect(s.loops).toHaveLength(1);expect(s.area).toBeCloseTo(Math.PI*(1-.16),2);});
 it('preserves the torus hole and disconnected sections',()=>{const mesh=solidMesh('torus');const ring=intersectMesh(mesh,{normal:[0,1,0],offset:0});expect(ring.closed).toBe(true);expect(ring.loops).toHaveLength(2);expect(ring.area).toBeCloseTo(4*Math.PI*.38,2);const two=intersectMesh(mesh,{normal:[1,0,0],offset:0});expect(two.loops).toHaveLength(2);expect(two.area).toBeCloseTo(2*Math.PI*.38**2,2);});
 it('handles no intersection',()=>expect(intersectMesh(solidMesh('sphere'),{normal:[0,1,0],offset:1.5}).loops).toHaveLength(0));
});
describe('bounded zeta continuation',()=>{
 it('matches known real values and excludes the pole',()=>{expect(zeta([2,0])![0]).toBeCloseTo(Math.PI**2/6,10);expect(zeta([0,0])![0]).toBeCloseTo(-.5,10);expect(zeta([-1,0])![0]).toBeCloseTo(-1/12,10);expect(zeta([-2,0])![0]).toBeCloseTo(0,10);expect(zeta([1,0])).toBeNull();});
 it('resolves known zeros and conjugate symmetry',()=>{for(const t of firstZeros)expect(Math.hypot(...zeta([.5,t])!)).toBeLessThan(1e-10);const a=zeta([.7,18])!,b=zeta([.7,-18])!;expect(a[0]).toBeCloseTo(b[0],12);expect(a[1]).toBeCloseTo(-b[1],12);});
 it('agrees with independently tabulated complex values',()=>{const v=zeta([.5,10])!;expect(v[0]).toBeCloseTo(1.5448952202967528,10);expect(v[1]).toBeCloseTo(-.11533646527127338,10);});
 it('is stable under a larger truncation across the supported rectangle',()=>{for(const sigma of [-3,-.5,.5,1.5,3])for(const t of [0,14,30,40]){const a=zeta([sigma,t],48)!,b=zeta([sigma,t],80)!;expect(Math.hypot(a[0]-b[0],a[1]-b[1])).toBeLessThan(1e-7);}});
});

describe('series and prime models',()=>{
 it('counts 25 primes through 100',()=>expect(primesThrough(100)).toHaveLength(25));
 it('converges at s=2 and keeps real terms aligned',()=>{const sums=phasorSum([2,0],128),v=sums[sums.length-1];expect(v[1]).toBe(0);expect(Math.abs(v[0]-Math.PI**2/6)).toBeLessThan(.008);const p=eulerProduct([2,0],primesThrough(128));expect(Math.abs(p[0]-Math.PI**2/6)).toBeLessThan(.004);});
});
