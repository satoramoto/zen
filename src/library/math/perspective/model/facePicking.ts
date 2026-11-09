import {camera,clipPolygon,imagePoint,type Point,type Projection,type Settings} from './projection';

export interface IdentifiedFace {points:Point[];id?:string;label?:string;hue?:1|2|3|4}
export interface ProjectedFace {face:IdentifiedFace;index:number;id?:string;points:Point[];meanDepth:number}
/** Shared drawing/hit geometry in SVG coordinates; invalid identities remain decorative. */
export function projectFaces(faces:IdentifiedFace[],settings:Settings,mode:Projection,offset={x:0,y:0}):ProjectedFace[]{
 const counts=new Map<string,number>();
 for(const face of faces)if(face.id)counts.set(face.id,(counts.get(face.id)??0)+1);
 return faces.flatMap((face,index)=>{
  if(face.points.length<3||face.points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))return [];
  const clipped=clipPolygon(face.points.map(p=>camera(p,settings)));
  const points=clipped.map(p=>{const q=imagePoint(p,settings.focal,mode);return q?{x:q.x+offset.x,y:-q.y-offset.y,z:p.z}:null;});
  if(points.length<3||points.some(p=>!p||![p.x,p.y,p.z].every(Number.isFinite)))return [];
  const vertices=points as Point[];
  const area=vertices.reduce((sum,a,i)=>{const b=vertices[(i+1)%vertices.length];return sum+a.x*b.y-b.x*a.y;},0);
  if(Math.abs(area)<1e-12)return [];
  const id=face.id?.trim()&&counts.get(face.id)===1?face.id:undefined;
  return [{face,index,id,points:vertices,meanDepth:vertices.reduce((sum,p)=>sum+p.z,0)/vertices.length}];
 });
}
function inside(points:Point[],p:{x:number;y:number}){
 let hit=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i],cross=(p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x);
  if(Math.abs(cross)<1e-10&&p.x>=Math.min(a.x,b.x)-1e-10&&p.x<=Math.max(a.x,b.x)+1e-10&&p.y>=Math.min(a.y,b.y)-1e-10&&p.y<=Math.max(a.y,b.y)+1e-10)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
 }
 return hit;
}
/** Perspective-correct depth, rather than polygon-centroid draw order. */
function depthAt(points:Point[],p:{x:number;y:number},mode:Projection):number|null{
 const a=points[0];
 for(let i=1;i<points.length-1;i++){
  const b=points[i],c=points[i+1],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  if(Math.abs(den)<1e-12)continue;
  const u=((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y))/den;
  const v=((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y))/den,w=1-u-v;
  if(Math.min(u,v,w)<-1e-9)continue;
  const z=mode==='Perspective'?1/(u/a.z+v/b.z+w/c.z):u*a.z+v*b.z+w*c.z;
  if(Number.isFinite(z))return z;
 }
 return null;
}
/** All spatial candidates, nearest first; exact depth ties retain caller order. */
export function faceCandidates(faces:ProjectedFace[],p:{x:number;y:number},mode:Projection):string[]{
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return [];
 return faces.flatMap(face=>{
  if(!face.id||!inside(face.points,p))return [];
  const depth=depthAt(face.points,p,mode);
  return depth===null?[]:[{id:face.id,depth,index:face.index}];
 }).sort((a,b)=>a.depth-b.depth||a.index-b.index).map(face=>face.id);
}
