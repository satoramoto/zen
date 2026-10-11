/**
 * The Settings screen's data and changes: one data object and one change type per page. The
 * library's Settings components take these as props and report changes as these values; the app's
 * wiring (panels/settings) builds the data from the engine's state and turns each change into a
 * command. No API types here: the library imports nothing from the app.
 */

/** The six Settings pages, in the page list's order. */
export type SettingsPageId = 'chord' | 'style' | 'keyboard' | 'pedals' | 'system' | 'launchkey'

/** A keyboard part's hue. */
export type PartHue = 'r1' | 'r2' | 'r3' | 'l'

/** One entry of the page list: its name and its tooltip. */
export interface SettingsPageItem {
  id: SettingsPageId
  /** "Chord & Split". */
  label: string
  /** The tooltip key (it also says where else the page's settings live). */
  tip: string
}

/** A change on a page whose settings are plain values: the key and its new value. */
export type ValueChange<T> = { [K in keyof T]: { key: K; value: T[K] } }[keyof T]

// ── Chord & Split ────────────────────────────────────────────────────────────────────────────────

/** One fingering type in the list. */
export interface FingeringItem {
  /** What `fingering` names and the change carries. */
  id: string
  /** "Fingered On Bass". */
  label: string
  /** One line on how it reads chords. */
  line: string
  /** The tooltip key. */
  tip: string
}

/** Who plays on one side of the split. */
export interface SplitZone {
  /** "Below" or "Above" on the first row of a side, null on the rows after it. */
  side: 'Below' | 'Above' | null
  /** "L", "R1". */
  part: string
  hue: PartHue
  /** The GM program number shown before the sound ("41"). */
  program: number
  sound: string
  /** "+ the chord", "on", "off". */
  state: string
  /** The part sounds (an off part is drawn faded). */
  on: boolean
}

export interface ChordPageData {
  fingerings: FingeringItem[]
  /** The chosen fingering's `id`. */
  fingering: string
  /** Chords from the right hand. */
  upper: boolean
  /** Works only with Upper on: shown, not pressable, while Upper is off. */
  manualBass: boolean
  leftHold: boolean
  /** The chord-settle window, ms. */
  settleMs: number
  /** Its maximum, ms (30). */
  settleMax: number
  /** The split point, a MIDI note, and its name ("F#2"). */
  split: number
  splitName: string
  /** The default split point; Reset is disabled while the split is there. */
  splitDefault: number
  splitDefaultName: string
  /** The range the split may move in, MIDI notes. */
  splitMin: number
  splitMax: number
  /** Parameter lock on the split point (switched on the Keyboard page). */
  splitLocked: boolean
  /** Who plays where: the Left zone below, the right-hand parts above. */
  zones: SplitZone[]
  /** The pick on the main keyboard is armed: the next key clicked there becomes the split. */
  picking: boolean
}

export type ChordChange =
  | { type: 'fingering'; id: string }
  | { type: 'upper'; on: boolean }
  | { type: 'manualBass'; on: boolean }
  | { type: 'leftHold'; on: boolean }
  | { type: 'settle'; ms: number }
  | { type: 'splitStep'; delta: -1 | 1 }
  | { type: 'splitReset' }
  /** "Set on the keys": arm (or disarm) the pick on the main keyboard. */
  | { type: 'pick'; armed: boolean }
  /** The lock note's link: open the Keyboard page. */
  | { type: 'openKeyboard' }

// ── Style ────────────────────────────────────────────────────────────────────────────────────────

export interface StylePageData {
  mainTiming: 'immediate' | 'nextBar'
  introEndingTiming: 'nextBar' | 'endOfSection'
  otsLinkTiming: 'immediate' | 'mainChange'
  stopAcmp: 'off' | 'style' | 'fixed'
  /** On a new style: the tempo and the parts' on/off. */
  tempoChange: 'lock' | 'hold' | 'reset'
  partsChange: 'lock' | 'hold' | 'reset'
  /** The Main (0–3) a new style starts on; null = Off. */
  sectionSet: number | null
  sectionReset: boolean
  /** Synchro Stop window, ms, 0 (Off) to 5000. */
  syncStopWindowMs: number
  /** Fade times, ms: in and out 0–20000, hold 0–5000. */
  fadeInMs: number
  fadeOutMs: number
  fadeHoldMs: number
  retrigger: boolean
  /** 1, 2, 4, 8, 16 or 32 (a whole note to a 32nd). */
  retriggerRate: number
  /** 0–100 %. */
  swing: number
  /** 8 or 16. */
  swingGrid: number
  sectionTempo: boolean
  syncStop: boolean
  /** Sync Stop isn't available (Full Keyboard fingering in Lower): shown, not pressable. */
  syncStopAvailable: boolean
  autoFill: boolean
  halfBarFill: boolean
  unison: boolean
  unisonType: 'root' | 'melody'
  dynamicsControl: boolean
  /** 0–127. */
  dynamicsLevel: number
  touch: boolean
  accent: boolean
  /** 1–127. */
  accentThreshold: number
  accentMode: 'hits' | 'fill'
  accentSource: 'left' | 'both'
}

/** Every Style setting is a value; the wiring sends the command that sets it. */
export type StyleChange = ValueChange<StylePageData>

// ── Keyboard: Transpose and Parameter lock ───────────────────────────────────────────────────────

export interface KeyboardPageData {
  /** Semitones, −12 to +12. */
  transposeKeyboard: number
  transposeMaster: number
  /** "You play C → you hear C": the note names for a C. */
  youPlay: string
  youHear: string
  lockSplit: boolean
  lockFingering: boolean
  /** The split point's name, for "Stays at F#2". */
  splitName: string
}

