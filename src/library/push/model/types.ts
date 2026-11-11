// The device's contract, as plain data (openspec: push-device-model). Three shapes cross it:
//
//   PushSet    what the app owns and gives: tracks, devices, clips, transport, browser, the unit's readings
//   PushState  what the device remembers: modes, layouts, what is held, highlights, pages
//   PushInput  one thing a person did: a control, what happened to it, and when
//
// and two pure functions use them (`step.ts`, `project.ts`):
//
//   step(state, set, input)  ->  { state, intents }
//   project(state, set)      ->  { lamps, screen, notes }
//
// Everything here survives JSON. Nothing here is a class, a function or a renderer's type.

import type { LampShade } from '../../foundation/themes/lamps';

/** A control's id from the layout table (`layout.ts`), or a pedal jack. */
export type ControlId = string;

/* ------------------------------------------------------------------ the Set */

/** How the unit is being used. They differ only where the manual says (arming, Sets, saving, Arrangement, the Session Ring, User Mode). */
export type UnitMode = 'standalone' | 'control';
export type Edition = 'intro' | 'standard' | 'suite';
export type Power = 'on' | 'off' | 'starting' | 'low-battery' | 'shutting-down';

/** One parameter of a device, a mixer or a setting, as the app has it now. */
export interface Parameter {
  id: string;
  name: string;
  /** Where the value is in its range, 0 to 1. */
  value: number;
  /** The value as the app words it ("-6.0 dB", "1/8", "On"). */
  display: string;
  /** `continuous` fills from the start, `bipolar` from the middle, `switch` is on or off, `choice` one of `choices`. */
  kind: 'continuous' | 'bipolar' | 'switch' | 'choice';
  choices?: string[];
  /** Automation exists for it in the playing clip or the Arrangement. */
  automated?: boolean;
  /** Automation exists but is overridden. */
  overridden?: boolean;
  /** Shown greyed: it cannot be changed now. */
  disabled?: boolean;
  /** The macro (1 to 16) this parameter is mapped to, in a Rack. */
  macro?: number;
  /** How many columns it takes on the display, when it is a drawing's control. Default 1. */
  span?: number;
}

/** A named page of up to eight parameters. A `null` leaves its column empty. */
export interface Bank {
  name: string;
  parameters: (Parameter | null)[];
  /** A drawing that goes with this bank, over the columns it names. */
  drawing?: Drawing;
}

/** What a device draws of itself, as readings the app gives. Points are 0 to 1 in both directions. */
export interface Drawing {
  kind: 'envelope' | 'filter' | 'oscillator' | 'spectrum' | 'gain-reduction' | 'tuner' | 'waveform' | 'curve';
  /** The first column it covers (1 to 8) and how many. */
  col: number;
  span: number;
  points?: [number, number][];
  /** Vertical markers (0 to 1 across), each with a job: a slice, a loop edge, the start, the end. */
  markers?: { at: number; kind: 'start' | 'end' | 'loop-start' | 'loop-end' | 'slice' | 'playhead' | 'selected' }[];
  /** A region lit between two places (the playing or loop region). */
  region?: [number, number];
  /** One number for a bar or a needle (gain reduction 0 to 1; the tuner -1 to 1, with `label` the note). */
  value?: number;
  label?: string;
  /** Sample peaks, low and high, 0 to 1, for a waveform. */
  peaks?: [number, number][];
}

export type DeviceKind = 'instrument' | 'audio-effect' | 'midi-effect' | 'instrument-rack' | 'drum-rack' | 'audio-effect-rack' | 'midi-effect-rack' | 'simpler' | 'max';

/** One chain of a Rack. */
export interface Chain {
  id: string;
  name: string;
  colour?: number;
  devices: Device[];
  muted?: boolean;
  soloed?: boolean;
}

