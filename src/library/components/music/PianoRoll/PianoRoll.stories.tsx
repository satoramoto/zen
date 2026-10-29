import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { PianoRoll } from './PianoRoll';
import PianoRollSvelte from './PianoRoll.svelte';
import { pianoRollArgTypes, pianoRollStories as s } from './PianoRoll.fixtures';

// Every story is built from PianoRoll.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. A frame gives the grid a width (it grows to fill), and Dense
// widens that frame to 900 px.

/** A story's width: 360 px, or the `frameWidth` parameter for a wide one. */
const frame: Decorator = (Story, { parameters }) => (
  <div style={{ width: parameters.frameWidth ?? 360 }}>
    <Story />
  </div>
);

// Every story is built from PianoRoll.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`.

/**
 * A compact keyboard and note timeline: aligned rows, bar/beat ruling, note blocks and a
 * playhead. Read-only: the roll holds no state and names no handlers.
 */
const meta = {
  title: 'Design OS/Components/Music/PianoRoll',
  component: PianoRoll,
  decorators: [withRenderer, frame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { keys: [], notes: [], from: 0, to: 16, beatsPerBar: 4 },
  argTypes: pianoRollArgTypes,
} satisfies Meta<typeof PianoRoll>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(PianoRoll, PianoRollSvelte);

/** A I–vi–IV–V in C, the playhead a third of the way through. */
export const Default: Story = story(s.Default);

/** An emphasized passing tone, a note off the keys (drawn nowhere), and a late playhead. */
export const EveryState: Story = story(s.EveryState);

/** The `compact` form in a 900 px frame: grid and notes alone. */
export const Dense: Story = story(s.Dense, { parameters: { frameWidth: 900 } });

/** No keys, no notes: the roll's empty face. */
export const Empty: Story = story(s.Empty);

/** Shown but meaning nothing yet: dimmed. */
export const Disabled: Story = story(s.Disabled);