export type KeyboardChange =
  | { type: 'keyboardStep'; delta: -1 | 1 }
  | { type: 'masterStep'; delta: -1 | 1 }
  | { type: 'reset' }
  | { type: 'lock'; item: 'splitPoint' | 'fingeringType'; on: boolean }

// ── Pedals ───────────────────────────────────────────────────────────────────────────────────────

/** One function a pedal can run. */
export interface PedalFunction {
  id: string
  label: string
  /** Control Type applies (Hold A / Hold B / Toggle). */
  switchKind: boolean
  /** Range applies (Pitch Bend). */
  bend: boolean
}

export interface PedalRow {
  /** The CC it listens for; null: none. */
  cc: number | null
  /** The function's `id`. */
  fn: string
  controlType: 'holdA' | 'holdB' | 'toggle'
  reverse: boolean
  range: 'upper' | 'lower' | 'full'
  /** Waiting for a pedal press to learn its CC. */
  learning: boolean
  /** Held down now. */
  down: boolean
}

/** Which controllers reach one keyboard part, and its bend range. */
export interface PartReach {
  /** "Right 1". */
  name: string
  hue: PartHue
  sustain: boolean
  pitchBend: boolean
  modulation: boolean
  /** Semitones, 0–12. */
  bendRange: number
}

export interface PedalsPageData {
  /** P1–P3. */
  pedals: PedalRow[]
  /** The functions, grouped as the picker lists them. */
  functions: { group: string; items: PedalFunction[] }[]
  /** Right 1, Right 2, Right 3, Left. */
  parts: PartReach[]
}

export type PedalsChange =
  | { type: 'cc'; pedal: number; cc: number | null }
  | { type: 'function'; pedal: number; fn: string }
  | { type: 'controlType'; pedal: number; value: PedalRow['controlType'] }
  | { type: 'reverse'; pedal: number; on: boolean }
  | { type: 'range'; pedal: number; value: PedalRow['range'] }
  /** Learn pressed: start learning, or stop if this pedal is learning. */
  | { type: 'learn'; pedal: number }
  /** Run the pedal's function once, as a press would. */
  | { type: 'try'; pedal: number }
  | { type: 'reach'; part: number; controller: 'sustain' | 'pitchBend' | 'modulation'; on: boolean }
  | { type: 'bendStep'; part: number; delta: -1 | 1 }

// ── System: Audio, MIDI, Library, App ────────────────────────────────────────────────────────────

export interface MidiInput {
  name: string
  listening: boolean
  /** The Launchkey's DAW port (pads and buttons). */
  pads: boolean
}

export interface SystemPageData {
  /** The built-in synth is running (false: started without it; its controls are shown, not pressable). */
  synthRunning: boolean
  /** Running and not muted. */
  synthOn: boolean
  /** The output pairs, by first channel (1-based), e.g. `[{ first: 1, label: '1–2' }]`. */
  outputPairs: { first: number; label: string }[]
  /** The pair playing, by its first channel; null: unknown. */
  outputFirst: number | null
  /** The buffer sizes offered, frames. */
  buffers: number[]
  /** The buffer in use, frames; null: unknown. */
  buffer: number | null
  /** "2.7" ms, or null. */
  latencyMs: string | null
  /** "48" kHz, or null. */
  sampleRateKhz: string | null
  /** 0–127; null: no synth. */
  master: number | null
  /** CPU load, percent; null: not measured. Above 70 it reads in trouble red. */
  cpu: number | null
  /** Audio dropouts lately (0: none). */
  dropouts: number
  /** Listen to every input; null: the engine doesn't say. */
  allInputs: boolean | null
  /** The engine can't choose inputs: the choice is shown, not pressable. */
  inputsFixed: boolean
  inputs: MidiInput[]
  /** The virtual output port's name ("yahaha Out"); empty: not open. */
  outputPort: string
  launchkeyConnected: boolean
  /** "MK4 61"; empty when not connected. */
  launchkeyName: string
  /** Palette LEDs on (false: RGB); null: set at launch. */
  paletteLeds: boolean | null
  /** The engine can't switch LEDs: shown, not pressable. */
  ledsFixed: boolean
  /** The style folders. */
  styleFolders: string[]
  styleCount: number
  scanning: boolean
  /** The engine can't rescan: shown, not pressable. */
  rescanFixed: boolean
  /** The `.sf2` files found, and the main one. */
  soundFonts: string[]
  soundFontMain: string | null
  /** The app's theme. "System" (follow the computer) is shown, not choosable yet. */
  theme: 'dark' | 'light'
}

export type SystemChange =
  | { type: 'synth'; on: boolean }
  | { type: 'outputPair'; first: number }
  | { type: 'buffer'; frames: number }
  | { type: 'master'; volume: number }
  | { type: 'allInputs'; all: boolean }
  | { type: 'input'; name: string; on: boolean }
  | { type: 'paletteLeds'; on: boolean }
  | { type: 'rescan' }
  | { type: 'theme'; theme: 'dark' | 'light' }

// ── Launchkey: the pad page order ────────────────────────────────────────────────────────────────

export interface PadPageRow {
  id: string
  /** "Racks". */
  label: string
  /** What its pads do, one line. */
  pads: string
  /** In the order Pad Bank steps through; a page left out sits at the end, unshown. */
  shown: boolean
}

export interface LaunchkeyPageData {
  /** Pages 2–5: the shown ones in their order, then the ones left out. Sections (page 1) is fixed and not listed. */
  pages: PadPageRow[]
  /** What Sections' pads do (the fixed first row). */
  sectionsPads: string
  /** The order is the default: Default order is shown, not pressable. */
  isDefault: boolean
}

export type LaunchkeyChange =
  | { type: 'move'; id: string; delta: -1 | 1 }
  | { type: 'shown'; id: string; on: boolean }
  | { type: 'reset' }

