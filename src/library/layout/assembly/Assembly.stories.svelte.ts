// The Assembly demo in the Svelte Storybook: the same story names and args as
// Assembly.stories.tsx, from Assembly.fixtures.ts, drawn by Assembly.story.svelte.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../storybook-svelte';
import AssemblyStory from './Assembly.story.svelte';
import { demoArgTypes, demoArgs, demoStoryArgs } from './Assembly.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Assembly',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: demoArgs,
  argTypes: demoArgTypes,
  render: (args) => ({ Component: AssemblyStory, props: args }),
};
export default meta;

/** One spec, three forms per part, any room: the screen assembles itself. Drag the frame's corner. */
export const Resizable = { args: demoStoryArgs.Resizable };
/** The 1440 × 900 board: every part at its richest form. */
export const Board = { args: demoStoryArgs.Board };
/** A short room: the pads go to one row before anything else. */
export const Short = { args: demoStoryArgs.Short };
/** Tighter still: every part at its last form; what's playing goes last. */
export const Small = { args: demoStoryArgs.Small };
/** Locked to 16:9 (`fit: 'contain'`): laid out in the largest 16:9 room inside, the rest ground bands. */
export const AspectLocked = { args: demoStoryArgs.AspectLocked };
/** Scaled (`fit: 'scale'`, design 1600 × 900): laid out once at its design room and drawn smaller. */
export const AspectScaled = { args: demoStoryArgs.AspectScaled };
