/**
 * Tap tempo, ported from `yahaha/src/ui/Stage/tapTempo.ts`: the tempo from the taps' intervals, as
 * the `tempo.tap` tooltip describes it. Two or more taps in time set the tempo, the last four
 * count; a pause longer than `TAP_RESET_MS` starts a new run of taps. The Stage times the taps it
 * gets from the Display's one Tap key with this.
 */

/** A gap longer than this (40 BPM's beat is 1.5 s) starts a new run of taps. */
export const TAP_RESET_MS = 2000;
/** How many taps count: the last four, so three intervals. */
export const TAP_COUNT = 4;

/**
 * Adds a tap at `now` (ms) to `taps` and returns the taps that still count, with the tempo they
 * give (rounded BPM), or `undefined` while there is only one tap.
 */
export function tapTempo(taps: readonly number[], now: number): { taps: number[]; bpm: number | undefined } {
  const last = taps.at(-1);
  const run = last !== undefined && now - last <= TAP_RESET_MS && now > last ? [...taps, now] : [now];
  const kept = run.slice(-TAP_COUNT);
  if (kept.length < 2) return { taps: kept, bpm: undefined };
  const mean = (kept[kept.length - 1] - kept[0]) / (kept.length - 1);
  return { taps: kept, bpm: Math.round(60000 / mean) };
}

/** A run of taps as a store: `tap(now)` adds one and returns the tempo the taps give, if any. */
export interface TapTempo {
  tap(now: number): number | undefined;
}

/** A tap store, framework-free: the Stage keeps one per mounted screen (a ref in React, a constant in Svelte). */
export function createTapTempo(): TapTempo {
  let taps: number[] = [];
  return {
    tap(now) {
      const next = tapTempo(taps, now);
      taps = next.taps;
      return next.bpm;
    },
  };
}
