import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { Display } from './Display';
import DisplaySvelte from './Display.svelte';
import { displayStories as s } from './Display.fixtures';

// Every story is built from Display.fixtures.ts, which the tree snapshot shares; the toolbar's
// Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Push/Layouts/Display',
  component: Display,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { onInput: fn() },
} satisfies Meta<typeof Display>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Display, DisplaySvelte);

/** One of each kind of parameter, between the tab row and the track row. */
export const Parameters: Story = story(s.Parameters);
/** A drawing across four columns. */
export const Spanning: Story = story(s.Spanning);
/** A menu three columns deep. */
export const Menu: Story = story(s.Menu);
/** A long list, scrolled to its highlight. */
export const LongList: Story = story(s.LongList);
export const NoClip: Story = story(s.NoClip);
export const Notice: Story = story(s.Notice);
export const Confirm: Story = story(s.Confirm);
export const Dialog: Story = story(s.Dialog);
export const TextEntry: Story = story(s.TextEntry);
/** A low battery, a count-in and a long task, over the screen. */
export const Status: Story = story(s.Status);
export const Blank: Story = story(s.Blank);
export const LowLight: Story = story(s.LowLight);
export const FollowsMode: Story = story(s.FollowsMode);
