// StatusDot in the Svelte Storybook: the same story names and args as StatusDot.stories.tsx, from
// StatusDot.fixtures.ts; Faces is drawn by StatusDot.story.svelte. Behaviours (the `play`
// functions) are exercised on the React stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import StatusDot from './StatusDot.svelte';
import StatusDotStory from './StatusDot.story.svelte';
import { statusDotArgTypes, statusDotStories as s } from './StatusDot.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Core/StatusDot',
  component: StatusDot,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: statusDotArgTypes,
};
export default meta;

const story = fixtureStory(StatusDot);

export const Board: FixtureStory = story(s.Board);
export const Section: FixtureStory = story(s.Section);
export const Intro: FixtureStory = story(s.Intro);
export const Stopped: FixtureStory = story(s.Stopped);
export const Disconnected: FixtureStory = story(s.Disconnected);
export const SyncStart: FixtureStory = story(s.SyncStart);
export const Small: FixtureStory = story(s.Small);
export const Named: FixtureStory = story(s.Named);
export const NamedHollow: FixtureStory = story(s.NamedHollow);
export const NamedHidden: FixtureStory = story(s.NamedHidden);
export const Faces = { render: () => ({ Component: StatusDotStory, props: {} }) };
