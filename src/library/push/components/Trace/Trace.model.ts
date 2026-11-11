// Trace's model: a line through a list of points, as an SVG, and the tree both renderers draw. No
// framework: `Trace.tsx` and `Trace.svelte` both pass `traceView` to their `Tree`. It is read, not
// played: it holds no state and names no handlers. It knows points, a region and markers, never
// what they measure: an envelope, a filter's response, an oscillator's shape and a spectrum are
// all a Trace.
import type { HueSlot } from '../../../components/hue';
import { h, type Node } from '../../../foundation/view/Tree.model';

export interface TraceMarker {
  /** Where across the trace, 0 to 1. */
  at: number;
  /** What it marks; drawn stronger when `strong`. */
  name?: string;
  strong?: boolean;
}

export interface TraceModelProps {
  /** The line's points, each `[across, up]`, 0 to 1. Fewer than two draw nothing. */
  points?: readonly (readonly [number, number])[];
  /** Fill the area under the line. Default false. */
  fill?: boolean;
  /**
   * A filled band between a low and a high edge, evenly spaced across: each `[low, high]`, 0 to 1.
   * A sample's peaks are a band. Drawn with, or in place of, the line.
   */
  band?: readonly (readonly [number, number])[];
  /** A stretch lit between two places across, 0 to 1 (a loop, a selection). */
  region?: readonly [number, number];
  /** Upright marks at places across the trace. */
  markers?: readonly TraceMarker[];
  /** A categorical hue slot for the line. Default: ink. */
  hue?: HueSlot;
  /** What the trace shows, for assistive technology ("Filter response"). Without it the trace is decorative. */
  name?: string;
  /** Shown dimmed. */
  disabled?: boolean;
  className?: string;
}

/** The drawing's box: 100 wide and 40 high, stretched to its container. */
export const TRACE_BOX = { w: 100, h: 40 } as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** The points as an SVG path: `up` 1 is the top of the box. '' for fewer than two points. */
export function tracePath(points: readonly (readonly [number, number])[] = []): string {
  if (points.length < 2) return '';
  return points.map(([x, y], i) => `${i ? 'L' : 'M'} ${fmt(clamp01(x) * TRACE_BOX.w)} ${fmt((1 - clamp01(y)) * TRACE_BOX.h)}`).join(' ');
}

/** The same line closed down to the baseline, for the fill. */
export function traceArea(points: readonly (readonly [number, number])[] = []): string {
  const line = tracePath(points);
  if (!line) return '';
  return `${line} L ${fmt(clamp01(points[points.length - 1][0]) * TRACE_BOX.w)} ${TRACE_BOX.h} L ${fmt(clamp01(points[0][0]) * TRACE_BOX.w)} ${TRACE_BOX.h} Z`;
}

/** A band as a closed SVG path: along its high edge, back along its low one. '' for fewer than two. */
export function traceBand(band: readonly (readonly [number, number])[] = []): string {
  if (band.length < 2) return '';
  const x = (i: number) => fmt((i / (band.length - 1)) * TRACE_BOX.w);
  const y = (v: number) => fmt((1 - clamp01(v)) * TRACE_BOX.h);
  const top = band.map(([, high], i) => `${i ? 'L' : 'M'} ${x(i)} ${y(high)}`);
  const bottom = band.map(([low], i) => `L ${x(i)} ${y(low)}`).reverse();
  return `${[...top, ...bottom].join(' ')} Z`;
}

/** The tree Trace draws: the region, the fill, the line and the markers, in one SVG. */
export function traceView({ points = [], fill = false, band, region, markers = [], hue, name, disabled = false, className }: TraceModelProps): Node {
  const line = tracePath(points);
  const from = region ? clamp01(Math.min(region[0], region[1])) : 0;
  const to = region ? clamp01(Math.max(region[0], region[1])) : 0;
  return h(
    'svg',
    {
      class: ['push-trace', className].filter(Boolean).join(' '),
      viewBox: `0 0 ${TRACE_BOX.w} ${TRACE_BOX.h}`,
      preserveAspectRatio: 'none',
      'data-part': 'root',
      'data-hue': hue === undefined ? undefined : String(hue),
      'data-disabled': disabled ? 'true' : undefined,
      role: name ? 'img' : undefined,
      'aria-label': name,
      'aria-hidden': name ? undefined : 'true',
    },
    region ? h('rect', { class: 'push-trace__region', 'data-part': 'region', x: fmt(from * TRACE_BOX.w), y: '0', width: fmt((to - from) * TRACE_BOX.w), height: String(TRACE_BOX.h) }) : null,
    band && band.length > 1 ? h('path', { class: 'push-trace__band', 'data-part': 'band', d: traceBand(band) }) : null,
    fill && line ? h('path', { class: 'push-trace__fill', 'data-part': 'fill', d: traceArea(points) }) : null,
    line ? h('path', { class: 'push-trace__line', 'data-part': 'line', d: line, 'vector-effect': 'non-scaling-stroke' }) : null,
    ...markers.map((m) =>
      h('line', {
        class: 'push-trace__marker',
        'data-part': 'marker',
        'data-name': m.name,
        'data-strong': m.strong ? 'true' : undefined,
        x1: fmt(clamp01(m.at) * TRACE_BOX.w),
        x2: fmt(clamp01(m.at) * TRACE_BOX.w),
        y1: '0',
        y2: String(TRACE_BOX.h),
        'vector-effect': 'non-scaling-stroke',
      }),
    ),
  );
}
