// SectionName in the Svelte Storybook: the same story names and args as SectionName.stories.tsx,
// from SectionName.fixtures.ts. Behaviours (the `play` functions) are exercised on the React
// stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import SectionName from './SectionName.svelte';
import { sectionNameArgTypes, sectionNameStories as s } from './SectionName.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/SectionName',
  component: SectionName,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: sectionNameArgTypes,
};
export default meta;

const story = fixtureStory(SectionName);

export const Board: FixtureStory = story(s.Board);
export const Idle: FixtureStory = story(s.Idle);
export const Intro: FixtureStory = story(s.Intro);
export const AllKinds: FixtureStory = story(s.AllKinds);
export const Empty: FixtureStory = story(s.Empty);
export const Next: FixtureStory = story(s.Next);
export const HeroSize: FixtureStory = story(s.HeroSize);
