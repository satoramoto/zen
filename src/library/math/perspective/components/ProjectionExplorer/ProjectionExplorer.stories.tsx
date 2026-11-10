import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within,fireEvent} from 'storybook/test';
import {withLibraryTheme} from '../../../../storybook';
import {ProjectionExplorer} from './ProjectionExplorer';
const meta={title:'Math/Perspective/Components/Projection Explorer',component:ProjectionExplorer,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{example:'compare'},argTypes:{example:{control:'select',options:['compare','forced','dolly','anamorphic']}}} satisfies Meta<typeof ProjectionExplorer>;
export default meta;type Story=StoryObj<typeof meta>;
export const FourProjections:Story={};
export const ForcedPerspective:Story={args:{example:'forced'}};
export const DollyZoom:Story={args:{example:'dolly'}};
export const AnamorphicMessage:Story={args:{example:'anamorphic'}};
export const BreakTheIllusion:Story={args:{example:'forced'},play:async({canvasElement})=>{
 const c=within(canvasElement);await expect(c.getByLabelText('Corner separation')).toHaveTextContent('0.000');
 await fireEvent.change(c.getByRole('slider',{name:'Viewpoint sideways'}),{target:{value:'1'}});await expect(c.getByLabelText('Corner separation')).not.toHaveTextContent('0.000');
 await userEvent.click(c.getByRole('button',{name:'Reset viewpoint'}));await expect(c.getByLabelText('Corner separation')).toHaveTextContent('0.000');
 const before=c.getByLabelText('Probe world coordinates').textContent;c.getByRole('button',{name:'Move probe in Orthographic view'}).focus();await userEvent.keyboard('{ArrowUp}');await expect(c.getByLabelText('Probe world coordinates')).not.toHaveTextContent(before!);
}};
