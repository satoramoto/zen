/**
 * The Looper page's data and changes. The library's Looper component takes `LooperPageData` and
 * reports `LooperChange`s; the app's wiring (panels/looper) builds the data from the engine's
 * Chord Looper state and turns each change into a command. No API types here: the library imports
 * nothing from the app.
 */

/** Where the looper is: the engine's five modes. */
export type LoopMode = 'off' | 'recArmed' | 'recording' | 'loopArmed' | 'looping'

/**
 * The one face a loop state wears, the same in the bar lane, the state readout and the lamps:
 * `rec` record red (recording), `recWait` a red outline (waiting to record), `play` lime (looping),
 * `playWait` a lime outline (waiting to loop), `stopped` white (a loop, not playing), `empty` plain off.
 */
export type LoopFace = 'rec' | 'recWait' | 'play' | 'playWait' | 'stopped' | 'empty'

/** One chord change in a bar. */
export interface LoopChordItem {
  /** "Am7". */
  chord: string
  /** Where in the bar it changes: 1 is the downbeat; "b3", "b2½" otherwise (for its accessible name). */
  beat: number
}

/** One bar of the lane. */
export interface LoopBarItem {
  /** 1-based. */
  bar: number
  /** Its chord changes; empty: the chord before it holds (or nothing recorded yet). */
  chords: LoopChordItem[]
}

/** One of the eight memories. */
export interface LoopMemoryItem {
  /** "CLD_001"; null: empty. */
  name: string | null
  /** How many bars it holds (0 when empty). */
  bars: number
  /** Its chords in order, for the accessible name ("Fmaj7 G Am7"). */
  summary: string
}

/** A bank file in the ChordLooper folder. */
export interface LoopBankItem {
  name: string
  path: string
}

/** The Save as… form, open. */
export interface LoopSaveAs {
  /** The name typed. */
  name: string
  /** The typed name is another bank's file: Save is refused, Overwrite replaces it. */
  clash: boolean
}

export interface LooperPageData {
  mode: LoopMode
  /** A sequence is recorded (the loop isn't empty). */
  hasData: boolean
  /** The bar recorded or looping (1-based); null otherwise. */
  bar: number | null
  /** The loop's length in bars (while recording: the bars recorded so far). */
  bars: number
  /** The sequence, bar by bar (empty while recording: the chords arrive when it stops). */
  sequence: LoopBarItem[]
  /**
   * The first bar of the lane's window of eight when the loop isn't playing or recording (paged
   * with ◀ ▶ in a loop longer than eight bars); default 1. Ignored while looping or recording:
   * the lane then follows the playing bar.
   */
  laneFirst?: number
  /** Where the playhead is in the current bar, 0–1, while looping or recording; null: none drawn. */
  playhead: number | null
  /** The transport runs: armed states start at the next bar line, not with the band. */
  running: boolean
  /** Memories 1–8. */
  memories: LoopMemoryItem[]
  /** The memory the loop came from (0-based); null: none. */
  memory: number | null
  /** The memory that takes over at the next bar line (0-based); null: none. */
  pendingMemory: number | null
  /** Memory or Clear was pressed: the next memory number stores or clears. */
  pick: 'store' | 'clear' | null
  /** The bank: its name, and whether it has a file yet. */
  bankName: string
  bankSaved: boolean
  /** The bank's file (null: unsaved), to mark it in the Load list. */
  bankPath: string | null
  /** The bank files to load. */
  banks: LoopBankItem[]
  /** The Load list is open. */
  loadOpen: boolean
  /** The Save as… form; null: closed. */
  saveAs: LoopSaveAs | null
}

/** What the page asks for. */
export type LooperChange =
  | { type: 'rec' }
  | { type: 'onOff' }
  | { type: 'pick'; pick: 'store' | 'clear' | null }
  | { type: 'memory'; index: number }
  | { type: 'newBank' }
  /** Page the lane: show the eight bars from `first`. */
  | { type: 'lanePage'; first: number }
  | { type: 'loadOpen'; open: boolean }
  | { type: 'load'; path: string }
  /** The Load list's "From a file…": pick a bank file anywhere on disk (the app opens the system file picker). */
  | { type: 'loadFile' }
  | { type: 'saveAsOpen'; open: boolean }
  | { type: 'saveAsName'; name: string }
  | { type: 'save'; overwrite: boolean }
