// Ring in the Svelte Storybook: the same story names as Ring.stories.tsx, drawn by Ring.story.svelte.
// The focus check (the `play` function) runs on the React story.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import RingStory from './Ring.story.svelte';

const meta: Meta = {
  title: 'Design OS/Primitives/Ring',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
};
export default meta;

/** Tab to the first button for the focus ring; click the second to toggle its press ring (and hold either for `:active`). */
export const FocusAndPress = {
  name: 'Focus and press',
  render: () => ({ Component: RingStory, props: { story: 'FocusAndPress' } }),
};

/** The focus ring in every pack: `--focus-ring` and `--focus-ring-offset`, from the materials' `focus` setting. Tab through to see each. */
export const FocusInEveryPack = {
  name: 'Focus in every pack',
  render: (_args: Record<string, unknown>, { globals }: { globals: Record<string, unknown> }) => ({
    Component: RingStory,
    props: { story: 'FocusInEveryPack', mode: globals.mode },
  }),
};
