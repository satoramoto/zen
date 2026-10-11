/**
 * A bar readout's pure maths (docs/specs/push/Channel.md, "Bar readout" and "The bar as a
 * control"): the fraction a value fills, the fill's box, the XG EQ frequency steps, the value's
 * text and unit for each kind, and one step of a value.
 */

import type { BarKind } from '../Channel/types'

/** The XG EQ frequency table's steps, 32 Hz to 16 kHz (data 04H–3AH). */
const XG_STEPS = [
  32, 36, 40, 45, 50, 56, 63, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500, 560, 630, 700, 800, 900, 1000,
  1100, 1200, 1400, 1600, 1800, 2000, 2200, 2500, 2800, 3200, 3600, 4000, 4500, 5000, 5600, 6300, 7000, 8000, 9000, 10000, 11000, 12000, 14000, 16000,
]
/** The low band's steps (32 Hz–2 kHz). */
export const LOW_STEPS = XG_STEPS.filter((f) => f <= 2000)
/** The high band's steps (500 Hz–16 kHz). */
export const HIGH_STEPS = XG_STEPS.filter((f) => f >= 500)

/** The index of the step of `steps` nearest `hz` (a frequency set elsewhere may fall between two). */
export function stepOf(steps: number[], hz: number): number {
  let best = 0
  for (let i = 1; i < steps.length; i++) if (Math.abs(steps[i] - hz) < Math.abs(steps[best] - hz)) best = i
  return best
}

/** How far along its range a value sits, 0–1; with `steps`, by its nearest step's index. */
export function fraction({ value, min, max, steps }: { value: number; min: number; max: number; steps?: number[] }): number {
  const f = steps && steps.length > 1 ? stepOf(steps, value) / (steps.length - 1) : max > min ? (value - min) / (max - min) : 0
  return Math.max(0, Math.min(1, f))
}

/** The fill's left edge and width in percent: from 0, or from the centre when bipolar. */
export function fillBox(f: number, bipolar: boolean): { fl: number; fw: number } {
  const pct = Math.round(f * 100)
  return bipolar ? { fl: Math.min(50, pct), fw: Math.abs(pct - 50) } : { fl: 0, fw: pct }
}

/** "0", "+3", "−6" (dB, with the minus sign U+2212). */
export function dbText(db: number): string {
  return db === 0 ? '0' : db > 0 ? `+${db}` : `−${-db}`
}

/** A frequency and its unit: ["120", "Hz"], ["8.0", "kHz"]. */
export function hzUnit(hz: number): [string, string] {
  return hz < 1000 ? [String(Math.round(hz)), 'Hz'] : [(hz / 1000).toFixed(1), 'kHz']
}

/** A ratio in tenths: 30 → "3", 25 → "2.5". */
export function ratioText(tenths: number): string {
  const r = tenths / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** A pan 0–127, 64 the centre: "C", "L12", "R5". */
export function panText(v: number): string {
  return v === 64 ? 'C' : v < 64 ? `L${64 - v}` : `R${v - 64}`
}

/** An offset 0–127, 64 the voice's own: "+12", "0", "−4". */
export function offsetText(v: number): string {
  return dbText(v - 64)
}

/** A display string split into its leading number and its unit: "0.50 Hz" → ["0.50", "Hz"]. */
export function splitDisplay(display: string): [string, string] {
  const run = /^[-+−0-9./]+/.exec(display)
  if (!run) return [display, '']
  return [run[0], display.slice(run[0].length).replace(/^ /, '')]
}

/** The value as the row shows it, and its unit (empty: none). */
export function formatValue(kind: BarKind, value: number, display?: string): [string, string] {
  switch (kind) {
    case 'db':
      return [dbText(value), 'dB']
    case 'ms':
      return [String(value), 'ms']
    case 'hz':
      return hzUnit(value)
    case 'pan':
      return [panText(value), '']
    case 'offset':
      return [offsetText(value), '']
    case 'ratio':
      return [ratioText(value), ':1']
    case 'display':
      return display === undefined ? [String(value), ''] : splitDisplay(display)
    default:
      return [String(value), '']
  }
}

/**
 * The value `delta` units (or, with `steps`, steps of the table from the nearest one) from
 * `value`, clamped to the range.
 */
export function step(value: number, delta: number, { min, max, steps }: { min: number; max: number; steps?: number[] }): number {
  if (steps && steps.length > 0) {
    const i = Math.max(0, Math.min(steps.length - 1, stepOf(steps, value) + delta))
    return steps[i]
  }
  return Math.max(min, Math.min(max, value + delta))
}
