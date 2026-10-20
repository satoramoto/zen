// StatusLine's stories as plain props: StatusLine.stories.tsx (React) and StatusLine.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every one in both.
import { defineFixtures } from '../../fixtures';
import type { StatusHint, StatusLineModelProps } from './StatusLine.model';

/** The controls, the same in both Storybooks. */
export const statusLineArgTypes = {
  text: { control: 'text' },
  error: { control: 'boolean' },
  seq: { control: 'number' },
  width: { control: 'number' },
  tip: { control: 'text' },
  hint: { control: 'object' },
} as const;

export const ERROR = "Can't delete Sunday drive: it's the loaded rack.";

export const HINT: StatusHint = {
  title: 'Sync Start',
  body: 'Arms the band to start on the first chord you play with your left hand.',
  keys: 'Y',
  launchkey: 'Shift + Play',
};

export const LONG_TEXT =
  'Rhodes Soft + Strings could not load: the plugin Sampler Deluxe is missing, so Right 1 plays its SoundFont voice until the plugin is installed and scanned again.';

export const statusLineStories = defineFixtures<StatusLineModelProps>()({
  Board: { args: { text: null, width: 1392 } },
  Error: { args: { text: ERROR, error: true, seq: 4, width: 1392 } },
  Notice: { args: { text: 'Added SlowWalker.T552 to the library and loaded it.', seq: 5, width: 1392 } },
  Clears: { args: { text: 'One Touch 3 applied · Recovered: Sunday drive', seq: 6, width: 1392 } },
  Hint: { args: { hint: HINT, text: null, width: 1392 } },
  HintOverMessage: {
    args: { hint: { title: 'Accomp', body: 'Turns the accompaniment on or off.' }, text: ERROR, error: true, seq: 4, width: 1392 },
  },
  LongText: { args: { text: LONG_TEXT, error: true, seq: 7, width: 600 } },
  Focused: { args: { text: ERROR, error: true, seq: 4, width: 1392 } },
  HintNarrow: { args: { hint: HINT, text: null, width: 420 } },
});
