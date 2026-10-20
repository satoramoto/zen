// OneTouchPicker in the Svelte Storybook: the same story names and args as
// OneTouchPicker.stories.tsx, from OneTouchPicker.fixtures.ts; the cells stories sit in the same
// five-cell grid (OneTouchPicker.story.svelte). Behaviours (the `play` functions) are exercised on
// the React stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import OneTouchPicker from './OneTouchPicker.svelte';
import OneTouchPickerStory from './OneTouchPicker.story.svelte';
import { oneTouchPickerArgTypes, oneTouchPickerStories as s } from './OneTouchPicker.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/OneTouchPicker',
  component: OneTouchPicker,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onApply: fn(), tipAction: fn() },
  argTypes: oneTouchPickerArgTypes,
};
export default meta;

const story = fixtureStory(OneTouchPicker);
/** A cells story: the picker inside the grid. */
const inGrid = (fixture: { args?: Record<string, unknown> }) => ({
  args: fixture.args,
  render: (args: Record<string, unknown>) => ({ Component: OneTouchPickerStory, props: args }),
});

export const Board: FixtureStory = story(s.Board);
export const NoneApplied: FixtureStory = story(s.NoneApplied);
export const Vertical: FixtureStory = story(s.Vertical);
export const Cells = inGrid(s.Cells);
export const CellsViolet = inGrid(s.CellsViolet);
export const TwoSettings: FixtureStory = story(s.TwoSettings);
