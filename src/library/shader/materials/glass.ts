// glass (docs/shader-graph.md, "The three materials" and "Liquid glass"): plain, high-quality
// glass. The CSS layer under it (frost's `glass()` in themes/materials.ts) already gives the real
// blur through, the tint and a soft highlight, and is the whole look where WebGL isn't; this
// circuit only adds light over it, with restraint:
//
// - body: a whisper of the ground and a fine grain of ink, so the pane isn't flat digital;
// - glow: a soft inner rim light, brighter on the lit top edge than the bottom (a `bevel`);
// - sheen: one faint specular band across the top-left;
// - hairline: a crisp bright line just inside the edge, brighter on top (a `bevel`);
// - outline: an ink line on the very edge, so the pale light-mode glass keeps a boundary (ink
//   turns over with the mode: a dark line in the light mode, a faint light one in the dark).
//
// Laid over each other bottom to top by `layers`. Static (`animate: false`) at full resolution
// (`scale: 1`), so the hairline is crisp and the pane costs a frame only on resize or change.
import type { Chip, Circuit, Module, Trace } from '../../graph/model/circuit';
import { shaderChip } from '../nodes';
import type { PinKind, ShaderMaterialDef } from '../types';

/** A trace from `chip.pin` to `chip.pin`. */
const wire = (id: string, from: string, to: string, kind: PinKind): Trace => {
  const [fc, fp] = from.split('.');
  const [tc, tp] = to.split('.');
  return { id, from: { chip: fc, pin: fp }, to: { chip: tc, pin: tp }, kind };
};

/**
 * bevel: a rim lit from one side. `rim` gives 1 at the box's edge falling to 0 `width` CSS px
 * inside; `tilt` (a gradient, angle 0: 0 at the bottom, 1 at the top) shades it from `floor` on
 * the far side to `floor + contrast` on the lit one; `gain` scales the result.
 */
const bevel: Module = {
  id: 'bevel',
  chips: [
    shaderChip('rim', 'rim', 0, 0, { width: 12, softness: 1 }),
    shaderChip('gradient', 'tilt', 0, 160, { angle: 0 }),
    shaderChip('math', 'contrast', 200, 160, { op: 'mul', b: 0.7 }),
    shaderChip('math', 'floor', 400, 160, { op: 'add', b: 0.3 }),
    shaderChip('math', 'shade', 600, 60, { op: 'mul' }),
    shaderChip('math', 'gain', 800, 60, { op: 'mul', b: 1 }),
  ],
  traces: [
    wire('tilt-contrast', 'tilt.n', 'contrast.a', 'number'),
    wire('contrast-floor', 'contrast.n', 'floor.a', 'number'),
    wire('rim-shade', 'rim.n', 'shade.a', 'number'),
    wire('floor-shade', 'floor.n', 'shade.b', 'number'),
    wire('shade-gain', 'shade.n', 'gain.a', 'number'),
  ],
  inPins: [
    { id: 'width', kind: 'number', label: 'Width', maps: { chip: 'rim', pin: 'width' } },
    { id: 'softness', kind: 'number', label: 'Softness', maps: { chip: 'rim', pin: 'softness' } },
    { id: 'angle', kind: 'number', label: 'Light angle', maps: { chip: 'tilt', pin: 'angle' } },
    { id: 'contrast', kind: 'number', label: 'Contrast', maps: { chip: 'contrast', pin: 'b' } },
    { id: 'floor', kind: 'number', label: 'Floor', maps: { chip: 'floor', pin: 'b' } },
    { id: 'gain', kind: 'number', label: 'Gain', maps: { chip: 'gain', pin: 'b' } },
  ],
  outPins: [{ id: 'n', kind: 'number', label: 'Light', maps: { chip: 'gain', pin: 'n' } }],
};

/** An instance of `bevel` (its pins come from the module). */
const bevelChip = (id: string, x: number, y: number, params: Chip['params']): Chip => ({ id, type: 'bevel', module: 'bevel', x, y, pins: [], params });

/** The merge's in pins, bottom first. */
const LAYERS = ['body', 'grain', 'glow', 'sheen', 'hairline', 'outline'] as const;

