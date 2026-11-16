import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../foundation/stories/story';
import { Sparkline } from './Sparkline';
import SparklineSvelte from './Sparkline.svelte';
import { sparklineStories as s } from './Sparkline.fixtures';

// Every story is built from Sparkline.fixtures.ts, which the tree snapshot and the static goldens
// share; the toolbar's Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`.
const meta = {
  title: 'Core/Components/Sparkline',
  component: Sparkline,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', spec: { capability: 'library-dashboard-parts', change: 'dashboard-charts' } },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Sparkline, SparklineSvelte);

export const ARisingLine: Story = scenario(
  {
    name: 'A rising line',
    requirement: 'A sparkline draws values small',
    shall: 'A Sparkline SHALL draw its values as a small line, toned by whether the last value is above the first, with a text name.',
    when: 'a Sparkline is drawn with rising values',
    then: 'the line reads as up and its name says so',
    check: async ({ canvasElement }) => {
      const spark = within(canvasElement).getByRole('img', { name: 'KRX yield, 7 days, up' });
      await expect(spark).toHaveAttribute('data-direction', 'up');
      await expect(spark.querySelector('.lib-spark__line')!.getAttribute('d')).toMatch(/^M0 /);
      await expect(spark.querySelector('[data-part="dot"]')).not.toBeNull();
    },
  },
  story(s.Up),
);

/** Falling, with its area. */
export const Down: Story = story(s.Down);
/** Level, no dot. */
export const Flat: Story = story(s.Flat);
/** One reading. */
export const Single: Story = story(s.Single);
