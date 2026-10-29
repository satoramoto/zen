import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { LoopPie } from './LoopPie';
import LoopPieSvelte from './LoopPie.svelte';
import { loopPieArgTypes, loopPieStories as s } from './LoopPie.fixtures';

// Every story is built from LoopPie.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`.

/**
 * One loop's phase as a wedge from twelve o'clock: how far through the loop this track is. While
 * recording the middle reads the captured bars. Controlled only by its phase: it holds no state.
 */
const meta = {
  title: 'Design OS/Components/Music/LoopPie',
  component: LoopPie,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { phase: 0.62 },
  argTypes: loopPieArgTypes,
} satisfies Meta<typeof LoopPie>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(LoopPie, LoopPieSvelte);

/** A loop two-thirds through, in hue slot 2. */
export const Default: Story = story(s.Default);

/** Every reading: empty, quarters, a full disc, a recording count and a labelled pie. */
export const EveryState: Story = story(s.EveryState);

/** The same pie in a narrow frame: the wedge keeps 1:1. */
export const Dense: Story = story(s.Dense);

/** Nothing playing: the ring with no wedge. */
export const Empty: Story = story(s.Empty);

/** Shown but meaning nothing yet: dimmed. */
export const Disabled: Story = story(s.Disabled);
