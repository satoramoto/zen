// Screen in the Svelte Storybook: the same story names and args as Screen.stories.tsx, from
// Screen.fixtures.ts, drawn by Screen.story.svelte.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import ScreenStory from './Screen.story.svelte';
import { screenArgTypes, screenArgs, screenStoryArgs } from './Screen.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Screen',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: screenArgs,
  argTypes: screenArgTypes,
  render: (args) => ({ Component: ScreenStory, props: args }),
};
export default meta;

/** A fixed header, a named grid of regions spaced by the plate gap, and a fixed footer. Change the arrangement: the regions move, the frame stays. */
export const Default = { args: screenStoryArgs.Default };

/** The grid alone, no header or footer. */
export const GridOnly = { args: screenStoryArgs.GridOnly };
