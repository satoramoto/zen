// The Effects page's story data: the board's moment (docs/design/push/png/Effects-Dark.png): four
// sends (the chorus kept by the rack, a Phaser added), the Delay open with tempo sync on, the
// Master Compressor on (Natural), the EQ off (Flat), one style insert on Chord 1.

import { returnText } from './returnText'
import type { BusData, EffectsData, EqBandData, InsertsData, ListData, MasterData, MixData, PartSendItem } from './types'

const RANGES: [number, number][] = [[32, 2000], [100, 10000], [100, 10000], [100, 10000], [100, 10000], [100, 10000], [100, 10000], [500, 16000]]
const FREQS = [80, 250, 500, 630, 800, 1000, 4000, 8000]

/** A Master EQ type's bands, as the app builds them (gains low to high). */
export function eqBands(gains: number[]): EqBandData[] {
  return gains.map((gain, i) => ({
    gain,
    freq: FREQS[i],
    freqMin: RANGES[i][0],
    freqMax: RANGES[i][1],
    q: 7,
    shelf: i === 0 || i === 7,
    canShelf: i === 0 || i === 7,
  }))
}

const parts = (values: number[]): PartSendItem[] =>
  (
    [
      ['R1', 'r1', 'Right 1', true],
      ['R2', 'r2', 'Right 2', true],
      ['R3', 'r3', 'Right 3', false],
      ['L', 'l', 'Left', true],
    ] as const
  ).map(([tag, hue, name, sounding], part) => ({ part, tag, hue, name, sounding, value: values[part] }))

export const effectsList: ListData = {
  sends: [
    { send: 0, name: 'Reverb', subtitle: 'Hall · Mine', returnLevel: 64, setByRack: false },
    { send: 1, name: 'Chorus', subtitle: 'Celeste · From style', returnLevel: 48, setByRack: true },
    { send: 2, name: 'Delay', subtitle: '1/8 · Mine', returnLevel: 36, setByRack: false },
    { send: 3, name: 'Phaser', subtitle: 'Added send', returnLevel: 20, setByRack: false },
  ],
  canAdd: true,
  free: '5 and 6 free',
  insertsLine: 'On · Chord 1',
  masterLine: 'Comp Natural · EQ off',
}

export const effectsMix: MixData = { insertsOn: true, rotaryFast: false, compOn: true, eqOn: false }

const DELAY_TYPES = [
  { id: 'eighth', label: '1/8', tip: 'fx.variation_type' },
  { id: 'dottedEighth', label: 'Dotted 1/8', tip: 'fx.variation_type' },
  { id: 'quarter', label: '1/4', tip: 'fx.variation_type' },
  { id: 'pingPong', label: 'Ping-pong', tip: 'fx.variation_type' },
]

/** Send 3, the Delay, tempo sync on. */
export const delayBus: BusData = {
  send: 2,
  name: 'Delay',
  word: 'delay',
  styleBus: true,
  followStyle: false,
  types: DELAY_TYPES,
  type: 'eighth',
  typeTip: 'fx.variation_type',
  switches: [
    { id: 'delaySync', label: 'Tempo sync', on: true, tip: 'fx.param.delay_sync' },
    { id: 'rack', label: 'Keep with rack', on: false, tip: 'fx.send_keep', name: 'Delay: keep this type with the rack' },
  ],
  params: [
    { id: 'delayNote', label: 'Note', value: 2, min: 0, max: 7, defaultValue: 2, display: '1/8', code: 'K5', tip: 'fx.param.delay_note' },
    { id: 'delayFeedback', label: 'Feedback', value: 38, min: 0, max: 90, defaultValue: 38, display: '38%', code: 'K6', tip: 'fx.param.delay_feedback' },
    { id: 'delayTone', label: 'Tone', value: 50, min: 10, max: 200, defaultValue: 50, display: '5.0 kHz', code: 'K7', tip: 'fx.param.delay_tone' },
  ],
  levels: [
    { id: 'return', label: 'Return', value: 36, min: 0, max: 127, defaultValue: 64, display: returnText(36), code: 'K8', tip: 'fx.variation_return' },
    { id: 'band', label: 'Band send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.variation_band' },
    { id: 'pad', label: 'Pad send', value: 20, min: 0, max: 127, defaultValue: 0, display: '20%', code: '', tip: 'fx.variation_pad' },
  ],
  parts: parts([0, 16, 0, 0]),
  partsCode: 'K1–4',
  note: 'Picking a type makes it Mine. Knob page 6/6, Delay, moves K1 to K8.',
}

