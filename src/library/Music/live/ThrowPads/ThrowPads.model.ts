// ThrowPads' model: named pairs of XY throws (a delay's feedback × time, a filter's cutoff ×
// resonance), and the tree both renderers draw from them. No framework: `ThrowPads.tsx` and
// `ThrowPads.svelte` both pass `throwPadsView` and `throwPadsHandlers` to their `Tree`. The drag
// and the arrow keys are zen's `xyInput` store (`components/music/XYPad/xyInput.ts`, registered by
// that name), bound to each pad's field: it only asks `onMove({ id, x, y })` and moves nothing.
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { inkStyle, livePane, liveReading, type StemInk } from '../live.model';
import type { ThrowPadsForm } from './ThrowPads.forms';

/** The most trail points drawn: the tail, oldest first. */
export const THROW_TRAIL_POINTS = 24;

/** A point on a pad, 0–1 across and 0–1 up. */
export interface ThrowPoint {
  x: number;
  y: number;
}

/** One XY throw. */
export interface ThrowPad {
  /** What `onMove` carries. Unique among the pads. */
  id: string;
  /** `'Delay throw'`: drawn in the pad's ink. */
  name: string;
  /** The stem ink the pad wears (default: the accent). */
  ink?: StemInk;
  /** 0 (left) to 1 (right). */
  x: number;
  /** 0 (bottom) to 1 (top). */
  y: number;
  /** What the horizontal axis rides: `'Time'`. */
  xLabel: string;
  /** What the vertical axis rides: `'Feedback'`. */
  yLabel: string;
  /** Where the finger has just been, oldest first; the last 24 are drawn, fading. */
  trail?: readonly ThrowPoint[];
}

/** What a drag or an arrow key asks for: a pad and its new point. */
export interface ThrowMove {
  id: string;
  x: number;
  y: number;
}

export interface ThrowPadsProps {
  /** The pads, left to right; `two-up` draws the first two, `one` the first. */
  pads: readonly ThrowPad[];
  /** A pad was dragged or nudged. Without it the pads are read-only. */
  onMove?: (move: ThrowMove) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: ThrowPadsForm;
  className?: string;
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const pct = (n: number): string => `${(clamp01(n) * 100).toFixed(2)}%`;
/** A reading: `76%`. */
export const throwReading = (n: number): string => `${Math.round(clamp01(n) * 100)}%`;

function trail(points: readonly ThrowPoint[] | undefined): Node {
  const tail = (points ?? []).slice(-THROW_TRAIL_POINTS);
  return h(
    'span',
    { class: 'live-throws-trail', 'data-part': 'trail', 'aria-hidden': 'true' },
    ...each(tail, (_, i) => String(tail.length - i), (p, i) =>
      h('span', { style: styleText({ left: pct(p.x), top: pct(1 - p.y), opacity: (0.12 + 0.6 * ((i + 1) / tail.length)).toFixed(2) }) }),
    ),
  );
}

function pad(p: ThrowPad, inert: boolean): Node {
  const x = clamp01(p.x);
  const y = clamp01(p.y);
  return h(
    'div',
    { class: 'live-throws-pad', 'data-part': 'pad', 'data-pad': p.id, style: inkStyle(p.ink) },
    h(
      'div',
      { class: 'live-throws-head' },
      h('span', { class: 'live-throws-name', 'data-part': 'name' }, p.name),
      liveReading(`x ${throwReading(x)}  y ${throwReading(y)}`, { 'data-part': 'reading' }),
    ),
    wire(
      h(
        'div',
        {
          class: 'live-throws-field',
          'data-part': 'field',
          role: 'group',
          'aria-roledescription': 'XY pad',
          'aria-label': `${p.name}: ${p.xLabel} ${throwReading(x)}, ${p.yLabel} ${throwReading(y)}`,
          'aria-disabled': inert ? 'true' : undefined,
          tabindex: inert ? undefined : '0',
          'data-x': x.toFixed(3),
          'data-y': y.toFixed(3),
        },
        h('span', { class: 'live-throws-grid', 'aria-hidden': 'true' }),
        trail(p.trail),
        h('span', { class: 'live-throws-cross', 'data-axis': 'x', 'aria-hidden': 'true', style: styleText({ left: pct(x) }) }),
        h('span', { class: 'live-throws-cross', 'data-axis': 'y', 'aria-hidden': 'true', style: styleText({ top: pct(1 - y) }) }),
        h('span', { class: 'live-throws-dot', 'data-part': 'dot', 'aria-hidden': 'true', style: styleText({ left: pct(x), top: pct(1 - y) }) }),
        h('span', { class: 'live-throws-axis', 'data-axis': 'x', 'aria-hidden': 'true' }, `${p.xLabel} →`),
        h('span', { class: 'live-throws-axis', 'data-axis': 'y', 'aria-hidden': 'true' }, `${p.yLabel} ↑`),
      ),
      { bind: [['xyInput', { x, y, disabled: inert, onMove: `move:${p.id}` }]] },
    ),
  );
}

/**
 * The tree ThrowPads draws: one or two pads, each its name in its ink over a reading of the point,
 * and a field in a well — the mixer's waveform grid, the axes' captions on its edges, the finger's
 * trail as fading dots, a 1px crosshair and a dot at the point. `form` is the binding's
 * (`useForm` / `getForm`).
 */
export function throwPadsView({ pads, onMove, className }: ThrowPadsProps, form: ThrowPadsForm): Node {
  const shown = pads.slice(0, form === 'one' ? 1 : 2);
  const inert = onMove === undefined;
  return livePane(
    'throws',
    { class: className, 'data-form': form, 'data-inert': inert ? 'true' : undefined, role: 'group', 'aria-label': 'Throws' },
    when(shown.length === 0, () => h('div', { class: 'live-throws-empty', 'data-part': 'empty' }, h('span', { class: 'live-axis' }, 'No throws'))),
    h('div', { class: 'live-throws-pads', 'data-part': 'pads' }, ...each(shown, (p) => p.id, (p) => pad(p, inert))),
  );
}

/** The callbacks the tree names: one move per pad (`move:<id>`), carrying its id. */
export function throwPadsHandlers({ pads, onMove }: ThrowPadsProps): Handlers {
  const handlers: Handlers = {};
  for (const { id } of pads) handlers[`move:${id}`] = (x: number, y: number) => onMove?.({ id, x, y });
  return handlers;
}
