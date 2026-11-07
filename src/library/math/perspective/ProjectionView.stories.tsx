import {useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {ProjectionView} from './ProjectionView';
import {initial,projections,type Projection} from './model/projection';
import {Frame,wireCube,floorGrid} from './shared';
function Specimen({projection='Perspective',focal=3}:{projection?:Projection;focal?:number}){const [rotation,setRotation]=useState(20),[probe,setProbe]=useState({x:1,y:1,z:0});return <Frame eyebrow="Primitive / projection" title="A point with four ways to land." description="Drag the point or use arrow keys. Drag the background to orbit. The projection and focal scale are available in Controls."><ProjectionView label="Projection specimen" lines={[...floorGrid,...wireCube({x:0,y:0,z:0},2,1)]} settings={{...initial,rotation,focal}} projection={projection} probe={probe} onProbeChange={setProbe} onRotate={setRotation}/></Frame>;}
const meta={title:'Math/Components/Projection View',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{projection:'Perspective',focal:3},argTypes:{projection:{control:'select',options:projections},focal:{control:{type:'range',min:1,max:5,step:.1}}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const Pinhole:Story={};export const Isometric:Story={args:{projection:'Isometric'}};export const Cabinet:Story={args:{projection:'Cabinet'}};
