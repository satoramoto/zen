import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { Label, type LabelProps } from './Label';

const meta = {
  id: 'music-controls-label',
  title: 'Music/Foundations/Label', component: Label,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { children: 'Channel', heading: false, hint: 'Channel routing and monitoring.' },
  argTypes: { children: { control: 'text' }, heading: { control: 'boolean' } },
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: LabelProps) => {
  const { children, ...props } = args;
  return { tree: h('div', { style: 'display: grid; gap: 8px; min-width: 180px' },
    component('MusicLabel', props, { slots: { children: [String(children ?? 'Channel')] } }),
    component('MusicDivider', { orientation: 'horizontal' })) };
});
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Channel')).toHaveClass('wdg', 'wdg-label');
    await expect(within(canvasElement).getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  },
};
export const Heading: Story = { ...sample, args: { heading: true } };
export const VerticalDivider: Story = {
  ...treeStory(() => ({ tree: h('div', { style: 'display: flex; height: 32px; align-items: center; gap: 12px' },
    component('MusicLabel', {}, { slots: { children: ['Cue'] } }),
    component('MusicDivider', { orientation: 'vertical' }),
    component('MusicLabel', {}, { slots: { children: ['Master'] } })) })),
};
