import {useEffect,useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {withLibraryTheme} from '../../../../storybook';
import {CrossSection} from './CrossSection';
import {initialSignal,type SignalKind} from '../../signals';
import type {SectionAxis} from '../../analysis';
import 'mafs/core.css';
import '../SignalPlayground/SignalPlayground.css';
function Specimen({kind='interference',slice=0,time=0}:{kind?:SignalKind;slice?:number;time?:number}){
 const [axis,setAxis]=useState<SectionAxis>('u'),[position,setPosition]=useState<number|null>(null),[probe,setProbe]=useState(0);
 useEffect(()=>setPosition(null),[slice]);
 return <section className="zen-signals"><CrossSection kind={kind} state={{...initialSignal(kind),slice:position??slice,time}} axis={axis} probe={probe} pinned={null} onAxis={setAxis} onProbe={setProbe} onSlice={setPosition}/><button onClick={()=>{setPosition(null);setAxis('u');setProbe(0);}}>Reset section</button></section>;
}
const meta={title:'Math/Signals/Components/Cross Section',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{kind:'interference',slice:0,time:0},argTypes:{kind:{control:'select',options:['interference','standing','sphere','torus4']},slice:{control:{type:'range',min:-3,max:3,step:.01}},time:{control:{type:'range',min:0,max:20,step:.01}}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const SpatialField:Story={};
export const SphericalDisplacement:Story={args:{kind:'sphere'}};
export const ProjectedManifold:Story={args:{kind:'torus4'}};
export const SwitchDirection:Story={play:async({canvasElement})=>{const c=within(canvasElement);await userEvent.click(c.getByRole('button',{name:'Along z'}));await expect(c.getByRole('button',{name:'Along z'})).toHaveAttribute('aria-pressed','true');await userEvent.click(c.getByRole('button',{name:'Reset section'}));await expect(c.getByRole('button',{name:'Along x'})).toHaveAttribute('aria-pressed','true');}};
