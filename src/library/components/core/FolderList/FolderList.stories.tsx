import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { FolderList, type FolderListProps } from './FolderList';
import FolderListSvelte from './FolderList.svelte';
import { folderListArgTypes, folderListStories as s } from './FolderList.fixtures';

// Every story is built from FolderList.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. React plays the parent
// (`Live`: a press or a key moves `chosen`); Svelte draws the fixture as given, controlled.

/** Plays the parent: a press or an arrow key moves `chosen`, and the story's action logs it. */
function Live(args: FolderListProps) {
  const [chosen, setChosen] = useState(args.chosen ?? null);
  return (
    <FolderList
      {...args}
      chosen={chosen}
      onChoose={(id) => {
        setChosen(id);
        args.onChoose?.(id);
      }}
    />
  );
}

/**
 * A vertical one-of-many list: the Library's style folders and sound categories. The chosen row
 * takes the `--selected` fill; counts form a quiet right-aligned column. One tab stop; ↑ ↓ Home
 * End move along the rows and choose. The parent owns `chosen`.
 */
const meta = {
  title: 'Design OS/Components/Core/FolderList',
  component: FolderList,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { ...(s.Styles.args as FolderListProps), onChoose: fn() },
  argTypes: folderListArgTypes,
  render: (args) => <Live key={String(args.chosen)} {...args} />,
} satisfies Meta<typeof FolderList>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(FolderList, FolderListSvelte);

/** The style folders, Pop & Rock chosen; taller than its box, so it scrolls. */
export const Styles: Story = story(s.Styles);

/** ↑ ↓ Home End move focus and choose; the keys stop at the ends and skip disabled rows. */
export const Keys: Story = story(s.Keys);

/** The sound categories, none chosen: the first row takes the tab stop. */
export const Sounds: Story = story(s.Sounds);

/** Narrow: long names keep their last word, so "…name" still tells the folder apart. */
export const Narrow: Story = story(s.Narrow);