/** One pad of a Drum Rack: its note, and its chain's devices when it has any. */
export interface DrumPad {
  note: number;
  name: string;
  colour?: number;
  /** No device on it: it plays nothing. */
  empty?: boolean;
  muted?: boolean;
  soloed?: boolean;
  /** The choke group, 0 for none. */
  choke?: number;
  /** Transpose, in semitones. */
  transpose?: number;
  /** What kind of sound it is, for an expressive kit's shading. */
  kind?: 'kick' | 'snare' | 'hat' | 'cymbal' | 'tom' | 'perc' | 'other';
  devices?: Device[];
}

/** Simpler's own readings. */
export interface Sampler {
  mode: 'classic' | 'one-shot' | 'slicing';
  sample?: string;
  peaks: [number, number][];
  /** 0 to 1 across the sample. */
  start: number;
  end: number;
  loop?: { start: number; end: number; on: boolean };
  zoom: number;
  warped?: boolean;
  /** Slicing: how it is sliced, where, and how slices play. */
  sliceBy?: 'transient' | 'beat' | 'region' | 'manual';
  slices?: number[];
  selectedSlice?: number;
  playback?: 'mono' | 'poly' | 'thru';
  trigger?: 'trigger' | 'gate';
  /** Whether the instrument can bend pitch per note (else a bend becomes a glissando). */
  playing?: number;
}

export interface Device {
  id: string;
  name: string;
  kind: DeviceKind;
  on: boolean;
  banks: Bank[];
  /** The preset loaded, and whether it differs from the stored one. */
  preset?: string;
  /** A Rack's chains and macros. */
  chains?: Chain[];
  macros?: (Parameter | null)[];
  /** How many macros are shown (1 to 16). */
  macroCount?: number;
  variations?: string[];
  variation?: number;
  /** A Drum Rack's pads, by note. */
  pads?: DrumPad[];
  /** The pad selected in a Drum Rack. */
  selectedPad?: number;
  sampler?: Sampler;
  /** It answers per-note pitch bend (MPE). */
  mpe?: boolean;
  /** A frozen track's device cannot be changed. */
  frozen?: boolean;
}

export interface Note {
  id: string;
  pitch: number;
  /** Start and length, in beats from the clip's start. */
  start: number;
  length: number;
  /** 1 to 127. */
  velocity: number;
  muted?: boolean;
  /** Per-note chances and offsets, as Live has them. */
  probability?: number;
  velocityRange?: number;
  releaseVelocity?: number;
  /** Fine position, in beats, from the grid. */
  nudge?: number;
}

export type ClipState = 'stopped' | 'playing' | 'recording' | 'queued' | 'queued-record' | 'queued-stop';

export interface Clip {
  name: string;
  colour: number;
  kind: 'midi' | 'audio';
  state: ClipState;
  /** Length in beats, and the loop inside it. */
  length: number;
  loop: { on: boolean; start: number; end: number };
  /** Where playback starts, in beats. */
  startMarker?: number;
  /** Where the clip is in its playback, in beats. */
  position?: number;
  notes?: Note[];
  /** Automation envelopes exist, by parameter id. */
  envelopes?: string[];
  /** An audio clip's own readings. */
  audio?: {
    peaks: [number, number][];
    warp: boolean;
    warpMode?: string;
    gain: number;
    transpose: number;
    detune: number;
    /** The tempo the app read from it. */
    bpm?: number;
  };
}

export type TrackKind = 'midi' | 'audio' | 'group' | 'return' | 'main';

export interface Routing {
  /** What is chosen and what the Set offers for each. */
  inputType: string;
  inputTypes: string[];
  inputChannel: string;
  inputChannels: string[];
  outputType: string;
  outputTypes: string[];
  outputChannel: string;
  outputChannels: string[];
  monitor: 'in' | 'auto' | 'off';
}

export interface Track {
  id: string;
  name: string;
  /** An index into the lamp table. */
  colour: number;
  kind: TrackKind;
  /** The group track that holds it. */
  parent?: string;
  /** A group track shown folded: its children are hidden. */
  folded?: boolean;
  armed?: boolean;
  /** Armed without a press, by selection (Standalone, Note Mode). */
  implicitArm?: boolean;
  muted?: boolean;
  soloed?: boolean;
  /** Muted by another track's solo. */
  mutedBySolo?: boolean;
  frozen?: boolean;
  volume: Parameter;
  pan: Parameter;
  sends: Parameter[];
  /** Cue volume and such, on the Main track. */
  extras?: Parameter[];
  routing?: Routing;
  devices: Device[];
  /** One slot per scene. */
  clips: (Clip | null)[];
  /** Slots with a stop button. Default: all. */
  stopButtons?: boolean[];
  /** The index of the clip playing or recording, if any. */
  playing?: number;
}

