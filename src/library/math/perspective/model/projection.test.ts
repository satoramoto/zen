import {describe,it,expect} from 'vitest';
import {camera,project,initial,forcedPreset,scene,clipSegment,near} from './projection';
describe('projection geometry',()=>{
 it('perspective halves apparent size at twice the depth',()=>{expect(project({x:2,y:4,z:8},3)).toEqual({x:.75,y:1.5});expect(project({x:2,y:4,z:16},3)?.x).toBe(.375)});
 it('orthographic is independent of point depth',()=>{expect(project({x:2,y:1,z:4},3,true)).toEqual(project({x:2,y:1,z:20},3,true))});
 it('focal distance scales both axes but eye motion changes camera depth',()=>{expect(project({x:2,y:4,z:8},6)?.x).toBe(1.5);expect(camera({x:1,y:2,z:3},initial)).toEqual({x:1,y:2,z:11})});
 it('forced perspective preset overlaps all eight corresponding vertices',()=>{const [a,b]=scene(forcedPreset);a.forEach((p,i)=>{const pa=project(camera(p,forcedPreset),3)!;const pb=project(camera(b[i],forcedPreset),3)!;expect(pa.x).toBeCloseTo(pb.x);expect(pa.y).toBeCloseTo(pb.y)})});
 it('moving the eye breaks forced-perspective coincidence',()=>{const moved={...forcedPreset,eye:10};const [a,b]=scene(moved);expect(project(camera(a[0],moved),3)?.x).not.toBeCloseTo(project(camera(b[0],moved),3)!.x)});
 it('world depth motion changes camera x when the scene is rotated',()=>{const rotated={...initial,rotation:30};const a=camera({x:1.2,y:1.1,z:0},rotated);const b=camera({x:1.2,y:1.1,z:2},rotated);expect(b.x-a.x).toBeCloseTo(1);expect(project(b,3,true)!.x-project(a,3,true)!.x).toBeCloseTo(.375)});
 it('projects a point onto a virtual plane beyond it',()=>{const p=camera({x:1.2,y:1.1,z:-2},{...initial,eye:6});expect(p.z).toBe(4);expect(project(p,5)!.x).toBeCloseTo(1.5)});
 it('clips crossing segments and rejects points behind eye',()=>{expect(project({x:1,y:1,z:-2},3)).toBeNull();expect(clipSegment({x:0,y:0,z:-1},{x:2,y:0,z:1})?.[0].z).toBe(near);expect(clipSegment({x:0,y:0,z:-2},{x:0,y:0,z:-1})).toBeNull()});
});

import {liftImagePath,imagePoint,imageToCamera,unCamera,projections} from './projection';
it('lifts an image into nonplanar geometry while preserving its chosen view',()=>{
 const image=[{x:-.5,y:.5},{x:.5,y:.5},{x:-.5,y:-.5}],world=liftImagePath(image,[5,9,12]);
 world.forEach((p,i)=>expect(project(camera(p,initial),3)).toEqual(image[i]));
 expect(()=>liftImagePath(image,[1])).toThrow();
});
it('inverts each image map at fixed camera depth under scene rotation',()=>{
 const s={...initial,rotation:32,pitch:17,cameraX:.8},p={x:1.4,y:.5,z:2},c=camera(p,s);
 for(const mode of projections){const q=imagePoint(c,3,mode)!;const back=unCamera(imageToCamera(q,c.z,3,mode),s);expect(back.x).toBeCloseTo(p.x);expect(back.y).toBeCloseTo(p.y);expect(back.z).toBeCloseTo(p.z);}
});
