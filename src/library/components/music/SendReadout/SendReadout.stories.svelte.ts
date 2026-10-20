// SendReadout in the Svelte Storybook: the same story names and args as SendReadout.stories.tsx,
// from SendReadout.fixtures.ts. Behaviours (the `play` functions) are exercised on the React
// stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import SendReadout from './SendReadout.svelte';
import { sendReadoutArgTypes, sendReadoutBase, sendReadoutStories as s } from './SendReadout.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/SendReadout',
  component: SendReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...sendReadoutBase, onPress: fn() },
  argTypes: sendReadoutArgTypes,
};
export default meta;

const story = fixtureStory(SendReadout);

export const Board: FixtureStory = story(s.Board);
export const Full: FixtureStory = story(s.Full);
export const AllOff: FixtureStory = story(s.AllOff);
