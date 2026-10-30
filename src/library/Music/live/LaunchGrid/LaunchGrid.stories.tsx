import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { LaunchGrid } from './LaunchGrid';
import LaunchGridSvelte from './LaunchGrid.svelte';
import { launchGridArgTypes, launchGridBoard, launchGridStories as s } from './LaunchGrid.fixtures';

// Every story is built from LaunchGrid.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the grid with no callbacks: read, not played.

/**
 * The looper's session grid in mix[flow]'s face: songs folded above, tracks as columns, loop slots
 * as 24px launch cells, the stop row and the set loop under them.
 */
const meta = {
  id: 'music-live-launch-grid',
  title: 'Music/Live/Launch grid',
  component: LaunchGrid,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 760, h: 300 } },
  args: launchGridBoard,
  argTypes: launchGridArgTypes,
} satisfies Meta<typeof LaunchGrid>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(LaunchGrid, LaunchGridSvelte);

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onLaunch: fn(), onStop: fn(), onStopTrack: fn(), onSelectTrack: fn(), onToggleSong: fn() },
});

/** Hidden Signals open, keys selected. A slot launches, a ■ stops its track, Stop stops them all, a name selects, a song folds. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Keys Pad, stopped' }));
    await expect(args.onLaunch).toHaveBeenCalledWith({ track: 'keys', cell: 'b' });
    await userEvent.click(canvas.getByRole('button', { name: 'Stop Drums' }));
    await expect(args.onStopTrack).toHaveBeenCalledWith('drums');
    await userEvent.click(canvas.getByRole('button', { name: 'Stop all' }));
    await expect(args.onStop).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole('button', { name: 'Select Bass' }));
    await expect(args.onSelectTrack).toHaveBeenCalledWith('bass');
    await userEvent.click(canvas.getByRole('button', { name: '2 Glass, folded' }));
    await expect(args.onToggleSong).toHaveBeenCalledWith('glass');
    await expect(canvas.getByRole('button', { name: 'Select Keys' })).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByRole('progressbar', { name: 'Set loop, bar 5 of 8' })).toBeTruthy();
  },
});

/** Every slot state: playing, queued, recording, stopped, empty, and holes under the short columns. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const states = [...canvasElement.querySelectorAll('[data-part="cell"]')].map((c) => c.getAttribute('data-state'));
    await expect(new Set(states)).toEqual(new Set(['playing', 'queued', 'recording', 'stopped', 'empty']));
    await expect(within(canvasElement).getByRole('button', { name: 'Keys slot 1, recording 1 bar' })).toBeTruthy();
    await expect(canvasElement.querySelectorAll('[data-part="hole"]').length).toBe(7);
  },
});

/** The `rows` form in a smaller frame: no song headers, the grid alone. */
export const Dense: Story = (() => {
  const base = live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.queryByRole('group', { name: 'Songs' })).toBeNull();
      await expect(canvas.getByRole('progressbar', { name: 'Set loop' })).toHaveAttribute('aria-valuenow', '20');
    },
  });
  return { ...base, parameters: { ...base.parameters, frame: { w: 560, h: 200 } } };
})();

/** No songs and no tracks. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No tracks')).toBeTruthy();
  },
});

/** No callbacks: every slot, name, song and stop is drawn but can't be pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});
