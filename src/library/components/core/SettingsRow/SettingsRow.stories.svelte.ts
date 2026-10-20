// SettingsRow in the Svelte Storybook: the same story names and args as SettingsRow.stories.tsx, from
// SettingsRow.fixtures.ts, drawn by SettingsRow.story.svelte (a row needs its control as a snippet).
// The parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import SettingsRowStory from './SettingsRow.story.svelte';
import { controlArgs, settingsRowArgTypes, settingsRowStories as s, storyControls } from './SettingsRow.fixtures';

type Name = keyof typeof s;

const meta: Meta = {
  title: 'Design OS/Components/Core/SettingsRow',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...s.Board.args, ...controlArgs, ontoggle: fn(), onchoose: fn(), onchange: fn() },
  argTypes: settingsRowArgTypes,
};
export default meta;

const drawn = (story: Name) => ({
  args: { ...s[story].args, ...storyControls[story] },
  render: (args: Record<string, unknown>) => ({ Component: SettingsRowStory, props: { ...args, story } }),
});

/** The Chord page's Upper row: "Upper", its On lamp lit, and the hint "Chords from the right hand". */
export const Board = drawn('Board');

/** Manual Bass, shown but not pressable while Upper is off: the lamp disabled, the hint says why. */
export const DisabledLamp = drawn('DisabledLamp');

/** The Style page's Main timing: a run of tabs, Next bar chosen; no hint. */
export const Tabs = drawn('Tabs');

/** The Chord page's Chord settle: a slider at 10 ms of 30. */
export const Slider = drawn('Slider');

/** A name too long for the column: it truncates, and its full text is on hover. */
export const LongLabel = drawn('LongLabel');

/** A Settings page's stack: the labels share a column, and so do the hints. */
export const Stack = drawn('Stack');
