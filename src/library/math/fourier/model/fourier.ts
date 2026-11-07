// The Fourier series of a closed drawing: a path f(t), t from 0 to 1, as a sum of arrows, each
// rotating a whole number of turns per unit time, each with a complex coefficient that fixes its
// starting size and angle. Numeric throughout: a path is sampled, an integral is a sum.
import { abs, add, mul, scale, turn, ZERO, type Complex } from './complex';

/** A drawing: where the pencil is at time `t`, 0 to 1. */
export type Path = (t: number) => Complex;

/** One term of the series: the arrow's turns per unit time and its coefficient. */
export interface Term {
  n: number;
  c: Complex;
}

/** `f` at `count` evenly spaced times from 0 (inclusive) to 1 (exclusive). */
export function samplePath(f: Path, count: number): Complex[] {
  return Array.from({ length: count }, (_, i) => f(i / count));
}

/**
 * The coefficient of the arrow turning `n` times: the average of the drawing after it is spun
 * back by `n` turns, which holds that arrow still and sends every other one around a whole
 * number of times, so they average to nothing. `∫₀¹ f(t) e^{-n·2πi·t} dt`, as a sum over the
 * samples.
 */
export function coefficient(samples: Complex[], n: number): Complex {
  let sum = ZERO;
  for (let i = 0; i < samples.length; i++) sum = add(sum, mul(samples[i], turn(-n, i / samples.length)));
  return scale(sum, 1 / samples.length);
}

/** The terms for `n` from `-count` to `count`, in that order of frequency: 0, 1, −1, 2, −2, … */
export function series(samples: Complex[], count: number): Term[] {
  const terms: Term[] = [{ n: 0, c: coefficient(samples, 0) }];
  for (let k = 1; k <= count; k++) terms.push({ n: k, c: coefficient(samples, k) }, { n: -k, c: coefficient(samples, -k) });
  return terms;
}

/** The terms by size, largest arrow first: the order the chain is drawn in. */
export const bySize = (terms: Term[]): Term[] => [...terms].sort((a, b) => abs(b.c) - abs(a.c));

/** Where the pencil is at time `t`, drawn by these terms. */
export function evaluate(terms: Term[], t: number): Complex {
  let z = ZERO;
  for (const { n, c } of terms) z = add(z, mul(c, turn(n, t)));
  return z;
}

/** The chain of arrows at time `t`: each joint, tail to tip, the last being the pencil. */
export function chain(terms: Term[], t: number): Complex[] {
  const joints: Complex[] = [ZERO];
  let z = ZERO;
  for (const { n, c } of terms) {
    z = add(z, mul(c, turn(n, t)));
    joints.push(z);
  }
  return joints;
}

/** The pencil's whole trace: `evaluate` at `count` times around the cycle, closed. */
export function trace(terms: Term[], count = 400): Complex[] {
  return Array.from({ length: count + 1 }, (_, i) => evaluate(terms, i / count));
}

/* ---------- the step: two rods at +1 and −1 ---------- */

/**
 * The coefficient on `cos((2k+1)πx)` in the cosine series of the step that is 1 on [0, ½) and −1
 * on (½, 1]: `4/π · (−1)^k / (2k+1)`. Only odd frequencies appear; the even ones average to zero
 * against the step.
 */
export const stepCoefficient = (k: number): number => ((4 / Math.PI) * (k % 2 === 0 ? 1 : -1)) / (2 * k + 1);

/** The step's series cut off after `terms` cosines, at `x` in [0, 1]. */
export function stepPartial(x: number, terms: number): number {
  let sum = 0;
  for (let k = 0; k < terms; k++) sum += stepCoefficient(k) * Math.cos((2 * k + 1) * Math.PI * x);
  return sum;
}

/** The step itself, with the value at the jump set to 0, halfway, as the series demands. */
export const step = (x: number): number => (x < 0.5 ? 1 : x > 0.5 ? -1 : 0);

/** `1 − ⅓ + ⅕ − ⅐ + …` after `terms` terms: it closes in on π/4 without ever being it. */
export function leibnizPartial(terms: number): number {
  let sum = 0;
  for (let k = 0; k < terms; k++) sum += (k % 2 === 0 ? 1 : -1) / (2 * k + 1);
  return sum;
}

/* ---------- heat on a rod ---------- */

/**
 * A cosine wave on a rod of length 1, insulated at both ends, after time `t`: the shape stays
 * `cos(nπx)` and only its height decays, as `e^{−(nπ)²·t}` (with the rod's diffusivity set to 1).
 * Mode 0 is the constant, which never decays; higher modes die faster, by the square of n.
 */
export const heatMode = (x: number, n: number, t: number): number => Math.cos(n * Math.PI * x) * Math.exp(-((n * Math.PI) ** 2) * t);

/** How fast mode `n` decays: the exponent's size, `(nπ)²`. */
export const decayRate = (n: number): number => (n * Math.PI) ** 2;

/** A temperature profile built from modes, `amplitudes[n]` on mode `n`, after time `t`. */
export function heatSum(x: number, amplitudes: number[], t: number): number {
  let sum = 0;
  for (let n = 0; n < amplitudes.length; n++) sum += amplitudes[n] * heatMode(x, n, t);
  return sum;
}

/* ---------- drawings to take apart ---------- */

/** A heart, traced once as t goes 0 to 1, scaled to fit about the unit square. */
const heart: Path = (t) => {
  const a = 2 * Math.PI * t;
  return { re: (16 * Math.sin(a) ** 3) / 17, im: (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 };
};

/** A square with corners at ±1, traced at constant speed. */
const square: Path = (t) => {
  const s = (t * 4) % 4;
  const u = s % 1;
  if (s < 1) return { re: -1 + 2 * u, im: 1 };
  if (s < 2) return { re: 1, im: 1 - 2 * u };
  if (s < 3) return { re: 1 - 2 * u, im: -1 };
  return { re: -1, im: -1 + 2 * u };
};

/** A five-pointed star. */
const star: Path = (t) => {
  const s = (t * 5) % 5;
  const u = s % 1;
  const point = (k: number) => ({ re: Math.sin((2 * Math.PI * k) / 5), im: Math.cos((2 * Math.PI * k) / 5) });
  const from = point(Math.floor(s) * 2);
  const to = point((Math.floor(s) * 2 + 2) % 5);
  return { re: from.re + (to.re - from.re) * u, im: from.im + (to.im - from.im) * u };
};

/** The step as a drawing: a very dull one, on the real line, 1 for the first half and −1 after. */
const stepPath: Path = (t) => ({ re: step(t), im: 0 });

/** An ellipse, which two arrows draw exactly. */
const ellipse: Path = (t) => ({ re: Math.cos(2 * Math.PI * t), im: 0.6 * Math.sin(2 * Math.PI * t) });

export const PATHS = { heart, square, star, ellipse, step: stepPath } as const;
export type PathName = keyof typeof PATHS;
export const PATH_NAMES = Object.keys(PATHS) as PathName[];
