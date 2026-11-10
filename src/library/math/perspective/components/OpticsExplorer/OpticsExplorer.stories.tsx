import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {withLibraryTheme} from '../../../../storybook';
import {OpticsExplorer} from './OpticsExplorer';
const meta={title:'Math/Perspective/Components/Optical Paths',component:OpticsExplorer,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{example:'parallel'},argTypes:{example:{control:'select',options:['parallel','leak','coated','aperture']}}} satisfies Meta<typeof OpticsExplorer>;
export default meta;type Story=StoryObj<typeof meta>;
export const MirrorsAndGlass:Story={};
export const InternalReflection:Story={args:{example:'leak'}};
export const ReflectiveCoating:Story={args:{example:'coated'}};
export const FinitePupil:Story={args:{example:'aperture'}};
export const RescueTheRay:Story={args:{example:'leak'},play:async({canvasElement})=>{
 const c=within(canvasElement);await expect(c.getByLabelText('Prism result')).toHaveTextContent('Leaks');await expect(c.getByLabelText('Mirror result')).toHaveTextContent('Two reflections');
 await userEvent.click(c.getByRole('button',{name:'Coat the bevels'}));await expect(c.getByLabelText('Prism result')).toHaveTextContent('exits toward scene');
 await userEvent.click(c.getByRole('button',{name:'Inspect event 2: coated'}));await expect(c.getByLabelText('Boundary event')).toHaveTextContent('coated');
 await userEvent.click(c.getByRole('button',{name:'Show sampled pupil rays'}));await expect(canvasElement.querySelectorAll('.zen-perspective__bench polyline').length).toBe(32);
}};
