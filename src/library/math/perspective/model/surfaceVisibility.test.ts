import {describe,it,expect} from 'vitest';
import {projectFaces,faceCandidates,type ProjectedFace} from './facePicking';
import {surfaceOccluders} from './surfaceVisibility';
import {initial} from './projection';

const triangle=[{x:-1,y:-1,z:0},{x:1,y:-1,z:0},{x:0,y:1,z:0}];
describe('opaque surface visibility',()=>{
 it('reverses a caller-owned contact order when viewed from the other side',()=>{
  for(const rotation of [0,180]){
   const faces=projectFaces([{id:'base',points:triangle,contactSides:{flap:1}},{id:'flap',points:triangle}],{...initial,rotation,pitch:0},'Perspective');
   const expected=rotation===0?'base':'flap';
   expect(faceCandidates(faces,{x:0,y:0},'Perspective',true)[0]).toBe(expected);
   const hidden=faces.find(f=>f.id!==expected)!;
   expect(surfaceOccluders(faces,'Perspective').get(hidden.index)).toHaveLength(1);
   expect(surfaceOccluders(faces,'Perspective').get(faces.find(f=>f.id===expected)!.index)).toHaveLength(0);
  }
 });
 it('clips crossing surfaces by depth at each image point, not their equal mean depths',()=>{
  const points=[{x:-1,y:-1,z:2},{x:1,y:-1,z:6},{x:0,y:1,z:4}];
  const faces:ProjectedFace[]=[{face:{},index:0,points,meanDepth:4},{face:{},index:1,points:points.map(p=>({...p,z:8-p.z})),meanDepth:4}].map(f=>({...f,face:{points:[]}}));
  const masks=surfaceOccluders(faces,'Orthographic');
  expect(masks.get(0)![0].every(p=>p.x>=-1e-7)).toBe(true);
  expect(masks.get(1)![0].every(p=>p.x<=1e-7)).toBe(true);
  expect(masks.get(0)![0].some(p=>Math.abs(p.x)<1e-7)).toBe(true);
 });
 it('uses reciprocal depth for perspective and clips near-plane crossings',()=>{
  const faces=projectFaces([{id:'near',points:triangle.map(p=>({...p,z:-7.5+p.x}))},{id:'far',points:triangle}],{...initial,eye:8,rotation:0,pitch:0},'Perspective');
  const masks=surfaceOccluders(faces,'Perspective');
  expect(faces.every(f=>f.points.every(p=>p.z>=.1-1e-8))).toBe(true);
  expect(masks.get(1)!.length).toBeGreaterThan(0);
  expect(masks.get(0)).toHaveLength(0);
 });
});
