// TempoReadout in the Svelte Storybook: the same story names and args as TempoReadout.stories.tsx,
// from TempoReadout.fixtures.ts. Behaviours (the `play` functions) are exercised on the React
// stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import TempoReadout from './TempoReadout.svelte';
import TempoReadoutCells from './TempoReadout.story.svelte';
import { CELLS_BOX, tempoReadoutArgTypes, tempoReadoutStories as s } from './TempoReadout.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/TempoReadout',
  component: TempoReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { bpm: 104, onTempo: fn(), onPlus: fn(), onMinus: fn(), onReset: fn() },
  argTypes: tempoReadoutArgTypes,
};
export default meta;

const story = fixtureStory(TempoReadout);
/** In its size container. */
type CellsStory = FixtureStory & { parameters: { sample: typeof CELLS_BOX } };
const cells = (args: object | undefined): CellsStory => ({
  args: args as Record<string, unknown> | undefined,
  parameters: { sample: CELLS_BOX },
  render: (a) => ({ Component: TempoReadoutCells, props: a }),
});

export const Board: FixtureStory = story(s.Board);
export const AtMax: FixtureStory = story(s.AtMax);
export const Slow: FixtureStory = story(s.Slow);
export const HeroSize: FixtureStory = story(s.HeroSize);
export const Cells: CellsStory = cells(s.Cells.args);
export const CellsUnitLarge: CellsStory = cells(s.CellsUnitLarge.args);
