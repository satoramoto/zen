// Meter in the Svelte Storybook: the same story names and args as Meter.stories.tsx, from
// Meter.fixtures.ts. The parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Meter from './Meter.svelte';
import { meterArgTypes, meterBase, meterStories as s } from './Meter.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/Meter',
  component: Meter,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: meterBase,
  argTypes: meterArgTypes,
};
export default meta;

const story = fixtureStory(Meter);

export const Default: FixtureStory = story(s.Default);
export const Peak: FixtureStory = story(s.Peak);
export const Vertical: FixtureStory = story(s.Vertical);
export const Inline: FixtureStory = story(s.Inline);
export const Inside: FixtureStory = story(s.Inside);
export const Display: FixtureStory = story(s.Display);
export const Clamped: FixtureStory = story(s.Clamped);
export const Ink: FixtureStory = story(s.Ink);
export const Driven: FixtureStory = story(s.Driven);