export interface Scene {
  name: string;
  colour?: number;
  /** Launched and waiting for its time. */
  queued?: boolean;
  tempo?: number;
}

export interface Transport {
  playing: boolean;
  /** Session recording into a slot, Arrangement recording, or neither. */
  recording: 'off' | 'session' | 'arrangement';
  /** Overdubbing into the playing clip. */
  overdub: boolean;
  tempo: number;
  swing: number;
  /** The song position, in beats. */
  beat: number;
  signature: [number, number];
  metronome: boolean;
  countIn: 'none' | '1 bar' | '2 bars' | '4 bars';
  /** A count-in is running: how far through, 0 to 1. */
  countingIn?: number;
  automationArm: boolean;
  /** Automation has been overridden and can be re-enabled. */
  reEnable?: boolean;
  fixedLength: { on: boolean; bars: string; choices: string[]; phrase?: boolean };
  quantize: { to: string; choices: string[]; amount: number; swing: number; recordTo: string; recordChoices: string[] };
  canUndo: boolean;
  canRedo: boolean;
  /** Something was played that Capture can keep. */
  canCapture: boolean;
  /** Link is on and has peers. */
  link?: { on: boolean; peers: number; playSync?: boolean };
  /** Which view Live shows (Control Mode). */
  view?: 'session' | 'arrangement';
}

/** The key and scale of the Set, and how the note grid is laid out. */
export interface ScaleSettings {
  /** 0 is C, 11 is B. */
  root: number;
  scale: string;
  inKey: boolean;
  fixed: boolean;
  /** How rows relate: fourths, thirds, or each row continuing the last. */
  layout: '4ths' | '3rds' | 'sequential';
}

/** One row of the browser, a Set, a Pack or any list the app gives. */
export interface BrowserItem {
  id: string;
  name: string;
  /** It holds more rows. `children` undefined means not yet listed (loading). */
  folder?: boolean;
  children?: BrowserItem[];
  /** It can be loaded: a device, a preset, a sample, a clip. */
  loadable?: boolean;
  /** What it would become: decides where it loads and whether it fits a hot-swap. */
  kind?: 'instrument' | 'drum' | 'audio-effect' | 'midi-effect' | 'sample' | 'clip' | 'preset' | 'track' | 'plugin' | 'max';
  /** It can be previewed. */
  preview?: boolean;
  favourite?: boolean;
  /** Collection colours it carries, as lamp indices. */
  collections?: number[];
  /** A small label after the name ("Cloud"). */
  tag?: string;
}

export interface Browser {
  /** The top of the tree: the Add menu's entries. */
  roots: BrowserItem[];
  previewing?: string;
  preview: boolean;
  /** Where the loaded device or preset of the selected thing lives, as ids from the top, for Hot-Swap. */
  hotSwapPath?: string[];
}

export interface PushSetFile {
  id: string;
  name: string;
  modified: string;
  cloud?: boolean;
  /** The Set that is open. */
  current?: boolean;
}

export interface Pack {
  id: string;
  name: string;
  size: string;
  state: 'available' | 'downloading' | 'paused' | 'downloaded' | 'installing' | 'installed';
  /** 0 to 1 while downloading or installing. */
  progress?: number;
  updatable?: boolean;
}

export interface Lesson {
  id: string;
  name: string;
  done?: boolean;
  steps?: string[];
}

export interface WifiNetwork {
  name: string;
  /** 0 to 1. */
  strength: number;
  secured: boolean;
  known?: boolean;
  connected?: boolean;
}

export interface MidiPort {
  id: string;
  name: string;
  input?: { track: boolean; sync: boolean; remote: boolean };
  output?: { track: boolean; sync: boolean; remote: boolean };
}

