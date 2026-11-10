// TransitionRow's stories as plain props: TransitionRow.stories.tsx draws them with React's or
// Svelte's `Tree`. The six pads are the mockups' row; the states are its three faces.
import { defineFixtures } from '../../../fixtures';
import { TRANSITION_LABELS } from './TransitionRow.forms';
import type { TransitionPad, TransitionRowModelProps, TransitionState } from './TransitionRow.model';

/** The pads' ids, as an app would name them. */
const IDS = ['riser', 'drop', 'crash', 'hold-a', 'hold-b', 'cut'] as const;
/** What each pad does, as a caption under its word. */
const HINTS = ['8 bars', 'next bar', 'one shot', 'A section', 'B section', 'hard cut'] as const;
/** Hue slots 1–5 for the first five pads; CUT takes none, so its fired face shows the `--role-2` fallback. */
const HUES = [1, 2, 3, 4, 5, undefined] as const;

const pad = (i: number, state: TransitionState, over: Partial<TransitionPad> = {}): TransitionPad => ({
  id: IDS[i],
  label: TRANSITION_LABELS[i],
  state,
  hue: HUES[i],
  hint: HINTS[i],
  ...over,
});

/** The row at rest: six pads, none armed or fired. */
export const transitionBoard: readonly TransitionPad[] = TRANSITION_LABELS.map((_, i) => pad(i, 'idle'));

/** Every state at once: RISER and HOLD B armed, DROP, HOLD A and CUT fired (CUT with no hue slot), CRASH idle. */
export const transitionEveryState: readonly TransitionPad[] = [
  pad(0, 'armed'),
  pad(1, 'fired'),
  pad(2, 'idle'),
  pad(3, 'fired'),
  pad(4, 'armed'),
  pad(5, 'fired'),
];

/** The controls, the same in both Storybooks. */
export const transitionRowArgTypes = {
  pads: { control: 'object' },
  selected: { control: 'text' },
  onFire: { control: false },
} as const;

/** Every story's args by export name. */
export const transitionRowStories = defineFixtures<TransitionRowModelProps>()({
  Default: { args: { pads: transitionBoard } },
  EveryState: { args: { pads: transitionEveryState, selected: 'drop' } },
  Dense: { args: { pads: transitionEveryState, selected: 'drop' } },
  Empty: { args: { pads: [] } },
  Disabled: { args: { pads: transitionBoard } },
});
