// AccentBlock in the Svelte Storybook: the same story names and args as AccentBlock.stories.tsx,
// from AccentBlock.fixtures.ts. The parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import AccentBlock from './AccentBlock.svelte';
import { accentBlockArgTypes, accentBlockStories as s } from './AccentBlock.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/AccentBlock',
  component: AccentBlock,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { onPress: fn(), tipAction: fn() },
  argTypes: accentBlockArgTypes,
};
export default meta;

const story = fixtureStory(AccentBlock);

export const Board: FixtureStory = story(s.Board);
export const LongName: FixtureStory = story(s.LongName);
export const Empty: FixtureStory = story(s.Empty);
export const BetweenSteps: FixtureStory = story(s.BetweenSteps);
export const KnobPage: FixtureStory = story(s.KnobPage);
export const SwapR1: FixtureStory = story(s.SwapR1);