export interface Jack {
  /** What is plugged in, or nothing. */
  plugged?: 'footswitch' | 'expression' | 'cv' | 'cable' | 'headphones' | 'device';
  /** What the jack is set to do. */
  job?: string;
  jobs?: string[];
}

/** The unit's own readings and settings: everything Setup shows, the battery, the ports. */
export interface Unit {
  mode: UnitMode;
  power: Power;
  edition: Edition;
  /** What the hardware has. */
  processor: boolean;
  battery?: { percent: number; charging: boolean };
  adat: boolean;
  name: string;
  storage?: { used: string; total: string; fraction: number };
  /** 0 to 100. */
  ledBrightness: number;
  displayLight: number;
  /** A startup's progress, 0 to 1, and whether the first-run guide is showing. */
  starting?: number;
  onboarding?: boolean;
  wifi: { on: boolean; networks: WifiNetwork[]; connecting?: string; address?: string };
  hotspot: { on: boolean; name?: string; password?: string };
  /** Pad expression. */
  expression: {
    mode: 'mpe' | 'poly-aftertouch' | 'mono-aftertouch' | 'off';
    /** Whether sideways movement bends the note: always, never, or only on an instrument that takes per-note bend. */
    noteBend: 'auto' | 'on' | 'off';
    slideRange: 'full' | 'half';
    inTune: 'pad' | 'finger';
    /** The width around the in-tune place that does not bend, as a share of a pad's width. */
    inTuneWidth: number;
    /** Draw where each held touch is, with its slide and bend. */
    trace: boolean;
  };
  /** The velocity curve. Each 0 to 1. */
  sensitivity: { threshold: number; drive: number; compand: number; range: number; curve: 'linear' | 'custom' };
  audio: {
    sampleRate: string;
    sampleRates: string[];
    buffer: string;
    buffers: string[];
    inputs: { name: string; type: 'line' | 'instrument' | 'high' ; types: string[]; gain: number; level: number; linked?: boolean; phantom?: boolean }[];
    outputs: { name: string; level: number; source: string; sources: string[] }[];
    clock: string;
    clocks: string[];
    latency?: string;
  };
  midi: { ports: MidiPort[]; externalSync?: boolean };
  /** The two pedal and CV jacks, and the other ports, by name. */
  jacks: Record<string, Jack>;
  preferences: Record<string, { value: string; choices: string[] }>;
  software: {
    version: string;
    licence: string;
    authorized: boolean;
    usageData: boolean;
    update?: { version: string; state: 'available' | 'downloading' | 'installing' | 'ready'; progress?: number };
    /** A code and an address to show for authorization, Cloud, crash reports or pairing. */
    code?: { purpose: 'authorize' | 'cloud' | 'crash-reports' | 'pair'; code: string; address: string };
  };
  /** What the Volume encoder can control, and what it does now. */
  volumeTarget: string;
  volumeTargets: string[];
  /** The level the Volume encoder controls, 0 to 1, and how the app words it. */
  volume: { value: number; display: string };
}

/** The whole Set, as the app gives it. The device never changes it. */
export interface PushSet {
  unit: Unit;
  transport: Transport;
  /** Audio, MIDI and group tracks, in order. A group's children follow it and name it as `parent`. */
  tracks: Track[];
  returns: Track[];
  main: Track;
  scenes: Scene[];
  selection: {
    /** The selected track's id (a track, a return or the Main track). */
    track: string;
    scene: number;
    /** The selected device's id on that track, if any. */
    device?: string;
  };
  scale: ScaleSettings;
  browser: Browser;
  sets: PushSetFile[];
  packs: Pack[];
  lessons: Lesson[];
  /** Pitches sounding now from the clip or from outside, to light on the grid. */
  sounding?: number[];
  /** Where the Session Ring of another controller is, if the app shares one. */
  ring?: { track: number; scene: number };
  /** Lamps the app sets in User Mode, by control. */
  userLamps?: Record<ControlId, Lamp>;
}

