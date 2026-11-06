export type Vec3 = [number,number,number];
export type Vec2 = [number,number];
export interface TriangleMesh { positions: number[]; indices: number[]; colors?: number[] }
export interface CuttingPlane { normal: Vec3; offset: number }
export const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const scale=(a:Vec3,s:number):Vec3=>[a[0]*s,a[1]*s,a[2]*s];
export const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=(a:Vec3):Vec3=>scale(a,1/Math.hypot(...a));
export function planeFrame(plane:CuttingPlane){
 const n=unit(plane.normal),u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(n,u);
 return {n,u,v,origin:scale(n,plane.offset)};
}
export function sampleSurface(fn:(u:number,v:number)=>Vec3,nu=96,nv=64):TriangleMesh {
 const positions:number[]=[],indices:number[]=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)positions.push(...fn(i/nu,j/nv));
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;indices.push(a,c,b,b,c,d);}
 return {positions,indices};
}
export function solidMesh(kind:'sphere'|'torus'|'ellipsoid'):TriangleMesh {
 return sampleSurface((u,v)=>{
  const a=u*2*Math.PI,b=v*Math.PI;
  if(kind==='torus'){const r=1+.38*Math.cos(v*2*Math.PI);return [r*Math.cos(a),.38*Math.sin(v*2*Math.PI),r*Math.sin(a)];}
  return [Math.sin(b)*Math.cos(a)*(kind==='ellipsoid'?1.35:1),Math.cos(b)*(kind==='ellipsoid'?.7:1),Math.sin(b)*Math.sin(a)];
 });
}
export interface PlaneSection { loops:Vec2[][]; lines:Vec3[][]; area:number; perimeter:number; closed:boolean }
const key=(p:Vec3)=>p.map(n=>Math.round(n*1e6)).join(',');
/** Intersect a triangle mesh with a plane; weld shared edges into ordered contour loops. */
export function intersectMesh(mesh:TriangleMesh,plane:CuttingPlane):PlaneSection {
 const {n,u,v,origin}=planeFrame(plane),vertices=new Map<string,Vec3>(),edges=new Map<string,[string,string]>();
 const at=(i:number):Vec3=>mesh.positions.slice(i*3,i*3+3) as Vec3;
 for(let i=0;i<mesh.indices.length;i+=3){
  const p=mesh.indices.slice(i,i+3).map(at),d=p.map(p=>dot(p,n)-plane.offset),hits=new Map<string,Vec3>();
  if(d.every(x=>Math.abs(x)<1e-9))continue;
  for(let e=0;e<3;e++){
   const j=(e+1)%3;
   if(Math.abs(d[e])<1e-9)hits.set(key(p[e]),p[e]);
   if(d[e]*d[j]<0){const t=d[e]/(d[e]-d[j]);const q=add(scale(p[e],1-t),scale(p[j],t));hits.set(key(q),q);}
  }
  if(hits.size!==2)continue;const [a,b]=[...hits.keys()];if(a===b)continue;
  hits.forEach((p,k)=>vertices.set(k,p));edges.set([a,b].sort().join('|'),[a,b]);
 }
 const adjacent=new Map<string,string[]>();edges.forEach(([a,b],id)=>{for(const k of [a,b])adjacent.set(k,[...(adjacent.get(k)??[]),id]);});
 const unused=new Set(edges.keys()),lines:Vec3[][]=[];let closed=true;
 while(unused.size){
  const first=unused.values().next().value!;const [start]=edges.get(first)!;let current=start;const line:Vec3[]=[vertices.get(start)!];
  for(let guard=0;guard<=edges.size;guard++){
   const edge=adjacent.get(current)?.find(e=>unused.has(e));if(!edge)break;unused.delete(edge);
   const [a,b]=edges.get(edge)!;current=current===a?b:a;line.push(vertices.get(current)!);if(current===start)break;
  }
  if(current!==start)closed=false;if(line.length>2)lines.push(line);
 }
 const loops=lines.map(line=>line.map(p=>{const q=add(p,scale(origin,-1));return [dot(q,u),dot(q,v)] as Vec2;}));
 const inside=(p:Vec2,loop:Vec2[])=>{let hit=false;for(let i=0,j=loop.length-1;i<loop.length;j=i++){const a=loop[i],b=loop[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 let area=0,perimeter=0;
 loops.forEach((loop,i)=>{let signed=0;for(let j=1;j<loop.length;j++){const a=loop[j-1],b=loop[j];signed+=a[0]*b[1]-a[1]*b[0];perimeter+=Math.hypot(b[0]-a[0],b[1]-a[1]);}const depth=loops.filter((other,j)=>j!==i&&inside(loop[0],other)).length;area+=Math.abs(signed)/2*(depth%2?-1:1);});
 return {loops,lines,area:Math.max(0,area),perimeter,closed};
}
