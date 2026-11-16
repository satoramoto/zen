import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../foundation/stories/story';
import { Track } from './Track';
import TrackSvelte from './Track.svelte';
import { trackStories as s } from './Track.fixtures';

// Every story is built from Track.fixtures.ts, which the tree snapshot and the static goldens
// share; the toolbar's Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`.
const meta = {
  title: 'Core/Components/Track',
  component: Track,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', spec: { capability: 'library-dashboard-parts', change: 'dashboard-charts', purpose: 'The small parts a dashboard is made of, generic and drawn in every renderer: a value on a rail, a sparkline, ranked bars, a strip of figures and a titled panel.' } },
} satisfies Meta<typeof Track>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Track, TrackSvelte);

export const AboveTheMark: Story = scenario(
  {
    name: 'Above the mark',
    requirement: 'A track places a value against a mark',
    shall: 'A Track SHALL place its value on a rail, as a ratio on a log scale around a mark in the middle or as a share from nothing to all, with a tone and a text name.',
    when: 'a ratio Track is given a value of 2 with a range of a quarter to four times the mark',
    then: 'its dot sits three quarters along, the fill runs from the mark to the dot, and it reads as good',
    check: async ({ canvasElement }) => {
      const root = canvasElement.querySelector<HTMLElement>('.lib-track')!;
      await expect(root).toHaveAttribute('data-tone', 'good');
      await expect(root.querySelector<HTMLElement>('[data-part="dot"]')!.style.left).toBe('75%');
      const fill = root.querySelector<HTMLElement>('[data-part="fill"]')!;
      await expect([fill.style.left, fill.style.width]).toEqual(['50%', '25%']);
      await expect(within(canvasElement).getByRole('img', { name: 'Our multiplier against what KRX needs: 2×' })).toBeInTheDocument();
    },
  },
  story(s.Ahead),
);

/** Just short: close, in the warning colour. */
export const Close: Story = story(s.Close);
/** Well short: quiet grey, never red. */
export const Short: Story = story(s.Short);
/** A tone given from outside wins over the ratio's. */
export const Cleared: Story = story(s.Cleared);
/** A share: from nothing to all, no mark. */
export const Share: Story = story(s.Share);
/** Past the range: held at the edge. */
export const Beyond: Story = story(s.Beyond);
/** No mark, no fill, a wider range. */
export const NoMark: Story = story(s.NoMark);
