// The node library (docs/shader-graph.md, "The node library"): a chip's `type` names one of these
// specs, which give its pins, its options and the GLSL each outlet compiles to.
//
// Points are in coord units (CSS pixels / 100, origin top-left, y down) unless a node says uv
// (0..1 across the box, also y down). Colours are premultiplied. Angles are degrees.
import type { Chip, Json, Pin } from '../graph/model/circuit';
import type { NodeInput, NodeOutput, NodeSpec } from './types';

const num = (id: string, label: string, def: number, min: number, max: number, step: number, unit?: string): NodeInput => ({
  id,
  kind: 'number',
  label,
  default: def,
  min,
  max,
  step,
  ...(unit ? { unit } : {}),
});
const point = (id = 'p', label = 'Point', fallback?: string): NodeInput => ({ id, kind: 'point', label, ...(fallback ? { fallback } : {}) });
const colour = (id = 'c', label = 'Colour'): NodeInput => ({ id, kind: 'colour', label });
const outP = (id = 'p', label = 'Point'): NodeOutput => ({ id, kind: 'point', label });
const outN = (id = 'n', label = 'Value'): NodeOutput => ({ id, kind: 'number', label });
const outC = (id = 'c', label = 'Colour'): NodeOutput => ({ id, kind: 'colour', label });
const angle = (def: number) => num('angle', 'Angle', def, -180, 180, 1, '°');

const THEME_SLOTS = ['ground', 'ink', 'accent', 'hue-1', 'hue-2', 'hue-3', 'hue-4', 'hue-5'] as const;
const MATH_OPS = ['add', 'sub', 'mul', 'div', 'min', 'max', 'pow'] as const;
const BLEND_MODES = ['over', 'add', 'screen', 'multiply'] as const;
const BLEND_FN: Record<string, string> = { over: 'zOver', add: 'zAdd', screen: 'zScreen', multiply: 'zMultiply' };

