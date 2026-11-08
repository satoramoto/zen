// Sinusoids: y = A·f(B(x − C)) + D for sine, cosine and tangent; the period, the inverse
// functions with their restricted domains, and how well a curve fits data points. Pure.
import { TAU } from './angle';

export type WaveKind = 'sin' | 'cos' | 'tan';

export interface Wave {
  kind: WaveKind;
  /** Amplitude A (ignored by tangent's shape but still scales it). */
  amplitude: number;
  /** The period: 2π/B for sine and cosine, π/B for tangent. */
  period: number;
  /** The phase shift C: the curve is moved right by it. */
  shift: number;
  /** The midline D. */
  midline: number;
}

/** B from the period. */
export const angularFrequency = (w: Wave) => (w.kind === 'tan' ? Math.PI : TAU) / w.period;

/** The period from B. */
export const periodFrom = (kind: WaveKind, B: number) => (kind === 'tan' ? Math.PI : TAU) / B;

const fn = { sin: Math.sin, cos: Math.cos, tan: Math.tan };

/** y at x. */
export function waveAt(w: Wave, x: number): number {
  return w.amplitude * fn[w.kind](angularFrequency(w) * (x - w.shift)) + w.midline;
}

/** Sample the curve over [from, to] into runs, broken at tangent's poles. */
export function sampleWave(w: Wave, from: number, to: number, n = 400): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  let last: number | undefined;
  for (let i = 0; i <= n; i++) {
    const x = from + ((to - from) * i) / n;
    const y = waveAt(w, x);
    const broken = !Number.isFinite(y) || Math.abs(y) > 50 || (last !== undefined && Math.abs(y - last) > 20);
    if (broken) {
      if (run.length > 1) runs.push(run);
      run = [];
      last = undefined;
      if (!Number.isFinite(y) || Math.abs(y) > 50) continue;
    }
    run.push({ x, y });
    last = y;
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

/** The x of tangent's poles in [from, to]. */
export function poles(w: Wave, from: number, to: number): number[] {
  if (w.kind !== 'tan') return [];
  const out: number[] = [];
  const B = angularFrequency(w);
  const first = Math.ceil(((from - w.shift) * B - Math.PI / 2) / Math.PI);
  for (let k = first; ; k++) {
    const x = w.shift + (Math.PI / 2 + k * Math.PI) / B;
    if (x > to) break;
    out.push(x);
  }
  return out;
}

/** The restricted domain on which each function is one-to-one, so its inverse exists. */
export const RESTRICTED: Record<WaveKind, [number, number]> = {
  sin: [-Math.PI / 2, Math.PI / 2],
  cos: [0, Math.PI],
  tan: [-Math.PI / 2, Math.PI / 2],
};

/** The inverse function's value, or NaN outside its domain. */
export function inverseAt(kind: WaveKind, y: number): number {
  if (kind === 'sin') return y < -1 || y > 1 ? NaN : Math.asin(y);
  if (kind === 'cos') return y < -1 || y > 1 ? NaN : Math.acos(y);
  return Math.atan(y);
}

/** The range of the inverse: the restricted domain of the function. */
export const inverseRange = (kind: WaveKind) => RESTRICTED[kind];

/**
 * Every solution of f(x) = k on [from, to] for the plain function (amplitude 1, period 2π,
 * no shift, midline 0), found from the inverse and the function's symmetry.
 */
export function solveOn(kind: WaveKind, k: number, from: number, to: number): number[] {
  const base = inverseAt(kind, k);
  if (Number.isNaN(base)) return [];
  const P = kind === 'tan' ? Math.PI : TAU;
  const seeds = kind === 'sin' ? [base, Math.PI - base] : kind === 'cos' ? [base, -base] : [base];
  const out: number[] = [];
  for (const s of seeds) {
    const first = Math.ceil((from - s) / P);
    for (let n = first; ; n++) {
      const x = s + n * P;
      if (x > to + 1e-9) break;
      if (x >= from - 1e-9) out.push(x);
    }
  }
  return [...new Set(out.map((x) => Math.round(x * 1e9) / 1e9))].sort((p, q) => p - q);
}

export interface DataPoint {
  x: number;
  y: number;
}

/** How far each point is from the curve, and whether all are within `band`. */
export function fit(w: Wave, points: DataPoint[], band: number): { residuals: number[]; worst: number; within: boolean } {
  const residuals = points.map((p) => p.y - waveAt(w, p.x));
  const worst = residuals.reduce((m, r) => Math.max(m, Math.abs(r)), 0);
  return { residuals, worst, within: worst <= band + 1e-9 };
}
