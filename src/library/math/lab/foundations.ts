import {plus,times,divide,type Complex} from './complex';
export function phasorSum(s:Complex,count:number):Complex[]{
 const points:Complex[]=[[0,0]];for(let n=1;n<=count;n++){const length=n**(-s[0]),angle=-s[1]*Math.log(n);points.push(plus(points[points.length-1],[length*Math.cos(angle),length*Math.sin(angle)]));}return points;
}
export function primesThrough(limit:number):number[]{const primes:number[]=[];for(let n=2;n<=limit;n++)if(primes.every(p=>p*p>n||n%p!==0))primes.push(n);return primes;}
export function eulerProduct(s:Complex,primes:number[]):Complex {let product:Complex=[1,0];for(const p of primes){const length=p**(-s[0]),angle=-s[1]*Math.log(p);product=times(product,divide([1,0],[1-length*Math.cos(angle),-length*Math.sin(angle)]));}return product;}
