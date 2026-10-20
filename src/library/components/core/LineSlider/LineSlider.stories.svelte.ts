// LineSlider in the Svelte Storybook: the same story names and args as LineSlider.stories.tsx, from
// LineSlider.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import LineSlider from './LineSlider.svelte';
import { lineSliderArgTypes, lineSliderStories as s } from './LineSlider.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Core/LineSlider',
  component: LineSlider,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onchange: fn(), tipAction: fn() },
  argTypes: lineSliderArgTypes,
};
export default meta;

const story = fixtureStory(LineSlider);

export const Board: FixtureStory = story(s.Board);
export const AtMax: FixtureStory = story(s.AtMax);
export const ValueText: FixtureStory = story(s.ValueText);
export const Disabled: FixtureStory = story(s.Disabled);
export const AtMin: FixtureStory = story(s.AtMin);
export const SettingsColumn: FixtureStory = story(s.SettingsColumn);
