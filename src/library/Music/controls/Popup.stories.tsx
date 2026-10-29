import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../stories/story';
import { h } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { buttonFaceView } from './ButtonFace.model';
import { popupHandlers, popupView, type PopupModelProps } from './Popup.model';
import { Popup } from './Popup';

const meta = {
  id: 'music-controls-popup',
  title: 'Music/Overlays/Popup', component: Popup,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { anchor: { left: 40, top: 48, bottom: 72, width: 112 }, label: 'Floating controls', role: 'dialog', onDismiss: fn(), className: 'wdg-select-menu' },
} satisfies Meta<typeof Popup>;
export default meta;
type Story = StoryObj<typeof meta>;
const sample = treeStory((args: PopupModelProps) => {
  const props = { ...args, anchor: () => document.getElementById('music-popup-story-anchor') };
  const face = buttonFaceView({ id: 'music-popup-story-anchor', size: 'medium', 'aria-label': 'Popup anchor' });
  face.children = ['Anchor'];
  const popup = popupView(props);
  popup.children = [h('div', { style: 'padding: 8px' }, 'The host controls this panel’s lifetime.')];
  return { tree: h('div', {}, face, popup), handlers: popupHandlers(props) };
});

/** Mounted is open: dismissal reports a reason; the host decides when to unmount it. */
export const Default: Story = {
  ...sample,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole('dialog', { name: 'Floating controls' });
    await expect(panel).toHaveAttribute('popover', 'manual');
    await userEvent.pointer({ target: canvas.getByRole('button', { name: 'Popup anchor' }), keys: '[MouseLeft]' });
    await expect(args.onDismiss).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await expect(args.onDismiss).toHaveBeenLastCalledWith('escape');
    canvasElement.ownerDocument.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    await expect(args.onDismiss).toHaveBeenLastCalledWith('wheel');
    canvasElement.ownerDocument.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await expect(args.onDismiss).toHaveBeenLastCalledWith('pointer');
  },
};
export const RememberedAnchor: Story = {
  ...treeStory((props: PopupModelProps) => {
    const popup = popupView(props);
    popup.children = [h('div', { style: 'padding: 8px' }, 'A remembered box dismisses when its surface moves.')];
    return { tree: h('div', {}, popup), handlers: popupHandlers(props) };
  }),
  play: async ({ canvasElement, args }) => {
    canvasElement.ownerDocument.defaultView!.dispatchEvent(new Event('resize'));
    await expect(args.onDismiss).toHaveBeenLastCalledWith('stale');
  },
};
