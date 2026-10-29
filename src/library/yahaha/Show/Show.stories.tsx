import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { Show } from './Show';
import ShowSvelte from './Show.svelte';
import { showArgTypes, showStories as s } from './Show.fixtures';

// Every story is the sample set (Show.data.ts: seven songs, Hidden Signals open, jam on) on one
// screen; the toolbar's Renderer draws it with React's or Svelte's `Tree`. Stories only pick the
// tab — the dataset never varies, so a view reads the same in both renderers.

/**
 * The sample set on one screen: seven songs and a jam across five tabs. The strip holds the
 * tabs, the set name and the JAM lamp; the open tab assembles beneath it. Controlled only at
 * the tab: switching asks for `onTab`, JAM for `onJam`, every widget for its own callback.
 */
const meta = {
  title: 'Yahaha/Show',
  component: Show,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  args: { active: 'stage' },
  argTypes: showArgTypes,
} satisfies Meta<typeof Show>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Show, ShowSvelte);

/** A story that can be played: tab, JAM and widget callbacks all spies. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onTab: fn(), onJam: fn(), onLaunch: fn(), onFire: fn() },
});

/** My stage: the loop grid over the mix. Switching tabs asks for `onTab`. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Session grid' }));
    await expect(args.onTab).toHaveBeenCalledWith('grid');
  },
});

/** Session grid: folded songs, eight columns, stops, cuts. */
export const Session: Story = live(s.Session);

/** Arp & follow: the progression strip over the 16-step arp beside the macro throws. */
export const ArpFollow: Story = live(s.ArpFollow);

/** Mix & sends: the column-aligned band, returns right. */
export const MixSends: Story = live(s.MixSends);

/** Stem deck: four Demucs lanes, hot cues, cuts. */
export const Stems: Story = live(s.Stems);

/** JAM off: the loop switch asks for it back. */
export const NoJam: Story = live(s.NoJam, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /JAM/ }));
    await expect(args.onJam).toHaveBeenCalledWith(true);
  },
});

/** Drawn but deaf: dimmed, tools inert. */
export const Disabled: Story = story(s.Disabled);
