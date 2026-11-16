import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../foundation/stories/story';
import { BarList } from './BarList';
import BarListSvelte from './BarList.svelte';
import { barListStories as s } from './BarList.fixtures';

// Every story is built from BarList.fixtures.ts, which the tree snapshot and the static goldens
// share; the toolbar's Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`.
const meta = {
  title: 'Core/Components/BarList',
  component: BarList,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', spec: { capability: 'library-dashboard-parts', change: 'dashboard-charts' } },
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(BarList, BarListSvelte);

export const HalfTheLargest: Story = scenario(
  {
    name: 'Half the largest',
    requirement: 'Ranked bars against the largest',
    shall: 'A BarList SHALL draw each item\'s bar as a share of the largest item\'s value, never narrower than a visible sliver, with its name, value and note.',
    when: 'a BarList has items of 10 and 5',
    then: 'the second bar is half the width of the first',
    check: async ({ canvasElement }) => {
      const bars = [...canvasElement.querySelectorAll<HTMLElement>('.lib-bars__bar')];
      await expect(bars.map((b) => b.style.width)).toEqual(['100%', '50%', '3.8%', '0.5%']);
      await expect(within(canvasElement).getByRole('link', { name: 'KeryxHashH6' })).toHaveAttribute('href', '#keryx');
      await expect(canvasElement).toHaveTextContent('3 of 4 in reach');
    },
  },
  story(s.Ranked),
);

/** Names only. */
export const Plain: Story = story(s.Plain);
