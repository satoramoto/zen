// The live set the concept panes draw, as plain data: the same eight tracks and the same songs the
// live widgets' fixtures use (LoopGrid, MixBand, ChordStrip), so a view can link them. No framework:
// a pane takes these values as props and asks for changes through `on<Verb>` callbacks.
import type { HueSlot } from '../components/core/hue';
import { chordStripBoard } from '../components/music/ChordStrip/ChordStrip.fixtures';
import type { LiveChord } from '../components/music/live.model';

/* ---------- tracks ---------- */

export interface SetTrack {
  id: string;
  name: string;
  hue: HueSlot;
  /** Where its sound comes from: `'pads'`, `'in 5'`, `'bus → arp'`. */
  source: string;
}

/** The set's eight columns, in LoopGrid's order and hue slots. */
export const SET_TRACKS: readonly SetTrack[] = [
  { id: 'drums', name: 'Drums', hue: 1, source: 'pads' },
  { id: 'bass', name: 'Bass', hue: 2, source: 'in 5 · bus' },
  { id: 'keys', name: 'Keys', hue: 3, source: 'bus → arp' },
  { id: 'vox', name: 'Vox', hue: 4, source: 'mic 3' },
  { id: 'gtr', name: 'Gtr', hue: 5, source: 'in 4' },
  { id: 'perc', name: 'Perc', hue: 1, source: 'pads' },
  { id: 'syn', name: 'Syn', hue: 2, source: 'chance' },
  { id: 'fx', name: 'FX', hue: 3, source: 'resample' },
];

export const trackById = (id: string): SetTrack | undefined => SET_TRACKS.find((t) => t.id === id);

/* ---------- the setlist ---------- */

export const SONG_STATES = ['done', 'now', 'cued', 'ahead', 'jam'] as const;
export type SongState = (typeof SONG_STATES)[number];

export const SCENE_STATES = ['played', 'playing', 'ahead'] as const;
export type SceneState = (typeof SCENE_STATES)[number];

export interface SetScene {
  id: string;
  name: string;
  /** The song section it belongs to: `'verse'`. */
  section: string;
  state: SceneState;
}

export interface SetSong {
  id: string;
  index: number;
  name: string;
  /** `'C'`, `'Am'`; a jam has none. */
  key?: string;
  tempo: number;
  /** Planned length, in minutes: a segment's width on the river. */
  minutes: number;
  state: SongState;
  scenes?: readonly SetScene[];
}

/** Friday's set: two done, Hidden Signals now, a jam, Wire cued, three ahead. */
export const SET_SONGS: readonly SetSong[] = [
  { id: 'open', index: 1, name: 'Open', key: 'Am', tempo: 100, minutes: 4.5, state: 'done' },
  { id: 'glass', index: 2, name: 'Glass', key: 'F', tempo: 104, minutes: 5, state: 'done' },
  {
    id: 'hidden',
    index: 3,
    name: 'Hidden Signals',
    key: 'C',
    tempo: 112,
    minutes: 6.5,
    state: 'now',
    scenes: [
      { id: 'bed', name: 'bed', section: 'intro', state: 'played' },
      { id: 'bass', name: '+bass', section: 'verse', state: 'playing' },
      { id: 'full', name: 'full', section: 'chorus', state: 'ahead' },
      { id: 'break', name: 'break', section: 'bridge', state: 'ahead' },
      { id: 'kept', name: 'kept', section: 'from jam', state: 'ahead' },
    ],
  },
  { id: 'wire', index: 4, name: 'Wire', key: 'G', tempo: 118, minutes: 4, state: 'cued' },
  { id: 'jam', index: 0, name: 'Jam', tempo: 118, minutes: 3, state: 'jam' },
  { id: 'tide', index: 5, name: 'Low Tide', key: 'Dm', tempo: 84, minutes: 5.5, state: 'ahead' },
  { id: 'sunset', index: 6, name: 'Sunset Loop', key: 'G', tempo: 104, minutes: 4, state: 'ahead' },
  { id: 'closer', index: 7, name: 'Closer', key: 'B♭', tempo: 132, minutes: 5, state: 'ahead' },
];

