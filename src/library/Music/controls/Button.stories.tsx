import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { Button, type ButtonProps } from './Button';

const meta = {
  id: 'music-controls-button',
  title: 'Music/Controls/Button', component: Button,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { onPress: fn(), label: 'Delete', children: 'Delete', disabled: false, tone: 'normal' },
  argTypes: { children: { control: 'text' }, tone: { control: 'radio', options: ['normal', 'quiet', 'danger'] }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: ButtonProps) => {
  const { onPress, children, ...props } = args;
  return { tree: h('div', {}, component('MusicButton', props, { on: { onPress: 'press' }, slots: { children: [String(children ?? 'Delete')] } })), handlers: { press: onPress } };
});

export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Delete' });
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onPress).toHaveBeenCalledTimes(3);
  },
};
export const Disabled: Story = {
  ...sample, args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Delete' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};
export const Quiet: Story = { ...sample, args: { tone: 'quiet', children: '×', label: 'Close' } };
export const Danger: Story = { ...sample, args: { tone: 'danger' } };
