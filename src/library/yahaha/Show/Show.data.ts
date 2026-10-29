// The show's dataset (docs/live-views.md): seven songs and a jam, as plain data. No framework:
// the same values feed a React story, a Svelte story and the app's own store. The set is the
// wireframes' band context (APC40-style eight tracks, Demucs stems, hot cues, six transitions).
import type { ArpState, LiveChord, LiveCue, LiveLoop, LiveSend, LiveSong, LiveStem, LiveTrack, LiveWindow } from '../../components/music/live.model';
import type { TransitionPad } from '../../components/music/TransitionRow/TransitionRow.model';
import type { MacroPad } from '../../components/music/MacroPads/MacroPads.model';

/** The whole sample set: what the Show draws, in one value. */
export interface ShowData {
  /** The setlist, in order; one song open. */
  songs: readonly LiveSong[];
  /** The eight track columns with the open song's loops, levels, meters, sends and lamps. */
  tracks: readonly LiveTrack[];
  /** Where the set is: the stop row's own loop. */
  loop: LiveLoop;
  /** The open song's eight-bar progression. */
  chords: readonly LiveChord[];
  /** The bar the progression is on. */
  chordIndex: number;
  /** The sixteen-step arp following the progression. */
  arp: ArpState;
  /** The deck's four stems, cues and loop window. */
  stems: readonly LiveStem[];
  cues: readonly LiveCue[];
  window: LiveWindow;
  /** The two effect returns. */
  returns: readonly LiveSend[];
  /** The six transition pads. */
  transitions: readonly TransitionPad[];
  /** The macro throws beside the arp. */
  macros: readonly MacroPad[];
  /** Jamming: the grid stays live past the arrangement. */
  jam: boolean;
}

const songs: readonly LiveSong[] = [
  { id: 'open', index: 1, name: 'Open', open: false, summary: '■■□', tempo: 100, key: 'Am' },
  { id: 'glass', index: 2, name: 'Glass', open: false, summary: '■■■□', tempo: 104, key: 'F' },
  { id: 'hidden', index: 3, name: 'Hidden Signals', open: true, summary: '■■■■', tempo: 112, key: 'C' },
  { id: 'wire', index: 4, name: 'Wire', open: false, summary: '■■□□', tempo: 118, key: 'G' },
  { id: 'salt', index: 5, name: 'Salt', open: false, summary: '■■■', tempo: 122, key: 'Dm' },
  { id: 'bloom', index: 6, name: 'Bloom', open: false, summary: '■■□', tempo: 96, key: 'Em' },
  { id: 'ember', index: 7, name: 'Ember', open: false, summary: '■■■■□', tempo: 128, key: 'A' },
];

const cell = (id: string, state: 'empty' | 'stopped' | 'queued' | 'playing' | 'recording', over: object = {}) => ({ id, state, ...over });

