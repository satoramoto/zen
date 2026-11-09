import {useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {scenario} from 'story-spec';
import {withLibraryTheme} from '../../../storybook';
import {ProjectionView} from '../ProjectionView';
import {initial} from '../model/projection';

function Surfaces(){
 const [rotation,setRotation]=useState(0),[picked,setPicked]=useState('');
 const points=[{x:-1,y:-1,z:0},{x:1,y:-1,z:0},{x:1,y:1,z:0},{x:-1,y:1,z:0}];
 return <><ProjectionView label="Opaque contact surfaces" surfaceMode="opaque" settings={{...initial,focal:5,rotation,pitch:0}}
  faces={[{id:'base',points,hue:1,contactSides:{flap:1}},{id:'flap',points,hue:3}]}
  lines={[{a:{x:-1,y:0,z:0},b:{x:1,y:0,z:0},hue:2,dashed:true,faceIds:['flap']}]}
  onCameraChange={c=>setRotation(c.rotation)} onFacePick={p=>setPicked(p.candidateIds[0])}/>
  <button onClick={()=>setRotation(r=>r===0?180:0)}>Other side</button><output aria-label="Picked surface">{picked}</output></>;
}
export default {title:'Math/Components/Surface Occlusion',component:Surfaces,decorators:[withLibraryTheme],parameters:{spec:{capability:'projection-surface-occlusion',change:'projection-surface-occlusion'}}} satisfies Meta<typeof Surfaces>;
type Story=StoryObj<typeof Surfaces>;
async function raster(root:HTMLElement){
 const svg=root.querySelector('svg')!,copy=svg.cloneNode(true) as SVGSVGElement;
 const originals=[svg,...svg.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
 originals.forEach((node,i)=>{
  const style=getComputedStyle(node);
  for(const key of ['fill','stroke','stroke-width','stroke-dasharray','stroke-linejoin','opacity','mask-type'])
   (clones[i] as SVGElement).style.setProperty(key,style.getPropertyValue(key));
 });
 copy.setAttribute('width','600');copy.setAttribute('height','400');
 const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
 await image.decode();const canvas=document.createElement('canvas');canvas.width=600;canvas.height=400;
 const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
 return {plain:[...ctx.getImageData(300,180,1,1).data],ink:[...ctx.getImageData(250,200,100,1).data]};
}
export const Explore:Story={};
export const InspectContactFromBothSides=scenario({
 requirement:'Occlude opaque surfaces and their marks',
 shall:'The projection SHALL optionally render opaque convex planar surfaces with pointwise depth occlusion, mask surface-owned marks with their owners, and honor caller-provided coplanar side relations consistently with camera-aware picking. Transparent wire mode SHALL remain the default.',
 when:'a viewer inspects contacting opaque surfaces from opposite sides',
 then:'the visible and first-picked surface reverses with the camera and the buried surface marks remain inside their owner visibility mask',
 act:async({canvasElement:root})=>{
  const svg=root.querySelector('svg')!,box=svg.getBoundingClientRect();
  await userEvent.pointer([{target:svg,coords:{clientX:box.x+box.width/2,clientY:box.y+box.height/2},keys:'[MouseLeft]'}]);
  expect(within(root).getByLabelText('Picked surface')).toHaveTextContent('base');
  const hidden=await raster(root);
  // The buried line crosses this whole interior row. Every pixel must match
  // the covering surface, not merely live in a correctly named SVG group.
  for(let i=0;i<hidden.ink.length;i+=4)expect(hidden.ink.slice(i,i+4)).toEqual(hidden.plain);
  await userEvent.click(within(root).getByRole('button',{name:'Other side'}));
  await userEvent.pointer([{target:svg,coords:{clientX:box.x+box.width/2,clientY:box.y+box.height/2},keys:'[MouseLeft]'}]);
 },
 check:async({canvasElement:root})=>{
  expect(within(root).getByLabelText('Picked surface')).toHaveTextContent('flap');
  expect(root.querySelector('[data-surface-id="flap"] line[stroke-dasharray]')).not.toBeNull();
  expect(root.querySelector('[data-surface-id="flap"]')).toHaveAttribute('mask');
  const visible=await raster(root);
  expect(visible.ink.some((value,i)=>value!==visible.plain[i%4])).toBe(true);
 },
}) as Story;
