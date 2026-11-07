import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {FusionTargets,type FusionTargetsProps} from './FusionTargets';
import {Frame} from '../perspective/shared';
function Specimen({step='align',relief=4,inverted=false}:Pick<FusionTargetsProps,'step'|'relief'|'inverted'>){return <Frame eyebrow="Primitive / fusion targets" title="First align. Then add depth." description="Synthetic 4 px/mm fixture. Each alignment image has half a cross; the visible ring adds relative disparity. Use the lab to measure your actual screen before free viewing."><div className="zen-stereo-lab__stage"><FusionTargets viewer={{pxPerMm:4,distanceMm:600,ipdMm:64}} layout={{widthMm:24,gapMm:4,mode:'parallel'}} step={step} relief={relief} inverted={inverted}/></div></Frame>;}
const meta={title:'Math/Components/Fusion Targets',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{step:'align',relief:4,inverted:false},argTypes:{step:{control:'inline-radio',options:['align','depth']},relief:{control:{type:'range',min:0,max:20,step:.5}},inverted:{control:'boolean'}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;export const ComplementaryCross:Story={};export const VisibleDepth:Story={args:{step:'depth'}};
