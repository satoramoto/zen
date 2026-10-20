// HueLegend in the Svelte Storybook: the same story names and args as HueLegend.stories.tsx, from
// HueLegend.fixtures.ts. OverPads draws the legend alone here (Pad and Group have no Svelte
// renderer yet); the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import HueLegend from './HueLegend.svelte';
import { hueLegendArgTypes, hueLegendStories as s } from './HueLegend.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/HueLegend',
  component: HueLegend,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: hueLegendArgTypes,
};
export default meta;

const story = fixtureStory(HueLegend);

export const Board: FixtureStory = story(s.Board);
export const OverPads: FixtureStory = story(s.OverPads);
