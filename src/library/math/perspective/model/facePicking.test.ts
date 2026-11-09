import {describe,it,expect} from 'vitest';
import {projectFaces,faceCandidates,type ProjectedFace} from './facePicking';
import {initial,projections,type Point} from './projection';

const square=(z:number):Point[]=>[{x:-1,y:-1,z},{x:1,y:-1,z},{x:1,y:1,z},{x:-1,y:1,z}];
describe('projected face candidates',()=>{
 it('retains coincident identities and stable caller ties without mutation',()=>{
  const faces=[{id:'rear',points:square(1)},{id:'a',points:square(-1)},{id:'b',points:square(-1)}],before=JSON.stringify(faces);
  expect(faceCandidates(projectFaces(faces,initial,'Perspective'),{x:0,y:0},'Perspective')).toEqual(['a','b','rear']);
  expect(faceCandidates(projectFaces([faces[2],faces[1]],initial,'Perspective'),{x:0,y:0},'Perspective')).toEqual(['b','a']);
  expect(JSON.stringify(faces)).toBe(before);
 });
 it('orders at the hit rather than by mean depth and uses reciprocal perspective depth',()=>{
  const face=(id:string,index:number,z:number[]):ProjectedFace=>({id,index,face:{points:[]},meanDepth:z.reduce((a,b)=>a+b)/4,points:square(0).map((p,i)=>({...p,z:z[i]}))});
  const tilted=face('tilted',0,[2,10,10,2]),flat=face('flat',1,[5,5,5,5]);
  expect(faceCandidates([tilted,flat],{x:-.8,y:0},'Perspective')).toEqual(['tilted','flat']);
  expect(faceCandidates([tilted,flat],{x:.8,y:0},'Perspective')).toEqual(['flat','tilted']);
  // At the center, reciprocal interpolation gives 10/3, not the mean 6.
  expect(faceCandidates([tilted,flat],{x:0,y:0},'Perspective')).toEqual(['tilted','flat']);
  expect(faceCandidates([tilted,flat],{x:0,y:0},'Orthographic')).toEqual(['flat','tilted']);
 });
 it('clips near-plane crossings and omits unavailable or degenerate surfaces',()=>{
  const faces=[{id:'crossing',points:[{x:-.01,y:-.01,z:-8},{x:.01,y:-.01,z:-7},{x:.01,y:.01,z:-7}]},
   {id:'behind',points:square(-9)},{id:'nan',points:[{x:NaN,y:0,z:0},...square(0)]},
   {id:'line',points:[{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0}]}];
  const projected=projectFaces(faces,initial,'Perspective');
  expect(projected.map(f=>f.id)).toEqual(['crossing']);expect(projected[0].points).toHaveLength(4);
  expect(projected[0].points.every(p=>p.z>=.1)).toBe(true);
  expect(faceCandidates(projected,{x:1,y:1},'Perspective')).toEqual([]);
 });
 it('keeps malformed identity decorative and supports every projection and offset',()=>{
  const faces=[{id:'valid',points:square(0)},{id:'dup',points:square(0)},{id:'dup',points:square(0)},{id:'',points:square(0)},{points:square(0)}];
  for(const mode of projections){const result=projectFaces(faces,initial,mode,{x:.2,y:.3});
   expect(result).toHaveLength(5);expect(faceCandidates(result,{x:.2,y:-.3},mode)).toEqual(['valid']);}
 });
});
