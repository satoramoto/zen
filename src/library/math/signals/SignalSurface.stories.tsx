import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {SignalSurface,type SignalCamera} from './SignalSurface';
import {initialSignal,type SignalKind} from './signals';
import type {SectionAxis,SurfaceColorMode} from './analysis';
import './SignalPlayground.css';
function Specimen({kind='interference',time=0,slice=0,probe=0,axis='u',colorMode='signed',camera='perspective'}:{kind?:SignalKind;time?:number;slice?:number;probe?:number;axis?:SectionAxis;colorMode?:SurfaceColorMode;camera?:SignalCamera}){
 return <section className="zen-signals"><SignalSurface key={kind} kind={kind} state={{...initialSignal(kind),time,slice}} axis={axis} probe={probe} colorMode={colorMode} camera={camera}/><p>Orbit the surface; use Controls to change the sample, time, section and color encoding.</p></section>;
}
const meta={title:'Math/Components/Signal Surface',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{kind:'interference',time:0,slice:0,probe:0,axis:'u',colorMode:'signed',camera:'perspective'},argTypes:{kind:{control:'select',options:['interference','standing','sphere','torus','torus4']},time:{control:{type:'range',min:0,max:20,step:.01}},slice:{control:{type:'range',min:-3,max:3,step:.01}},probe:{control:{type:'range',min:-3,max:3,step:.01}},axis:{control:'inline-radio',options:['u','v']},colorMode:{control:'inline-radio',options:['solid','signed','magnitude']},camera:{control:'inline-radio',options:['perspective','top','front']}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const SignedField:Story={};
export const Magnitude:Story={args:{colorMode:'magnitude'}};
export const Manifold:Story={args:{kind:'sphere',colorMode:'solid'}};
