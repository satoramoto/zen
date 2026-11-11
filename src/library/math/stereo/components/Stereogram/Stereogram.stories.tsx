import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../../../storybook';
import {Stereogram} from './Stereogram';
// Stories tagged browser here draw on a canvas: they play in a real browser, not on zen-stories' virtual DOM.
const meta={title:'Math/Stereo/Components/Stereogram',component:Stereogram,decorators:[withLibraryTheme],args:{viewer:{pxPerMm:3.8,distanceMm:600,ipdMm:64},layout:{widthMm:24,gapMm:4,mode:'parallel'},width:600,illusion:'ring',relief:4,grain:1.5},parameters:{docs:{description:{component:'Synthetic display scale. These fixtures do not measure your monitor or establish fusion.'}}}, tags: ['browser'] } satisfies Meta<typeof Stereogram>;
export default meta;type Story=StoryObj<typeof meta>;
export const HiddenRing:Story={};
export const Crossed:Story={args:{layout:{widthMm:24,gapMm:4,mode:'crossed'}}};
