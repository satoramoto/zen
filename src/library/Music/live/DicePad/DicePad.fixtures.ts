// DicePad's stories as plain props: DicePad.stories.tsx draws them with React's or Svelte's `Tree`.
// Aimed at Keys, as the ONE wireframe's dice row is; the lock on the chord, chaos at 0.25. The
// moves a host offers, the lock and the macro are controlled contract data: the host's.
import { defineFixtures } from '../../../fixtures';
import type { DicePadProps } from './DicePad.model';

export const dicePadBoard: DicePadProps = { target: 'Keys', scaleLock: 'chord', chaos: 0.25 };

/** The controls, the same in both Storybooks. */
export const dicePadArgTypes = {
  target: { control: 'text' },
  moves: { control: 'object' },
  scaleLock: { control: 'inline-radio', options: ['chord', 'scale', 'off'] },
  chaos: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  form: { control: 'inline-radio', options: ['full', 'row'] },
  onDice: { control: false },
  onScaleLock: { control: false },
  onChaos: { control: false },
} as const;

/** Every story's args by export name. */
export const dicePadStories = defineFixtures<DicePadProps>()({
  Default: { args: { ...dicePadBoard, form: 'full' } },
  /** A host that can't rotate or step ratios on this generator: those two drawn disabled; the lock off, chaos high. */
  EveryState: { args: { ...dicePadBoard, moves: ['mutate', 'shake', 'keep', 'revert'], scaleLock: 'off', chaos: 0.9, form: 'full' } },
  /** The `row` form: the ONE board's dice row. */
  Dense: { args: { ...dicePadBoard, form: 'row' } },
  /** No track selected: only SHAKE (every generator) can ask. */
  Empty: { args: { target: undefined, scaleLock: 'chord', chaos: 0, form: 'full' } },
  Disabled: { args: { ...dicePadBoard, form: 'full' } },
});
