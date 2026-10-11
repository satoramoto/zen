// The ring's geometry in its own 48 × 48 box: the arc starts 225° clockwise from the top (bottom
// left) and sweeps 270°, as on a hardware knob.

export const BOX = 48;
export const C = 24;
export const R = 19;
export const START = 225;
export const SWEEP = 270;

export function point(deg: number, r = R): { x: number; y: number } {
  const th = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(th), y: C - r * Math.cos(th) };
}

/** An SVG arc path from `from`° to `to`° on the ring; '' when it has no length. */
export function arc(from: number, to: number): string {
  if (to - from <= 0) return '';
  const a = point(from);
  const b = point(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Degrees round the arc for a 0–1 fraction, clamped. */
export function sweepOf(fraction: number): number {
  return Math.round(Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0)) * SWEEP);
}

/** Pixels of wheel travel that make one notch (a trackpad's small deltas add up to it). */
export const WHEEL_PX = 20;
/** Drag travel per step, and per step with Shift (fine). */
export const DRAG_PX = 4;
export const FINE_PX = 16;

/** A wheel event's travel in pixels, whatever unit it came in. */
export function wheelPx(deltaY: number, deltaMode: number): number {
  return deltaMode === 1 ? deltaY * WHEEL_PX : deltaMode === 2 ? deltaY * WHEEL_PX * 10 : deltaY;
}
