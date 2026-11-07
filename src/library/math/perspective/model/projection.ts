// Adapted from ryangavin/perspective at aa83fc32. See docs/perspective.md.
export type Point = {x:number;y:number;z:number};
export type Settings = {eye:number;cameraX?:number;pitch?:number;focal:number;rotation:number;depth:number;forced:boolean};
export const initial:Settings = {eye:8,focal:3,rotation:0,depth:1.4,forced:false};
export const forcedPreset:Settings = {eye:8,focal:3,rotation:0,depth:4,forced:true};
export const near = 0.1;
export function camera(p:Point,s:Settings):Point {const a=s.rotation*Math.PI/180,b=(s.pitch??0)*Math.PI/180;const x=p.x*Math.cos(a)+p.z*Math.sin(a),z=-p.x*Math.sin(a)+p.z*Math.cos(a);return {x:x-(s.cameraX??0),y:p.y*Math.cos(b)-z*Math.sin(b),z:p.y*Math.sin(b)+z*Math.cos(b)+s.eye};}
export function project(p:Point,focal:number,orthographic=false):{x:number;y:number}|null {if(p.z<near)return null; const scale=orthographic?focal/8:focal/p.z;return {x:p.x*scale,y:p.y*scale};}
export function cube(center:Point,size:number):Point[]{return Array.from({length:8},(_,i)=>({x:center.x+((i&1)?1:-1)*size/2,y:center.y+((i&2)?1:-1)*size/2,z:center.z+((i&4)?1:-1)*size/2}));}
export const edges = Array.from({length:8},(_,i)=>[1,2,4].filter(b=>!(i&b)).map(b=>[i,i|b])).flat();
export function scene(s:Settings):Point[][] {const front=cube({x:-1.4,y:0,z:-1.5},1.6); if(!s.forced)return [front,cube({x:1.4,y:0,z:2},1.6)];const k=1.8;return [front,front.map(p=>({x:p.x*k,y:p.y*k,z:(p.z+8)*k-8}))];}
export function probe(s:Settings):Point{return {x:1.2,y:1.1,z:s.depth};}
export function clipSegment(a:Point,b:Point):[Point,Point]|null{if(a.z<near&&b.z<near)return null;if(a.z>=near&&b.z>=near)return [a,b];const t=(near-a.z)/(b.z-a.z);const hit={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:near};return a.z<near?[hit,b]:[a,hit];}
export type Projection = 'Perspective'|'Orthographic'|'Isometric'|'Cabinet';
export const projections:Projection[]=['Perspective','Orthographic','Isometric','Cabinet'];
export function unCamera(p:Point,s:Settings):Point{const a=s.rotation*Math.PI/180,b=(s.pitch??0)*Math.PI/180,Z=p.z-s.eye,x=p.x+(s.cameraX??0),y=p.y*Math.cos(b)+Z*Math.sin(b),z=-p.y*Math.sin(b)+Z*Math.cos(b);return {x:x*Math.cos(a)-z*Math.sin(a),y,z:x*Math.sin(a)+z*Math.cos(a)};}
export function imagePoint(p:Point,f:number,mode:Projection){if(p.z<near)return null;const k=f/8,d=p.z-8;if(mode==='Perspective')return project(p,f);if(mode==='Orthographic')return project(p,f,true);if(mode==='Cabinet')return {x:k*(p.x+d*Math.SQRT1_2/2),y:k*(p.y+d*Math.SQRT1_2/2)};return {x:k*(p.x-d)/Math.sqrt(2),y:k*(2*p.y-p.x-d)/Math.sqrt(6)};}
/** Invert each 2D map while retaining the selected point's camera z. */
export function imageToCamera(q:{x:number;y:number},z:number,f:number,mode:Projection):Point{const k=f/8,d=z-8;if(mode==='Perspective')return {x:q.x*z/f,y:q.y*z/f,z};if(mode==='Orthographic')return {x:q.x/k,y:q.y/k,z};if(mode==='Cabinet')return {x:q.x/k-d*Math.SQRT1_2/2,y:q.y/k-d*Math.SQRT1_2/2,z};const x=q.x/k*Math.sqrt(2)+d;return {x,y:(q.y/k*Math.sqrt(6)+x+d)/2,z};}
export const faces=[[0,4,6,2],[1,3,7,5],[0,1,5,4],[2,6,7,3],[0,2,3,1],[4,5,7,6]];
export const ground=-1.6;
export function lightVector(azimuth:number,elevation:number):Point{const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;return{x:Math.cos(e)*Math.cos(a),y:Math.sin(e),z:Math.cos(e)*Math.sin(a)};}
export function shadow(p:Point,light:Point):Point|null{if(light.y<=0||p.y<ground)return null;const t=(p.y-ground)/light.y;return{x:p.x-light.x*t,y:ground,z:p.z-light.z*t};}
export function bounds(points:Point[]):Point[]{return cube({x:0,y:0,z:0},2).map(p=>({x:p.x<0?Math.min(...points.map(v=>v.x)):Math.max(...points.map(v=>v.x)),y:p.y<0?Math.min(...points.map(v=>v.y)):Math.max(...points.map(v=>v.y)),z:p.z<0?Math.min(...points.map(v=>v.z)):Math.max(...points.map(v=>v.z))}));}
export function clipPolygon(points:Point[]):Point[]{return points.flatMap((a,i)=>{const b=points[(i+1)%points.length],inside=a.z>=near,next=b.z>=near;if(inside&&next)return[b];if(!inside&&!next)return[];const t=(near-a.z)/(b.z-a.z),hit={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:near};return inside?[hit]:[hit,b]});}
export function diffuse(vertices:Point[],light:Point){const [a,b,c]=vertices,u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};return .28+.72*Math.max(0,(n.x*light.x+n.y*light.y+n.z*light.z)/(Math.hypot(n.x,n.y,n.z)||1));}

export function viewDepth(p:Point,mode:Projection){return mode==='Isometric'?(p.x+p.y+p.z-8)/Math.sqrt(3):p.z;}
/** Lift image-plane samples to arbitrary positive camera depths without changing their projection. */
export function liftImagePath(points:{x:number;y:number}[],depths:number[],focal=3,eye=8):Point[]{
 if(points.length!==depths.length||focal<=0||depths.some(z=>!Number.isFinite(z)||z<near))throw new Error('Provide one positive camera depth per point and a positive focal scale.');
 return points.map((p,i)=>({x:p.x*depths[i]/focal,y:p.y*depths[i]/focal,z:depths[i]-eye}));
}
