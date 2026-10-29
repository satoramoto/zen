import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { Toggle, type ToggleProps } from './Toggle';
import { PressableHarness } from './ToggleHarness';
import PressableHarnessSvelte from './ToggleHarness.svelte';
import { pressableHostStories } from './ToggleHarness.fixtures';

const meta = {
  id: 'music-controls-toggle',
  title: 'Music/Controls/Toggle', component: Toggle,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { on: false, onChange: fn(), label: 'Loop', name: 'Loop', children: 'Loop', disabled: false, momentary: false },
  argTypes: { on: { control: 'boolean' }, disabled: { control: 'boolean' }, momentary: { control: 'boolean' }, layout: { control: 'radio', options: ['stacked', 'inside'] } },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: ToggleProps) => {
  const { onChange, children, ...props } = args;
  return { tree: h('div', { style: args.layout === 'inside' ? 'min-width: 180px' : undefined }, component('MusicToggle', props, { on: { onChange: 'change' }, slots: { children: [String(children ?? 'Loop')] } })), handlers: { change: onChange } };
});
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const stage = canvasElement.querySelector<HTMLElement>('[data-music-stage="specimen"]')!;
    await expect(stage).toBeInTheDocument();
    await expect(getComputedStyle(stage.closest('.lib-scope')!).minHeight).toBe('0px');
    await expect(stage.getBoundingClientRect().height).toBeLessThan(window.innerHeight);
    const button = within(canvasElement).getByRole('button', { name: 'Loop' });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    button.focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};
export const On: Story = { ...sample, args: { on: true } };
export const Live: Story = {
  ...fixtureStories<Story>(PressableHarness, PressableHarnessSvelte)(pressableHostStories.Toggle),
  render: args => <PressableHarness {...args} control="toggle" children={String(args.children ?? '')} />,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Loop' });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveAttribute('data-on');
    await userEvent.keyboard(' ');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};
export const Inside: Story = { ...sample, args: { layout: 'inside', on: true, children: 'On' } };
export const Momentary: Story = {
  ...sample, args: { momentary: true },
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const button = within(canvasElement).getByRole('button', { name: 'Loop' });
    await expect(button).not.toHaveAttribute('aria-pressed');
    await user.pointer({ target: button, keys: '[MouseLeft>]' });
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    button.dispatchEvent(new Event('pointerleave'));
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    await user.pointer({ target: button, keys: '[/MouseLeft]' });
    button.focus();
    await user.keyboard('[Space>]');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Escape}[/Space]');
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};
export const Disabled: Story = {
  ...sample, args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Loop' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
