import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer, type StoryView } from '../stories/story';
import { groupArgTypes, groupArgs, groupSample, groupStoryArgs, type GroupArgs, type GroupStory } from './Group.fixtures';

// Every story is a view tree built in Group.fixtures.ts (`groupSample`, Buttons standing in for
// the controls), which the tree snapshot shares; the toolbar's Renderer draws it with React's or
// Svelte's `Tree`.
const sample =
  (story: GroupStory): StoryView<GroupArgs> =>
  (args) => ({ tree: groupSample({ ...args, story }) });

const meta: Meta<GroupArgs> = {
  title: 'Design OS/Layout/Group',
  decorators: [withRenderer, withLibraryTheme],
  render: treeStory(sample('Default')).render,
  parameters: { layout: 'fullscreen', ...treeStory(sample('Default')).parameters },
  args: groupArgs,
  argTypes: groupArgTypes,
};
export default meta;
type Story = StoryObj<GroupArgs>;

/** A labelled cluster of controls: the header is the same in every group, the scale sets the spacing. */
export const Default: Story = { args: groupStoryArgs.Default };

/** An aside on the right of the header: a count or a page switch. */
export const WithAside: Story = { args: groupStoryArgs.WithAside };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping: Story = { args: groupStoryArgs.Wrapping };

/** A column, label hidden (the name stays for assistive tech). */
export const ColumnUnlabelled: Story = { args: groupStoryArgs.ColumnUnlabelled };

/** Groups inside a region: how they sit on a plate. */
export const InRegion: Story = { ...treeStory(sample('InRegion')), args: groupStoryArgs.InRegion };