/** Send 1, the Reverb, following the style. */
export const reverbBus: BusData = {
  send: 0,
  name: 'Reverb',
  word: 'reverb',
  styleBus: true,
  followStyle: true,
  types: [
    { id: 'hall', label: 'Hall', tip: 'fx.reverb_type' },
    { id: 'room', label: 'Room', tip: 'fx.reverb_type' },
    { id: 'stage', label: 'Stage', tip: 'fx.reverb_type' },
    { id: 'plate', label: 'Plate', tip: 'fx.reverb_type' },
  ],
  type: 'hall',
  typeTip: 'fx.reverb_type',
  switches: [{ id: 'rack', label: 'Keep with rack', on: false, tip: 'fx.send_keep', name: 'Reverb: keep this type with the rack' }],
  params: [
    { id: 'reverbTime', label: 'Time', value: 24, min: 3, max: 100, defaultValue: 24, display: '2.4 s', code: 'K5', tip: 'fx.param.reverb_time' },
    { id: 'preDelay', label: 'Pre-delay', value: 22, min: 0, max: 100, defaultValue: 22, display: '22 ms', code: 'K6', tip: 'fx.param.pre_delay' },
    { id: 'reverbTone', label: 'Tone', value: 45, min: 10, max: 200, defaultValue: 45, display: '4.5 kHz', code: 'K7', tip: 'fx.param.reverb_tone' },
  ],
  levels: [
    { id: 'return', label: 'Return', value: 64, min: 0, max: 127, defaultValue: 64, display: returnText(64), code: 'K8', tip: 'fx.reverb_return' },
    { id: 'band', label: 'Band send', value: 100, min: 0, max: 127, defaultValue: 100, display: '100%', code: '', tip: 'fx.reverb_band' },
    { id: 'pad', label: 'Pad send', value: 100, min: 0, max: 127, defaultValue: 100, display: '100%', code: '', tip: 'fx.reverb_pad' },
  ],
  parts: parts([40, 30, 0, 20]),
  partsCode: 'K1–4',
  note: 'Style: Real Medium Hall. Picking a type makes it Mine. Knob page 4/6, Reverb, moves K1 to K8.',
}

/** Send 2, the Chorus, its type kept by the rack. */
export const chorusBus: BusData = {
  send: 1,
  name: 'Chorus',
  word: 'chorus',
  styleBus: true,
  followStyle: true,
  types: [
    { id: 'chorus', label: 'Chorus', tip: 'fx.chorus_type' },
    { id: 'celeste', label: 'Celeste', tip: 'fx.chorus_type' },
    { id: 'flanger', label: 'Flanger', tip: 'fx.chorus_type' },
  ],
  type: 'celeste',
  typeTip: 'fx.chorus_type',
  switches: [{ id: 'rack', label: 'Keep with rack', on: true, tip: 'fx.send_keep', name: 'Chorus: keep this type with the rack' }],
  params: [
    { id: 'chorusRate', label: 'Rate', value: 29, min: 0, max: 100, defaultValue: 29, display: '0.29 Hz', code: 'K5', tip: 'fx.param.chorus_rate' },
    { id: 'chorusDepth', label: 'Depth', value: 9, min: 0, max: 100, defaultValue: 9, display: '0.9 ms', code: 'K6', tip: 'fx.param.chorus_depth' },
  ],
  levels: [
    { id: 'return', label: 'Return', value: 48, min: 0, max: 127, defaultValue: 64, display: returnText(48), code: 'K8', tip: 'fx.chorus_return' },
    { id: 'band', label: 'Band send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.chorus_band' },
    { id: 'pad', label: 'Pad send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.chorus_pad' },
  ],
  parts: parts([10, 10, 10, 10]),
  partsCode: 'K1–4',
  note: 'Set by rack: the rack keeps Celeste when the style changes. Knob page 5/6, Chorus, moves K1 to K6 and K8.',
}

