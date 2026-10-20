// DisplayArt in the Svelte Storybook: the same story names and args as DisplayArt.stories.tsx, from
// DisplayArt.fixtures.ts, drawn by DisplayArt.story.svelte (the display's width, and the readouts
// over the art in UnderReadouts). The parity test holds DisplayArt.svelte to the React DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../storybook-svelte';
import DisplayArtStory from './DisplayArt.story.svelte';
import { displayArtArgTypes, displayArtStories as s } from './DisplayArt.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/DisplayArt',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { fade: true },
  argTypes: displayArtArgTypes,
  render: (args) => ({ Component: DisplayArtStory, props: args }),
};
export default meta;

/** The board's art. */
export const Board = { args: s.Board.args };

/** The art without the fade from the ground on its left. */
export const Bare = { args: s.Bare.args };

/** Behind the display's readouts: the chord and tempo stay the brightest things on it. */
export const UnderReadouts = { args: { ...s.UnderReadouts.args, readouts: true } };
