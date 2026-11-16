import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../foundation/stories/story';
import { Panel } from './Panel';
import PanelSvelte from './Panel.svelte';
import { panelStories as s } from './Panel.fixtures';

// Every story is built from Panel.fixtures.ts, which the tree snapshot and the static goldens
// share; the toolbar's Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`.
const meta = {
  title: 'Core/Layouts/Panel',
  component: Panel,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', spec: { capability: 'library-dashboard-parts', change: 'dashboard-charts' } },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Panel, PanelSvelte);

export const AnEmptyPanel: Story = scenario(
  {
    name: 'An empty panel',
    requirement: 'A titled panel',
    shall: 'A Panel SHALL draw its title as a heading of the level given, an aside beside it, and its body, or its empty message when it has no body.',
    when: 'a Panel has no body and an empty message',
    then: 'the message is drawn under the heading',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByRole('heading', { level: 2, name: 'Feed' })).toBeInTheDocument();
      await expect(canvasElement.querySelector('[data-part="empty"]')).toHaveTextContent('Nothing yet');
      await expect(canvasElement.querySelector('[data-part="body"]')).toBeNull();
    },
  },
  story(s.Empty),
);

/** A linked title, its aside and a body. */
export const Coins: Story = {
  ...story(s.Coins),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Coins in reach' })).toHaveAttribute('href', '#board');
    await expect(canvasElement.querySelector('[data-part="body"]')).toHaveTextContent('Sixteen coins.');
  },
};
/** A third-level heading. */
export const Nested: Story = story(s.Nested);
/** A dense dashboard's panel: the title at label size, set strong. */
export const Dense: Story = {
  ...story(s.Dense),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('.lib-panel__title')!;
    await expect(title).toHaveAttribute('data-text-size', 'label');
    await expect(title).toHaveAttribute('data-text-weight', 'strong');
  },
};
