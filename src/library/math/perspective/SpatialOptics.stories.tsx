import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within,fireEvent} from 'storybook/test';
import {withLibraryTheme} from '../../storybook';
import {SpatialOptics} from './SpatialOptics';
const meta={title:'Math/Spatial Optics',component:SpatialOptics,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{example:'mirrors'},argTypes:{example:{control:'select',options:['mirrors','prism','escape']}}} satisfies Meta<typeof SpatialOptics>;
export default meta;type Story=StoryObj<typeof meta>;
export const MirrorRelay:Story={};
export const SolidPrism:Story={args:{example:'prism'}};
export const OutOfPlane:Story={args:{example:'escape'}};
export const InspectAPath:Story={args:{example:'prism'},play:async({canvasElement})=>{
 const c=within(canvasElement);await expect(c.getByLabelText('Boundary count')).toHaveTextContent('4');
 await userEvent.click(c.getByRole('button',{name:'Event 2 · TIR'}));await expect(c.getByLabelText('Surface')).toHaveTextContent('Inner bevel');
 await fireEvent.change(c.getByRole('slider',{name:'Inspection tilt'}),{target:{value:'30'}});await expect(c.getByLabelText('Boundary count')).toHaveTextContent('4');
 await fireEvent.change(c.getByRole('slider',{name:'Ray elevation'}),{target:{value:'5'}});await expect(c.getByLabelText('Event height')).not.toHaveTextContent('0.0 mm');
}};
