/**
 * The Effects page's data and changes. The library's Effects components take these as props and
 * report changes as these values; the app's wiring (panels/effects) builds the data from the
 * engine's state and turns each change into a command. No API types here: the library imports
 * nothing from the app.
 */

/** A keyboard part's hue. */
export type PartHue = 'r1' | 'r2' | 'r3' | 'l'

/** What the editor shows: a send (0–5), the Master Compressor and EQ, or the style's inserts. */
export type EffectsBus = number | 'master' | 'inserts'

/** One choice in a tab run or a picker. */
export interface Choice {
  /** What the change carries ("hall", "natural"). */
  id: string
  /** The word shown ("Hall", "Dotted 1/8"). */
  label: string
  /** The tooltip key. */
  tip?: string
}

// ── The list ────────────────────────────────────────────────────────────────────────────────────

/** One send in the list. */
export interface SendRowData {
  /** 0–5. */
  send: number
  /** "Reverb", "Chorus", "Delay" for sends 1–3; the kind's name for 4–6 ("Phaser"). */
  name: string
  /** "Hall · Mine", "Celeste · From style", "Added send". */
  subtitle: string
  /** The return, 0–127, shown in dB (64 = 0 dB, 127 = +6 dB, 0 = Off). */
  returnLevel: number
  /** Sends 1–3: the rack keeps its type. The badge "Set by rack" shows in place of the return. */
  setByRack: boolean
}

export interface ListData {
  sends: SendRowData[]
  /** Fewer than six sends (and the state lists them): Add send shows. */
  canAdd: boolean
  /** Which sends are free, "5 and 6 free". */
  free: string
  /** The Style inserts row's second line: "On · Chord 1", "Off", "None in this style". */
  insertsLine: string
  /** The Master row's second line: "Comp Natural · EQ off". */
  masterLine: string
}

// ── The mix switches (always in view) ───────────────────────────────────────────────────────────

export interface MixData {
  /** The style's insertion effects play. */
  insertsOn: boolean
  /** The rotary inserts at their fast speed. */
  rotaryFast: boolean
  /** The Master Compressor on. */
  compOn: boolean
  /** The Master EQ on. */
  eqOn: boolean
}

export type MixChange =
  | { type: 'insertsOn'; on: boolean }
  | { type: 'rotaryFast' }
  | { type: 'compOn'; on: boolean }
  | { type: 'eqOn'; on: boolean }

// ── A send's editor ─────────────────────────────────────────────────────────────────────────────

/** One labelled value with a bar (a Readout). */
export interface ParamRow {
  /** What the change carries: a block parameter's id ("delayFeedback"), "return", "band", "pad", or an added send's parameter "p0", "p1", … */
  id: string
  /** "Feedback". */
  label: string
  value: number
  min: number
  max: number
  /** Where a double-click puts it. */
  defaultValue: number
  /** The value as shown, unit included ("38%", "5.0 kHz", "1/8"). */
  display: string
  /** The Launchkey knob that moves it ("K6"), or empty. */
  code: string
  /** The tooltip key. */
  tip: string
}

/** One on/off switch in an editor's switch row (Tempo sync, Keep with rack). */
export interface SwitchItem {
  /** What the change carries: "delaySync", "pingPong", "rack". */
  id: string
  label: string
  on: boolean
  tip: string
  /** The accessible name when the label alone isn't enough. */
  name?: string
}

/** A keyboard part's send to the open bus. */
export interface PartSendItem {
  /** 0–3. */
  part: number
  /** "R1", "R2", "R3", "L". */
  tag: string
  hue: PartHue
  /** "Right 1". */
  name: string
  /** 0–127. */
  value: number
  /** The part sounds (an off part is drawn dimmed, still settable). */
  sounding: boolean
}

