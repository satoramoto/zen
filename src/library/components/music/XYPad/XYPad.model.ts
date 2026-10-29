// XYPad's model: its props and the tree both renderers draw from them (the well, the quarter
// grid, the fading trail, the crosshair and its dot, the two axis labels, and the `xyInput` store
// it binds). No framework: `XYPad.tsx` (React) and `XYPad.svelte` (Svelte) both pass `xyPadView`
// and `xyPadHandlers` to their `Tree`; the drag and the keys are the `xyInput.ts` store beside it,
// registered as `xyInput` in `src/library/view/stores.ts`.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView } from '../../../primitives/Text.model';
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { XYPadForm } from './XYPad.forms';

/** The most trail points drawn: the tail, oldest first, so a long performance never grows the SVG. */
export const XY_TRAIL_POINTS = 24;

/** The quarter grid's hairlines, at 25, 50 and 75 of the 0–100 view box. */
const QUARTERS = [25, 50, 75] as const;

/** A fraction clamped to 0–1, with a non-finite value read as 0. */
export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** The trail's last `XY_TRAIL_POINTS` points, clamped; the tail is drawn, not the whole performance. */
export function xyTrailPoints(trail: XYPadModelProps['trail']): readonly (readonly [number, number])[] {
  return (trail ?? []).slice(-XY_TRAIL_POINTS).map(([x, y]) => [clamp01(x), clamp01(y)] as const);
}

/** Every XYPad prop (it has no framework children). */
export interface XYPadModelProps {
  /** Where the crosshair sits across the field, 0 (left) to 1 (right). */
  x: number;
  /** Where it sits down the field, 0 (bottom) to 1 (top). */
  y: number;
  /** The word at the bottom edge: what the horizontal axis controls ("Cutoff"). */
  xLabel?: string;
  /** The word up the left edge: what the vertical axis controls ("Resonance"). */
  yLabel?: string;
  /** The trail's identity: a hue slot (`--hue-n`). An app maps its meaning. Default: text ink. */
  hue?: HueSlot;
  /** Where the finger has been, oldest first, each point 0–1 in both axes. The last 24 are drawn, fading. */
  trail?: readonly (readonly [number, number])[];
  /** The form (`XY_PAD_FORMS`): `square`, or `wide` beside other controls. Wins over the assembled screen's choice. */
  form?: XYPadForm;
  /** Shown but not usable: no drag, no keys, dimmed. Default false. */
  disabled?: boolean;
  /** Called with the point asked for (0–1, y up) on a drag or an arrow key. Nothing while disabled. */
  onMove?: (x: number, y: number) => void;
}

/** A Text's attributes (its class and `data-*`). */
function text(props: Parameters<typeof textView>[0], extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs, ...extra };
}

/** The quarter grid: three hairlines each way, at 25, 50 and 75. */
function grid(): Node[] {
  return QUARTERS.flatMap((v) => [
    h('line', { class: 'yh-xypad__grid-line', x1: String(v), y1: '0', x2: String(v), y2: '100' }),
    h('line', { class: 'yh-xypad__grid-line', x1: '0', y1: String(v), x2: '100', y2: String(v) }),
  ]);
}

/** The trail as fading segments: the oldest faintest, the newest brightest; one line per step. */
function trailNodes(trail: XYPadModelProps['trail']): Node[] {
  const points = xyTrailPoints(trail);
  if (points.length < 2) return [];
  const steps = points.length - 1;
  return each(
    points.slice(1).map((to, i) => ({ from: points[i], to, i })),
    (step) => String(step.i),
    ({ from, to, i }) =>
      h('line', {
        class: 'yh-xypad__trail-line',
        x1: (from[0] * 100).toFixed(2),
        y1: ((1 - from[1]) * 100).toFixed(2),
        x2: (to[0] * 100).toFixed(2),
        y2: ((1 - to[1]) * 100).toFixed(2),
        opacity: (0.15 + 0.55 * ((i + 1) / steps)).toFixed(2),
      }),
  );
}

/**
 * The tree XYPad draws: the well (`well` Surface), the quarter grid, the trail, the crosshair at
 * (`x`, `y`) with its dot, and the two axis labels at the edges; binding the `xyInput` store (the
 * drag and the arrow keys) by `moveKey`, so a bank can route each pad's move to its own handler.
 */
export function xyPadView(
  { x, y, xLabel, yLabel, hue, trail, disabled = false }: XYPadModelProps,
  form: XYPadForm = 'square',
  moveKey = 'move',
): Node {
  const cx = clamp01(x);
  const cy = clamp01(y);
  const well = surfaceView({ material: 'well', radius: 'control', border: true, className: 'yh-xypad__well' });
  const name = xLabel || yLabel ? `XY pad: ${xLabel ?? 'X'} over ${yLabel ?? 'Y'}` : 'XY pad';
  return wire(
    h(
      'div',
      {
        class: `yh-xypad ${focusRing}`,
        role: 'group',
        'aria-roledescription': 'XY pad',
        'aria-label': name,
        'aria-disabled': disabled ? 'true' : undefined,
        tabindex: disabled ? undefined : '0',
        'data-form': form,
        'data-hue': hue === undefined ? undefined : String(hue),
        'data-disabled': disabled ? 'true' : undefined,
        'data-x': cx.toFixed(3),
        'data-y': cy.toFixed(3),
        style: styleText({ '--yh-xy-x': String(cx), '--yh-xy-y': String(cy) }),
      },
      h('span', { class: well.className, ...well.attrs, 'data-part': 'well', 'aria-hidden': 'true' }),
      h(
        'svg',
        { class: 'yh-xypad__field', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        h('g', { class: 'yh-xypad__grid' }, grid()),
        trailNodes(trail),
        h('line', { class: 'yh-xypad__cross', x1: (cx * 100).toFixed(2), y1: '0', x2: (cx * 100).toFixed(2), y2: '100' }),
        h('line', { class: 'yh-xypad__cross', x1: '0', y1: ((1 - cy) * 100).toFixed(2), x2: '100', y2: ((1 - cy) * 100).toFixed(2) }),
      ),
      h('span', { class: 'yh-xypad__dot', 'data-part': 'dot', 'aria-hidden': 'true' }),
      when(xLabel !== undefined, () => h('span', text({ role: 'caption', leading: 'tight', className: 'yh-xypad__axis yh-xypad__axis--x' }, { 'data-part': 'x-label' }), xLabel!)),
      when(yLabel !== undefined, () => h('span', text({ role: 'caption', leading: 'tight', className: 'yh-xypad__axis yh-xypad__axis--y' }, { 'data-part': 'y-label' }), yLabel!)),
    ),
    { bind: [['xyInput', { x: cx, y: cy, disabled, onMove: moveKey }]] },
  );
}

/** The callbacks `xyPadView`'s tree names: the move (by `moveKey`), as `xyPadView` named it. */
export function xyPadHandlers(props: XYPadModelProps, moveKey = 'move'): Handlers {
  return { [moveKey]: props.onMove };
}
