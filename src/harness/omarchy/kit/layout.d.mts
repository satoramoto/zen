import type {Element} from './ui.mjs';
export interface Box {x:number; y:number; width:number; height:number; children:Box[]; lines?:string[]; detailLines?:string[]; labelLines?:string[]; controlY?:number}
export function lines(label:string,width:number,size:number):string[];
export function arrange(node:Element,width:number,theme?:object|string):Box;
