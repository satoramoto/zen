import { useLayoutEffect, useRef, useState } from 'react';
import { mount, unmount } from 'svelte';
import { liveProps } from '../../../foundation/svelte/stories/props.svelte';
import { themeScopeContext } from '../../../foundation/svelte/theme.svelte';
import { useThemeScope } from '../../../theme';
import { PlotViewport, type PlotViewportProps } from './PlotViewport';
import PlotViewportSvelte from './PlotViewport.svelte';

export type RegionProps = PlotViewportProps & Record<string,unknown>;
export const regionPoints = [
  {id:'a',x:0,y:0}, {id:'b',x:2,y:0}, {id:'c',x:2,y:2}, {id:'d',x:0,y:2},
  {id:'e',x:4,y:0}, {id:'f',x:4,y:2},
];
export const regions = [
  {id:'left',boundary:['a','b','c','d'],label:'Left region',hue:1 as const,interactive:true},
  {id:'right',boundary:['b','e','f','c'],label:'Right region',hue:2 as const,interactive:true},
  {id:'ghost',boundary:['a','b','c','d'],label:'Ghost',hue:3 as const,opacity:.15},
];
function SvelteViewport({props}:{props:RegionProps}) {
  const host=useRef<HTMLDivElement>(null),live=useRef<ReturnType<typeof liveProps<RegionProps>>|null>(null);
  const scope=useThemeScope();
  useLayoutEffect(()=>{
    const held=liveProps(props);live.current=held;
    const app=mount(PlotViewportSvelte,{target:host.current!,props:held.props,context:themeScopeContext(scope?{facets:scope.facets,principles:scope.principles}:null)});
    return ()=>{live.current=null;void unmount(app);};
  },[]);
  useLayoutEffect(()=>live.current?.set(props),[props]);
  return <div ref={host} style={{display:'contents'}}/>;
}
export function RegionsHarness({renderer='react',malformed=false,noRegions=false,density=false,overlap=false}:{renderer?:string;malformed?:boolean;noRegions?:boolean;density?:boolean;overlap?:boolean}) {
  const [camera,setCamera]=useState({x:0,y:0,zoom:1,rotation:0});
  const [selectedRegionId,selectRegion]=useState<string|null>('left'),[selectedId,selectPoint]=useState<string|null>(null);
  const [calls,setCalls]=useState<string[]>([]),[removed,setRemoved]=useState(false);
  const props:RegionProps={points:malformed?[...regionPoints,{id:'bad',x:NaN,y:1}]:regionPoints,boundsPoints:regionPoints,
    camera,onCameraChange:setCamera,selectedId,onSelect:selectPoint,edges:[['a','b']],renderMode:density?'density':'points',
    regions:noRegions?undefined:overlap?[...regions,{id:'top',boundary:['a','b','c','d'],label:'Top region',interactive:true}]:removed?regions.filter(r=>r.id!=='left'):malformed?[...regions,
      {id:'short',boundary:['a','b'],interactive:true},{id:'duplicate',boundary:['a','b','a'],interactive:true},
      {id:'missing',boundary:['a','b','missing'],interactive:true},{id:'nonfinite',boundary:['a','b','bad'],interactive:true}]:regions,
    selectedRegionId,onRegionSelect:id=>{selectRegion(id);setCalls(old=>[...old,id]);},label:'Region plot'};
  return <div style={{width:'100%',maxWidth:800}}>
    <div style={{height:420}}>{renderer==='svelte'?<SvelteViewport props={props}/>:<PlotViewport {...props}/>}</div>
    <button onClick={()=>setRemoved(true)}>Remove selected region</button>
    <output data-state style={{overflowWrap:'anywhere'}}>{JSON.stringify({camera,selectedRegionId,selectedId,calls})}</output>
  </div>;
}
