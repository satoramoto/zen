// Water (docs/shader-graph.md, "The three materials"): caustic light over the layer, its field
// gently warped so it reads as light refracted through moving water, a ring spreading from each
// press, tinted from the theme's accent drawn toward its ink. Translucent: a faint body tint and
// the light's web, laid over the layer's own CSS material.
//
// coord → warp → ripple → caustics → 1 − n → band (rise − fall) ┐
//              └→ noise → smooth ─────────────────────────────┴→ × → × strength
//                 → fade(mix(accent, ink)) → over(body tint) → out
//
// Noise reads per fragment: warp 12 + caustics 18 + noise 4 = 34.
import type { Chip, Circuit, Json, Trace } from '../../graph/model/circuit';
import { shaderChip } from '../nodes';
import type { PinKind, ShaderMaterialDef } from '../types';

const trace = (from: string, fromPin: string, to: string, toPin: string, kind: PinKind): Trace => ({
  id: `${from}.${fromPin}->${to}.${toPin}`,
  from: { chip: from, pin: fromPin },
  to: { chip: to, pin: toPin },
  kind,
});
const chip = (type: string, id: string, name: string, x: number, y: number, params?: Record<string, Json>): Chip => ({
  ...shaderChip(type, id, x, y, params),
  name,
});

const circuit: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    board: {
      id: 'board',
      inPins: [],
      outPins: [],
      chips: [
        // Where: the surface, slowly displaced as if seen through moving water, then pushed by a press.
        chip('coord', 'coord', 'Surface', 0, 200),
        chip('warp', 'refract', 'Refraction', 200, 200, { amount: 0.16, scale: 0.55, speed: 0.035 }),
        chip('ripple', 'ripple', 'Press ripple', 400, 120, { strength: 1, speed: 2.4, decay: 1.2 }),
        // What: the caustic web. The caustics field is bright at its cells' hearts; one level of
        // its inverse, between them, is the web of light lines.
        chip('caustics', 'caustics', 'Caustics', 600, 40, { scale: 0.85, speed: 0.22, sharpness: 0 }),
        chip('math', 'between', 'Between cells', 800, 40, { op: 'sub', a: 1 }),
        chip('smooth', 'web-in', 'Web rise', 1000, -40, { low: 0.3, high: 0.4 }),
        chip('smooth', 'web-out', 'Web fall', 1000, 120, { low: 0.4, high: 0.52 }),
        chip('math', 'web', 'Light web', 1200, 40, { op: 'sub' }),
        // ... dimmed in broad, slow patches so it pools rather than tiles.
        chip('noise', 'depth-noise', 'Depth', 600, 320, { scale: 0.45 }),
        chip('smooth', 'depth', 'Depth falloff', 800, 320, { low: 0.2, high: 0.8 }),
        chip('math', 'light', 'Light', 1400, 160, { op: 'mul' }),
        chip('math', 'strength', 'Strength', 1600, 160, { op: 'mul', b: 0.36 }),
        // Colour: the accent drawn toward the ink, so it follows each pack's palette.
        chip('theme', 'accent', 'Accent', 1200, 440, { slot: 'accent' }),
        chip('theme', 'ink', 'Ink', 1200, 580, { slot: 'ink' }),
        chip('mix', 'water-tint', 'Water tint', 1400, 500, { t: 0.25 }),
        chip('fade', 'caustic-light', 'Caustic light', 1800, 280),
        chip('theme', 'body', 'Body tint', 1800, 40, { slot: 'accent', alpha: 0.045 }),
        chip('blend', 'lay', 'Lay over', 2000, 160, { mode: 'over' }),
        chip('out', 'out', 'Out', 2200, 160),
      ],
      traces: [
        trace('coord', 'p', 'refract', 'p', 'point'),
        trace('refract', 'p', 'ripple', 'p', 'point'),
        trace('ripple', 'p', 'caustics', 'p', 'point'),
        trace('refract', 'p', 'depth-noise', 'p', 'point'),
        trace('depth-noise', 'n', 'depth', 'n', 'number'),
        trace('caustics', 'n', 'between', 'b', 'number'),
        trace('between', 'n', 'web-in', 'n', 'number'),
        trace('between', 'n', 'web-out', 'n', 'number'),
        trace('web-in', 'n', 'web', 'a', 'number'),
        trace('web-out', 'n', 'web', 'b', 'number'),
        trace('web', 'n', 'light', 'a', 'number'),
        trace('depth', 'n', 'light', 'b', 'number'),
        trace('light', 'n', 'strength', 'a', 'number'),
        trace('accent', 'c', 'water-tint', 'a', 'colour'),
        trace('ink', 'c', 'water-tint', 'b', 'colour'),
        trace('water-tint', 'c', 'caustic-light', 'c', 'colour'),
        trace('strength', 'n', 'caustic-light', 'amount', 'number'),
        trace('body', 'c', 'lay', 'a', 'colour'),
        trace('caustic-light', 'c', 'lay', 'b', 'colour'),
        trace('lay', 'c', 'out', 'c', 'colour'),
      ],
    },
  },
};

export const water: ShaderMaterialDef = { name: 'water', label: 'Water', circuit, scale: 0.5, animate: true, interactive: true };
