export const drumRoots = [[2.404825557695773, 5.520078110286311, 8.653727912911013], [3.8317059702075125, 7.015586669815619, 10.173468135062722], [5.135622301840683, 8.417244140399864, 11.619841172149059], [6.380161895923983, 9.76102312998167, 13.015200721698434], [7.588342434503804, 11.064709488501185, 14.37253667161759]] as const;
export type CymaticKind='membrane'|'plate'|'drum';
export interface ModeShape {kind:CymaticKind;m:number;n:number}
export interface ModeMix {mix:number;phase:number}
export type Pair=readonly [number,number];
/** Integer-order Bessel J on the bounded educational domain |x| <= 16. */
export function besselJ(m:number,x:number):number{
 let term=1;for(let k=1;k<=m;k++)term*=x/(2*k);let sum=term;
 for(let k=1;k<80;k++){term*=-(x*x/4)/(k*(m+k));sum+=term;if(Math.abs(term)<1e-16*Math.max(1,Math.abs(sum)))break;}return sum;
}
const normalization=new Map<string,number>();
function drumScale(m:number,n:number){const key=`${m}:${n}`;if(!normalization.has(key)){let max=0;for(let i=0;i<=512;i++)max=Math.max(max,Math.abs(besselJ(m,drumRoots[m][n-1]*i/512)));normalization.set(key,max);}return normalization.get(key)!;}
export function pairedMode(shape:ModeShape){return shape.kind==='drum'?shape.m>0:shape.m!==shape.n;}
export function modeBasis(shape:ModeShape,x:number,y:number):Pair|null{
 if(Math.abs(x)>1+1e-9||Math.abs(y)>1+1e-9)return null;
 const {kind,m,n}=shape;
 if(kind==='drum'){const r=Math.hypot(x,y);if(r>1+1e-9)return null;const radial=besselJ(m,drumRoots[m][n-1]*Math.min(1,r))/drumScale(m,n),angle=Math.atan2(y,x);return [radial*Math.cos(m*angle),m===0?0:radial*Math.sin(m*angle)];}
 return [Math.sin(m*Math.PI*(x+1)/2)*Math.sin(n*Math.PI*(y+1)/2),m===n?0:Math.sin(n*Math.PI*(x+1)/2)*Math.sin(m*Math.PI*(y+1)/2)];
}
export function mixWeights(shape:ModeShape,mix:number):Pair{return pairedMode(shape)?[Math.cos(mix),Math.sin(mix)]:[1,0];}
export function displacement(pair:Pair,weights:Pair,phase:number,cycle:number){return (pair[0]*weights[0]*Math.cos(2*Math.PI*cycle)+pair[1]*weights[1]*Math.cos(2*Math.PI*cycle+phase))/Math.SQRT2;}
export function rmsAmplitude(pair:Pair,weights:Pair,phase:number){const a=pair[0]*weights[0],b=pair[1]*weights[1];return Math.sqrt(Math.max(0,a*a+b*b+2*a*b*Math.cos(phase)))/2;}
export function relativeFrequency({kind,m,n}:ModeShape){return kind==='drum'?drumRoots[m][n-1]/drumRoots[0][0]:kind==='plate'?(m*m+n*n)/2:Math.sqrt((m*m+n*n)/2);}
export interface ModeGrid {size:number;basis:(Pair|null)[]}
export function sampleMode(shape:ModeShape,size=121):ModeGrid{return {size,basis:Array.from({length:size*size},(_,i)=>modeBasis(shape,2*(i%size)/(size-1)-1,1-2*Math.floor(i/size)/(size-1)))};}
export function rmsGrid(grid:ModeGrid,shape:ModeShape,mix:ModeMix){const weights=mixWeights(shape,mix.mix);return grid.basis.map(p=>p?rmsAmplitude(p,weights,mix.phase):NaN);}
export function sampleGrid(values:readonly number[],size:number,x:number,y:number){const a=Math.max(0,Math.min(size-1,(x+1)/2*(size-1))),b=Math.max(0,Math.min(size-1,(1-y)/2*(size-1))),i=Math.min(size-2,Math.floor(a)),j=Math.min(size-2,Math.floor(b)),u=a-i,v=b-j;const at=(k:number)=>Number.isFinite(values[k])?values[k]:0;return (at(j*size+i)*(1-u)+at(j*size+i+1)*u)*(1-v)+(at((j+1)*size+i)*(1-u)+at((j+1)*size+i+1)*u)*v;}
export interface Grain {x:number;y:number}
export function scatterGrains(kind:CymaticKind,count=1600,seed=1):Grain[]{let state=seed;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};return Array.from({length:count},()=>{if(kind==='drum'){const r=Math.sqrt(random())*.98,a=random()*2*Math.PI;return {x:r*Math.cos(a),y:r*Math.sin(a)};}return {x:random()*1.96-.98,y:random()*1.96-.98};});}
/** Illustrative descent of cycle-averaged displacement: not a granular mechanics simulation. */
export function settleGrains(grains:Grain[],values:readonly number[],size:number,kind:CymaticKind,dt:number){
 const e=.015;for(const p of grains){const f=(x:number,y:number)=>sampleGrid(values,size,x,y)**2,gx=(f(p.x+e,p.y)-f(p.x-e,p.y))/(2*e),gy=(f(p.x,p.y+e)-f(p.x,p.y-e))/(2*e),length=Math.hypot(gx,gy),speed=Math.min(.45,length*4)*dt;if(length>1e-8){p.x-=gx/length*speed;p.y-=gy/length*speed;}if(kind==='drum'){const r=Math.hypot(p.x,p.y);if(r>.985){p.x*=.985/r;p.y*=.985/r;}}else{p.x=Math.max(-.985,Math.min(.985,p.x));p.y=Math.max(-.985,Math.min(.985,p.y));}}
}
export function standingString(x:number,n:number,reflection:number,cycle:number){const k=n*Math.PI;return (Math.sin(k*x-2*Math.PI*cycle)+reflection*Math.sin(k*x+2*Math.PI*cycle))/2;}
