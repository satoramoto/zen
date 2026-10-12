import type { HueSlot } from '../../core/hue';
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
