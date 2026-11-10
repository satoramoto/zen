import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { withLibraryTheme } from '../../../storybook';
import { withMusicScope } from '../../preview';
import { SeekBar } from './SeekBar';
import SeekBarSvelte from './SeekBar.svelte';
import { SeekBarHost } from './SeekBarHost.story';
import SeekBarHostSvelte from './SeekBarHost.story.svelte';

const meta = {
  id: 'music-seek-bar', title: 'Music/Components/SeekBar', component: SeekBar,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  args: { duration: 120, position: 20, label: 'Playback position', onSeek: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SeekBar>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SeekBar, SeekBarSvelte);
const tick = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
export const Default: Story = story({ args: {} }, {
  async play({ canvasElement, args }) {
    const slider = within(canvasElement).getByRole('slider');
    const box = slider.getBoundingClientRect();
    const pointer = { pointerId: 71, button: 0, clientY: box.y + box.height / 2 };
    await fireEvent.pointerDown(slider, { ...pointer, clientX: box.x + box.width / 2 });
    await tick();
    await expect(args.onSeek).toHaveBeenLastCalledWith(60);
    await expect(slider).toHaveAttribute('aria-valuenow', '60');
    await fireEvent.pointerMove(slider, { ...pointer, clientX: box.right });
    await tick();
    await expect((args.onSeek as ReturnType<typeof fn>).mock.lastCall?.[0]).toBeCloseTo(120, 5);
    await fireEvent.pointerUp(slider, pointer);
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '20'));
    for (const key of ['Home', 'ArrowLeft', 'End', 'ArrowRight']) {
      await fireEvent.keyDown(slider, { key });
      await expect(args.onSeek).toHaveBeenLastCalledWith(key === 'Home' || key === 'ArrowLeft' ? 0 : 120);
    }
    await fireEvent.pointerDown(slider, { ...pointer, clientX: box.x });
    await tick();
    await expect(args.onSeek).toHaveBeenLastCalledWith(0);
    const calls = (args.onSeek as ReturnType<typeof fn>).mock.calls.length;
    await fireEvent.pointerMove(slider, { ...pointer, clientX: box.right });
    await fireEvent.keyDown(slider, { key: 'Escape' });
    await tick();
    await expect(args.onSeek).toHaveBeenCalledTimes(calls);
    await expect(slider).toHaveAttribute('aria-valuenow', '20');
    for (const type of ['pointercancel', 'lostpointercapture']) {
      await fireEvent.pointerDown(slider, { ...pointer, clientX: box.x });
      await fireEvent(slider, new PointerEvent(type, { bubbles: true, pointerId: 71 }));
      await tick();
      await expect(slider).toHaveAttribute('aria-valuenow', '20');
    }
  },
});
export const HostUpdates: Story = { ...fixtureStories<Story>(SeekBarHost, SeekBarHostSvelte)({ args: {} }, {
  async play({ canvasElement }) {
    const slider = within(canvasElement).getByRole('slider');
    const box = slider.getBoundingClientRect();
    await fireEvent.pointerDown(slider, { pointerId: 9, button: 0, clientX: box.x + box.width / 2 });
    await tick();
    await expect(slider).toHaveAttribute('aria-valuenow', '60');
    await fireEvent.click(within(canvasElement).getByRole('button', { name: 'Update host position' }));
    await tick();
    await expect(slider).toHaveAttribute('aria-valuenow', '60');
    await fireEvent.pointerUp(slider, { pointerId: 9 });
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '35'));
  },
}), render: args => <SeekBarHost {...args} /> };
async function inert({ canvasElement, args }: { canvasElement: HTMLElement; args: typeof meta.args }) {
  const slider = within(canvasElement).getByRole('slider');
  await fireEvent.pointerDown(slider, { pointerId: 1, button: 0 });
  await fireEvent.keyDown(slider, { key: 'End' });
  await tick();
  await expect(args.onSeek).not.toHaveBeenCalled();
  await expect(slider).toHaveAttribute('aria-disabled', 'true');
}
export const Disabled: Story = story({ args: {} }, { args: { disabled: true }, play: inert });
export const ZeroDuration: Story = story({ args: {} }, { args: { duration: 0 }, play: inert });
export const InvalidDuration: Story = story({ args: {} }, { args: { duration: Number.NaN, position: Infinity }, play: inert });
export const OutOfRange: Story = story({ args: {} }, { args: { position: 999 },
  async play({ canvasElement }) { await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuenow', '120'); },
});
