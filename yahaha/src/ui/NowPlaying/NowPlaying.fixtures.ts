import type { ComponentProps } from 'svelte'
import type ChordReadout from '../ChordReadout/ChordReadout.svelte'
import type NowPlaying from './NowPlaying.svelte'

/** The board's chord: Am7 (A C E G), as the board's left hand holds it, Fingered On Bass. */
export const chordBoard = {
  chord: 'Am',
  extension: '7',
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
  ],
  fingering: 'Fingered On Bass',
  held: false,
} satisfies ComponentProps<typeof ChordReadout>

/** The last chord (Cmaj7) held while stopped. */
export const chordStopped = {
  chord: 'C',
  extension: 'maj7',
  notes: [
    { note: 'C', interval: 'R' },
    { note: 'E', interval: '3' },
    { note: 'G', interval: '5' },
    { note: 'B', interval: '7' },
  ],
  fingering: 'Fingered',
  held: true,
} satisfies ComponentProps<typeof ChordReadout>

/** A long chord name: it steps down the hero sizes to fit its third. */
export const chordLong = {
  chord: 'C♯m',
  extension: 'maj9(♯11)/G♯',
  notes: [
    { note: 'C♯', interval: 'R' },
    { note: 'E', interval: 'm3' },
    { note: 'G♯', interval: '5' },
    { note: 'C', interval: 'M7' },
    { note: 'D♯', interval: '9' },
    { note: 'G', interval: '♯11' },
  ],
  fingering: 'AI Full Keyboard',
  held: false,
} satisfies ComponentProps<typeof ChordReadout>

/** A long fingering with Keyboard transpose: the small line wraps, nothing is cut off. */
export const chordLongFingering = {
  ...chordBoard,
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
    { note: 'B', interval: '9' },
    { note: 'D', interval: '4' },
  ],
  fingering: 'AI Full Keyboard · played Cm7 (Keyboard transpose −3)',
} satisfies ComponentProps<typeof ChordReadout>

/** The board's song: Main B playing, Main C next, the fill after bar 4, bar 3 of 4, 104 BPM. */
export const nowPlayingBoard = {
  playing: 'Main B',
  hue: 'main',
  next: 'Main C',
  fill: 'fill after bar 4',
  bar: 3,
  bars: 4,
  bpm: 104,
  running: true,
  syncStart: false,
} satisfies ComponentProps<typeof NowPlaying>

/** Stopped on Main A at 92, nothing armed. */
export const nowPlayingStopped = {
  playing: 'Main A',
  hue: 'main',
  next: '',
  fill: '',
  bar: 1,
  bars: 4,
  bpm: 92,
  running: false,
  syncStart: false,
} satisfies ComponentProps<typeof NowPlaying>

/** Stopped with Sync Start armed and Intro II armed: the band starts on your first chord. */
export const nowPlayingSyncStart = {
  ...nowPlayingStopped,
  next: 'Intro II',
  syncStart: true,
} satisfies ComponentProps<typeof NowPlaying>

/** Main D looping with nothing queued: "bar 2 of 8". */
export const nowPlayingLooping = {
  ...nowPlayingBoard,
  playing: 'Main D',
  next: '',
  fill: '',
  bar: 2,
  bars: 8,
} satisfies ComponentProps<typeof NowPlaying>

/** A fill in 3/4 with Ending II waiting. */
export const nowPlayingFill = {
  ...nowPlayingBoard,
  playing: 'Fill',
  hue: 'fill',
  next: 'Ending II',
  fill: 'after bar 1',
  bar: 1,
  bars: 1,
  bpm: 84,
} satisfies ComponentProps<typeof NowPlaying>
