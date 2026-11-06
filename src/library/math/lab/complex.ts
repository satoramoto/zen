export type Complex = [number,number];
export const plus=(a:Complex,b:Complex):Complex=>[a[0]+b[0],a[1]+b[1]];
export const times=(a:Complex,b:Complex):Complex=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export const multiply=(a:Complex,n:number):Complex=>[a[0]*n,a[1]*n];
export const divide=(a:Complex,b:Complex):Complex=>multiply(times(a,[b[0],-b[1]]),1/(b[0]*b[0]+b[1]*b[1]));
const power=(n:number,s:Complex):Complex=>{const a=Math.exp(s[0]*Math.log(n)),b=s[1]*Math.log(n);return [a*Math.cos(b),a*Math.sin(b)];};
// B_2k/(2k)!; Euler–Maclaurin continuation, DLMF 25.2(iii).
const corrections=[1/12,-1/720,1/30240,-1/1209600,1/47900160,-691/1307674368000,1/74724249600,-3617/10670622842880000];
/** Bounded educational evaluator: -3 <= Re(s) <= 3, |Im(s)| <= 40; excludes the pole. */
export function zeta(s:Complex,n=48):Complex|null {
 if(!s.every(Number.isFinite)||s[0]<-3||s[0]>3||Math.abs(s[1])>40||Math.hypot(s[0]-1,s[1])<1e-8)return null;
 let sum:Complex=[0,0];for(let k=1;k<n;k++)sum=plus(sum,power(k,[-s[0],-s[1]]));
 sum=plus(sum,divide(power(n,[1-s[0],-s[1]]),[s[0]-1,s[1]]));
 sum=plus(sum,multiply(power(n,[-s[0],-s[1]]),.5));
 let rising:Complex=[1,0];let last=0;
 corrections.forEach((c,k)=>{const degree=2*k+1;for(let j=last;j<degree;j++)rising=times(rising,[s[0]+j,s[1]]);last=degree;sum=plus(sum,multiply(times(rising,power(n,[-s[0]-degree,-s[1]])),c));});
 return sum;
}
export type ComplexFunction = 'square'|'reciprocal'|'zeta';
export function evaluateComplex(kind:ComplexFunction,s:Complex):Complex|null {
 if(kind==='square')return times(s,s);
 if(kind==='reciprocal')return Math.hypot(...s)<1e-8?null:divide([1,0],s);
 return zeta(s);
}
export const firstZeros=[14.134725141734695,21.022039638771555,25.01085758014569,30.424876125859513,32.93506158773919,37.586178158825675];
/** Cyclic interpolation through theme colors; brightness encodes |f|/(1+|f|). */
export function domainRGB(value:Complex|null,palette:number[][]):number[] {
 if(!value)return palette[4];
 const phase=((Math.atan2(value[1],value[0])/(2*Math.PI)+1)%1)*4,i=Math.floor(phase),t=phase-i;
 const magnitude=Math.hypot(...value),brightness=.08+.92*magnitude/(1+magnitude);
 return palette[i].map((v,c)=>(v+(palette[(i+1)%4][c]-v)*t)*brightness);
}
