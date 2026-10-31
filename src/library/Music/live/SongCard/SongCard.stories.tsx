import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { SongCard, type SongCardProps } from './SongCard';
import SongCardSvelte from './SongCard.svelte';
import { songCardArgTypes, songCardBoard, songCardStories as s } from './SongCard.fixtures';

// Every story is built from SongCard.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`. Disabled is the card with no `onJam`: no JAM.

/** The song now and the song next, the ONE board's header card, with JAM. */
const meta = {
  id: 'music-live-song-card',
  title: 'Music/Live/Song card',
  component: SongCard,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 360, h: 88 } },
  args: songCardBoard,
  argTypes: songCardArgTypes,
} satisfies Meta<typeof SongCard>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SongCard, SongCardSvelte);
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({ ...story(fixture, extra), args: { ...fixture.args, onJam: fn() } });

/** Song 3 of 7, Big Red cued in 6 bars. JAM asks; the card stays on the song until the host says otherwise. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Song 3/7: Hidden Signals' })).toBeTruthy();
    await expect(canvasElement.querySelector('[data-part="reading"]')).toHaveTextContent('120 · Am');
    await expect(canvasElement.querySelector('[data-part="next"]')).toHaveTextContent('Next · Big Red · 128 · E');
    await expect(canvasElement.querySelector('[data-part="cue"]')).toHaveTextContent('cued · in 6 bars');
    await userEvent.click(canvas.getByRole('button', { name: 'Jam from here' }));
    await expect(args.onJam).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Jam from here' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('heading', { name: 'Hidden Signals' })).toBeTruthy();
  },
});

/** In a jam: "Free · jam", the next song only ahead, JAM lit. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Free · jam' })).toBeTruthy();
    await expect(canvas.getByRole('button', { name: 'Jam, playing' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('[data-part="cue"]')).toHaveTextContent('next');
    await expect(canvasElement.querySelector('[data-part="next"]')).not.toHaveAttribute('data-cued');
  },
});

/** The `chip` form: one status line, nothing to press. */
export const Dense: Story = framed(
  live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('status')).toHaveTextContent('3/7 Hidden Signals → Big Red in 6 bars');
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
      await expectFits(canvasElement);
    },
  }),
  320,
  32,
);

/** Between songs: no reading, no next, nothing invented. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'between songs' })).toBeTruthy();
    await expect(canvasElement.querySelector('[data-part="reading"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-part="next"]')).toBeNull();
  },
});

/** No `onJam`: the card is read, there is no JAM. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
  },
});

/** A host that goes free on JAM, and back to the song on a second press. */
const jam = host<SongCardProps>({ apply: { onJam: (p) => ({ jam: !p.jam, song: p.jam ? songCardBoard.song : undefined }) } });

/** Controlled readback: JAM (click or Space) lights and the card reads the jam once the host goes free; again, and the song is back. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...jam },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Jam from here' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Jam, playing' })).toHaveAttribute('aria-pressed', 'true'));
    await expect(canvas.getByRole('heading', { name: 'Free · jam' })).toBeTruthy();
    canvas.getByRole('button', { name: 'Jam, playing' }).focus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(canvas.getByRole('heading', { name: 'Hidden Signals' })).toBeTruthy());
    await expect(canvas.getByRole('button', { name: 'Jam from here' })).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onJam).toHaveBeenCalledTimes(2);
  },
});

/** Rebinding: the host moves the set on. The card reads the new song and its next. */
export const Rebound: Story = live(s.Default, {
  parameters: {
    ...story(s.Default).parameters,
    host: { ...jam.host, presets: { 'Next song': { song: { id: 'big-red', name: 'Big Red', tempo: 128, key: 'E' }, index: 4, next: { id: 'low-tide', name: 'Low Tide', tempo: 84, key: 'Dm' } } } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next song' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Song 4/7: Big Red' })).toBeTruthy());
    await expect(canvasElement.querySelector('[data-part="cue"]')).toHaveTextContent('next');
  },
});