/** How far through the current song the set is (0–1), and the bars left until the cued song lands. */
export const SET_NOW = { progress: 0.38, barsToCue: 6, bar: 17, beat: 3 } as const;

/* ---------- harmony ---------- */

/** The progression loop: ChordStrip's own, so the strip and the compass agree. */
export const SET_PROGRESSION: readonly LiveChord[] = chordStripBoard.chords ?? [];
export const SET_CHORD_INDEX = chordStripBoard.index ?? 0;

/* ---------- generators ---------- */

/**
 * Euclid's rhythm: `hits` onsets spread as evenly as they go over `steps` (Bjorklund by
 * Bresenham). `euclid(5, 8)` is `x.xx.xx.`.
 */
export function euclid(hits: number, steps: number, rotate = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    if (Math.floor(((i + rotate) * hits) / steps) !== Math.floor(((i + rotate - 1) * hits) / steps)) out.push(i);
  }
  return out;
}

export interface SetGenerator {
  /** The track it plays. */
  track: string;
  /** `'ARP'`, `'EUCLID'`, `'CHANCE'`. */
  kind: string;
  /** Steps in its cycle. */
  steps: number;
  /** The steps that fire. */
  hits: readonly number[];
  /** Steps per beat: 4 is sixteenths. */
  rate: number;
  /** What it reads as: `'E(5,8) · 1/16'`. */
  hint: string;
}

/**
 * The follow page's generators, each on its own cycle length, so their hands drift apart and
 * meet again: 1.5, 2, 2.5, 3 and 4 beats, which line up every 60 beats (15 bars).
 */
export const SET_GENERATORS: readonly SetGenerator[] = [
  { track: 'drums', kind: 'EUCLID', steps: 16, hits: euclid(5, 16), rate: 4, hint: 'E(5,16) · kick' },
  { track: 'perc', kind: 'EUCLID', steps: 12, hits: euclid(7, 12), rate: 4, hint: 'E(7,12) · shaker' },
  { track: 'syn', kind: 'CHANCE', steps: 10, hits: [0, 3, 4, 7, 9], rate: 4, hint: 'markov · 30% rest' },
  { track: 'bass', kind: 'EUCLID', steps: 8, hits: euclid(5, 8), rate: 4, hint: 'E(5,8) · root 5th' },
  { track: 'keys', kind: 'ARP', steps: 6, hits: [0, 1, 2, 3, 4, 5], rate: 4, hint: 'up-down · 3 notes' },
];

/** Beats until every generator's hand is back at its top together (the cycles' least common multiple). */
export function realignBeats(gens: readonly SetGenerator[], beat: number): { every: number; left: number } {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  // Work in steps (all rates are integers), then back to beats.
  const rate = gens.reduce((r, g) => (r * g.rate) / gcd(r, g.rate), 1);
  const lcmSteps = gens.reduce((l, g) => {
    const n = g.steps * (rate / g.rate);
    return (l * n) / gcd(l, n);
  }, 1);
  const every = lcmSteps / rate;
  return { every, left: every - (((beat % every) + every) % every) };
}

/* ---------- a track's chain ---------- */

export const LAYER_KINDS = ['base', 'dub'] as const;
export type LayerKind = (typeof LAYER_KINDS)[number];

export interface LoopLayer {
  id: string;
  kind: LayerKind;
  /** When it was laid down, as the set clock read: `'0:32'`. */
  at: string;
  muted?: boolean;
}

export interface ChainStage {
  /** `'input'`, `'gen'`, `'inst'`, `'looper'`, `'fx'`, `'out'`. */
  id: string;
  title: string;
  /** The chosen option, drawn on the cartridge face. */
  value: string;
  /** The other options, drawn faint underneath. */
  options: readonly string[];
  /** Small readings: `rate 1/16`. */
  params?: readonly { name: string; value: string }[];
  /** An empty stage: the signal passes through. */
  bypass?: boolean;
}

