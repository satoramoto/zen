import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { DisplayArt } from './DisplayArt';
import DisplayArtSvelte from './DisplayArt.svelte';
import { DISPLAY_WIDTH, displayArtArgTypes, displayArtStories as s, displayArtUnderReadouts } from './DisplayArt.fixtures';
import type { DisplayArtModelProps } from './DisplayArt.model';

// Every story is built from DisplayArt.fixtures.ts, drawn by React's or Svelte's `Tree` (the
// toolbar's Renderer), at the display's width.
const meta = {
  title: 'Yahaha/Primitives/DisplayArt',
  component: DisplayArt,
  decorators: [
    withRenderer,
    (Story) => (
      <div style={{ width: DISPLAY_WIDTH }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: { fade: true },
  argTypes: displayArtArgTypes,
} satisfies Meta<typeof DisplayArt>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(DisplayArt, DisplayArtSvelte);

/** The board's art. */
export const Board: Story = story(s.Board);

/** The art without the fade from the ground on its left. */
export const Bare: Story = story(s.Bare);

/** Behind the display's readouts: the chord and tempo stay the brightest things on it. */
export const UnderReadouts: Story = {
  args: s.UnderReadouts.args,
  ...treeStory((args: DisplayArtModelProps) => ({ tree: displayArtUnderReadouts(args) })),
};
