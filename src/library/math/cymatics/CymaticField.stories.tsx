import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {CymaticField} from './CymaticField';
import '../lab/lab.css';
const meta={title:'Design OS/Math/Components/Cymatic Field',component:CymaticField,decorators:[withLibraryTheme,Story=><section className="zen-lab"><Story/></section>],args:{shape:{kind:'plate',m:4,n:3},mix:{mix:Math.PI/4,phase:Math.PI},cycle:0,paint:'grains',playing:false},argTypes:{paint:{control:'inline-radio',options:['grains','displacement','rms']},cycle:{control:{type:'range',min:0,max:1,step:.01}},playing:{control:false}}} satisfies Meta<typeof CymaticField>;
export default meta;type Story=StoryObj<typeof meta>;
export const NodalGrains:Story={};
export const SignedDisplacement:Story={args:{paint:'displacement'}};
export const CycleAverage:Story={args:{paint:'rms'}};