const board: Module = {
  id: 'board',
  chips: [
    // Sources.
    shaderChip('theme', 'ground', 0, 0, { slot: 'ground', alpha: 0.04 }),
    shaderChip('coord', 'coord', 0, 140),
    shaderChip('theme', 'ink', 0, 260, { slot: 'ink', alpha: 0.014 }),
    shaderChip('tint', 'light', 0, 560, { r: 1, g: 1, b: 1, alpha: 1 }),
    shaderChip('theme', 'edge-ink', 0, 1160, { slot: 'ink', alpha: 0.22 }),

    // Fields: where each layer's light falls. (A bevel instance shows six knobs: give it room.)
    shaderChip('noise', 'grain-field', 200, 140, { scale: 60 }),
    bevelChip('glow-rim', 200, 300, { width: 14, softness: 1, angle: 0, contrast: 0.75, floor: 0.25, gain: 0.11 }),
    shaderChip('sheen', 'sheen-band', 200, 660, { angle: 150, width: 0.32, offset: -0.62 }),
    bevelChip('hairline-rim', 200, 820, { width: 1.5, softness: 0, angle: 0, contrast: 0.65, floor: 0.35, gain: 0.32 }),
    shaderChip('rim', 'edge', 200, 1160, { width: 1, softness: 0 }),

    // Shaping.
    shaderChip('smooth', 'grain-contrast', 400, 140, { low: 0.2, high: 0.8 }),
    shaderChip('math', 'sheen-gain', 400, 660, { op: 'mul', b: 0.07 }),

    // Colour each layer.
    shaderChip('fade', 'grain', 600, 140),
    shaderChip('fade', 'glow', 600, 380),
    shaderChip('fade', 'sheen', 600, 660),
    shaderChip('fade', 'hairline', 600, 880),
    shaderChip('fade', 'outline', 600, 1160),

    // Lay them over each other, bottom first.
    {
      id: 'layers',
      type: 'merge',
      x: 800,
      y: 560,
      pins: [...LAYERS.map((id) => ({ id, side: 'in' as const, kind: 'colour', label: id })), { id: 'out', side: 'out' as const, kind: 'colour', label: 'Out' }],
    },
    shaderChip('out', 'out', 1000, 560),
  ],
  traces: [
    wire('coord-grain', 'coord.p', 'grain-field.p', 'point'),
    wire('grain-contrast', 'grain-field.n', 'grain-contrast.n', 'number'),
    wire('grain-amount', 'grain-contrast.n', 'grain.amount', 'number'),
    wire('ink-grain', 'ink.c', 'grain.c', 'colour'),

    wire('light-glow', 'light.c', 'glow.c', 'colour'),
    wire('glow-amount', 'glow-rim.n', 'glow.amount', 'number'),

    wire('light-sheen', 'light.c', 'sheen.c', 'colour'),
    wire('sheen-gain', 'sheen-band.n', 'sheen-gain.a', 'number'),
    wire('sheen-amount', 'sheen-gain.n', 'sheen.amount', 'number'),

    wire('light-hairline', 'light.c', 'hairline.c', 'colour'),
    wire('hairline-amount', 'hairline-rim.n', 'hairline.amount', 'number'),

    wire('ink-outline', 'edge-ink.c', 'outline.c', 'colour'),
    wire('outline-amount', 'edge.n', 'outline.amount', 'number'),

    wire('body-layers', 'ground.c', 'layers.body', 'colour'),
    wire('grain-layers', 'grain.c', 'layers.grain', 'colour'),
    wire('glow-layers', 'glow.c', 'layers.glow', 'colour'),
    wire('sheen-layers', 'sheen.c', 'layers.sheen', 'colour'),
    wire('hairline-layers', 'hairline.c', 'layers.hairline', 'colour'),
    wire('outline-layers', 'outline.c', 'layers.outline', 'colour'),
    wire('layers-out', 'layers.out', 'out.c', 'colour'),
  ],
  inPins: [],
  outPins: [],
};

const circuit: Circuit = { version: 1, board: 'board', modules: { board, bevel } };

export const glass: ShaderMaterialDef = { name: 'glass', label: 'Glass', circuit, scale: 1, animate: false, interactive: false };
