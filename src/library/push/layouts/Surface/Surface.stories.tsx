import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { Surface } from './Surface';
import SurfaceSvelte from './Surface.svelte';
import { surfaceStories as s } from './Surface.fixtures';

// Every story is built from Surface.fixtures.ts, which the tree snapshot shares; the toolbar's
// Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Push/Layouts/Surface',
  component: Surface,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { onInput: fn() },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Surface, SurfaceSvelte);

/** The whole unit, lit as the model projects the sample Set. */
export const Unit: Story = story(s.Unit);
/** No lamps: every control of the unit and nothing else. */
export const Bare: Story = story(s.Bare);
/** Every lamp lit through the lamp table. */
export const AllLit: Story = story(s.AllLit);
/** Lamp states, derived shades and the meanings' colours. */
export const LampStates: Story = story(s.LampStates);
/** LED brightness and display light turned down. */
export const Dimmed: Story = story(s.Dimmed);
/** The touch trace: hold a pad and move. */
export const Trace: Story = story(s.Trace);
export const DisplayRegion: Story = story(s.DisplayRegion);
export const PadRegion: Story = story(s.PadRegion);
export const LeftRegion: Story = story(s.LeftRegion);
export const RightRegion: Story = story(s.RightRegion);
