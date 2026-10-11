import { partsBoard } from '../ChannelParts/ChannelParts.fixtures'
import type { ChannelData, InsertKindItem, SendKindItem } from './types'

/** The send kinds + Add send offers (the app's SEND_KINDS, in order). */
export const sendKindsBoard: SendKindItem[] = [
  { kind: 'hall', name: 'Hall' },
  { kind: 'room', name: 'Room' },
  { kind: 'stage', name: 'Stage' },
  { kind: 'plate', name: 'Plate' },
  { kind: 'chorus', name: 'Chorus' },
  { kind: 'celeste', name: 'Celeste' },
  { kind: 'flanger', name: 'Flanger' },
  { kind: 'eighth', name: 'Delay 1/8' },
  { kind: 'dottedEighth', name: 'Delay 1/8.' },
  { kind: 'quarter', name: 'Delay 1/4' },
  { kind: 'pingPong', name: 'Ping-Pong' },
  { kind: 'phaser', name: 'Phaser' },
]

/** The insert kinds a slot offers (the app's INSERT_KINDS, in order). */
export const insertKindsBoard: InsertKindItem[] = [
  { kind: 'none', name: 'None' },
  { kind: 'distortion', name: 'Distortion' },
  { kind: 'compressor', name: 'Compressor' },
  { kind: 'autoWah', name: 'Auto Wah' },
  { kind: 'tremolo', name: 'Tremolo' },
  { kind: 'rotary', name: 'Rotary' },
  { kind: 'phaser', name: 'Phaser' },
]

/** The board (docs/specs/push/Channel.md, Board fixture): Right 1 open, Stage Grand on the fake plugin. */
export const channelBoard: ChannelData = {
  part: 0,
  parts: partsBoard,
  keyboard: true,
  partName: 'Right 1',
  hue: 'r1',
  tab: 'mix',
  prevTag: 'Phrase 2',
  nextTag: 'R2',
  cpu: 0.03,
  sound: {
    number: '1',
    name: 'Stage Grand',
    edited: false,
    missing: false,
    failed: false,
    off: false,
    bass: false,
    mine: true,
    plugin: { name: 'Sampler Deluxe', status: 'playing', missing: false, inProcess: true, fallback: false, editor: true },
  },
  mix: { level: 90, waiting: false, pan: 64, on: true, onLabel: 'On', canSwap: true, solo: false },
  sends: [
    { send: 0, label: 'Reverb', level: 40, present: true },
    { send: 1, label: 'Chorus', level: 12, present: true },
    { send: 2, label: 'Delay', level: 0, present: true },
    { send: 3, label: 'Phaser', level: 20, present: true },
    { send: 4, label: 'Send 5', level: 0, present: false },
    { send: 5, label: 'Send 6', level: 0, present: false },
  ],
  sendKinds: sendKindsBoard,
  eq: { lowGain: 2, lowFreq: 120, highGain: -2, highFreq: 8000 },
  tone: { cutoff: 76, resonance: 68, attack: 64, decay: 64, release: 72, vibratoRate: 64, vibratoDepth: 64, vibratoDelay: 64 },
  play: { mono: false, portamento: { on: false, time: 0 }, octave: 0, bend: 2 },
  comp: { on: true, preset: 'punchy', threshold: -18, ratio: 30, attack: 10, release: 120, makeup: 0, edited: true },
  inserts: [
    {
      kind: 'rotary',
      name: 'Rotary',
      on: true,
      settings: [
        { name: 'Depth', value: 64, min: 0, max: 127, default: 64, display: '64' },
        { name: 'Drive', value: 20, min: 0, max: 127, default: 0, display: '20' },
        { name: 'Balance', value: 64, min: 0, max: 127, default: 64, display: '64' },
      ],
    },
    { kind: 'none', name: 'None', on: false, settings: [] },
  ],
  insertKinds: insertKindsBoard,
  rotaryFast: true,
}

/** Rhythm 1 open (a Style part): no pan, tone or play; the style's insert in slot 1. */
export const channelStylePart: ChannelData = {
  ...channelBoard,
  part: 4,
  keyboard: false,
  partName: 'Rhythm 1',
  hue: null,
  prevTag: 'L',
  nextTag: 'Rhythm 2',
  cpu: 0.02,
  sound: { ...channelBoard.sound, number: '', name: 'Standard Kit 1', mine: false, plugin: null },
  mix: { level: 100, waiting: false, pan: null, on: true, onLabel: 'On', canSwap: false, solo: false },
  sends: channelBoard.sends.map((s) => ({ ...s, level: s.send === 0 ? 56 : 0 })),
  eq: { lowGain: 0, lowFreq: 120, highGain: 2, highFreq: 8000 },
  tone: null,
  play: null,
  inserts: [
    {
      kind: 'compressor',
      name: 'Compressor',
      on: true,
      settings: [
        { name: 'Squeeze', value: 64, min: 0, max: 127, default: 64, display: '64' },
        { name: 'Attack', value: 3, min: 1, max: 100, default: 10, display: '3 ms' },
        { name: 'Release', value: 150, min: 10, max: 1000, default: 120, display: '150 ms' },
        { name: 'Output', value: 100, min: 0, max: 127, default: 100, display: '100' },
      ],
    },
    { kind: 'none', name: 'None', on: false, settings: [] },
  ],
}
