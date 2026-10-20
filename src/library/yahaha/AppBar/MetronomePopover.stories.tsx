import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { MetronomePopover } from './MetronomePopover';
import MetronomePopoverSvelte from './MetronomePopover.svelte';
import { boardMetronome, metronomePopoverArgTypes, metronomePopoverStories as s } from './AppBar.fixtures';

/**
 * The metronome's settings, opened by the app bar's Metronome ▾: the title, then Metronome
 * On/Off, Volume (0–127, a line slider) and Bell on beat 1 (On/Off), each a settings row. A caption
 * says when the click can't sound. Esc or a press outside it asks to close it. Every story is built
 * from AppBar.fixtures.ts; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
 */
const meta = {
  title: 'Yahaha/Components/MetronomePopover',
  component: MetronomePopover,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: {
    ...boardMetronome,
    tipAction: fn(),
    onOn: fn(),
    onVolume: fn(),
    onBell: fn(),
    onClose: fn(),
  },
  argTypes: metronomePopoverArgTypes,
} satisfies Meta<typeof MetronomePopover>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(MetronomePopover, MetronomePopoverSvelte);

/** On, volume 90, the bell on. Off asks for the metronome off, End for volume 127; Esc and a press outside ask to close it. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('dialog', { name: 'Metronome settings' })).toHaveAttribute('id', 'metronome-settings');
    await userEvent.click(canvas.getByRole('button', { name: 'Metronome on/off' }));
    await expect(args.onOn).toHaveBeenLastCalledWith(false);
    const volume = canvas.getByRole('slider', { name: 'Metronome volume' });
    volume.focus();
    await userEvent.keyboard('{End}');
    await expect(args.onVolume).toHaveBeenLastCalledWith(127);
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await fireEvent.pointerDown(document.body);
    await expect(args.onClose).toHaveBeenCalledTimes(2);
  },
};

/** Off, quiet, no bell. */
export const Off: Story = story(s.Off);

/** The built-in synth isn't running: a caption says the click can't sound. */
export const NotAudible: Story = story(s.NotAudible);
