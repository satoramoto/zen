import {useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../../../storybook';
import {DisplayCalibration} from './DisplayCalibration';
import {Frame} from '../../../perspective/shared';
function Specimen(){const [viewer,setViewer]=useState({pxPerMm:3.8,distanceMm:600,ipdMm:64}),[confirmed,setConfirmed]=useState(false);return <Frame eyebrow="Primitive / physical scale" title="Pixels become millimetres." description="Match a real ruler to the reference, then confirm. The resulting scale belongs to this monitor at this browser zoom."><DisplayCalibration viewer={viewer} onChange={setViewer} confirmed={confirmed} onConfirm={()=>setConfirmed(true)} onInvalidate={()=>setConfirmed(false)}/><output aria-label="Measured pixel scale">{confirmed?`${viewer.pxPerMm.toFixed(2)} CSS px/mm`:'Not confirmed'}</output></Frame>;}
const meta={title:'Math/Stereo/Components/Display Calibration',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;export const RulerReference:Story={};
