import {useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {RayPathView} from './RayPathView';
import {defaultBench,device,tracePrism,traceMirror} from './model/optics';
import {Frame} from './shared';
function Specimen({glass=true,index=1.5,angle=0}:{glass?:boolean;index?:number;angle?:number}){const [selected,setSelected]=useState(0),s={...defaultBench,index,angle},g=device(s),ray=(glass?tracePrism:traceMirror)(s);return <Frame eyebrow="Primitive / ray paths" title="A path is a sequence of events." description="Select an event to reveal its surface normal. Use Controls to change the material, angle or optical system."><RayPathView label="Ray path specimen" faces={glass?g.faces:g.faces.filter(f=>f.bevel)} glass={glass?g.vertices:undefined} rays={[ray]} selected={selected} onSelect={setSelected}/><p role="status">{ray.status}</p></Frame>;}
const meta={title:'Math/Components/Ray Path View',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{glass:true,index:1.5,angle:0},argTypes:{glass:{control:'boolean'},index:{control:{type:'range',min:1.1,max:2,step:.01}},angle:{control:{type:'range',min:-20,max:20,step:.1}}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const Glass:Story={};export const Mirrors:Story={args:{glass:false}};
