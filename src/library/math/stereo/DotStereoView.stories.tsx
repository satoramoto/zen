import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {DotStereoView} from './DotStereoView';
import {Frame} from '../perspective/shared';
import {stereoIllusions,type StereoIllusion} from './illusions';
import type {FusionMode} from './viewer';
function Specimen({illusion='ring',mode='parallel',relief=6,inverted=false}:{illusion?:StereoIllusion;mode?:FusionMode;relief?:number;inverted?:boolean}){return <Frame eyebrow="Primitive / random-dot stereo" title="A surface written in disparity." description="Synthetic calibration fixture: 4 CSS px/mm, 600 mm viewing distance and 64 mm eye spacing. These values are for inspecting the renderer, not a measurement of your display. Use the Stereo Illusion Lab to calibrate before free viewing."><div className="zen-stereo-lab__stage"><DotStereoView viewer={{pxPerMm:4,distanceMm:600,ipdMm:64}} layout={{widthMm:24,gapMm:4,mode}} illusion={illusion} relief={relief} inverted={inverted}/></div></Frame>;}
const meta={title:'Math/Components/Dot Stereo View',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{illusion:'ring',mode:'parallel',relief:6,inverted:false},argTypes:{illusion:{control:'select',options:Object.keys(stereoIllusions)},mode:{control:'inline-radio',options:['parallel','crossed']},relief:{control:{type:'range',min:0,max:20,step:.5}},inverted:{control:'boolean'}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const RandomDotRelief:Story={};export const ReversedDepth:Story={args:{inverted:true}};export const CrossedPair:Story={args:{mode:'crossed'}};
