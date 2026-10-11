/**
 * The Playground's tap tempo (story-only): the tempo from the taps' intervals, as the `tempo.tap`
 * tooltip describes it: two or more taps in time set the tempo, the last four count. A pause
 * longer than `TAP_RESET_MS` starts a new run of taps.
 */

/** A gap longer than this (40 BPM's beat is 1.5 s) starts a new run of taps. */
export const TAP_RESET_MS = 2000
/** How many taps count: the last four, so three intervals. */
export const TAP_COUNT = 4

/**
 * Adds a tap at `now` (ms) to `taps` and returns the taps that still count, with the tempo they
 * give (rounded BPM), or `undefined` while there is only one tap.
 */
export function tapTempo(taps: readonly number[], now: number): { taps: number[]; bpm: number | undefined } {
  const last = taps.at(-1)
  const run = last !== undefined && now - last <= TAP_RESET_MS && now > last ? [...taps, now] : [now]
  const kept = run.slice(-TAP_COUNT)
  if (kept.length < 2) return { taps: kept, bpm: undefined }
  const mean = (kept[kept.length - 1] - kept[0]) / (kept.length - 1)
  return { taps: kept, bpm: Math.round(60000 / mean) }
}
