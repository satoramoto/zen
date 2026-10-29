// The live workspace's shared vocabulary (docs/live-workspace.md): what a performance surface is
// made of, as plain data. No framework, no app: a track, its slots, a song, a chord, a stem. The
// widgets in this folder take these and return nothing but callbacks, so the same values feed a
// React story, a Svelte story, an assembled spec and an app's own store.
import type { HueSlot } from '../core/hue';

/* ---------- loops: the grid ---------- */

/** What a loop slot is doing. The union comes from this tuple, so a new state is a type error everywhere it isn't drawn. */
export const LIVE_CELL_STATES = ['empty', 'stopped', 'queued', 'playing', 'recording'] as const;
export type LiveCellState = (typeof LIVE_CELL_STATES)[number];

/** One loop slot in one track column. */
export interface LiveCell {
  id: string;
  /** The loop's own name, shown when there is room; the slot is usable without one. */
  name?: string;
  state: LiveCellState;
  /** 0–1 through the loop: the pie's wedge. Meaningful while `playing`, `queued` or `recording`. */
  phase?: number;
  /** Bars captured so far, while `recording`. */
  bars?: number;
  /** The loop this slot hands over to (a transition), if any. */
  next?: string;
}

/** Which slot a callback is about. */
export interface LiveCellRef {
  track: string;
  cell: string;
}

/** One track column: its slots, its level, its two sends. */
export interface LiveTrack {
  id: string;
  name: string;
  /** The track's categorical hue. What it means is the app's. */
  hue: HueSlot;
  cells: readonly LiveCell[];
  /** 0–1. */
  level: number;
  /** 0–1, the post-fader meter. Absent: not metered. */
  meter?: number;
  /** Send A and send B, 0–1 each. Absent: this track has no sends. */
  sends?: readonly [number, number];
  armed?: boolean;
  muted?: boolean;
  soloed?: boolean;
  /** Parked: drawn faint, still column-aligned. */
  parked?: boolean;
}

/** One song in the set: a folded header row over the grid. */
export interface LiveSong {
  id: string;
  /** Its place in the set, from 1. */
  index: number;
  name: string;
  /** Unfolded: its track columns are drawn under it. */
  open: boolean;
  /** The folded summary, one glyph per section: `'■■■□'`. */
  summary?: string;
  tempo?: number;
  key?: string;
}

/** The stop row's own loop: where the set is, independent of any slot. */
export interface LiveLoop {
  /** 0–1. */
  phase: number;
  /** Bars in the current loop, when known. */
  bars?: number;
  recording?: boolean;
}

/* ---------- harmony: the arpeggiator and its chords ---------- */

/** How the arpeggiator walks the chord. */
export const ARP_MODES = ['up', 'down', 'updown', 'converge', 'random'] as const;
export type ArpMode = (typeof ARP_MODES)[number];

/** The chord degrees a step can fire, in order: a step's `degree` indexes this. */
export const ARP_DEGREES = ['R', '3', '5', '7', '9', '11', '+8', '+15'] as const;
export type ArpDegree = (typeof ARP_DEGREES)[number];

/** One step of the arpeggiator. */
export interface ArpStep {
  on: boolean;
  /** Index into `ARP_DEGREES`. */
  degree: number;
  /** 0–1, the step's stalk. */
  velocity?: number;
  /** Holds into the next step. */
  tie?: boolean;
}

/** The whole arpeggiator: its steps and the four knobs every hardware arp has. */
export interface ArpState {
  /** Sixteen steps, left to right. */
  steps: readonly ArpStep[];
  mode: ArpMode;
  /** 0–1 on the rate ladder (the app names the divisions). */
  rate: number;
  /** How many octaves it climbs: 1–4. */
  octaves: number;
  /** 0–1. */
  gate: number;
  /** 0–1. */
  swing: number;
}

/** One chord in the progression the arpeggiator follows. */
export interface LiveChord {
  id: string;
  /** `'Am7'`. */
  name: string;
  /** `'A C E G'`, when the app knows the voicing. */
  notes?: readonly string[];
  /** Its length in beats. */
  beats?: number;
}

/* ---------- the mix ---------- */

/** One effect return: the thing a send feeds. */
export interface LiveSend {
  id: string;
  name: string;
  hue?: HueSlot;
  /** 0–1. */
  level: number;
}

/* ---------- stems: the deck ---------- */

/** One stem lane. */
export interface LiveStem {
  id: string;
  name: string;
  hue: HueSlot;
  /** 0–1 per bucket, left to right: the lane's envelope. */
  peaks: readonly number[];
  muted?: boolean;
  soloed?: boolean;
}

/** A hot cue on the deck's ruler. */
export interface LiveCue {
  id: string;
  label: string;
  /** 0–1 across the loop. */
  at: number;
}

/** Where a deck's loop sits in the file, and how long it is. */
export interface LiveWindow {
  /** 0–1. */
  start: number;
  /** 0–1. */
  end: number;
  /** The loop length in bars, when known. */
  bars?: number;
}
