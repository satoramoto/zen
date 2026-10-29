import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { component, h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import type { ButtonFaceProps } from './ButtonFace';

type FaceStoryProps = Pick<ButtonFaceProps, 'lit' | 'size' | 'onClick' | 'disabled' | 'aria-label' | 'aria-pressed'>;

const meta = {
  id: 'music-controls-buttonface',
  title: 'Music/Foundations/Button face',
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { 'aria-label': 'Power', size: 'medium', onClick: fn(), disabled: false, lit: false },
  argTypes: { size: { control: 'radio', options: ['small', 'medium'] }, disabled: { control: 'boolean' }, lit: { control: 'boolean' } },
} satisfies Meta<FaceStoryProps>;
export default meta;
type Story = StoryObj<FaceStoryProps>;
const sample = treeStory((args: ButtonFaceProps) => {
  const { onClick, children: _children, ref: _ref, ...props } = args;
  return { tree: h('div', {}, component('MusicButtonFace', props, { on: { onClick: 'press' }, slots: { children: ['⏻'] } })), handlers: { press: onClick } };
});
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Power' });
    await expect(button).toHaveClass('wdg-body', 'wdg-toggle-body');
    await expect(button).not.toHaveAttribute('aria-pressed');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
export const Lit: Story = { ...sample, args: { lit: true, 'aria-pressed': true } };
export const Disabled: Story = {
  ...sample, args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Power' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
