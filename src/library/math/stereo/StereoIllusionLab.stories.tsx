import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within,fireEvent} from 'storybook/test';
import {withLibraryTheme} from '../../storybook';
import {StereoIllusionLab} from './StereoIllusionLab';
import {stereoIllusions} from './illusions';
const meta={title:'Math/Stereo Illusion Lab',component:StereoIllusionLab,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{illusion:'ring'},argTypes:{illusion:{control:'select',options:Object.keys(stereoIllusions)}}} satisfies Meta<typeof StereoIllusionLab>;
export default meta;type Story=StoryObj<typeof meta>;
export const HiddenRing:Story={};
export const BowlOrDome:Story={args:{illusion:'bowl'}};
export const Saddle:Story={args:{illusion:'saddle'}};
export const RippleTunnel:Story={args:{illusion:'ripples'}};
export const SecretMessage:Story={args:{illusion:'message'}};
/** The confirmation is a synthetic browser fixture, never a real physical calibration. */
export const CalibrateAndExplore:Story={play:async({canvasElement})=>{
 const c=within(canvasElement);await expect(c.getByRole('button',{name:'Start stereo'})).toBeDisabled();
 await fireEvent.change(c.getByRole('slider',{name:'Calibration reference pixels'}),{target:{value:'200'}});
 await userEvent.click(c.getByRole('button',{name:'Confirm measured screen scale'}));await userEvent.click(c.getByRole('button',{name:'Start stereo'}));
 await expect(c.getByLabelText('Screen scale')).toHaveTextContent('4.00');await expect(c.getByRole('img',{name:'Left eye random-dot image'})).toBeInTheDocument();
 await userEvent.click(c.getByRole('button',{name:'Reverse depth'}));await expect(c.getByRole('button',{name:'Reverse depth'})).toHaveAttribute('aria-pressed','true');
 await userEvent.keyboard('{Escape}');await expect(c.queryByRole('img',{name:'Left eye random-dot image'})).not.toBeInTheDocument();
 await userEvent.click(c.getByRole('button',{name:'Crossed viewing'}));await userEvent.click(c.getByRole('button',{name:'Start stereo'}));
 await expect(canvasElement.querySelector('.zen-dot-stereo')).toHaveAttribute('data-viewing','crossed');
 await userEvent.click(c.getByRole('button',{name:'Flatten depth'}));await expect(c.getByLabelText('Effective relief')).toHaveTextContent('0.0 arcmin');
}};
