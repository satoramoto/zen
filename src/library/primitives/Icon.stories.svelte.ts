// Icon in the Svelte Storybook: the same story names and args as Icon.stories.tsx, from
// Icon.fixtures.ts, drawn by Icon.story.svelte.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import IconStory from './Icon.story.svelte';
import { iconArgTypes, iconArgs } from './Icon.fixtures';

const meta: Meta = {
  title: 'Design OS/Primitives/Icon',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: iconArgs,
  argTypes: iconArgTypes,
  render: (args) => ({ Component: IconStory, props: { ...args, story: 'Playground' } }),
};
export default meta;

/** One icon: every control changes it. */
export const Playground = {};

/** Every size, beside text in the same role so the two line up. */
export const Sizes = {
  render: (args: Record<string, unknown>) => ({ Component: IconStory, props: { ...args, story: 'Sizes' } }),
};

/** Every tone. */
export const Tones = {
  render: (args: Record<string, unknown>) => ({ Component: IconStory, props: { ...args, story: 'Tones' } }),
};
