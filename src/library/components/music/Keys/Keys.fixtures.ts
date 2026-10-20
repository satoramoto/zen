// Keys' stories as plain props: Keys.stories.tsx draws them (with either renderer) and the tree
// snapshot prints every instance. No callbacks: the stories add their own `onSplit`, `onPick` and
// `tipAction` spies (and drop `onSplit` for the pictures).
import type { HueSlot } from '../../core/hue';
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { KeysModelProps } from './Keys.model';
import type { KeyRange } from './keyLayout';

/** The Launchkey 61's range: C1 (36) to C6 (96), 36 white keys (C3 = 60). */
export const range61: KeyRange = { low: 36, high: 96 };

/** A 49-key range, C2 (48) to C6 (96). */
export const range49: KeyRange = { low: 48, high: 96 };

/** The Stage board's keys: split F#2, left hand G1 A1 C2 E2 (an A minor 7), right hand E4 A4 in Right 1's hue (slot 1). */
export const boardKeys: {
  range: KeyRange;
  split: number;
  heldLeft: number[];
  heldRight: number[];
  rightHue: HueSlot;
  rightName: string;
  width: number;
} = {
  range: range61,
  split: 54,
  heldLeft: [43, 45, 48, 52],
  heldRight: [76, 81],
  rightHue: 1,
  rightName: 'Right 1',
  width: 1392,
};

/** Every story's base: the Stage board with the engine's split limits, unlocked and unarmed. */
const base: FixtureProps<KeysModelProps> = { ...boardKeys, splitMin: 24, splitMax: 96, splitLocked: false, picking: false };

const HUE_SLOTS = [1, 2, 3, 4, 5];

/** The controls, the same in both Storybooks. */
export const keysArgTypes = {
  range: { control: 'object' },
  split: { control: { type: 'number', min: 0, max: 127, step: 1 } },
  heldLeft: { control: 'object' },
  heldRight: { control: 'object' },
  leftHue: { control: 'inline-radio', options: HUE_SLOTS },
  leftName: { control: 'text' },
  rightHue: { control: 'inline-radio', options: HUE_SLOTS },
  rightName: { control: 'text' },
  width: { control: { type: 'number', min: 200, step: 1 } },
  ruler: { control: 'boolean' },
  splitMin: { control: { type: 'number', min: 0, max: 127, step: 1 } },
  splitMax: { control: { type: 'number', min: 0, max: 127, step: 1 } },
  splitLocked: { control: 'boolean' },
  picking: { control: 'boolean' },
} as const;

export const keysStories = defineFixtures<KeysModelProps>()({
  Board: { args: base },
  Idle: { args: { ...base, heldLeft: [], heldRight: [] } },
  BlackKeySplit: { args: { ...base, split: 61, heldLeft: [], heldRight: [] } },
  Drag: { args: { ...base, split: 60, heldLeft: [], heldRight: [] } },
  Armed: { args: { ...base, split: 60, picking: true, heldLeft: [], heldRight: [] } },
  Locked: { args: { ...base, splitLocked: true, picking: true, heldLeft: [], heldRight: [] } },
  NoSplit: { args: { ...base, split: null, heldLeft: [], heldRight: [60, 63, 67], rightHue: 2, rightName: 'Right 2' } },
  Keys49: {
    args: { ...base, range: range49, split: 59, heldLeft: [49, 54, 58], heldRight: [73, 78], rightHue: 3, rightName: 'Right 3', width: 960 },
  },
  HighSplit: { args: { ...base, range: range61, split: 60, heldLeft: [48, 52, 55], heldRight: [84, 88, 91] } },
  // A picture: each Storybook drops its `onSplit` spy.
  Picture: { args: base },
  // A picture without the ruler: each Storybook drops its `onSplit` spy.
  NoRuler: { args: { ...base, ruler: false } },
  Fluid: { args: { ...base, width: 'fill', rightHue: 5, rightName: 'Right 5' } },
  Narrow: {
    args: { ...base, range: range49, split: 59, heldLeft: [49, 54, 58], heldRight: [73, 78], rightHue: 3, rightName: 'Right 3', width: 480 },
  },
});