/* ---------------------------------------------------------------- the input */

export type InputKind =
  | 'down' // a button, a pad (with `velocity`), a pressed encoder, a pedal
  | 'up'
  | 'turn' // an encoder or the jog wheel, `value` steps (positive: clockwise)
  | 'touch' // an encoder's cap or the touch strip (with `value`, 0 at the bottom to 1)
  | 'release'
  | 'move' // the touch strip, `value` 0 to 1
  | 'nudge' // the jog wheel pushed sideways: `value` -1 left, 1 right
  | 'pressure' // a held pad, `value` 0 to 1
  | 'slide' // a held pad, `value` 0 at the bottom to 1 at the top
  | 'bend' // a held pad, `value` in pads sideways from where it was pressed
  | 'tick'; // time passing with nothing touched; `control` is empty

/** One thing a person did. Time comes with it, in milliseconds on any steady clock. */
export interface PushInput {
  control: ControlId;
  kind: InputKind;
  time: number;
  value?: number;
  /** A pad's strike, 1 to 127, after the sensitivity curve. */
  velocity?: number;
}

/* --------------------------------------------------------------- the intent */

/** The six kinds of thing the device can ask of the app. */
export type IntentKind = 'note' | 'edit' | 'transport' | 'navigate' | 'file' | 'setting';

/** What the device asks. `action` is one of the published names (`intents.ts`); the rest names what it is asked of. */
export interface PushIntent {
  kind: IntentKind;
  action: string;
  [detail: string]: unknown;
}

/* ------------------------------------------------------------ the projection */

export type LampState = 'off' | 'dim' | 'lit' | 'pulse' | 'blink';

/** A colour that means a state, taken from the pack's meaning colours, so a pack can restate it. */
export type LampMeaning = 'white' | 'play' | 'record' | 'select' | 'solo' | 'mute' | 'queue' | 'accent' | 'warn' | 'stop' | 'root' | 'note';

/** A control's lamp: a state, and a colour where the unit's lamp has colour (a table index or a meaning). */
export interface Lamp {
  state: LampState;
  colour?: number | LampMeaning;
  /** A derived version of the colour. Default `lit`. */
  shade?: LampShade;
}

/** A cell of the display's top or bottom row, over or under one display button. */
export interface RowCell {
  label: string;
  /** A lamp index or a meaning; the display button's lamp takes it too. */
  colour?: number | LampMeaning;
  /** The chosen one: a solid block. */
  selected?: boolean;
  /** Shown greyed: muted, off, or not available. */
  dim?: boolean;
  icon?: 'midi' | 'audio' | 'group' | 'return' | 'main' | 'instrument' | 'effect' | 'midi-effect' | 'rack' | 'drum-rack' | 'folder' | 'left' | 'right' | 'close' | 'plus' | 'check';
  /** The armed circle. */
  armed?: boolean;
  /** A playing clip's progress, 0 to 1. */
  progress?: number;
  /** An unfolded group or Rack: an underline across its children. */
  fold?: 'open' | 'child' | 'end';
  /** The lamp its display button shows, when not just lit in `colour`. */
  lamp?: Lamp;
}

/** A parameter on the display. */
export interface ParamCell {
  type: 'param';
  name: string;
  value: string;
  unit?: string;
  fraction: number;
  style: 'arc' | 'bipolar' | 'bar' | 'switch' | 'choice';
  choices?: string[];
  chosen?: number;
  colour?: number | LampMeaning;
  touched?: boolean;
  disabled?: boolean;
  automated?: boolean;
  overridden?: boolean;
  /** Show the value large (a touched parameter, a notice). */
  large?: boolean;
}

export interface ListItem {
  id: string;
  label: string;
  /** The mark at the row's end: a chevron for a folder, a tag, a count. */
  mark?: string;
  disabled?: boolean;
  colour?: number;
}

/** A list with a highlight, as the browser's columns and the menus are. */
export interface ListCell {
  type: 'list';
  label: string;
  items: ListItem[];
  chosen?: string;
  /** Rows exist above or below what is shown. */
  more?: { above: boolean; below: boolean };
  loading?: boolean;
  /** A column the highlight has passed through: its chosen row is dimmer. */
  enclosing?: boolean;
}