export interface BusData {
  /** 0–5. */
  send: number
  /** "Delay", "Phaser". */
  name: string
  /** The bus in lower case for the part sends' names: "reverb", "chorus", "delay", "phaser". */
  word: string
  /** Sends 1–3, the style's buses: they have a source and a type run; added sends a kind picker and Remove. */
  styleBus: boolean
  /** Sends 1–3: takes the style's type (true) or keeps the player's (false). Null for added sends. */
  followStyle: boolean | null
  /** The types (sends 1–3) or kinds (added sends) to choose from. */
  types: Choice[]
  /** The chosen one's id. */
  type: string
  /** The type control's tooltip key. */
  typeTip: string
  /** The switch row: 0–1 parameters and Keep with rack. Empty: no switch row. */
  switches: SwitchItem[]
  /** The left column: the bus's parameters. */
  params: ParamRow[]
  /** The right column, above the part sends: Return, then Band send and Pad send (sends 1–3). */
  levels: ParamRow[]
  /** Each keyboard part's send to this bus. */
  parts: PartSendItem[]
  /** The knobs that move the part sends ("K1–4"), or empty. */
  partsCode: string
  /** The line under the grid. */
  note: string
}

export type BusChange =
  | { type: 'source'; send: number; follow: boolean }
  | { type: 'kind'; send: number; kind: string }
  | { type: 'switch'; send: number; id: string; on: boolean }
  | { type: 'param'; send: number; id: string; value: number }
  | { type: 'partSend'; send: number; part: number; value: number }
  | { type: 'remove'; send: number }

// ── The Master Compressor and EQ ────────────────────────────────────────────────────────────────

/** One Master EQ band. */
export interface EqBandData {
  /** dB, −12..12. */
  gain: number
  /** Hz. */
  freq: number
  /** The lowest frequency it takes (Hz); it takes any whole Hz from here to `freqMax`. */
  freqMin: number
  /** The highest frequency it takes (Hz). */
  freqMax: number
  /** Q in tenths (7 = 0.7), 1..120. */
  q: number
  /** A shelf (bands 1 and 8 only). */
  shelf: boolean
  /** Bands 1 and 8: can be a shelf. */
  canShelf: boolean
}

export interface MasterData {
  compOn: boolean
  /** The compressor's type id ("natural"). */
  compType: string
  compTypes: Choice[]
  /** Its settings differ from the type's. */
  compEdited: boolean
  /** Compression, Texture, Output. */
  comp: ParamRow[]
  eqOn: boolean
  /** The EQ's type id ("flat"). */
  eqType: string
  eqTypes: Choice[]
  eqEdited: boolean
  /** Eight bands, low to high. */
  bands: EqBandData[]
}

export type MasterChange =
  | { type: 'compType'; preset: string }
  | { type: 'compParam'; id: string; value: number }
  | { type: 'eqType'; preset: string }
  | { type: 'eqBand'; band: number; gain: number; freq: number; q: number; shelf: boolean }

// ── The style's insertion effects ───────────────────────────────────────────────────────────────

/** A Style part's insertion effect. */
export interface InsertRowData {
  /** The Style part, 0–7. */
  part: number
  /** "Chord 1". */
  partName: string
  /** The style's XG type, "British Combo Classic". */
  xgName: string
  /** What plays it here, "Distortion", or "Dry" when nothing does. */
  plays: string
  /** Something plays it (an amount to set). */
  playing: boolean
  on: boolean
  /** 0–127. */
  amount: number
}

export interface InsertsData {
  /** The style's inserts play at all (the mix switch). */
  on: boolean
  rows: InsertRowData[]
}

export type InsertsChange = { type: 'on'; part: number; on: boolean } | { type: 'amount'; part: number; amount: number }

// ── The page ────────────────────────────────────────────────────────────────────────────────────

export interface EffectsData {
  /** What the editor shows (and the list's chosen row). */
  bus: EffectsBus
  list: ListData
  mix: MixData
  /** The open send's editor; null while Master or the inserts show. */
  editor: BusData | null
  master: MasterData
  inserts: InsertsData
}
