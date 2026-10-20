// Fader in the Svelte Storybook: the same story names and args as Fader.stories.tsx, from
// Fader.fixtures.ts. Behaviours are exercised on the React stories; the parity test holds this
// renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Fader from './Fader.svelte';
import { faderArgTypes, faderBoard, faderStories as s } from './Fader.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/Fader',
  component: Fader,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...faderBoard, onlevel: fn(), tipAction: fn() },
  argTypes: faderArgTypes,
};
export default meta;

const story = fixtureStory(Fader);

export const Board: FixtureStory = story(s.Board);
export const Away: FixtureStory = story(s.Away);
export const Off: FixtureStory = story(s.Off);
export const Group: FixtureStory = story(s.Group);
export const Master: FixtureStory = story(s.Master);
export const Parked: FixtureStory = story(s.Parked);
export const Layered: FixtureStory = story(s.Layered);
export const Empty: FixtureStory = story(s.Empty);
export const AwayAbove: FixtureStory = story(s.AwayAbove);
export const Strip: FixtureStory = story(s.Strip);
export const FillHeight: FixtureStory = story(s.FillHeight);
export const Live: FixtureStory = story(s.Live);
