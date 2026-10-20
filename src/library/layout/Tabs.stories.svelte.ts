// Tabs in the Svelte Storybook: the same story names and args as Tabs.stories.tsx, from
// Tabs.fixtures.ts, drawn by Tabs.story.svelte (which holds the choice). Behaviours are exercised on
// the React side; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../svelte/stories/story';
import TabsStory from './Tabs.story.svelte';
import { tabsArgTypes, tabsStories as s } from './Tabs.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Tabs',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { onChange: fn() },
  argTypes: tabsArgTypes,
};
export default meta;

const story = fixtureStory(TabsStory);

export const Default: FixtureStory = story(s.Default);
export const Two: FixtureStory = story(s.Two);
export const WithDisabled: FixtureStory = story(s.WithDisabled);
export const NoneChosen: FixtureStory = story(s.NoneChosen);
