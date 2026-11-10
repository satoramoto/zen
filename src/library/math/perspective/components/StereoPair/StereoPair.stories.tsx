import {useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../../../storybook';
import {StereoPair} from './StereoPair';
import {Frame,wireCube} from '../../shared';
function Specimen({separation=.65,convergence=8,crossed=false}:{separation?:number;convergence?:number;crossed?:boolean}){const [probe,setProbe]=useState({x:0,y:.5,z:5});return <Frame eyebrow="Primitive / stereo" title="Two cameras. One source of truth." description="The same lines and probe feed both parallel cameras. Drag either probe; change separation, convergence or viewing order in Controls."><StereoPair settings={{separation,convergence,focal:3,cameraX:0}} lines={[...wireCube({x:-1,y:0,z:5},1,1),...wireCube({x:1,y:0,z:10},1,2)]} probe={probe} onProbeChange={setProbe} crossed={crossed}/></Frame>;}
const meta={title:'Math/Perspective/Components/Stereo Pair',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{separation:.65,convergence:8,crossed:false},argTypes:{separation:{control:{type:'range',min:0,max:1.5,step:.01}},convergence:{control:{type:'range',min:2,max:14,step:.1}},crossed:{control:'boolean'}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const Parallel:Story={};export const Crossed:Story={args:{crossed:true}};
