// Ether (docs/shader-graph.md, "The three materials"): gradient smoke from the theme's hues, slow
// and turbulent, its colour drifting softly. Translucent: thin veils of colour over the layer's
// own CSS material, never a fill.
//
// `smoke` is a module (a shader function): a point scaled, warped (two-level fBm) and read as fBm,
// with its scale, speed, turbulence and offset as the instance's knobs. The board uses it twice:
// a broad, slow body that sets where the smoke is, and a finer, quicker wisp that turns its colour.
//
// coord → swirl ┬→ smoke "body" ─→ density (smooth × strength) ─────────┐
//               └→ smoke "wisp" ─→ mix(hue-1, hue-2) → mix(·, hue-3) → fade → out
//                  (body's thick parts take hue-3, along a drifting gradient)
//
// Noise reads per fragment: 2 × smoke (warp 12 + noise 4) = 32.
import type { Chip, Circuit, Json, Module, Trace } from '../../graph/model/circuit';
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
const instance = (id: string, name: string, module: string, x: number, y: number, params: Record<string, Json>): Chip => ({
  id,
  type: 'module',
  module,
  name,
  x,
  y,
  pins: [],
  params,
});

/** smoke(p, scale, speed, turbulence, offset) → density 0–1: warped fBm, a shader function. */
const smoke: Module = {
  id: 'smoke',
  inPins: [
    { id: 'p', kind: 'point', label: 'Point', maps: { chip: 'grain', pin: 'p' } },
    { id: 'scale', kind: 'number', label: 'Scale', maps: { chip: 'grain', pin: 'scale' } },
    { id: 'offset', kind: 'number', label: 'Offset', maps: { chip: 'grain', pin: 'x' } },
    { id: 'speed', kind: 'number', label: 'Speed', maps: { chip: 'turbulence', pin: 'speed' } },
    { id: 'turbulence', kind: 'number', label: 'Turbulence', maps: { chip: 'turbulence', pin: 'amount' } },
  ],
  outPins: [{ id: 'n', kind: 'number', label: 'Density', maps: { chip: 'density', pin: 'n' } }],
  chips: [
    chip('transform', 'grain', 'Grain', 0, 100, { scale: 1 }),
    chip('warp', 'turbulence', 'Turbulence', 200, 100, { amount: 0.6, scale: 1, speed: 0.04 }),
    chip('noise', 'density', 'Density', 400, 100, { scale: 1 }),
  ],
  traces: [trace('grain', 'p', 'turbulence', 'p', 'point'), trace('turbulence', 'p', 'density', 'p', 'point')],
};

const board: Module = {
  id: 'board',
  inPins: [],
  outPins: [],
  chips: [
    // Where: the surface, curled a little about its centre, read as smoke twice.
    chip('coord', 'coord', 'Surface', 0, 200),
    chip('swirl', 'curl', 'Curl', 200, 200, { turns: 0.06 }),
    instance('body', 'Smoke body', 'smoke', 400, 80, { scale: 0.45, speed: 0.025, turbulence: 0.6, offset: 0 }),
    instance('wisp', 'Smoke wisp', 'smoke', 400, 340, { scale: 0.9, speed: 0.045, turbulence: 0.5, offset: 7.3 }),
    // How much: the body's density, soft-thresholded into veils.
    chip('smooth', 'veil', 'Veils', 600, 80, { low: 0.3, high: 0.85 }),
    chip('math', 'strength', 'Strength', 800, 80, { op: 'mul', b: 0.32 }),
    // Which colour: hue-1 to hue-2 by the wisp; the thick parts and one corner lean to hue-3.
    chip('theme', 'hue-1', 'Hue 1', 400, 800, { slot: 'hue-1' }),
    chip('theme', 'hue-2', 'Hue 2', 400, 920, { slot: 'hue-2' }),
    chip('mix', 'drift', 'Colour drift', 600, 760),
    chip('gradient', 'lean', 'Lean', 400, 1040, { angle: 135 }),
    chip('math', 'lean-body', 'Lean × body', 600, 920, { op: 'mul' }),
    chip('smooth', 'deep', 'Deep smoke', 800, 920, { low: 0.15, high: 0.7 }),
    chip('theme', 'hue-3', 'Hue 3', 800, 1060, { slot: 'hue-3' }),
    chip('mix', 'colour', 'Smoke colour', 1000, 800),
    chip('fade', 'smoke', 'Smoke', 1200, 200),
    chip('out', 'out', 'Out', 1400, 200),
  ],
  traces: [
    trace('coord', 'p', 'curl', 'p', 'point'),
    trace('curl', 'p', 'body', 'p', 'point'),
    trace('curl', 'p', 'wisp', 'p', 'point'),
    trace('body', 'n', 'veil', 'n', 'number'),
    trace('veil', 'n', 'strength', 'a', 'number'),
    trace('hue-1', 'c', 'drift', 'a', 'colour'),
    trace('hue-2', 'c', 'drift', 'b', 'colour'),
    trace('wisp', 'n', 'drift', 't', 'number'),
    trace('lean', 'n', 'lean-body', 'a', 'number'),
    trace('body', 'n', 'lean-body', 'b', 'number'),
    trace('lean-body', 'n', 'deep', 'n', 'number'),
    trace('drift', 'c', 'colour', 'a', 'colour'),
    trace('hue-3', 'c', 'colour', 'b', 'colour'),
    trace('deep', 'n', 'colour', 't', 'number'),
    trace('colour', 'c', 'smoke', 'c', 'colour'),
    trace('strength', 'n', 'smoke', 'amount', 'number'),
    trace('smoke', 'c', 'out', 'c', 'colour'),
  ],
};

const circuit: Circuit = { version: 1, board: 'board', modules: { board, smoke } };

export const ether: ShaderMaterialDef = { name: 'ether', label: 'Ether', circuit, scale: 0.4, animate: true, interactive: false };
