// SongForm in the Svelte Storybook: the same story names and args as SongForm.stories.tsx, from
// SongForm.fixtures.ts, each in its region box (SongForm.story.svelte; Forms draws the forms
// sheet). Behaviours (the `play` functions) are exercised on the React stories; the parity test
// holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import SongForm from './SongForm.svelte';
import SongFormStory from './SongForm.story.svelte';
import { songFormArgTypes, songFormArgs, songFormBoxes, songFormStories as s } from './SongForm.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/SongForm',
  component: SongForm,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ...songFormArgs,
    tipAction: fn(),
    onSection: fn(),
    onStartStop: fn(),
    onStopWithFade: fn(),
    onAccomp: fn(),
    onSyncStart: fn(),
    onSyncStop: fn(),
    onAutoFill: fn(),
    onFillUp: fn(),
    onFillDown: fn(),
    onFade: fn(),
    onReset: fn(),
  },
  argTypes: songFormArgTypes,
};
export default meta;

/** A story: its fixture's args, drawn in its region box (or as the forms sheet). */
const story = (name: keyof typeof s, sheet = false) => ({
  args: s[name].args as Record<string, unknown> | undefined,
  render: (args: Record<string, unknown>) => ({
    Component: SongFormStory,
    props: { ...args, storyWidth: songFormBoxes[name]?.width, storyHeight: songFormBoxes[name]?.height, storySheet: sheet },
  }),
});

export const Stopped = story('Stopped');
export const Board = story('Board');
export const FlashOff = story('FlashOff');
export const FillPending = story('FillPending');
export const SyncStartArmed = story('SyncStartArmed');
export const MissingSections = story('MissingSections');
export const Fading = story('Fading');
export const At1217 = story('At1217');
export const Narrow = story('Narrow');
export const FormPart = story('FormPart');
export const FormPartSmall = story('FormPartSmall');
export const FormPartAuto = story('FormPartAuto');
export const TransportPart = story('TransportPart');
export const TransportPartTall = story('TransportPartTall');
export const Forms = story('Forms', true);
export const TransportPartStopped = story('TransportPartStopped');
