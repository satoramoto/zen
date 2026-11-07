// Geometry adapted from ryangavin/perspective at aa83fc32. See docs/perspective.md.
/** Ideal 3D geometric optics. x right, y forward, z up; dimensions in mm. */
export type V3={x:number;y:number;z:number};
export const v=(x:number,y:number,z:number):V3=>({x,y,z});
export const plus=(a:V3,b:V3):V3=>v(a.x+b.x,a.y+b.y,a.z+b.z);
export const times=(a:V3,k:number):V3=>v(a.x*k,a.y*k,a.z*k);
export const minus=(a:V3,b:V3)=>plus(a,times(b,-1));
export const dot3=(a:V3,b:V3)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const cross3=(a:V3,b:V3)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export const norm=(a:V3)=>Math.hypot(a.x,a.y,a.z);
export const normal=(a:V3)=>times(a,1/norm(a));
const rad=(a:number)=>a*Math.PI/180;
export type Pose={position:V3;yaw:number;pitch:number};
export function rotate(a:V3,p:Pose){const cp=Math.cos(rad(p.pitch)),sp=Math.sin(rad(p.pitch)),cy=Math.cos(rad(p.yaw)),sy=Math.sin(rad(p.yaw)),b=v(a.x,a.y*cp-a.z*sp,a.y*sp+a.z*cp);return v(b.x*cy-b.y*sy,b.x*sy+b.y*cy,b.z)}
export const transform=(a:V3,p:Pose)=>plus(rotate(a,p),p.position);
export const reflection=(d:V3,n:V3)=>minus(d,times(n,2*dot3(d,n)));
export function snell(d:V3,n:V3,n1:number,n2:number){if(dot3(d,n)>0)n=times(n,-1);const c=-dot3(d,n),eta=n1/n2,k=1-eta*eta*(1-c*c);return k< -1e-10?{direction:reflection(d,n),tir:true,critical:false}:{direction:normal(plus(times(d,eta),times(n,eta*c-Math.sqrt(Math.max(0,k))))),tir:false,critical:Math.abs(k)<=1e-10}}
export type OpticsState={mode:'mirrors'|'prism';mirrors:[Pose,Pose];prism:Pose;width:number;height:number;offset:number;thickness:number;index:number;coated:boolean;fov:number;eye:V3};
export const default3D:OpticsState={mode:'mirrors',mirrors:[{position:v(0,0,0),yaw:0,pitch:0},{position:v(-60,0,0),yaw:0,pitch:0}],prism:{position:v(-30,0,0),yaw:0,pitch:0},width:52,height:56,offset:60,thickness:32,index:1.5,coated:false,fov:30,eye:v(0,-45,0)};
export type Face3={id:string;optic:number;vertices:V3[];outward:V3;kind:'mirror'|'glass'|'coated'};
export function makeGeometry(s:OpticsState):Face3[]{
 if(s.mode==='mirrors')return s.mirrors.map((pose,i)=>{const t=normal(v(1,-1,0)),z=v(0,0,1),vertices=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>transform(plus(times(t,a*s.width/2),times(z,b*s.height/2)),pose));return{id:i?'Outer mirror':'Inner mirror',optic:i,vertices,outward:rotate(normal(i?v(1,1,0):v(-1,-1,0)),pose),kind:'mirror'}});
 const L=s.offset,h=s.thickness/2,H=s.height/2,base=[v(-L/2-h,h,0),v(-L/2+h,-h,0),v(L/2+h,-h,0),v(L/2-h,h,0)],ids=['Outer bevel','Entrance','Inner bevel','Exit'];
 const faces:Face3[]=base.map((a,i)=>{const b=base[(i+1)%4],e=minus(b,a);return{id:ids[i],optic:0,vertices:[v(a.x,a.y,-H),v(b.x,b.y,-H),v(b.x,b.y,H),v(a.x,a.y,H)].map(q=>transform(q,s.prism)),outward:rotate(normal(v(e.y,-e.x,0)),s.prism),kind:i%2===0&&s.coated?'coated':'glass'}});
 faces.push(...[-1,1].map(sign=>({id:sign<0?'Lower cap':'Upper cap',optic:0,vertices:base.map(p=>transform(v(p.x,p.y,sign*H),s.prism)),outward:rotate(v(0,0,sign),s.prism),kind:'glass' as const})));return faces;
}
export function faceHit(origin:V3,d:V3,face:Face3){const den=dot3(d,face.outward);if(Math.abs(den)<1e-10)return null;const t=dot3(minus(face.vertices[0],origin),face.outward)/den;if(t<=1e-5)return null;const point=plus(origin,times(d,t));let sign=0,edge=false;for(let i=0;i<face.vertices.length;i++){const a=face.vertices[i],b=face.vertices[(i+1)%face.vertices.length],e=minus(b,a),c=dot3(cross3(e,minus(point,a)),face.outward)/norm(e);if(Math.abs(c)<1e-7){edge=true;continue}if(sign&&c*sign<0)return null;sign=Math.sign(c)}return{t,point,face,edge}}
export function nearestFace(origin:V3,d:V3,faces:Face3[]){let best:ReturnType<typeof faceHit>=null;for(const face of faces){const hit=faceHit(origin,d,face);if(hit&&(!best||hit.t<best.t))best=hit}return best}
export const contains=(p:V3,faces:Face3[])=>faces.length===6&&faces.every(f=>dot3(minus(p,f.vertices[0]),f.outward)<-1e-6);
export interface OpticalEvent { point:V3; surface:string; kind:'reflection'|'refraction'|'TIR'|'critical'|'edge'|'back'; incidence:number }
export interface OpticalRay { points:V3[]; events:OpticalEvent[]; status:string }
/** Bounded geometric ray path, independent of scene colors or a particular renderer. */
export function traceOpticalRay(s:OpticsState,direction:V3,origin=s.eye):OpticalRay {
 const faces=makeGeometry(s),points=[origin],events:OpticalEvent[]=[];
 let p=origin,d=normal(direction),inside=s.mode==='prism'&&contains(origin,faces);
 for(let bounce=0;bounce<16;bounce++){
  const hit=nearestFace(p,d,faces);
  if(!hit){points.push(plus(p,times(d,140)));return {points,events,status:events.length?'Leaves optical system':'Misses optical system'};}
  p=hit.point;points.push(p);const face=hit.face,incidence=Math.acos(Math.min(1,Math.abs(dot3(d,face.outward))))*180/Math.PI;
  if(hit.edge){events.push({point:p,surface:face.id,kind:'edge',incidence});return {points,events,status:'Edge hit · normal is ambiguous'};}
  if(face.kind==='mirror'||face.kind==='coated'){
   if(!(face.kind==='mirror'?dot3(d,face.outward)<0:inside)){events.push({point:p,surface:face.id,kind:'back',incidence});return {points,events,status:'Opaque back of coating'};}
   d=reflection(d,face.outward);events.push({point:p,surface:face.id,kind:'reflection',incidence});continue;
  }
  const next=snell(d,face.outward,inside?s.index:1,inside?1:s.index);
  events.push({point:p,surface:face.id,kind:next.tir?'TIR':next.critical?'critical':'refraction',incidence});d=next.direction;
  if(next.critical){points.push(plus(p,times(d,140)));return {points,events,status:'Critical angle · grazing boundary'};}
  if(!next.tir)inside=!inside;
 }
 return {points,events,status:'16-event limit'};
}
