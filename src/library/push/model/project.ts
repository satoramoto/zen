// The model's second pure function: from a state and a Set alone, the lamp of every control, the
// screen description, and what each pad plays (openspec: push-device-model, "Lamps and display
// are a projection").
import { CONTROLS } from './layout';
import { OFF, screen, type Paint } from './engine';
import { LAYERS } from './layers';
import type { Lamp, Projection, PushSet, PushState } from './types';

export function project(state: PushState, set: PushSet): Projection {
  const lamps: Record<string, Lamp> = {};
  for (const c of CONTROLS) lamps[c.id] = OFF;
  const paint: Paint = { state, set, lamps, screen: screen('empty'), notes: {}, strip: { kind: 'off' } };
  // From the lowest layer up, so a higher layer has the last word.
  for (let i = LAYERS.length - 1; i >= 0; i--) {
    const layer = LAYERS[i];
    if (layer.active && !layer.active(state, set)) continue;
    layer.paint?.(paint);
  }
  return { lamps: paint.lamps, strip: paint.strip, screen: paint.screen, notes: paint.notes };
}
