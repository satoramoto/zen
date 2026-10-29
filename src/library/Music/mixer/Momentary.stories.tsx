import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { Momentary, type MomentaryProps } from './Momentary';
import { PressableHarness } from '../controls/ToggleHarness';
import PressableHarnessSvelte from '../controls/ToggleHarness.svelte';
import { pressableHostStories } from '../controls/ToggleHarness.fixtures';
import './mixer.css';

const meta = {
  id: 'music-controls-momentary',
  title: 'Music/Controls/Hold button', component: Momentary,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { label: 'Deck 1 transport cue', held: false, disabled: false, onHold: fn(), onTakeover: fn() },
  argTypes: { held: { control: 'boolean' }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof Momentary>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: MomentaryProps) => {
  const { onHold, onTakeover, children: _children, ...props } = args;
  return { tree: h('div', {}, component('MusicMomentary', props, { on: { onHold: 'hold', onTakeover: 'takeover' }, slots: { children: ['CUE'] } })), handlers: { hold: onHold, takeover: onTakeover } };
});
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const button = within(canvasElement).getByRole('button', { name: 'Deck 1 transport cue' });
    await user.pointer({ target: button, keys: '[MouseLeft>]' });
    await expect(args.onHold).toHaveBeenLastCalledWith(true);
    await user.pointer({ target: button, keys: '[/MouseLeft]' });
    await expect(args.onHold).toHaveBeenLastCalledWith(false);
    button.focus();
    await user.keyboard('[Space>]{Enter}');
    await expect(args.onTakeover).toHaveBeenCalledTimes(1);
    await expect(args.onHold).toHaveBeenLastCalledWith(true);
    await user.keyboard('[/Space]');
    await expect(args.onHold).toHaveBeenLastCalledWith(false);
    await user.keyboard('{Enter}');
    await expect(args.onHold).toHaveBeenCalledTimes(6);
  },
};
export const Cancel: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const button = within(canvasElement).getByRole('button');
    await user.pointer({ target: button, keys: '[MouseLeft>]' });
    button.dispatchEvent(new Event('pointercancel'));
    await expect(args.onHold).toHaveBeenLastCalledWith(false);
    await user.pointer({ target: button, keys: '[/MouseLeft]' });
    await expect(args.onHold).toHaveBeenCalledTimes(2);
    button.focus();
    await user.keyboard('[Space>]{Escape}[/Space]');
    await expect(args.onHold).toHaveBeenCalledTimes(4);
  },
};
export const Held: Story = { ...sample, args: { held: true } };
export const Live: Story = {
  ...fixtureStories<Story>(PressableHarness, PressableHarnessSvelte)(pressableHostStories.Momentary),
  render: args => <PressableHarness {...args} control="momentary" children="CUE" />,
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const button = within(canvasElement).getByRole('button', { name: 'Deck 1 transport cue' });
    button.focus();
    await user.keyboard('[Space>]');
    await expect(button).toHaveAttribute('data-on');
    await user.keyboard('[/Space]');
    await expect(button).not.toHaveAttribute('data-on');
  },
};
export const Disabled: Story = {
  ...sample, args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onHold).not.toHaveBeenCalled();
  },
};
