import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { ContextControls, type ContextControlsProps } from './ContextControls';
import { powerIconView } from './ContextControls.model';
import './mixer.css';

const meta = {
  id: 'music-controls-contextcontrols',
  title: 'Music/Overlays/Context panel', component: ContextControls,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { label: 'Effects group', pressed: true, onPress: fn(), disabled: false },
  argTypes: { pressed: { control: 'boolean' }, active: { control: 'boolean' }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof ContextControls>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: ContextControlsProps) => {
  const { onPress, face: _face, children: _children, ...props } = args;
  return { tree: h('div', {}, component('MusicContextControls', props, { on: { onPress: 'press' }, slots: {
    face: [powerIconView(), h('span', {}, 'FX')],
    children: [h('p', {}, 'Bypass stops new sends and lets existing tails decay.'), component('MusicButtonFace', { size: 'medium', disabled: true }, { slots: { children: ['Clear tails'] } })],
  } })), handlers: { press: onPress } };
});
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Effects group' });
    await user.click(trigger);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('{Shift>}');
    await user.click(trigger);
    await user.keyboard('{/Shift}');
    await expect(await canvas.findByRole('dialog', { name: 'Effects group' })).toBeInTheDocument();
    await expect(args.onPress).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await user.pointer({ target: trigger, keys: '[MouseRight]' });
    await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
    await user.click(canvas.getByRole('button', { name: 'Close Effects group' }));
    await expect(trigger).toHaveFocus();
    trigger.focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
    canvasElement.ownerDocument.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
export const MenuOnly: Story = {
  ...sample, args: { onPress: undefined, pressed: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Effects group' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  },
};
export const Disabled: Story = {
  ...sample, args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Effects group' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};