export interface TextCell {
  type: 'text';
  text: string;
  size?: 'label' | 'value' | 'large';
  tone?: 'normal' | 'dim' | 'warn';
  colour?: number | LampMeaning;
  align?: 'start' | 'centre';
}

export interface TraceCell {
  type: 'trace';
  drawing: Drawing;
  colour?: number | LampMeaning;
}

export interface MeterCell {
  type: 'meter';
  /** The track the frame reader has levels for. */
  track: string;
  name: string;
  value: string;
  fraction: number;
  colour?: number;
  dim?: boolean;
  touched?: boolean;
}

export interface RollCell {
  type: 'roll';
  /** Pitches shown, highest first. */
  pitches: number[];
  notes: { id: string; pitch: number; start: number; length: number; velocity: number; colour?: number; selected?: boolean; highlighted?: boolean; muted?: boolean }[];
  from: number;
  to: number;
  beatsPerBar: number;
  loop?: [number, number];
  /** The part of the clip the pads sequence, in beats and pitches. */
  box?: { from: number; to: number; low: number; high: number };
  /** Notes per pitch, for the strip beside the roll. */
  density?: number[];
  /** Whose playhead the frame reader moves. */
  track?: string;
  colour?: number;
}

export interface GridCell {
  type: 'grid';
  /** Rows of clips: a name and a colour, or an empty slot. */
  rows: ({ label: string; colour?: number; state?: ClipState; selected?: boolean } | null)[][];
  labels?: string[];
}

export type BodyContent = ParamCell | ListCell | TextCell | TraceCell | MeterCell | RollCell | GridCell;

/** One thing in the display's body: what it is, the first column it covers (1 to 8) and how many. */
export type BodyCell = BodyContent & { col: number; span?: number };

export type Overlay =
  | { type: 'notice'; text: string; value?: string }
  | { type: 'confirm'; text: string; yes: string; no: string }
  | { type: 'dialog'; title: string; code?: string; address?: string; text?: string }
  | { type: 'text-entry'; title: string; text: string; caret: number; characters: string[]; highlighted: number }
  | { type: 'battery'; percent: number; charging: boolean; low?: boolean }
  | { type: 'count-in'; fraction: number }
  | { type: 'progress'; label: string; fraction: number };

/** What the display shows: plain data a renderer draws without knowing the mode. */
export interface Screen {
  /** Which screen this is ("device", "mix-global", "browse"). `blank` shows nothing at all. */
  kind: string;
  /** Eight cells over the upper display buttons, and eight under the lower ones. */
  top: (RowCell | null)[];
  bottom: (RowCell | null)[];
  body: BodyCell[];
  overlays: Overlay[];
  /** An X in the top right corner: the last upper display button leaves the screen. */
  close?: boolean;
  /** Arrows at the row's ends: more to the left or right. */
  paging?: { top?: { left: boolean; right: boolean }; bottom?: { left: boolean; right: boolean } };
}

/** What a pad plays when struck, by pad id: a pitch, or nothing. The surface's input store reads it for glissando. */
export type PadNotes = Record<ControlId, number | null>;

/**
 * The touch strip's lamps: a centre mark and the bend (`value` -1 to 1), a level from the bottom
 * (`value` 0 to 1), or the part in view among all of it (`from` and `to`, 0 at the bottom to 1).
 */
export type StripLamps = { kind: 'off' } | { kind: 'bend'; value: number } | { kind: 'level'; value: number } | { kind: 'range'; from: number; to: number };

export interface Projection {
  lamps: Record<ControlId, Lamp>;
  strip: StripLamps;
  screen: Screen;
  notes: PadNotes;
}

/* ---------------------------------------------------------------- the state */

export type DisplayMode = 'device' | 'mix' | 'clip' | 'session' | 'browse' | 'sets' | 'setup' | 'learn';
export type PadMode = 'note' | 'session';

