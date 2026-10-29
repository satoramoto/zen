import type { Meta,StoryObj } from '@storybook/react-vite';
import { expect,fn,userEvent,within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories,withRenderer } from '../../../stories/story';
import { PlotViewport } from './PlotViewport';
import PlotViewportSvelte from './PlotViewport.svelte';
import { plotViewportStories as s } from './PlotViewport.fixtures';
const meta={title:'Design OS/Math/PlotViewport',component:PlotViewport,decorators:[withRenderer,withLibraryTheme],args:{onSelect:fn(),onCameraChange:fn(),onHover:fn(),onBinHover:fn(),onClearSelection:fn()},parameters:{layout:'padded'}} satisfies Meta<typeof PlotViewport>;
export default meta;
type Story=StoryObj<typeof meta>;
const story=fixtureStories<Story>(PlotViewport,PlotViewportSvelte);
export const Grid:Story=story(s.Grid,{play:async({canvasElement,args})=>{const plot=within(canvasElement).getByRole('group',{name:'Integer point grid'});plot.focus();await userEvent.keyboard('{ArrowRight}');await expect(args.onSelect).toHaveBeenCalledWith('37');await userEvent.keyboard('{Home}');await expect(args.onCameraChange).toHaveBeenCalledWith({x:0,y:0,zoom:1,rotation:35});}});
export const Volume:Story=story(s.Volume);
export const Empty:Story=story(s.Empty);

export const Density:Story=story(s.Density,{play:async({canvasElement})=>{const plot=within(canvasElement).getByRole('group',{name:'Integer density grid'});await expect(plot).toHaveAttribute('data-render-mode','density');await expect(plot.querySelectorAll('[data-bin-id]').length).toBeLessThanOrEqual(1936);await expect(plot.querySelector('[data-indicator=selection]')).toBeInTheDocument();}});
