import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../foundation/stories/story';
import { FigureStrip } from './FigureStrip';
import FigureStripSvelte from './FigureStrip.svelte';
import { figureStripStories as s } from './FigureStrip.fixtures';

// Every story is built from FigureStrip.fixtures.ts, which the tree snapshot and the static goldens
// share; the toolbar's Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`.
const meta = {
  title: 'Core/Components/FigureStrip',
  component: FigureStrip,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', spec: { capability: 'library-dashboard-parts', change: 'dashboard-charts' } },
} satisfies Meta<typeof FigureStrip>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(FigureStrip, FigureStripSvelte);

export const FiveFigures: Story = scenario(
  {
    name: 'Five figures',
    requirement: 'A strip of figures',
    shall: 'A FigureStrip SHALL show each figure\'s label, value and note, and may lead with its first.',
    when: 'a FigureStrip is given five figures',
    then: 'each is drawn as a term and its value with its note',
    check: async ({ canvasElement }) => {
      const terms = [...canvasElement.querySelectorAll('dt')].map((t) => t.textContent);
      await expect(terms).toEqual(['Coins in reach', 'On the table', 'Hardware clearing 20%', 'Yield 24h', 'Network']);
      await expect(canvasElement.querySelectorAll('dd')).toHaveLength(5);
      await expect(canvasElement.querySelector('[data-lead]')).toHaveTextContent('16');
      await expect(within(canvasElement).getByRole('link', { name: '16' })).toHaveAttribute('href', '#board');
    },
  },
  story(s.Today),
);

/** Even figures. */
export const Even: Story = story(s.Even);