/** A control that is down: when, whether a combination used it, and whether its hold job has begun. */
export interface Held {
  at: number;
  used?: boolean;
  holding?: boolean;
  /** A pad's strike. */
  velocity?: number;
  /** A pad's pitch when it went down, so its release names the same note. */
  note?: number;
}

/** A place in a list: the path of ids chosen so far and the highlighted row in the last column. */
export interface ListPlace {
  path: string[];
  highlight: number;
}

/**
 * Everything the device remembers that is not in the Set. The app holds it and passes it back.
 * Each mode's own part is optional and made on first use, so an old state still reads.
 */
export interface PushState {
  /** What the display shows and what the pads do: kept apart. */
  display: DisplayMode;
  pads: PadMode;
  /** User Mode: the device asks nothing of the Set. `before` is where it returns to. */
  user: boolean;
  /** Every control that is down, by id. */
  held: Record<ControlId, Held>;
  /** Encoders being touched. */
  touched: ControlId[];
  /** The last press that finished, for double presses. */
  last?: { control: ControlId; at: number };
  /** A note to show over the screen until a time. */
  notice?: { text: string; value?: string; until: number };
  /** A Pedal 1 tap waiting to see whether a second follows. */
  pedalTap?: number;
  /** A mode a held button is visiting, and the one to return to. */
  momentary?: { pads?: PadMode; display?: DisplayMode };
  /** An action tied to the lower display buttons by Lock. */
  lock?: 'mute' | 'solo' | 'stop-clip';
  /** A question on the display, and what answering yes asks. */
  confirm?: { text: string; yes: PushIntent };
  /** Text being entered, and what it is for. */
  textEntry?: { title: string; text: string; highlighted: number; then: PushIntent };
  /** Colours offered on the pads, for a track, a clip or a drum pad. */
  colourPick?: { of: 'track' | 'clip' | 'pad'; track?: string; scene?: number; note?: number };
  /** The Scale menu is open. */
  scaleMenu?: boolean;
  /** Mix View. */
  mix: { mode: 'global' | 'track'; parameter: number; page: number; io?: boolean };
  /** Device View: the bank shown per device, what is unfolded, and its modes. */
  device: { banks: Record<string, number>; unfolded: string[]; chain?: Record<string, string>; macroMap?: boolean; macroEdit?: number; page: number; edit?: boolean };
  /** Clip View. */
  clip: { noteEdit?: boolean; highlighted?: string; selected: string[]; zoomAt?: number; audioEdit?: boolean };
  /** The Session window's top left, shared by the pads and the display, and the overview. */
  session: { track: number; scene: number; overview?: boolean; overviewLocked?: boolean; sceneNames?: boolean; workflow: 'scene' | 'clip' };
  /** The note grid: octave per track, layout per track. */
  notes: { octave: Record<string, number>; layout: Record<string, string>; shift: number };
  /** Drum layouts: the bank's lowest note per track, the velocity pad chosen, the borrowed quarter. */
  drums: { base: Record<string, number>; borrow?: 'held' | 'locked' };
  /** The sequencers: step size, the page in view, whether it follows, what is selected. */
  seq: { step: number; page: number; follow: boolean; pageCopied?: number; selected?: number[]; rowBase: Record<string, number>; loopRow?: boolean; stepCopied?: number; velocity?: number };
  /** Repeat and Accent, per track where the manual says so. */
  repeat: { on: boolean; interval: number };
  accent: boolean;
  /** Track selection's own scroll: the first track in the bottom row. */
  trackPage: number;
  /** The browser and the lists like it. */
  browse: ListPlace & { hotSwap?: boolean; target?: 'device' | 'track' | 'pad'; places: Record<string, ListPlace> };
  sets: { highlight: number; sort: 'date' | 'name'; menu?: boolean };
  setup: { tab: number; highlight: number; advanced?: boolean; network?: string };
  learn: { highlight: number; lesson?: string; step?: number };
  /** Track options (Shift and a track's button). */
  trackOptions?: string;
  /** The Volume and the Swing & Tempo encoders' own modes. */
  tempoMode: 'tempo' | 'swing';
}
