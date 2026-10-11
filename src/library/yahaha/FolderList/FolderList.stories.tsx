import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { FolderList, type FolderListProps } from './FolderList';
import { soundCategories, styleFolders } from './FolderList.fixtures';

const ALL_IDS = [...styleFolders, ...soundCategories].map((item) => item.id);

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
  title: 'Library/Yahaha/Primitives/FolderList',
  component: FolderList,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: {
    items: styleFolders,
    chosen: 'pop',
    label: 'Style folders',
    width: 220,
    height: 280,
    onChoose: fn(),
  },
  argTypes: {
    items: { control: 'object' },
    chosen: { control: 'select', options: [null, ...ALL_IDS] },
    label: { control: 'text' },
    width: { control: { type: 'number', min: 80, step: 10 } },
    height: { control: { type: 'number', min: 28, step: 28 } },
  },
  render: (args) => <Live key={String(args.chosen)} {...args} />,
} satisfies Meta<typeof FolderList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The style folders, Pop & Rock chosen; taller than its box, so it scrolls. */
export const Styles: Story = {};

/** ↑ ↓ Home End move focus and choose; the keys stop at the ends and skip disabled rows. */
export const Keys: Story = {};

/** The sound categories, none chosen: the first row takes the tab stop. */
export const Sounds: Story = {
  args: { items: soundCategories, chosen: null, label: 'Sound categories', height: 252 },
};

/** Narrow: long names keep their last word, so "…name" still tells the folder apart. */
export const Narrow: Story = {
  args: { chosen: 'user', width: 160 },
};
