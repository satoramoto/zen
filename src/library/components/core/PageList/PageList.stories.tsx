import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { PageList, type PageListProps } from './PageList';
import PageListSvelte from './PageList.svelte';
import { pageListArgTypes, pageListStories as s } from './PageList.fixtures';

// Every story is built from PageList.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`.

/**
 * A vertical list of pages, one row each, the open one a `--selected` block. Page navigation:
 * buttons with `aria-current="page"`; ↑ ↓ Home End move focus and call `onChoose`. Controlled: the
 * parent moves `chosen`.
 */
const meta = {
  title: 'Design OS/Components/Core/PageList',
  component: PageList,
  decorators: [
    withRenderer,
    (Story) => (
      <div style={{ width: 220, padding: 'var(--space-4)' }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: { ...(s.Board.args as PageListProps), onChoose: fn() },
  argTypes: pageListArgTypes,
} satisfies Meta<typeof PageList>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(PageList, PageListSvelte);

/** The Settings screen's left column: Chord & Split open, then Style … Controller, names only. */
export const Board: Story = story(s.Board);

/** Keys: ↑ ↓ wrap, Home and End jump; each move focuses the row and calls `onChoose`. */
export const Keys: Story = story(s.Keys);

/** The System page open: the block moves with `chosen`, and only that row is current. */
export const SystemOpen: Story = story(s.SystemOpen);

/** No page open: every row at rest. */
export const NoneOpen: Story = story(s.NoneOpen);

/** A narrow column: long names end in an ellipsis and keep their first words. */
export const LongNames: Story = {
  ...story(s.LongNames),
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
};
