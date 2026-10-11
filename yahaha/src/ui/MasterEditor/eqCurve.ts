// The Master EQ's response curve: each band as an RBJ biquad (Audio EQ Cookbook), peaking for the
// mid bands and for bands 1 and 8 unless they are shelves, then a low or high shelf (slope 1).
// Pure: the editor draws what these return.

import type { EqBandData } from '../Effects/types'

/** The sample rate the biquads are designed at. */
const FS = 48000
/** The curve's axes: 20 Hz–20 kHz on a log scale, ±12 dB. */
export const F_MIN = 20
export const F_MAX = 20000
export const DB_RANGE = 12

type Coeffs = [b0: number, b1: number, b2: number, a0: number, a1: number, a2: number]

/** One band's biquad. `last` marks band 8 (a shelf there is a high shelf). */
function coeffs(band: EqBandData, last: boolean): Coeffs {
  const A = Math.pow(10, band.gain / 40)
  const w0 = (2 * Math.PI * Math.min(band.freq, FS / 2 - 1)) / FS
  const cos = Math.cos(w0)
  const sin = Math.sin(w0)
  if (band.shelf && band.canShelf) {
    // Shelf slope S = 1: alpha = sin(w0) / 2 · √2.
    const alpha = sin / Math.SQRT2
    const k = 2 * Math.sqrt(A) * alpha
    if (!last) {
      return [
        A * (A + 1 - (A - 1) * cos + k),
        2 * A * (A - 1 - (A + 1) * cos),
        A * (A + 1 - (A - 1) * cos - k),
        A + 1 + (A - 1) * cos + k,
        -2 * (A - 1 + (A + 1) * cos),
        A + 1 + (A - 1) * cos - k,
      ]
    }
    return [
      A * (A + 1 + (A - 1) * cos + k),
      -2 * A * (A - 1 + (A + 1) * cos),
      A * (A + 1 + (A - 1) * cos - k),
      A + 1 - (A - 1) * cos + k,
      2 * (A - 1 - (A + 1) * cos),
      A + 1 - (A - 1) * cos - k,
    ]
  }
  const alpha = sin / (2 * Math.max(band.q, 1) / 10)
  return [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A]
}

/** A biquad's gain in dB at `hz`. */
function gainAt([b0, b1, b2, a0, a1, a2]: Coeffs, hz: number): number {
  const w = (2 * Math.PI * hz) / FS
  const c1 = Math.cos(w)
  const s1 = Math.sin(w)
  const c2 = Math.cos(2 * w)
  const s2 = Math.sin(2 * w)
  const nr = b0 + b1 * c1 + b2 * c2
  const ni = b1 * s1 + b2 * s2
  const dr = a0 + a1 * c1 + a2 * c2
  const di = a1 * s1 + a2 * s2
  return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di))
}

/** The whole EQ's response in dB at each of `freqs` (Hz): the bands' gains summed. */
export function eqResponse(bands: EqBandData[], freqs: number[]): number[] {
  const all = bands.map((band, i) => coeffs(band, i === bands.length - 1))
  return freqs.map((hz) => all.reduce((sum, c) => sum + gainAt(c, hz), 0))
}

/** Where `hz` sits across `width` on the log axis. */
export function xOf(hz: number, width: number): number {
  return (Math.log(hz / F_MIN) / Math.log(F_MAX / F_MIN)) * width
}

/** Where `db` sits down `height`, ±DB_RANGE, clamped to the box. */
export function yOf(db: number, height: number): number {
  const clamped = Math.max(-DB_RANGE, Math.min(DB_RANGE, db))
  return ((DB_RANGE - clamped) / (2 * DB_RANGE)) * height
}

const round = (n: number) => Math.round(n * 10) / 10

/** The response curve as an SVG path across a `width` × `height` box, sampled at `points` frequencies. */
export function eqPath(bands: EqBandData[], width: number, height: number, points = 128): string {
  const freqs = Array.from({ length: points }, (_, i) => F_MIN * Math.pow(F_MAX / F_MIN, i / (points - 1)))
  const dbs = eqResponse(bands, freqs)
  return freqs.map((hz, i) => `${i === 0 ? 'M' : 'L'}${round(xOf(hz, width))} ${round(yOf(dbs[i], height))}`).join(' ')
}

/** Each band's dot: at its frequency, on the curve. */
export function eqDots(bands: EqBandData[], width: number, height: number): { x: number; y: number }[] {
  const dbs = eqResponse(
    bands,
    bands.map((band) => band.freq),
  )
  return bands.map((band, i) => ({ x: round(xOf(band.freq, width)), y: round(yOf(dbs[i], height)) }))
}
