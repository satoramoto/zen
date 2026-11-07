// Adapted from ryangavin/perspective at aa83fc32. See docs/perspective.md.
/** Reciprocal 2D geometric optics, millimeters. Directions are unit vectors. */
export type V={x:number;y:number};
export type Bench={offset:number;thickness:number;relief:number;angle:number;index:number;pupil:number;coated:boolean};
export const defaultBench:Bench={offset:60,thickness:16,relief:15,angle:0,index:1.5,pupil:4,coated:false};
export const add=(a:V,b:V):V=>({x:a.x+b.x,y:a.y+b.y});
export const mul=(v:V,k:number):V=>({x:v.x*k,y:v.y*k});
export const dot=(a:V,b:V)=>a.x*b.x+a.y*b.y;
export const cross=(a:V,b:V)=>a.x*b.y-a.y*b.x;
export const unit=(v:V)=>mul(v,1/Math.hypot(v.x,v.y));
export const radians=(a:number)=>a*Math.PI/180;
export const degrees=(a:number)=>a*180/Math.PI;
export const direction=(angle:number):V=>({x:Math.sin(radians(angle)),y:Math.cos(radians(angle))});
export const reflect=(d:V,n:V)=>add(d,mul(n,-2*dot(d,n)));
export function refract(d:V,normal:V,n1:number,n2:number){
 const n=dot(d,normal)>0?mul(normal,-1):normal,c=-dot(d,n),ratio=n1/n2,k=1-ratio*ratio*(1-c*c);
 if(k< -1e-10)return {direction:reflect(d,n),tir:true,critical:false};
 return {direction:unit(add(mul(d,ratio),mul(n,ratio*c-Math.sqrt(Math.max(0,k))))),tir:false,critical:Math.abs(k)<=1e-10};
}
export const criticalAngle=(n:number)=>degrees(Math.asin(1/n));
export type FaceId='left'|'entrance'|'right'|'exit';
export type Face={id:FaceId;a:V;b:V;outward:V;bevel:boolean};
export function device(s:Bench){
 const h=s.thickness/2,L=s.offset;
 const vertices=[{x:-L-h,y:h},{x:-L+h,y:-h},{x:h,y:-h},{x:-h,y:h}];
 const ids:FaceId[]=['left','entrance','right','exit'];
 const faces=vertices.map((a,i)=>{const b=vertices[(i+1)%4],v=add(b,mul(a,-1));return {id:ids[i],a,b,outward:unit({x:v.y,y:-v.x}),bevel:i%2===0}});
 return {vertices,faces,eye:{x:0,y:-h-s.relief}};
}
export function intersectRay(p:V,d:V,a:V,b:V){
 const v=add(b,mul(a,-1)),delta=add(a,mul(p,-1)),den=cross(d,v);
 if(Math.abs(den)<1e-10)return null;
 const t=cross(delta,v)/den,u=cross(delta,d)/den;
 return t>1e-6&&u>=-1e-9&&u<=1+1e-9?{t,u,point:add(p,mul(d,t)),corner:u<1e-7||u>1-1e-7}:null;
}
function nearest(p:V,d:V,faces:Face[]){
 const hits=faces.flatMap(face=>{const hit=intersectRay(p,d,face.a,face.b);return hit?[{...hit,face}]:[]}).sort((a,b)=>a.t-b.t);
 if(!hits.length)return null;
 return {...hits[0],corner:hits[0].corner||(hits.length>1&&Math.abs(hits[1].t-hits[0].t)<1e-7)};
}
export type Event={point:V;face:FaceId;kind:'mirror'|'coated'|'TIR'|'refract'|'critical'|'corner'|'back face';incidence:number;outAngle?:number;incoming:V;outgoing?:V;from:number;to:number};
export type Trace={points:V[];events:Event[];status:string;success:boolean;angle:number;outgoing?:V;exit?:V;shift?:number;turn?:number};
const inc=(d:V,n:V)=>degrees(Math.acos(Math.min(1,Math.abs(dot(d,n)))));
function finish(points:V[],events:Event[],status:string,success:boolean,angle:number,s:Bench,outgoing?:V):Trace{
 const exit=points[points.length-1];
 const shift=success&&outgoing&&outgoing.y>1e-8?exit.x+(50-exit.y)*outgoing.x/outgoing.y-points[0].x-(50-points[0].y)*Math.tan(radians(angle)):undefined;
 const turn=success&&outgoing?degrees(Math.atan2(outgoing.x,outgoing.y))-angle:undefined;
 return {points:outgoing?[...points,add(exit,mul(outgoing,160))]:points,events,status,success,angle,outgoing,exit,shift,turn};
}
export function traceMirror(s:Bench,angle=s.angle,pupilX=0):Trace{
 const g=device(s);g.eye={...g.eye,x:pupilX};const surfaces=g.faces.filter(f=>f.bevel),points=[g.eye],events:Event[]=[];
 let p=g.eye,d=direction(angle);
 for(let count=0;count<12;count++){
  const expected=count%2===0?'right':'left';
  const hit=nearest(p,d,surfaces);
  if(!hit){const success=events.length===2;return finish(points,events,success?'Two reflections · reaches scene':events.length>2?'Extra reflections · not the intended shift':`Missed ${expected==='right'?'inner':'outer'} aperture`,success,angle,s,d)}
  points.push(hit.point);
  if(hit.corner){events.push({point:hit.point,face:hit.face.id,kind:'corner',incidence:inc(d,hit.face.outward),incoming:d,from:1,to:1});return finish(points,events,'Corner hit · direction undefined',false,angle,s)}
  const n=mul(hit.face.outward,-1);
  if(dot(d,n)>=-1e-9||hit.face.id!==expected){events.push({point:hit.point,face:hit.face.id,kind:'back face',incidence:inc(d,n),incoming:d,from:1,to:1});return finish(points,events,'Wrong reflecting face',false,angle,s)}
  const next=reflect(d,n);events.push({point:hit.point,face:hit.face.id,kind:'mirror',incidence:inc(d,n),outAngle:inc(next,n),incoming:d,outgoing:next,from:1,to:1});p=hit.point;d=next;
 }
 return finish(points,events,'Event limit · trapped path',false,angle,s);
}
export function tracePrism(s:Bench,angle=s.angle,pupilX=0):Trace{
 const g=device(s);g.eye={...g.eye,x:pupilX};const points=[g.eye],events:Event[]=[];
 let p=g.eye,d=direction(angle),inside=false;
 for(let count=0;count<12;count++){
  const hit=nearest(p,d,g.faces);
  if(!hit)return finish(points,events,inside?'No valid next boundary':'Missed glass aperture',false,angle,s,d);
  const f=hit.face;points.push(hit.point);const from=inside?s.index:1,to=inside?1:s.index,incidence=inc(d,f.outward);
  if(hit.corner){events.push({point:hit.point,face:f.id,kind:'corner',incidence,incoming:d,from,to});return finish(points,events,'Corner hit · direction undefined',false,angle,s)}
  if(!inside&&f.bevel&&s.coated){events.push({point:hit.point,face:f.id,kind:'back face',incidence,incoming:d,from,to});return finish(points,events,'Coating reached from air side',false,angle,s)}
  if(inside&&f.bevel&&s.coated){const next=reflect(d,f.outward);events.push({point:hit.point,face:f.id,kind:'coated',incidence,outAngle:inc(next,f.outward),incoming:d,outgoing:next,from,to:from});p=hit.point;d=next;continue}
  const next=refract(d,inside?mul(f.outward,-1):f.outward,from,to);
  events.push({point:hit.point,face:f.id,kind:next.tir?'TIR':next.critical?'critical':'refract',incidence,outAngle:inc(next.direction,f.outward),incoming:d,outgoing:next.direction,from,to:next.tir?from:to});
  p=hit.point;d=next.direction;
  if(next.critical)return finish(points,events,'Critical angle · tangent boundary ray',false,angle,s,d);
  if(next.tir)continue;
  if(inside){
   const sequence=events.map(e=>e.face).join(',');
   const success=sequence==='entrance,right,left,exit';
   return finish(points,events,success?'Two reflections · exits toward scene':f.bevel?`Leaks through ${f.id==='right'?'inner':'outer'} facet`:'Wrong entrance / exit sequence',success,angle,s,d);
  }
  inside=true;
 }
 return finish(points,events,'Event limit · trapped path',false,angle,s);
}
export const sampledAngles=(angle:number)=>[-8,-4,0,4,8].map(v=>v+angle);

/** A sampled horizontal pupil cross-section, not integrated pupil area or FOV. */
export const pupilSamples=(diameter:number)=>diameter>0?[-diameter/2,0,diameter/2]:[0];
export const traceBundle=(s:Bench,prism:boolean)=>pupilSamples(s.pupil).flatMap(x=>sampledAngles(s.angle).map(angle=>(prism?tracePrism:traceMirror)(s,angle,x)));
