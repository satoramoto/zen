// A Master EQ band's frequency control: any whole Hz in the band's range. A drag, a wheel notch or
// an arrow key moves along a log grid (fine enough that an arrow key moves one grid step, every
// whole Hz near the bottom of the range); typing digits then Enter sets any whole Hz exactly.

/** Grid steps across a band's range: at most 190, so `stepOf` (../Readout/readout.ts) is 1. */
export const FREQ_POSITIONS = 180

/** The band's frequencies a drag or an arrow key stops at, low to high, `current` among them. */
export function freqGrid(min: number, max: number, current?: number): number[] {
  const out: number[] = []
  for (let k = 0; k <= FREQ_POSITIONS; k++) {
    const f = k === FREQ_POSITIONS ? max : Math.round(min * (max / min) ** (k / FREQ_POSITIONS))
    if (f !== out[out.length - 1]) out.push(f)
  }
  if (current !== undefined && Number.isInteger(current) && current >= min && current <= max && !out.includes(current)) {
    out.push(current)
    out.sort((a, b) => a - b)
  }
  return out
}

/** The index of the grid step nearest `hz`. */
export function nearestStep(grid: number[], hz: number): number {
  let best = 0
  for (let i = 1; i < grid.length; i++) if (Math.abs(grid[i] - hz) < Math.abs(grid[best] - hz)) best = i
  return best
}

/** Typed digits as a whole Hz clamped to the range; null for nothing typed. */
export function parseHz(text: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(text)) return null
  return Math.min(max, Math.max(min, Number(text)))
}
