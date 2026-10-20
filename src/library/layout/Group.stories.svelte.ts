// Group in the Svelte Storybook: the same story names and args as Group.stories.tsx, from
// Group.fixtures.ts, drawn by Group.story.svelte (Buttons standing in for the React stories' Pads).
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import GroupStory from './Group.story.svelte';
import { groupArgTypes, groupArgs, groupStoryArgs } from './Group.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Group',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: groupArgs,
  argTypes: groupArgTypes,
  render: (args) => ({ Component: GroupStory, props: args }),
};
export default meta;

/** A labelled cluster of controls: the header is the same in every group, the scale sets the spacing. */
export const Default = { args: groupStoryArgs.Default };

/** An aside on the right of the header: a count or a page switch. */
export const WithAside = { args: groupStoryArgs.WithAside };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping = { args: groupStoryArgs.Wrapping };

/** A column, label hidden (the name stays for assistive tech). */
export const ColumnUnlabelled = { args: groupStoryArgs.ColumnUnlabelled };

/** Groups inside a region: how they sit on a plate. */
export const InRegion = {
  args: groupStoryArgs.InRegion,
  render: (args: Record<string, unknown>) => ({ Component: GroupStory, props: { ...args, story: 'InRegion' } }),
};
