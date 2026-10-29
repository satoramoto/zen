import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { LoopGrid } from './LoopGrid';
import LoopGridSvelte from './LoopGrid.svelte';
import { loopBoard, loopGridArgTypes, loopGridStories as s, loopSongs } from './LoopGrid.fixtures';

// Every story is built from LoopGrid.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`.

/**
 * The set as a folded grid: song headers, eight column-aligned track columns of loop cells, and a
 * pinned stop row with one phase pie per track. Controlled: a cell asks for `onLaunch`, a song
 * for `onToggleSong`, the stop button for `onStop`.
 */
const meta = {
  title: 'Design OS/Components/Music/LoopGrid',
  component: LoopGrid,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { songs: loopSongs, tracks: loopBoard, loop: { phase: 0.5, bars: 8 } },
  argTypes: loopGridArgTypes,
} satisfies Meta<typeof LoopGrid>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(LoopGrid, LoopGridSvelte);

/** A story that can be played: every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onLaunch: fn(), onStop: fn(), onSelectTrack: fn(), onToggleSong: fn(), onStopTrack: fn() },
});

/** The set at bar 17: two songs folded, Hidden Signals open, Keys recording its third bar. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('button', { name: 'Drums Main, playing' });
    await expect(cell).toHaveAttribute('data-state', 'playing');
    await userEvent.click(cell);
    await expect(args.onLaunch).toHaveBeenCalledWith({ track: 'drums', cell: 'a' });
  },
});

/** Every state at once: an open song, a folded one, a recording stop row. */
export const EveryState: Story = live(s.EveryState);

/** The `rows` form: no song headers, the open song's tracks plus the stop row. */
export const Dense: Story = live(s.Dense);

/** No songs, no tracks: the stop row alone. */
export const Empty: Story = live(s.Empty);

/** Drawn but deaf: every button `aria-disabled`, nothing fires. */
export const Disabled: Story = story(s.Disabled);
