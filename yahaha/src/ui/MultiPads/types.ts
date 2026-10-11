/** A pad's lamp, as the engine lights it: no data, data, playing, waiting for the bar line, Synchro Start standby. */
export type MultiPadLamp = 'empty' | 'ready' | 'playing' | 'queued' | 'armed'

/** One of the bank's four pads. */
export type MultiPadItem = {
  /** The phrase's name from the bank file; empty for an empty pad. */
  name: string
  lamp: MultiPadLamp
  /** Loops until stopped (on) or plays once (off). */
  repeat: boolean
  /** Follows the chord you play. */
  chordMatch: boolean
  /** The MIDI channel it plays on (5–8). */
  channel: number
}

/** One bank in the list: a `.pad` file in the style folders. */
export type MultiPadBankItem = {
  /** What a bank change carries. Unique. */
  id: string
  name: string
  /** Its folder, relative to the scanned root ("Pads/Latin"). */
  folder: string
}

/** Everything the Multi Pads page draws. */
export type MultiPadsData = {
  /** The banks, folder then name. */
  banks: MultiPadBankItem[]
  /** The `id` of the loaded bank; null when none. */
  bank: string | null
  /** The loaded bank's name; empty when none. */
  bankName: string
  /** A bank is on its way to the engine. */
  loading: boolean
  /** Always four. */
  pads: MultiPadItem[]
  /** The flash phase of queued and armed pads (the beat clock's first half). */
  lit: boolean
  /** The band is playing: a pad press waits for the bar line. */
  running: boolean
  /** The Multi Pad volume (Panel fader 6), 0–127; 100 plays the pads as written. */
  volume: number
  /** Panel fader 6 hasn't reached `volume` yet. */
  volumeWaiting: boolean
  /** Multi Pad Synchro Stop: looping pads stop when the band stops / an Ending starts. */
  synchroStop: { styleStop: boolean; ending: boolean }
  /** Load… failed (the file picker didn't open): the line shown under the bank tools. Default: none. */
  error?: string | null
}

/** What the page asks for. Pads are 0–3. */
export type MultiPadsChange =
  | { type: 'play'; pad: number }
  | { type: 'stop'; pad: number }
  | { type: 'select'; pad: number }
  | { type: 'stopAll' }
  | { type: 'repeat'; pad: number; on: boolean }
  | { type: 'chordMatch'; pad: number; on: boolean }
  | { type: 'bank'; id: string }
  | { type: 'clear' }
  /** Load…: pick a `.pad` file anywhere on disk (the app opens the system file picker). */
  | { type: 'loadFile' }
  | { type: 'volume'; volume: number }
  | { type: 'synchroStop'; styleStop: boolean; ending: boolean }