/** Keys: Keystation in, arp, an SF2 piano, an 8-bar loop with three layers, delay and plate out. */
export const KEYS_CHAIN: readonly ChainStage[] = [
  { id: 'input', title: 'Input', value: 'MIDI · Keystation', options: ['audio · in 1/2', 'chord bus', 'resample'] },
  {
    id: 'gen',
    title: 'Generator',
    value: 'Arp · up-down',
    options: ['euclid', 'chance', 'chord player'],
    params: [
      { name: 'rate', value: '1/16' },
      { name: 'gate', value: '60%' },
      { name: 'oct', value: '2' },
    ],
  },
  { id: 'inst', title: 'Instrument', value: 'SF2 · E.Piano 2', options: ['AU plugin', 'MIDI out', 'none'] },
  {
    id: 'looper',
    title: 'Looper',
    value: 'MIDI loop · 8 bars',
    options: ['audio loop'],
    params: [
      { name: 'sync', value: 'clock' },
      { name: 'quant', value: 'bar' },
      { name: 'fb', value: '100%' },
    ],
  },
  {
    id: 'fx',
    title: 'FX',
    value: 'Delay 1/8d',
    options: ['plate → send B'],
    params: [{ name: 'fb', value: '35%' }],
  },
];

export const KEYS_LAYERS: readonly LoopLayer[] = [
  { id: 'l1', kind: 'base', at: '0:00' },
  { id: 'l2', kind: 'dub', at: '0:18', muted: true },
  { id: 'l3', kind: 'dub', at: '0:32' },
];

/* ---------- the hardware ---------- */

export const PUSH_SECTIONS = ['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUT', 'FILL', 'VAR', 'FREE'] as const;
export const PUSH_TRANSITIONS = ['RISER', 'DROP', 'CRASH', 'NOISE', 'STAB', 'HOLD A', 'HOLD B', 'CUT'] as const;

/* ---------- the landing ---------- */

export const LANDING_TARGETS = ['song', 'section', 'scene'] as const;
export type LandingTarget = (typeof LANDING_TARGETS)[number];

export const LANDING_LENGTHS = [4, 8, 16] as const;
export type LandingLength = (typeof LANDING_LENGTHS)[number];

/* ---------- the rig ---------- */

export const SIGNAL_STATES = ['ok', 'low', 'none'] as const;
export type SignalState = (typeof SIGNAL_STATES)[number];

export interface RigInput {
  id: string;
  name: string;
  state: SignalState;
  /** 0–1, the last second's peak. */
  level: number;
}

export interface RigDevice {
  id: string;
  name: string;
  connected: boolean;
}

export const RIG_INPUTS: readonly RigInput[] = [
  { id: 'nord', name: 'Nord', state: 'ok', level: 0.62 },
  { id: 'vox', name: 'Vox', state: 'ok', level: 0.74 },
  { id: 'gtr', name: 'Gtr', state: 'low', level: 0.08 },
  { id: 'bass', name: 'Bass', state: 'none', level: 0 },
];

export const RIG_DEVICES: readonly RigDevice[] = [
  { id: 'push', name: 'Push', connected: true },
  { id: 'mcu', name: 'MCU', connected: true },
  { id: 'chord', name: 'Chord kbd', connected: true },
  { id: 'foot', name: 'Footswitch', connected: false },
];

/** The last 24 seconds of DSP load, oldest first (0–1). */
export const RIG_LOAD: readonly number[] = [
  0.1, 0.11, 0.1, 0.12, 0.14, 0.12, 0.11, 0.13, 0.18, 0.22, 0.16, 0.12, 0.11, 0.12, 0.1, 0.12, 0.13, 0.12, 0.15, 0.13, 0.12, 0.11,
  0.12, 0.12,
];
