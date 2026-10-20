// WaitingChip in the Svelte Storybook: the same story names and args as WaitingChip.stories.tsx,
// from WaitingChip.fixtures.ts. Behaviours (the `play` functions) are exercised on the React
// stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import WaitingChip from './WaitingChip.svelte';
import { waitingChipArgTypes, waitingChipStories as s } from './WaitingChip.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/WaitingChip',
  component: WaitingChip,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: waitingChipArgTypes,
};
export default meta;

const story = fixtureStory(WaitingChip);

export const Board: FixtureStory = story(s.Board);
export const Display: FixtureStory = story(s.Display);
export const QueuedStyle: FixtureStory = story(s.QueuedStyle);
export const Empty: FixtureStory = { ...story(s.Empty), parameters: { rendersNothing: true } } as FixtureStory;
export const LongStyle: FixtureStory = story(s.LongStyle);
export const AllHues: FixtureStory = story(s.AllHues);
