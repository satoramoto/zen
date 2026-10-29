import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import type { FixtureProps } from '../../../fixtures';
import type { TransportModelProps } from './Transport.model';
import { Transport } from './Transport';
import TransportSvelte from './Transport.svelte';
import { transportArgTypes, transportStories as s } from './Transport.fixtures';

// Every story is built from Transport.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`.

/**
 * Playback, its tempo and where the head is: play, stop, loop, tempo and a position reading in
 * one row. Controlled: pressing play asks for the opposite of `playing`, the reading toggles
 * beats/seconds.
 */
const meta = {
  title: 'Design OS/Components/Music/Transport',
  component: Transport,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { playing: true, position: { seconds: 96, bar: 48.5, bars: 64 } },
  argTypes: transportArgTypes,
} satisfies Meta<typeof Transport>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Transport, TransportSvelte);

/** A story that can be played: every callback a spy, the tempo editable. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => {
  const data = (fixture.args ?? {}) as FixtureProps<TransportModelProps>;
  return {
    ...story(fixture, extra),
    args: {
      ...fixture.args,
      onPlay: fn(),
      onStop: fn(),
      onUnit: fn(),
      tempo: data.tempo ? { ...data.tempo, onChange: fn() } : undefined,
    },
  };
};

/** Playing, looped at 112: pausing asks for `false`. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
    await expect(args.onPlay).toHaveBeenCalledWith(false);
  },
});

/** Stopped, looped, part-looped, clock-only: every face at once. */
export const EveryState: Story = live(s.EveryState);

/** Play and the reading in a narrow frame: the `compact` form. */
export const Dense: Story = live(s.Dense);

/** Nothing playing, no tempo: two buttons and a clock. */
export const Empty: Story = live(s.Empty);

/** Drawn but deaf: dimmed, nothing fires. */
export const Disabled: Story = story(s.Disabled);