export const SHADER_NODES: Record<string, NodeSpec> = {
  // --- Sources -------------------------------------------------------------------------------
  coord: {
    type: 'coord',
    label: 'Coord',
    description: 'The fragment position in CSS pixels / 100, origin top-left: the same grain on a chip and a board.',
    inputs: [],
    outputs: [outP()],
    emit: () => 'coord',
  },
  uv: {
    type: 'uv',
    label: 'UV',
    description: 'The fragment position 0–1 across the box, origin top-left.',
    inputs: [],
    outputs: [outP()],
    emit: () => 'uv',
  },
  time: {
    type: 'time',
    label: 'Time',
    description: 'Seconds on the page-wide clock, times speed.',
    inputs: [num('speed', 'Speed', 1, 0, 4, 0.01)],
    outputs: [outN('n', 'Time')],
    emit: (i) => `(uTime * ${i.speed})`,
  },
  pointer: {
    type: 'pointer',
    label: 'Pointer',
    description: 'Where the pointer is (coord units), seconds since the last press, and 1 while it is inside.',
    inputs: [],
    outputs: [outP('p', 'Point'), outN('age', 'Age'), outN('inside', 'Inside')],
    emit: (_i, _o, outlet) => (outlet === 'age' ? 'uPointer.z' : outlet === 'inside' ? 'uPointer.w' : 'uPointer.xy'),
  },
  value: {
    type: 'value',
    label: 'Value',
    description: 'A knob.',
    inputs: [num('value', 'Value', 0.5, 0, 1, 0.01)],
    outputs: [outN()],
    emit: (i) => `(${i.value})`,
  },
  theme: {
    type: 'theme',
    label: 'Theme',
    description: "A colour from the scope's theme: the ground, the ink, the accent or one of the five hues.",
    inputs: [num('alpha', 'Alpha', 1, 0, 1, 0.01)],
    outputs: [outC()],
    options: { slot: { values: THEME_SLOTS, default: 'ground' } },
    emit: (i, o) => {
      const slot = Math.max(0, (THEME_SLOTS as readonly string[]).indexOf(o.slot));
      return `(vec4(uTheme[${slot}], 1.0) * clamp(${i.alpha}, 0.0, 1.0))`;
    },
  },
  tint: {
    type: 'tint',
    label: 'Tint',
    description: 'A fixed colour.',
    inputs: [num('r', 'Red', 1, 0, 1, 0.01), num('g', 'Green', 1, 0, 1, 0.01), num('b', 'Blue', 1, 0, 1, 0.01), num('alpha', 'Alpha', 1, 0, 1, 0.01)],
    outputs: [outC()],
    emit: (i) => `(vec4(clamp(vec3(${i.r}, ${i.g}, ${i.b}), 0.0, 1.0), 1.0) * clamp(${i.alpha}, 0.0, 1.0))`,
  },

  // --- Geometry: move a point before a field reads it ----------------------------------------
  transform: {
    type: 'transform',
    label: 'Transform',
    description: 'Scale, rotate (about the origin), then move a point.',
    inputs: [
      point(),
      num('scale', 'Scale', 1, 0.05, 10, 0.01),
      num('rotate', 'Rotate', 0, -180, 180, 1, '°'),
      num('x', 'X', 0, -10, 10, 0.01),
      num('y', 'Y', 0, -10, 10, 0.01),
    ],
    outputs: [outP()],
    helpers: ['rotate'],
    emit: (i) => `(zRotate(${i.p} * ${i.scale}, ${i.rotate}) + vec2(${i.x}, ${i.y}))`,
  },
  drift: {
    type: 'drift',
    label: 'Drift',
    description: 'Slide a point steadily along an angle, speed in coord units a second.',
    inputs: [point(), num('speed', 'Speed', 0.05, 0, 1, 0.005), angle(0)],
    outputs: [outP()],
    emit: (i) => `(${i.p} + vec2(cos(radians(${i.angle})), sin(radians(${i.angle}))) * uTime * ${i.speed})`,
  },
  warp: {
    type: 'warp',
    label: 'Warp',
    description: 'A slow, turbulent two-level fBm domain warp (12 noise reads).',
    inputs: [point(), num('amount', 'Amount', 0.5, 0, 2, 0.01), num('scale', 'Scale', 1, 0.1, 8, 0.01), num('speed', 'Speed', 0.05, 0, 1, 0.005)],
    outputs: [outP()],
    helpers: ['warp'],
    emit: (i) => `zWarp(${i.p}, ${i.amount}, ${i.scale}, ${i.speed})`,
  },
  swirl: {
    type: 'swirl',
    label: 'Swirl',
    description: "Twist a point about the box's centre, more the further out.",
    inputs: [point(), num('turns', 'Turns', 0.2, -2, 2, 0.01)],
    outputs: [outP()],
    helpers: ['swirl'],
    emit: (i) => `zSwirl(${i.p}, ${i.turns})`,
  },
  ripple: {
    type: 'ripple',
    label: 'Ripple',
    description: 'A ring spreading from the last press (speed in coord units a second), fading as it goes.',
    inputs: [point(), num('strength', 'Strength', 0.3, 0, 1, 0.01), num('speed', 'Speed', 3, 0, 8, 0.05), num('decay', 'Decay', 1.5, 0.1, 4, 0.05)],
    outputs: [outP()],
    helpers: ['ripple'],
    emit: (i) => `zRipple(${i.p}, ${i.strength}, ${i.speed}, ${i.decay})`,
  },

  // --- Fields: a number 0..1 at a point -------------------------------------------------------
  noise: {
    type: 'noise',
    label: 'Noise',
    description: 'Four octaves of value-noise fBm, 0–1 (4 noise reads).',
    inputs: [point(), num('scale', 'Scale', 1, 0.1, 8, 0.01)],
    outputs: [outN()],
    helpers: ['fbm'],
    emit: (i) => `zFbm(${i.p} * ${i.scale})`,
  },
  caustics: {
    type: 'caustics',
    label: 'Caustics',
    description: 'Sunlight through water: two Worley layers drifting against each other, 0–1 (18 cell reads).',
    inputs: [point(), num('scale', 'Scale', 1, 0.1, 8, 0.01), num('speed', 'Speed', 0.3, 0, 2, 0.01), num('sharpness', 'Sharpness', 0.5, 0, 1, 0.01)],
    outputs: [outN()],
    helpers: ['caustics'],
    emit: (i) => `zCaustics(${i.p}, ${i.scale}, ${i.speed}, ${i.sharpness})`,
  },
  rim: {
    type: 'rim',
    label: 'Rim',
    description: "1 at the box's rounded edge, falling to 0 at width CSS pixels inside.",
    inputs: [num('width', 'Width', 12, 0, 64, 0.5, 'CSS px'), num('softness', 'Softness', 0.5, 0, 1, 0.01)],
    outputs: [outN()],
    helpers: ['rim'],
    emit: (i) => `zRim(${i.width}, ${i.softness})`,
  },
  sheen: {
    type: 'sheen',
    label: 'Sheen',
    description: 'A soft band of light across the box (angle as in CSS: 0 up, 90 right; offset -1–1 corner to corner).',
    inputs: [angle(135), num('width', 'Width', 0.35, 0, 1, 0.01), num('offset', 'Offset', 0, -1, 1, 0.01)],
    outputs: [outN()],
    helpers: ['sheen'],
    emit: (i) => `zSheen(${i.angle}, ${i.width}, ${i.offset})`,
  },
  gradient: {
    type: 'gradient',
    label: 'Gradient',
    description: 'A linear ramp 0–1 across the box (angle as in CSS: 90 is left to right).',
    inputs: [point('p', 'Point', 'uv'), angle(90)],
    outputs: [outN()],
    helpers: ['gradient'],
    emit: (i) => `zGradient(${i.p}, ${i.angle})`,
  },

  // --- Numbers ---------------------------------------------------------------------------------
  math: {
    type: 'math',
    label: 'Math',
    description: 'Two numbers combined.',
    inputs: [num('a', 'A', 0, -10, 10, 0.01), num('b', 'B', 1, -10, 10, 0.01)],
    outputs: [outN()],
    options: { op: { values: MATH_OPS, default: 'add' } },
    emit: (i, o) => {
      const { a, b } = i;
      switch (o.op) {
        case 'sub':
          return `(${a} - ${b})`;
        case 'mul':
          return `(${a} * ${b})`;
        case 'div':
          return `(${a} / (abs(${b}) < 1e-6 ? 1e-6 : ${b}))`;
        case 'min':
          return `min(${a}, ${b})`;
        case 'max':
          return `max(${a}, ${b})`;
        case 'pow':
          return `pow(max(${a}, 0.0), ${b})`;
        default:
          return `(${a} + ${b})`;
      }
    },
  },
  smooth: {
    type: 'smooth',
    label: 'Smooth',
    description: 'smoothstep(low, high, n): a soft threshold.',
    inputs: [num('n', 'Value', 0.5, 0, 1, 0.01), num('low', 'Low', 0, 0, 1, 0.01), num('high', 'High', 1, 0, 1, 0.01)],
    outputs: [outN()],
    emit: (i) => `smoothstep(${i.low}, ${i.high}, ${i.n})`,
  },

  // --- Colours ---------------------------------------------------------------------------------
  mix: {
    type: 'mix',
    label: 'Mix',
    description: 'From colour a to colour b by t.',
    inputs: [colour('a', 'A'), colour('b', 'B'), num('t', 'T', 0.5, 0, 1, 0.01)],
    outputs: [outC()],
    emit: (i) => `mix(${i.a}, ${i.b}, clamp(${i.t}, 0.0, 1.0))`,
  },
  fade: {
    type: 'fade',
    label: 'Fade',
    description: 'A colour times an amount: its coverage scaled.',
    inputs: [colour(), num('amount', 'Amount', 1, 0, 1, 0.01)],
    outputs: [outC()],
    emit: (i) => `(${i.c} * clamp(${i.amount}, 0.0, 1.0))`,
  },
  hue: {
    type: 'hue',
    label: 'Hue',
    description: 'Turn the hue (a full turn is 1).',
    inputs: [colour(), num('shift', 'Shift', 0, -0.5, 0.5, 0.01)],
    outputs: [outC()],
    helpers: ['hue'],
    emit: (i) => `zHue(${i.c}, ${i.shift})`,
  },
  levels: {
    type: 'levels',
    label: 'Levels',
    description: 'Contrast (gain) and brightness (lift); 0.5 leaves a colour alone.',
    inputs: [colour(), num('gain', 'Gain', 0.5, 0, 1, 0.01), num('lift', 'Lift', 0.5, 0, 1, 0.01)],
    outputs: [outC()],
    helpers: ['levels'],
    emit: (i) => `zLevels(${i.c}, ${i.gain}, ${i.lift})`,
  },
  blend: {
    type: 'blend',
    label: 'Blend',
    description: 'Colour b laid on colour a, by amount.',
    inputs: [colour('a', 'Under'), colour('b', 'Over'), num('amount', 'Amount', 1, 0, 1, 0.01)],
    outputs: [outC()],
    options: { mode: { values: BLEND_MODES, default: 'over' } },
    helpers: ['blend'],
    emit: (i, o) => `${BLEND_FN[o.mode] ?? 'zOver'}(${i.a}, ${i.b} * clamp(${i.amount}, 0.0, 1.0))`,
  },
  merge: {
    type: 'merge',
    label: 'Merge',
    description: 'Every source on one inlet: colours laid over in pin order (the first is the bottom), numbers summed.',
    // A merge chip's in pins are its own (one per source). The compiler hands them in keyed by
    // their index ('0', '1', ...) and passes the chip's kind as the `kind` option.
    inputs: [],
    outputs: [{ id: 'out', kind: 'colour', label: 'Out' }],
    helpers: ['blend'],
    emit: (i, o) => {
      const parts = Object.keys(i)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => i[k]);
      if (o.kind === 'number') return parts.length ? `(${parts.join(' + ')})` : '0.0';
      if (o.kind === 'point') return parts.length ? `(${parts.join(' + ')})` : 'vec2(0.0)';
      return parts.reduce((acc, c) => (acc ? `zOver(${acc}, ${c})` : c), '') || 'vec4(0.0)';
    },
  },
  out: {
    type: 'out',
    label: 'Out',
    description: 'The fragment: this colour, clamped and premultiplied, is what the surface shows.',
    inputs: [colour()],
    outputs: [],
    emit: (i) => i.c,
  },
};

/**
 * A chip of a node type with its pins from the spec: inputs on side `in` (numbers marked
 * `param`), outputs on side `out`, each with its kind and label. A `merge` chip starts with no in
 * pins (the editor grows one per source) and a colour `out`. An unknown type gets no pins.
 */
export function shaderChip(type: string, id: string, x: number, y: number, params?: Record<string, Json>): Chip {
  const s = Object.prototype.hasOwnProperty.call(SHADER_NODES, type) ? SHADER_NODES[type] : undefined;
  const pins: Pin[] = [];
  for (const i of s?.inputs ?? []) {
    const pin: Pin = { id: i.id, side: 'in', kind: i.kind };
    if (i.label) pin.label = i.label;
    if (i.kind === 'number') pin.param = true;
    pins.push(pin);
  }
  for (const o of s?.outputs ?? []) {
    const pin: Pin = { id: o.id, side: 'out', kind: o.kind };
    if (o.label) pin.label = o.label;
    pins.push(pin);
  }
  return { id, type, x, y, pins, ...(params ? { params } : {}) };
}
