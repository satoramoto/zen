// The Looper page's state language: which face each part of the page wears for a loop state, and
// the words for it. Pure, so the page, its stories and the app's tests share one answer.

import type { LoopBarItem, LoopFace, LoopMode } from './types'

/** The face of the loop's state: recording red, playing lime, armed an outline, stopped white. */
export function loopFace(mode: LoopMode, hasData: boolean): LoopFace {
  switch (mode) {
    case 'recording':
      return 'rec'
    case 'recArmed':
      return 'recWait'
    case 'looping':
      return 'play'
    case 'loopArmed':
      return 'playWait'
    case 'off':
      return hasData ? 'stopped' : 'empty'
  }
}

/** The five states of the readout, left to right, with the face each wears when it is the one. */
export const READOUT: { mode: LoopMode; label: string; face: LoopFace }[] = [
  { mode: 'off', label: 'Stopped', face: 'stopped' },
  { mode: 'recArmed', label: 'Rec armed', face: 'recWait' },
  { mode: 'recording', label: 'Recording', face: 'rec' },
  { mode: 'loopArmed', label: 'Loop armed', face: 'playWait' },
  { mode: 'looping', label: 'Looping', face: 'play' },
]

/** What the looper is doing, in words. */
export function modeText(mode: LoopMode, running: boolean, hasData: boolean): string {
  switch (mode) {
    case 'recArmed':
      return running ? 'Recording starts at the next bar line.' : 'Play a chord: the band and the recording start together.'
    case 'recording':
      return 'Recording: play the chords in time with the band. Rec / Stop ends it.'
    case 'loopArmed':
      return running ? 'The loop starts at the next bar line.' : 'The loop starts with the band.'
    case 'looping':
      return 'Looping: your chords are ignored, both hands are free.'
    case 'off':
      return hasData ? 'Stopped. On / Off plays the loop for your left hand.' : 'Empty. Rec / Stop, then play a chord progression.'
  }
}

/** The lane shows eight bars at a time. */
export const LANE_BARS = 8

/** The first bar (1-based) of the window of eight that holds `bar` (the first window without one). */
export function windowStart(bar: number | null): number {
  if (bar === null || bar < 1) return 1
  return Math.floor((bar - 1) / LANE_BARS) * LANE_BARS + 1
}

/** The lane follows the playing bar while looping or recording; otherwise it is paged by hand. */
export function laneFollows(mode: LoopMode): boolean {
  return mode === 'looping' || mode === 'recording'
}

/** The last window's first bar for a loop of `bars` (1 for eight bars or fewer). */
export function lastWindow(bars: number): number {
  return windowStart(Math.max(1, bars))
}

/**
 * The first bar of the lane's window: the window holding the playing bar while looping or
 * recording; otherwise the window that was last playing (`held`, until the lane is paged by
 * hand), else the paged-to window (`paged`, default 1), snapped to a window of eight and kept
 * within the loop.
 */
export function laneStart(
  mode: LoopMode,
  bar: number | null,
  bars: number,
  paged: number | undefined,
  held: number | null = null,
): number {
  if (laneFollows(mode)) return windowStart(bar)
  return Math.min(windowStart(held ?? paged ?? 1), lastWindow(bars))
}

/** A bar's face in the lane: the current bar takes the state's face, past bars are grey, coming
 *  bars white; armed outlines the bar it starts on (bar 1); empty slots are plain off. */
export function barFace(
  bar: number,
  mode: LoopMode,
  current: number | null,
  bars: number,
): 'current' | 'past' | 'coming' | 'start' | 'blank' {
  if (bar > bars) return mode === 'recArmed' && bar === 1 ? 'start' : 'blank'
  if ((mode === 'recArmed' || mode === 'loopArmed') && bar === 1) return 'start'
  if ((mode === 'looping' || mode === 'recording') && current !== null) {
    if (bar === current) return 'current'
    return bar < current ? 'past' : 'coming'
  }
  return 'coming'
}

/** A chord's place in its bar for its accessible name: "beat 3", "beat 2½". */
export function beatWords(beat: number): string {
  const whole = Math.floor(beat)
  const frac = beat - whole
  const part = frac === 0 ? '' : frac === 0.5 ? '½' : frac === 0.25 ? '¼' : frac === 0.75 ? '¾' : `.${Math.round(frac * 100)}`
  return `beat ${whole}${part}`
}

/** A bar's accessible name: "Bar 3: Am7", "Bar 7: Dm7, G on beat 3", "Bar 2: holds". */
export function barName(b: LoopBarItem): string {
  if (!b.chords.length) return `Bar ${b.bar}: holds`
  return `Bar ${b.bar}: ${b.chords.map((c) => (c.beat === 1 ? c.chord : `${c.chord} on ${beatWords(c.beat)}`)).join(', ')}`
}
