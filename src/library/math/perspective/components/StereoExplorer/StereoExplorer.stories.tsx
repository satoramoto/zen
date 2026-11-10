import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {withLibraryTheme} from '../../../../storybook';
import {StereoExplorer} from './StereoExplorer';
const meta={title:'Math/Perspective/Components/Stereo Explorer',component:StereoExplorer,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{example:'depth'},argTypes:{example:{control:'select',options:['depth','convergence','parallax']}}} satisfies Meta<typeof StereoExplorer>;
export default meta;type Story=StoryObj<typeof meta>;
export const BinocularDepth:Story={};
export const ConvergencePlane:Story={args:{example:'convergence'}};
export const MotionParallax:Story={args:{example:'parallax'}};
export const CrossTheZeroPlane:Story={args:{example:'convergence'},play:async({canvasElement})=>{
 const c=within(canvasElement);await expect(c.getByLabelText('Image disparity')).toHaveTextContent('0.000');
 await userEvent.click(c.getByRole('button',{name:'Near target'}));await expect(c.getByLabelText('Relative to zero plane')).toHaveTextContent('In front');
 await userEvent.click(c.getByRole('button',{name:'Far target'}));await expect(c.getByLabelText('Relative to zero plane')).toHaveTextContent('Behind');
 await userEvent.click(c.getByRole('button',{name:'Swap for crossed viewing'}));await expect(c.getAllByRole('heading',{level:2})[0]).toHaveTextContent('Right eye');
 await userEvent.click(c.getByRole('button',{name:'One eye · motion parallax'}));await expect(c.getByLabelText('Image disparity')).toHaveTextContent('0.000');
}};
