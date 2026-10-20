// KnobBank in the Svelte Storybook: the Knobs region (KnobBankRegion.svelte) with the same story
// names and args as KnobBank.stories.tsx, from KnobBank.fixtures.ts, at the same widths
// (KnobBank.story.svelte). Behaviours (the `play` functions, the working Playground) are exercised
// on the React stories; the parity test holds the bank's renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import type { StoryFixture } from '../../fixtures';
import type { FixtureStory } from '../../svelte/stories/story';
import KnobBankRegion from './KnobBankRegion.svelte';
import KnobBankStory from './KnobBank.story.svelte';
import { KNOB_BANK_WIDTH_1217, knobBankArgTypes, knobBankStories as s } from './KnobBank.fixtures';
import type { KnobBankRegionModelProps } from './KnobBank.model';

const meta: Meta = {
  title: 'Yahaha/Components/KnobBank',
  component: KnobBankRegion,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { tipAction: fn(), onPage: fn(), onPress: fn(), onStep: fn() },
  argTypes: knobBankArgTypes,
};
export default meta;

/** A story: the region at `width` (default the board's), or the fixture's items in a grid. */
const story = (fixture: StoryFixture<KnobBankRegionModelProps>, width?: number): FixtureStory => ({
  args: fixture.args as Record<string, unknown> | undefined,
  render: (args) => ({ Component: KnobBankStory, props: { ...args, width, items: fixture.items } }),
});

export const Board: FixtureStory = story(s.Board);
export const ReverbPage: FixtureStory = story(s.ReverbPage);
export const ReverbSends: FixtureStory = story(s.ReverbSends);
export const RackPage: FixtureStory = story(s.RackPage);
export const PanPage: FixtureStory = story(s.PanPage);
export const ChorusPage: FixtureStory = story(s.ChorusPage);
export const FewerKnobs: FixtureStory = story(s.FewerKnobs);
export const PageLabelOnly: FixtureStory = story(s.PageLabelOnly);
export const At1440: FixtureStory = story(s.At1440);
export const At1217: FixtureStory = story(s.At1217, KNOB_BANK_WIDTH_1217);
export const Forms: FixtureStory = story(s.Forms);
export const Playground: FixtureStory = story(s.Playground);
