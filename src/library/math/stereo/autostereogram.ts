import {noiseValue,type DotRaster} from './illusions';
/** Row-wise correspondence constraints for a continuous stereogram. Shallow relief only.
 * Symmetric link construction follows the algorithm described by Thimbleby, Witten & Inglis:
 * https://harold.thimbleby.net/sirds/ieee3d.pdf . No hidden-surface removal is performed.
 * separation returns the unsigned distance between matching screen samples, in raster pixels.
 */
export function autostereogram(width:number,height:number,seed:number,separation:(x:number,y:number)=>number):DotRaster {
 const values=new Uint8Array(width*height),links=new Int32Array(width);
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++)links[x]=x;
  for(let x=0;x<width;x++){
   const distance=Math.max(2,Math.round(separation(x,y)));
   let left=x-Math.floor(distance/2),right=left+distance;
   if(left<0||right>=width)continue;
   while(links[left]!==left&&links[left]!==right){
    const next=links[left];
    if(next<right)left=next;else{links[left]=right;left=right;right=next;}
   }
   links[left]=right;
  }
  for(let x=width-1;x>=0;x--)values[y*width+x]=links[x]===x?noiseValue(x,y,seed)%4:values[y*width+links[x]];
 }
 return {width,height,values};
}
