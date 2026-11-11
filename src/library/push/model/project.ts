// The model's second pure function: from a state and a Set alone, the lamp of every control, the
// screen description, and what each pad plays (openspec: push-device-model, "Lamps and display
// are a projection").
import { CONTROLS } from './layout';
import { OFF, screen, type Paint } from './engine';
import { LAYERS } from './layers';
import type { Lamp, Projection, PushSet, PushState, RowCell } from './types';

/** The lamp of the display button over or under a row cell. */
export function rowLamp(cell: RowCell | null | undefined): Lamp {
  if (!cell || cell.dim) return OFF;
  if (cell.lamp) return cell.lamp;
  return { state: 'lit', colour: cell.colour ?? 'white', ...(cell.selected ? {} : { shade: 'dim' as const }) };
}

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
  // A display button's lamp is what is above or below it: its item's colour, brighter for the
  // selected one, and unlit where there is no item or the item is greyed. Not in User Mode, where
  // every lamp is the app's, nor on a unit that is not on.
  if (!state.user && set.unit.power === 'on') {
    for (let c = 1; c <= 8; c++) {
      paint.lamps[`upper-${c}`] = rowLamp(paint.screen.top[c - 1]);
      paint.lamps[`lower-${c}`] = rowLamp(paint.screen.bottom[c - 1]);
    }
  }
  return { lamps: paint.lamps, strip: paint.strip, screen: paint.screen, notes: paint.notes };
}
