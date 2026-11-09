import type {Point,Projection} from './projection';
import type {ProjectedFace} from './facePicking';

const epsilon=1e-9;
type Plane={x:number;y:number;c:number};
/** Reciprocal perspective depth (ordinary depth for parallel projections) is
 * affine on a projected planar polygon. No centroid painter approximation. */
function depthPlane(face:ProjectedFace,mode:Projection):Plane|null {
 const a=face.points[0],depth=(p:Point)=>mode==='Perspective'?1/p.z:p.z;
 for(let i=1;i<face.points.length-1;i++){
  const b=face.points[i],c=face.points[i+1],det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  if(Math.abs(det)<1e-12)continue;
  const x=((depth(b)-depth(a))*(c.y-a.y)-(depth(c)-depth(a))*(b.y-a.y))/det;
  const y=((b.x-a.x)*(depth(c)-depth(a))-(c.x-a.x)*(depth(b)-depth(a)))/det;
  return {x,y,c:depth(a)-x*a.x-y*a.y};
 }
 return null;
}
/** Negative means a is closer. Explicit relations are relative to material
 * normals, not the camera. Unspecified ties retain stable caller order. */
export function contactCompare(a:ProjectedFace,b:ProjectedFace):number {
 const side=b.id?a.face.contactSides?.[b.id]:undefined;
 if(side)return side*(a.facing??1);
 const reverse=a.id?b.face.contactSides?.[a.id]:undefined;
 if(reverse)return -reverse*(b.facing??1);
 return a.index-b.index;
}
function clip(points:Point[],distance:(p:Point)=>number):Point[]{
 const result:Point[]=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],da=distance(a),db=distance(b);
  if(da>=0)result.push(a);
  if((da<0)!==(db<0)){
   const t=da/(da-db);result.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),z:a.z+t*(b.z-a.z)});
  }
 }
 return result;
}
function bounds(points:Point[]){return {x0:Math.min(...points.map(p=>p.x)),x1:Math.max(...points.map(p=>p.x)),y0:Math.min(...points.map(p=>p.y)),y1:Math.max(...points.map(p=>p.y))};}
function area(points:Point[]):number{return points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a.x*b.y-a.y*b.x;},0)/2;}
function overlaps(a:Point[],b:Point[]):boolean{
 let intersection=a;
 const orientation=Math.sign(area(b));
 for(let i=0;i<b.length&&intersection.length>=3;i++){
  const p=b[i],q=b[(i+1)%b.length];
  intersection=clip(intersection,v=>orientation*((q.x-p.x)*(v.y-p.y)-(q.y-p.y)*(v.x-p.x)));
 }
 return intersection.length>=3&&Math.abs(area(intersection))>1e-12;
}

/** Per-face screen-space occluders for convex planar faces. Near clipping is
 * already performed by projectFaces. The result also masks surface-owned ink. */
export function surfaceOccluders(faces:ProjectedFace[],mode:Projection):Map<number,Point[][]>{
 const planes=faces.map(f=>depthPlane(f,mode)),boxes=faces.map(f=>bounds(f.points));
 return new Map(faces.map((face,i)=>{
  const plane=planes[i],box=boxes[i];
  const occluders=faces.flatMap((other,j)=>{
   const p=planes[j],b=boxes[j];
   if(i===j||!plane||!p||box.x1<b.x0||b.x1<box.x0||box.y1<b.y0||b.y1<box.y0)return [];
   // Adjacent tessellation facets do not cover one another. Masking their
   // shared boundary would cut antialiasing seams into a continuous surface.
   if(!overlaps(face.points,other.points))return [];
   const factor=mode==='Perspective'?1:-1;
   const d={x:(p.x-plane.x)*factor,y:(p.y-plane.y)*factor,c:(p.c-plane.c)*factor};
   const distances=other.points.map(v=>d.x*v.x+d.y*v.y+d.c);
   if(distances.every(v=>Math.abs(v)<epsilon))return contactCompare(other,face)<0?[other.points]:[];
   const polygon=clip(other.points,v=>d.x*v.x+d.y*v.y+d.c-epsilon);
   return polygon.length>=3?[polygon]:[];
  });
  return [face.index,occluders];
 }));
}