/** Send 4, an added Phaser. */
export const phaserBus: BusData = {
  send: 3,
  name: 'Phaser',
  word: 'phaser',
  styleBus: false,
  followStyle: null,
  types: [
    { id: 'hall', label: 'Hall' },
    { id: 'room', label: 'Room' },
    { id: 'stage', label: 'Stage' },
    { id: 'plate', label: 'Plate' },
    { id: 'chorus', label: 'Chorus' },
    { id: 'celeste', label: 'Celeste' },
    { id: 'flanger', label: 'Flanger' },
    { id: 'eighth', label: 'Delay 1/8' },
    { id: 'dottedEighth', label: 'Delay 1/8.' },
    { id: 'quarter', label: 'Delay 1/4' },
    { id: 'pingPong', label: 'Ping-Pong' },
    { id: 'phaser', label: 'Phaser' },
  ],
  type: 'phaser',
  typeTip: 'fx.send_kind',
  switches: [],
  params: [
    { id: 'p0', label: 'Depth', value: 64, min: 0, max: 127, defaultValue: 64, display: '64', code: '', tip: 'fx.send_param' },
    { id: 'p1', label: 'Rate', value: 50, min: 5, max: 500, defaultValue: 50, display: '0.50 Hz', code: '', tip: 'fx.send_param' },
    { id: 'p2', label: 'Feedback', value: 40, min: 0, max: 90, defaultValue: 40, display: '40%', code: '', tip: 'fx.send_param' },
  ],
  levels: [{ id: 'return', label: 'Return', value: 20, min: 0, max: 127, defaultValue: 64, display: returnText(20), code: '', tip: 'fx.send_return' }],
  parts: parts([0, 0, 0, 0]),
  partsCode: '',
  note: 'Saved with the rack. No knob page moves it.',
}

export const effectsMaster: MasterData = {
  compOn: true,
  compType: 'natural',
  compTypes: [
    { id: 'natural', label: 'Natural' },
    { id: 'rich', label: 'Rich' },
    { id: 'punchy', label: 'Punchy' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'loud', label: 'Loud' },
  ],
  compEdited: false,
  comp: [
    { id: 'compression', label: 'Compression', value: 30, min: 0, max: 100, defaultValue: 30, display: '30%', code: '', tip: 'fx.master_comp_compression' },
    { id: 'texture', label: 'Texture', value: 50, min: 0, max: 100, defaultValue: 50, display: '50%', code: '', tip: 'fx.master_comp_texture' },
    { id: 'output', label: 'Output', value: 1, min: -12, max: 12, defaultValue: 1, display: '+1 dB', code: '', tip: 'fx.master_comp_output' },
  ],
  eqOn: false,
  eqType: 'flat',
  eqTypes: [
    { id: 'flat', label: 'Flat', tip: 'fx.master_eq_type' },
    { id: 'mellow', label: 'Mellow', tip: 'fx.master_eq_type' },
    { id: 'bright', label: 'Bright', tip: 'fx.master_eq_type' },
    { id: 'loudness', label: 'Loudness', tip: 'fx.master_eq_type' },
    { id: 'powerful', label: 'Powerful', tip: 'fx.master_eq_type' },
  ],
  eqEdited: false,
  bands: eqBands([0, 0, 0, 0, 0, 0, 0, 0]),
}

/** The board's Master variant: the EQ on, Loudness. */
export const effectsMasterLoudness: MasterData = { ...effectsMaster, eqOn: true, eqType: 'loudness', bands: eqBands([4, 1, 0, 0, 0, 0, 2, 4]) }

export const effectsInserts: InsertsData = {
  on: true,
  rows: [
    { part: 3, partName: 'Chord 1', xgName: 'British Combo Classic', plays: 'Distortion', playing: true, on: true, amount: 64 },
    { part: 4, partName: 'Chord 2', xgName: 'Rotary Speaker 2', plays: 'Rotary', playing: true, on: true, amount: 80 },
    { part: 6, partName: 'Phrase 1', xgName: 'Ring Modulator', plays: 'Dry', playing: false, on: false, amount: 64 },
  ],
}

/** The whole page at the board's moment: send 3, the Delay, open. */
export const effectsBoard: EffectsData = {
  bus: 2,
  list: effectsList,
  mix: effectsMix,
  editor: delayBus,
  master: effectsMaster,
  inserts: effectsInserts,
}
