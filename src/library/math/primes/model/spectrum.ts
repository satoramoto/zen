// Spectra: a radix-2 FFT, the prime gaps played as tones, the prime indicator, and the peaks of
// a magnitude spectrum named as simple fractions. Pure.
import { isPrime } from './primes';

/** The largest transform any figure runs: 2²⁰ samples. */
export const MAX_FFT = 1 << 20;

/** In-place radix-2 FFT of a complex signal whose length is a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n !== im.length || (n & (n - 1)) !== 0) throw new Error('fft: length must be a power of two');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    const wr = Math.cos(a);
    const wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let ur = 1;
      let ui = 0;
      for (let k = 0; k < len / 2; k++) {
        const xr = re[i + k + len / 2] * ur - im[i + k + len / 2] * ui;
        const xi = re[i + k + len / 2] * ui + im[i + k + len / 2] * ur;
        re[i + k + len / 2] = re[i + k] - xr;
        im[i + k + len / 2] = im[i + k] - xi;
        re[i + k] += xr;
        im[i + k] += xi;
        const t = ur * wr - ui * wi;
        ui = ur * wi + ui * wr;
        ur = t;
      }
    }
  }
}

/** The magnitude spectrum of a real signal, bins 0…n/2. */
export function magnitude(signal: Float64Array): Float64Array {
  const re = Float64Array.from(signal);
  const im = new Float64Array(signal.length);
  fft(re, im);
  const out = new Float64Array(signal.length / 2 + 1);
  for (let k = 0; k < out.length; k++) out[k] = Math.hypot(re[k], im[k]);
  return out;
}

export interface ToneSignal {
  signal: Float64Array;
  /** Samples per gap. */
  segment: number;
  /** The base frequency in FFT bins: gap g sounds at bin g·`baseBin`. */
  baseBin: number;
}

/**
 * The gaps played as tones: gap g becomes `segment` samples of sin(2π·g·f₀·n), n the global sample
 * index, so every stretch of the same gap is in phase with the others and they add up: the
 * spectrum's value at g·f₀ grows in proportion to how many gaps of size g there are. f₀ is a
 * whole number of bins, chosen so the largest gap still sits below half the sampling rate.
 */
export function gapTones(gapValues: ArrayLike<number>): ToneSignal {
  const n = gapValues.length;
  let largest = 1;
  for (let i = 0; i < n; i++) largest = Math.max(largest, gapValues[i]);
  const segment = Math.max(1, Math.min(64, Math.floor(MAX_FFT / Math.max(1, n))));
  let length = 1;
  while (length < n * segment) length <<= 1;
  length = Math.max(length, 1024);
  const baseBin = Math.max(1, Math.floor(length / 2 / (largest + 2)));
  const f0 = baseBin / length;
  const signal = new Float64Array(length);
  for (let k = 0; k < n; k++) {
    const w = 2 * Math.PI * gapValues[k] * f0;
    for (let t = 0; t < segment; t++) {
      const i = k * segment + t;
      signal[i] = Math.sin(w * i);
    }
  }
  return { signal, segment, baseBin };
}

/** The prime indicator: 1 at each prime below `length` (a power of two), 0 elsewhere. */
export function indicator(length: number): Float64Array {
  const out = new Float64Array(length);
  for (let n = 2; n < length; n++) if (isPrime(n)) out[n] = 1;
  return out;
}

/**
 * The exact value of the indicator's spectrum at frequency a/q (a share of the sampling rate),
 * divided by the number of primes: its size is |μ(q)|/φ(q) in the limit, 1 at ½, ½ at ⅓ and ⅙,
 * ¼ at ⅕.
 */
export function indicatorAt(length: number, a: number, q: number): number {
  let re = 0;
  let im = 0;
  let count = 0;
  for (let n = 2; n < length; n++) {
    if (!isPrime(n)) continue;
    const angle = (-2 * Math.PI * a * n) / q;
    re += Math.cos(angle);
    im += Math.sin(angle);
    count++;
  }
  return Math.hypot(re, im) / Math.max(1, count);
}

/** The simplest fraction a/q (q ≤ `maxDenominator`) within `tolerance` of x, or undefined. */
export function simpleFraction(x: number, maxDenominator = 12, tolerance = 2e-3): { a: number; q: number } | undefined {
  for (let q = 1; q <= maxDenominator; q++) {
    const a = Math.round(x * q);
    if (Math.abs(x - a / q) <= tolerance) return { a, q };
  }
  return undefined;
}

/** The `count` tallest local maxima of a spectrum, skipping bin 0 and anything within `guard` bins of a taller one. */
export function peaks(spectrum: Float64Array, count: number, guard = 3): { bin: number; value: number }[] {
  const order = Array.from({ length: spectrum.length - 1 }, (_, i) => i + 1).sort((a, b) => spectrum[b] - spectrum[a]);
  const out: { bin: number; value: number }[] = [];
  for (const bin of order) {
    if (out.length >= count) break;
    if (out.some((p) => Math.abs(p.bin - bin) <= guard)) continue;
    out.push({ bin, value: spectrum[bin] });
  }
  return out;
}

/** Down-sample a spectrum to `columns` values, keeping each column's largest (so spikes survive). */
export function columnsOf(spectrum: Float64Array, columns: number, upTo = spectrum.length): Float64Array {
  const out = new Float64Array(columns);
  const per = upTo / columns;
  for (let c = 0; c < columns; c++) {
    let m = 0;
    for (let k = Math.floor(c * per); k < Math.min(upTo, Math.floor((c + 1) * per)); k++) m = Math.max(m, spectrum[k]);
    out[c] = m;
  }
  return out;
}
