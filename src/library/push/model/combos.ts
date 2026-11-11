// Every combination the model knows, as data (openspec: push-device-model, "Shift and Select
// change what a press means"). This is read from the same table the layers dispatch on.
import type { Combo } from './engine';
import { LAYERS } from './layers';
import type { ControlId, InputKind } from './types';

export interface Combination {
  id: string;
  /** The buttons held. */
  hold: ControlId[];
  /** The control used with them: an id, or a class of controls ("pad", "upper", "encoder"). */
  press: string;
  /** What is done to it. */
  kind: InputKind;
  /** Where it applies. */
  mode: string;
  /** What it asks. */
  asks: string;
}

/** The dispatch table itself: each layer's combinations, highest layer first. */
export const COMBOS: readonly Combo[] = LAYERS.flatMap((l) => l.combos ?? []);

/** The published list. */
export const combinations = (): Combination[] => COMBOS.map(({ id, hold, press, kind = 'down', mode, asks }) => ({ id, hold: [...hold], press, kind, mode, asks }));
