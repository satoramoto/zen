// Text in the Svelte Storybook: the same story names and args as Text.stories.tsx, from
// Text.fixtures.ts, drawn by Text.story.svelte.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import TextStory from './Text.story.svelte';
import { textArgTypes, textArgs } from './Text.fixtures';

const meta: Meta = {
  title: 'Design OS/Primitives/Text',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: textArgs,
  argTypes: textArgTypes,
  render: (args) => ({ Component: TextStory, props: { ...args, story: 'Playground' } }),
};
export default meta;

/** One specimen: every control changes it (narrow the width with truncate on to see the ellipsis). */
export const Playground = {};

/** Every role (rows) in every tone (columns). */
export const AllRolesAndTones = {
  name: 'All roles and tones',
  render: (args: Record<string, unknown>) => ({ Component: TextStory, props: { ...args, story: 'AllRolesAndTones' } }),
};

/** The `math` role around MathML in running text. */
export const MathInText = {
  name: 'Math in running text',
  render: (args: Record<string, unknown>) => ({ Component: TextStory, props: { ...args, story: 'MathInText' } }),
};
