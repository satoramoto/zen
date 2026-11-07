export type StereoIllusion='ring'|'bowl'|'saddle'|'ripples'|'message';
export const stereoIllusions:Record<StereoIllusion,{label:string;hint:string}>={
 ring:{label:'Hidden ring',hint:'A ring emerges when the two noise fields fuse. Reveal the depth map if you want a clue.'},
 bowl:{label:'Bowl or dome?',hint:'Reverse the disparity and the same relief changes from a hollow to a bulge.'},
 saddle:{label:'The saddle',hint:'One direction bends toward you while the other bends away.'},
 ripples:{label:'Ripple tunnel',hint:'Concentric waves alternate in depth. Move the phase slowly to explore the surface.'},
 message:{label:'A secret in the noise',hint:'The letters ZEN are carried by binocular disparity, not by a printed outline.'},
};
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const strokes=[[-.8,.3,-.35,.3],[-.35,.3,-.8,-.3],[-.8,-.3,-.35,-.3],[-.2,-.3,-.2,.3],[-.2,.3,.2,.3],[-.2,0,.12,0],[-.2,-.3,.2,-.3],[.35,-.3,.35,.3],[.35,.3,.8,-.3],[.8,-.3,.8,.3]];
function segmentDistance(x:number,y:number,[a,b,c,d]:number[]){const t=Math.max(0,Math.min(1,((x-a)*(c-a)+(y-b)*(d-b))/((c-a)**2+(d-b)**2)));return Math.hypot(x-a-t*(c-a),y-b-t*(d-b));}
/** Positive relief is behind the fused reference plane. Every shape tapers to that plane at the image border. */
export function illusionHeight(kind:StereoIllusion,x:number,y:number,phase=0):number{
 const r=Math.hypot(x,y),edge=1-smooth((Math.max(Math.abs(x),Math.abs(y))-.8)/.16);
 const h=kind==='ring'?-Math.exp(-(((r-.48)/.1)**2)):kind==='bowl'?Math.max(0,1-(r/.72)**2):kind==='saddle'?Math.max(-1,Math.min(1,2*(x*x-y*y)))*(1-smooth((r-.65)/.3)):kind==='ripples'?Math.sin(r*17-phase)*(1-smooth((r-.65)/.3)):-smooth((.07-Math.min(...strokes.map(s=>segmentDistance(x,y,s))))/.035);
 return Math.max(-1,Math.min(1,h))*edge;
}
export function noiseValue(x:number,y:number,seed:number){let n=Math.imul(x+seed*97,374761393)^Math.imul(y+seed*13,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;}
export interface DotRaster {width:number;height:number;values:Uint8Array}
/** Forward-warped random-dot surface with a per-eye depth buffer; disocclusions get independent noise. */
export function stereoRaster(width:number,height:number,dotPixels:number,seed:number,eye:-1|1,depth:(u:number,v:number)=>number,shift:(h:number)=>number):DotRaster{
 const values=new Uint8Array(width*height),z=new Float32Array(width*height).fill(Infinity);
 const cell=Math.max(1,Math.round(dotPixels));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)values[y*width+x]=noiseValue(Math.floor(x/cell),Math.floor(y/cell),seed+eye*79)%2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const h=depth(2*(x+.5)/width-1,1-2*(y+.5)/height),target=Math.round(x+shift(h));
  if(target<0||target>=width)continue;const i=y*width+target;
  if(h<z[i]){z[i]=h;values[i]=noiseValue(Math.floor(x/cell),Math.floor(y/cell),seed)%2;}
 }
 return {width,height,values};
}
