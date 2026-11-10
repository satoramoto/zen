import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../../../storybook';
import {MotionRelief} from './MotionRelief';
import {stereoIllusions,type StereoIllusion} from '../../illusions';
import {Frame} from '../../../perspective/shared';
function Specimen({illusion='ring',inverted=false,phase=0}:{illusion?:StereoIllusion;inverted?:boolean;phase?:number}){return <Frame eyebrow="Primitive / motion parallax" title="Depth in one moving view." description="Drag the surface or use arrow keys. This enlarged point cloud requires no binocular fusion."><MotionRelief illusion={illusion} inverted={inverted} phase={phase}/></Frame>;}
const meta={title:'Math/Stereo/Components/Motion Relief',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{illusion:'ring',inverted:false,phase:0},argTypes:{illusion:{control:'select',options:Object.keys(stereoIllusions)},inverted:{control:'boolean'},phase:{control:{type:'range',min:0,max:6.28,step:.05}}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;export const TurnTheRing:Story={};export const Saddle:Story={args:{illusion:'saddle'}};
