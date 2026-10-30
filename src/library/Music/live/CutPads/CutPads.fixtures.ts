// CutPads' stories as plain props: CutPads.stories.tsx draws them with React's or Svelte's `Tree`.
// The six transitions of a live set, with what each does as its caption.
import { defineFixtures } from '../../../fixtures';
import type { CutPad, CutPadState, CutPadsProps } from './CutPads.model';

const PADS: readonly Omit<CutPad, 'state'>[] = [
  { id: 'riser', label: 'RISER', hint: '8 bars' },
  { id: 'drop', label: 'DROP', hint: 'next bar' },
  { id: 'crash', label: 'CRASH', hint: 'one shot' },
  { id: 'hold-a', label: 'HOLD A', hint: 'A section' },
  { id: 'hold-b', label: 'HOLD B', hint: 'B section' },
  { id: 'cut', label: 'CUT', hint: 'hard cut' },
];

const withStates = (...states: CutPadState[]): readonly CutPad[] => PADS.map((p, i) => ({ ...p, state: states[i] ?? 'idle' }));

/** The row at rest: six pads, none armed or fired. */
export const cutPadsBoard: readonly CutPad[] = withStates();

/** Every state: RISER armed for its 8 bars, DROP fired, HOLD A held, the rest idle. */
export const cutPadsEveryState: readonly CutPad[] = withStates('armed', 'fired', 'idle', 'held', 'idle', 'idle');

/** Two more pads past the six: a filter sweep and a tape stop. */
const MORE: readonly CutPad[] = [...cutPadsEveryState, { id: 'sweep', label: 'SWEEP', hint: '4 bars', state: 'armed' }, { id: 'stop', label: 'TAPE STOP', hint: '1 beat', state: 'idle' }];

/** The controls, the same in both Storybooks. */
export const cutPadsArgTypes = {
  pads: { control: 'object' },
  selected: { control: 'text' },
  form: { control: 'inline-radio', options: ['row', 'grid'] },
  onFire: { control: false },
} as const;

/** Every story's args by export name. */
export const cutPadsStories = defineFixtures<CutPadsProps>()({
  Default: { args: { pads: cutPadsBoard, form: 'row' } },
  EveryState: { args: { pads: cutPadsEveryState, selected: 'drop', form: 'row' } },
  Grid: { args: { pads: cutPadsEveryState, selected: 'hold-a', form: 'grid' } },
  More: { args: { pads: MORE, selected: 'sweep', form: 'grid' } },
  Dense: { args: { pads: cutPadsEveryState, selected: 'drop', form: 'grid' } },
  Empty: { args: { pads: [], form: 'row' } },
  Disabled: { args: { pads: cutPadsEveryState, form: 'row' } },
});