const tracks: readonly LiveTrack[] = [
  { id: 'drums', name: 'Drums', hue: 1, level: 0.8, meter: 0.7, sends: [0.4, 0.75], cells: [cell('a', 'playing', { phase: 0.6, name: 'Main' }), cell('b', 'stopped', { name: 'Break' }), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'bass', name: 'Bass', hue: 2, level: 0.75, meter: 0.6, sends: [0.3, 0.2], cells: [cell('a', 'playing', { phase: 0.6, name: 'Sub' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'keys', name: 'Keys', hue: 3, level: 0.7, meter: 0.5, sends: [0.6, 0.4], armed: true, cells: [cell('a', 'recording', { phase: 0.3, bars: 3 }), cell('b', 'stopped', { name: 'Pad' }), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'vox', name: 'Vox', hue: 4, level: 0.8, meter: 0.65, sends: [0.5, 0.5], soloed: true, cells: [cell('a', 'queued', { phase: 0.1, name: 'Verse' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'gtr', name: 'Gtr', hue: 5, level: 0.6, meter: 0.4, sends: [0.2, 0.1], muted: true, cells: [cell('a', 'stopped', { name: 'Riff' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'perc', name: 'Perc', hue: 1, level: 0.55, meter: 0.45, sends: [0.35, 0.3], cells: [cell('a', 'stopped', { name: 'Top' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'syn', name: 'Syn', hue: 2, level: 0.65, meter: 0.5, sends: [0.45, 0.55], cells: [cell('a', 'playing', { phase: 0.85, name: 'Arp' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'fx', name: 'FX', hue: 3, level: 0.5, meter: 0.3, parked: true, cells: [cell('a', 'empty'), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
];

/** Hidden Signals' eight bars: the progression the arp follows. */
const chords: readonly LiveChord[] = [
  { id: 'am7', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'am7-2', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'fmaj7', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'fmaj7-2', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'c', name: 'C', notes: ['C', 'E', 'G'], beats: 4 },
  { id: 'g', name: 'G/B', notes: ['G', 'B', 'D'], beats: 4 },
  { id: 'dm7', name: 'Dm7', notes: ['D', 'F', 'A', 'C'], beats: 4 },
  { id: 'e7', name: 'E7', notes: ['E', 'G#', 'B', 'D'], beats: 4 },
];

/** Sixteen steps climbing the Am7: R 3 5 7 9, twice, a tie and a rest. */
const arp: ArpState = {
  steps: [
    { on: true, degree: 0, velocity: 0.9 }, { on: true, degree: 1, velocity: 0.7 },
    { on: true, degree: 2, velocity: 0.8 }, { on: true, degree: 3, velocity: 0.65, tie: true },
    { on: true, degree: 4, velocity: 0.75 }, { on: true, degree: 3, velocity: 0.6 },
    { on: true, degree: 2, velocity: 0.7, tie: true }, { on: false, degree: 1, velocity: 0.5 },
    { on: true, degree: 0, velocity: 0.85 }, { on: true, degree: 1, velocity: 0.7 },
    { on: true, degree: 2, velocity: 0.75 }, { on: true, degree: 3, velocity: 0.6 },
    { on: true, degree: 0, velocity: 0.9, tie: true }, { on: true, degree: 2, velocity: 0.7 },
    { on: false, degree: 1, velocity: 0.5 }, { on: true, degree: 0, velocity: 0.95 },
  ],
  mode: 'updown',
  rate: 0.4,
  octaves: 2,
  gate: 0.5,
  swing: 0.25,
};

const peaks = (seed: number): readonly number[] =>
  Array.from({ length: 48 }, (_, i) => Math.max(0.05, Math.min(1, 0.45 + 0.35 * Math.sin(i / 3 + seed) + 0.12 * Math.sin(i / 1.3 + seed * 2))));

const stems: readonly LiveStem[] = [
  { id: 'drums', name: 'D', hue: 1, peaks: peaks(0) },
  { id: 'bass', name: 'B', hue: 2, peaks: peaks(2), muted: true },
  { id: 'vox', name: 'V', hue: 4, peaks: peaks(4), soloed: true },
  { id: 'other', name: 'O', hue: 3, peaks: peaks(6) },
];

const cues: readonly LiveCue[] = [
  { id: 'c1', label: '1', at: 0.06 },
  { id: 'c2', label: '2', at: 0.28 },
  { id: 'c3', label: '3', at: 0.52 },
  { id: 'c4', label: '4', at: 0.74 },
  { id: 'c5', label: '5', at: 0.9 },
];

const transitions: readonly TransitionPad[] = [
  { id: 'riser', label: 'RISER', state: 'idle', hue: 1, hint: '8 bars' },
  { id: 'drop', label: 'DROP', state: 'armed', hue: 2, hint: 'next bar' },
  { id: 'crash', label: 'CRASH', state: 'idle', hue: 3, hint: 'one shot' },
  { id: 'hold-a', label: 'HOLD A', state: 'idle', hue: 4, hint: 'A section' },
  { id: 'hold-b', label: 'HOLD B', state: 'idle', hue: 5, hint: 'B section' },
  { id: 'cut', label: 'CUT', state: 'idle', hint: 'hard cut' },
];

/** The sample set: Hidden Signals open, Keys recording, Vox soloed, DROP armed, jam on. */
export const LIVE_SHOW: ShowData = {
  songs,
  tracks,
  loop: { phase: 0.5, bars: 8 },
  chords,
  chordIndex: 2,
  arp,
  stems,
  cues,
  window: { start: 0.18, end: 0.74, bars: 8 },
  returns: [
    { id: 'fxa', name: 'FX A', hue: 1, level: 0.7 },
    { id: 'fxb', name: 'FX B', hue: 2, level: 0.6 },
  ],
  transitions,
  macros: [
    { id: 'throw', label: 'FX A delay throw', xLabel: 'Time', yLabel: 'Feedback', x: 0.7, y: 0.62, hue: 2 },
    { id: 'filter', label: 'Filter / resonance', xLabel: 'Cutoff', yLabel: 'Resonance', x: 0.62, y: 0.7, hue: 3 },
  ],
  jam: true,
};
