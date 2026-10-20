import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { treeStory, withRenderer } from '../../../stories/story';
import { Separator, type SeparatorProps } from './Separator';
import { separatorAppBar, separatorArgTypes, separatorBoard, separatorFull, separatorStories as s } from './Separator.fixtures';

// Every story is a row from Separator.fixtures.ts drawn as a view tree; the toolbar's Renderer
// draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Design OS/Components/Core/Separator',
  component: Separator,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: separatorArgTypes,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The app bar's hairline between Harm/Arp and Library: a short line, as tall as the tab labels. */
export const Board: Story = {
  args: s.Board.args,
  ...treeStory((args: SeparatorProps) => ({ tree: separatorBoard(args) })),
};

/** The line spanning the whole row. */
export const Full: Story = {
  args: s.Full.args,
  ...treeStory((args: SeparatorProps) => ({ tree: separatorFull(args) })),
};

/** In place on an app bar: two tab runs and the right area, split by short lines. */
export const InAppBar: Story = {
  args: s.InAppBar.args,
  ...treeStory((args: SeparatorProps) => ({ tree: separatorAppBar(args) })),
};
