// Knob in the Svelte Storybook: the same story names and args as Knob.stories.tsx, from
// Knob.fixtures.ts. The parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Knob from './Knob.svelte';
import { knobArgTypes, knobStories as s } from './Knob.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/Knob',
  component: Knob,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onpress: fn(), onstep: fn(), tipAction: fn() },
  argTypes: knobArgTypes,
};
export default meta;

const story = fixtureStory(Knob);

export const Board: FixtureStory = story(s.Board);
export const Partial: FixtureStory = story(s.Partial);
export const Unit: FixtureStory = story(s.Unit);
export const Unused: FixtureStory = story(s.Unused);
export const Hue: FixtureStory = story(s.Hue);
export const BoardRow: FixtureStory = story(s.BoardRow);
