import type { LoopBarItem, LoopMemoryItem, LooperPageData } from './types'

/** The board's loop (Looper-Dark.dc.html): eight bars, bar 7 with two chords. */
export const boardSequence: LoopBarItem[] = [
  { bar: 1, chords: [{ chord: 'Fmaj7', beat: 1 }] },
  { bar: 2, chords: [{ chord: 'G', beat: 1 }] },
  { bar: 3, chords: [{ chord: 'Am7', beat: 1 }] },
  { bar: 4, chords: [] },
  { bar: 5, chords: [{ chord: 'Dm7', beat: 1 }] },
  { bar: 6, chords: [{ chord: 'G', beat: 1 }] },
  { bar: 7, chords: [{ chord: 'Dm7', beat: 1 }, { chord: 'G', beat: 3 }] },
  { bar: 8, chords: [{ chord: 'Esus4', beat: 1 }, { chord: 'E', beat: 3 }] },
]

const empty = (): LoopMemoryItem => ({ name: null, bars: 0, summary: '' })

/** Three memories stored (CLD_001–003), five empty. */
export const boardMemories: LoopMemoryItem[] = [
  { name: 'CLD_001', bars: 8, summary: 'Fmaj7 G Am7 Dm7 G Dm7 G Esus4 E' },
  { name: 'CLD_002', bars: 4, summary: 'C Am F G' },
  { name: 'CLD_003', bars: 2, summary: 'Dm7 G7' },
  empty(),
  empty(),
  empty(),
  empty(),
  empty(),
]

export const boardBanks = [
  { name: 'Sunday set', path: '/Users/me/Yahaha/ChordLooper/Sunday set.clb' },
  { name: 'Ballads', path: '/Users/me/Yahaha/ChordLooper/Ballads.clb' },
  { name: 'Practice', path: '/Users/me/Yahaha/ChordLooper/Practice.clb' },
]

/** The board: looping, bar 3 of 8, memory 1 loaded, the "Sunday set" bank. */
export const looperBoard: LooperPageData = {
  mode: 'looping',
  hasData: true,
  bar: 3,
  bars: 8,
  sequence: boardSequence,
  playhead: 0.55,
  running: true,
  memories: boardMemories,
  memory: 0,
  pendingMemory: null,
  pick: null,
  bankName: 'Sunday set',
  bankSaved: true,
  bankPath: boardBanks[0].path,
  banks: boardBanks,
  loadOpen: false,
  saveAs: null,
}

/** Recording bar 3 while the band plays: the chords arrive when it stops. */
export const looperRecording: LooperPageData = {
  ...looperBoard,
  mode: 'recording',
  hasData: false,
  bar: 3,
  bars: 3,
  sequence: [],
  playhead: 0.3,
  memory: null,
}

/** Rec / Stop pressed while the band plays: waiting for the next bar line. */
export const looperRecArmed: LooperPageData = {
  ...looperBoard,
  mode: 'recArmed',
  hasData: false,
  bar: null,
  bars: 0,
  sequence: [],
  playhead: null,
  memory: null,
}

/** On / Off pressed: the loop starts at the next bar line. */
export const looperLoopArmed: LooperPageData = { ...looperBoard, mode: 'loopArmed', bar: null, playhead: null }

/** A loop in it, not playing; the band stopped. */
export const looperStopped: LooperPageData = { ...looperBoard, mode: 'off', bar: null, playhead: null, running: false }

/** Nothing recorded, a new bank with no file. */
export const looperEmpty: LooperPageData = {
  ...looperStopped,
  hasData: false,
  bars: 0,
  sequence: [],
  memories: Array.from({ length: 8 }, empty),
  memory: null,
  bankName: 'New Bank',
  bankSaved: false,
  bankPath: null,
}

/** A sixteen-bar loop playing bar 11: the lane shows bars 9–16. */
export const looperLong: LooperPageData = {
  ...looperBoard,
  bar: 11,
  bars: 16,
  sequence: [...boardSequence, ...boardSequence.map((b) => ({ ...b, bar: b.bar + 8 }))],
}

/** A twelve-bar loop, stopped, paged to its second window: bars 9–12, then four empty slots. */
export const looperLongStopped: LooperPageData = {
  ...looperStopped,
  bars: 12,
  sequence: [...boardSequence, ...boardSequence.slice(0, 4).map((b) => ({ ...b, bar: b.bar + 8 }))],
  laneFirst: 9,
}
