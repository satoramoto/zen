import {expect,it} from 'vitest';
import {default3D,traceOpticalRay,v,snell,reflection,normal,makeGeometry,faceHit} from './spatial';
import {disparity,stereoPoint} from './stereo';
it('follows two finite mirrors in three dimensions and preserves outgoing direction',()=>{
 const ray=traceOpticalRay(default3D,v(0,1,0));expect(ray.events.map(e=>e.kind)).toEqual(['reflection','reflection']);
 expect(ray.points[2].x).toBeCloseTo(-60);expect(ray.points.at(-1)!.x).toBeCloseTo(-60);
 expect(traceOpticalRay(default3D,v(0,1,3)).events).toHaveLength(0);
});
it('uses Snell and distinguishes critical transmission from internal reflection',()=>{
 const n=v(0,-1,0),d=normal(v(1,1,0));expect(snell(d,n,1.5,1).tir).toBe(true);expect(snell(d,n,Math.SQRT2,1).critical).toBe(true);
 expect(reflection(reflection(d,n),n)).toEqual(d);
 const p=traceOpticalRay({...default3D,mode:'prism'},v(0,1,0));expect(p.events.map(e=>e.kind)).toEqual(['refraction','TIR','TIR','refraction']);
});
it('rejects hits outside finite faces',()=>{expect(faceHit(v(0,-45,100),v(0,1,0),makeGeometry(default3D)[0])).toBeNull();});
it('has zero disparity at convergence and reverses sign either side',()=>{
 const s={separation:.65,cameraX:0,convergence:8,focal:3};
 expect(disparity({x:1,y:0,z:8},s)).toBeCloseTo(0);
 expect(disparity({x:1,y:0,z:4},s)).toBeGreaterThan(0);expect(disparity({x:1,y:0,z:12},s)).toBeLessThan(0);
 expect(disparity({x:1,y:0,z:4},{...s,separation:0})).toBe(0);
 expect(stereoPoint({x:1,y:0,z:-1},s,-1)).toBeNull();
});
