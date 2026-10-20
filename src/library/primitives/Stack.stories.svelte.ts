// Stack in the Svelte Storybook: the same story names and args as Stack.stories.tsx, from
// Stack.fixtures.ts, drawn by Stack.story.svelte.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import StackStory from './Stack.story.svelte';
import { stackArgTypes, stackArgs, stackStoryArgs } from './Stack.fixtures';

const meta: Meta = {
  title: 'Design OS/Primitives/Stack',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: stackArgs,
  argTypes: stackArgTypes,
  render: (args) => ({ Component: StackStory, props: args }),
};
export default meta;

/** Controls in a row with a scale step between them: change `gap` and the space changes, nothing else. */
export const Playground = { args: stackStoryArgs.Playground };

/** A column: the default direction of a bare Stack. */
export const Column = { args: stackStoryArgs.Column };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping = { args: stackStoryArgs.Wrapping };

/** Spread across the line: `justify="between"`. */
export const Between = { args: stackStoryArgs.Between };
