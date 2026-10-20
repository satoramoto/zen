import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { AccentBlock } from './AccentBlock';
import AccentBlockSvelte from './AccentBlock.svelte';
import { accentBlockArgTypes, accentBlockStories as s } from './AccentBlock.fixtures';

// Every story is built from AccentBlock.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Yahaha/Primitives/AccentBlock',
  component: AccentBlock,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { label: 'Sunday Drive Pop', onPress: fn(), tipAction: fn() },
  argTypes: accentBlockArgTypes,
} satisfies Meta<typeof AccentBlock>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(AccentBlock, AccentBlockSvelte);

/** The style name: the accent-barred block with a chevron; a click opens the Browser. */
export const Board: Story = story(s.Board);

/** A 59-character style name in a 240px block: one line, clipped with "…"; the full name stays in the button's name. */
export const LongName: Story = story(s.LongName);

/** An empty label: the block shows its `empty` text ("No style") so it keeps its height and something to click. */
export const Empty: Story = story(s.Empty);

/** New: between ‹ and › step keys, as the Display's header draws it: no chevron, so the line has two arrows, not three. */
export const BetweenSteps: Story = story(s.BetweenSteps);

/** The knob page's name over the knobs: the plain label at the knob size, not a control. */
export const KnobPage: Story = story(s.KnobPage);

/** Swap mode on the knob page: the same block; the part's hue stays on its lamp and strip. */
export const SwapR1: Story = story(s.SwapR1);
