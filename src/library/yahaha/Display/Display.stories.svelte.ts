// Display in the Svelte Storybook: the same story names and args as Display.stories.tsx, from
// Display.fixtures.ts, each in the same Stage region (Display.story.svelte). Behaviours (the `play`
// functions) are exercised on the React stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import Display from './Display.svelte';
import DisplayStory from './Display.story.svelte';
import { displayArgTypes, displayStories as s, displayStoryRegions as regions } from './Display.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/Display',
  component: Display,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    onPrev: fn(),
    onNext: fn(),
    onBrowse: fn(),
    onOneTouch: fn(),
    onSound: fn(),
    onTempoUp: fn(),
    onTempoDown: fn(),
    onTempo: fn(),
    onTap: fn(),
    onStyleTempo: fn(),
  },
  argTypes: displayArgTypes,
};
export default meta;

/** A story from its fixture, in its region (or, for Forms, the three forms at their least). */
const story = (name: keyof typeof s) => ({
  args: s[name].args as Record<string, unknown>,
  render: (args: Record<string, unknown>) => ({
    Component: DisplayStory,
    props: { ...args, region: regions[name] ?? 'large', forms: name === 'Forms' },
  }),
});

export const Board = story('Board');
export const Stopped = story('Stopped');
export const SyncStartArmed = story('SyncStartArmed');
export const LongChord = story('LongChord');
export const LongStyleName = story('LongStyleName');
export const LongFingering = story('LongFingering');
export const PartOff = story('PartOff');
export const ThreeFour = story('ThreeFour');
export const Looping = story('Looping');
export const FillToEnding = story('FillToEnding');
export const NoParts = story('NoParts');
export const StageColumn = story('StageColumn');
export const StageColumnSmall = story('StageColumnSmall');
export const StageColumnSmallLong = story('StageColumnSmallLong');
export const Compact = story('Compact');
export const FullInColumn = story('FullInColumn');
export const SmallStage = story('SmallStage');
export const SmallStageLongChord = story('SmallStageLongChord');
export const AtStyleTempo = story('AtStyleTempo');
export const Forms = story('Forms');
export const WithArt = story('WithArt');
