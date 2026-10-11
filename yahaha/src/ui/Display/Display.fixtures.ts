import type { ComponentProps } from 'svelte'
import {
  chordBoard,
  chordLong,
  chordLongFingering,
  chordStopped,
  nowPlayingBoard,
  nowPlayingStopped,
  nowPlayingSyncStart,
} from '../NowPlaying/NowPlaying.fixtures'
import { soundRowBoard, soundRowClean } from '../SoundRow/SoundRow.fixtures'
import { styleLineBoard, styleLineLong, styleLineQueued, styleLineWaltz } from '../StyleLine/StyleLine.fixtures'
import type Display from './Display.svelte'

/** The board: Sunday Drive Pop, Am7 in Main B → Main C at 104 on beat 2 of 4, One Touch 2. */
export const displayBoard = {
  styleLine: { ...styleLineBoard, oneTouch: 2, oneTouchCount: 4 },
  nowPlaying: { ...nowPlayingBoard, chord: chordBoard, beat: 2, beats: 4 },
  soundRow: { parts: soundRowBoard.parts },
} satisfies ComponentProps<typeof Display>

/** Stopped with the last chord held, a style queued, a clean rack. */
export const displayStopped = {
  styleLine: { ...styleLineQueued, oneTouch: 0, oneTouchCount: 3 },
  nowPlaying: { ...nowPlayingStopped, chord: chordStopped, beat: 0, beats: 4 },
  soundRow: { parts: soundRowClean.parts },
} satisfies ComponentProps<typeof Display>

/** Stopped with Sync Start armed and Intro II armed. */
export const displaySyncStart = {
  ...displayBoard,
  nowPlaying: { ...nowPlayingSyncStart, chord: chordBoard, beat: 0, beats: 4 },
} satisfies ComponentProps<typeof Display>

/** A long chord name, stepped down to fit its third. */
export const displayLongChord = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, chord: chordLong },
} satisfies ComponentProps<typeof Display>

/** A style name longer than its third: it ends in an ellipsis. */
export const displayLongStyle = {
  ...displayBoard,
  styleLine: { ...displayBoard.styleLine, ...styleLineLong },
} satisfies ComponentProps<typeof Display>

/** A long fingering: the small line wraps, never cut off. */
export const displayLongFingering = {
  ...displayBoard,
  nowPlaying: { ...displayBoard.nowPlaying, chord: chordLongFingering },
} satisfies ComponentProps<typeof Display>

/** Right 1 off as well as Right 3: both dots at their absent strength, "· off" after the part. */
export const displayPartOff = {
  ...displayBoard,
  soundRow: { parts: soundRowBoard.parts.map((p) => (p.id === 'right1' ? { ...p, off: true } : p)) },
} satisfies ComponentProps<typeof Display>

/** A waltz in 3/4: three beat segments, on beat 3. */
export const displayThreeFour = {
  ...displayBoard,
  styleLine: { ...displayBoard.styleLine, ...styleLineWaltz },
  nowPlaying: { ...displayBoard.nowPlaying, bpm: 88, beat: 3, beats: 3 },
} satisfies ComponentProps<typeof Display>
