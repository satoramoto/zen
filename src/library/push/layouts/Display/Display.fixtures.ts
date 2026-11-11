// Display's stories as plain props: each is a `Screen` description written by hand, so the display
// is shown drawing data, not a mode. Display.stories.tsx draws them with either renderer's `Tree`,
// and the tree snapshot prints each.
import { defineFixtures } from '../../../fixtures';
import type { BodyCell, ParamCell, RowCell, Screen } from '../../model/types';
import type { DisplayModelProps } from './Display.model';

const row = (cells: (RowCell | null)[]): (RowCell | null)[] => Array.from({ length: 8 }, (_, i) => cells[i] ?? null);
const screen = (kind: string, more: Partial<Screen> = {}): Screen => ({ kind, top: row([]), bottom: row([]), body: [], overlays: [], ...more });

/** The track row of a Set with six tracks and two returns: track 2 selected, 5 armed, 2 playing. */
export const TRACKS: (RowCell | null)[] = [
  { label: 'Drums', colour: 14, icon: 'drum-rack' },
  { label: 'Bass', colour: 26, icon: 'midi', selected: true, progress: 0.5 },
  { label: 'Keys', colour: 8, icon: 'rack' },
  { label: 'Vocals', colour: 3, icon: 'audio', dim: true },
  { label: 'Guitar', colour: 17, icon: 'audio', armed: true },
  { label: 'Synths', colour: 10, icon: 'group', fold: 'open' },
  { label: 'A Reverb', colour: 36, icon: 'return' },
  { label: 'B Delay', colour: 37, icon: 'return' },
];

const p = (col: number, name: string, value: string, fraction: number, more: Partial<ParamCell> = {}): BodyCell => ({ type: 'param', col, name, value, fraction, style: 'arc', colour: 26, ...more });

/** One of each kind of parameter, on a pink track. */
export const parameters = screen('device', {
  top: row([{ label: 'Oscillator', colour: 26 }, { label: 'Filter', colour: 26, selected: true }, { label: 'Envelope', colour: 26 }, { label: 'LFO', colour: 26 }]),
  bottom: TRACKS,
  body: [
    p(1, 'Frequency', '20.0', 1, { unit: ' kHz' }),
    p(2, 'Pan', 'C', 0.5, { style: 'bipolar' }),
    p(3, 'Type', 'Band-pass', 0.66, { style: 'choice', choices: ['Low-pass', 'High-pass', 'Band-pass', 'Notch'], chosen: 2 }),
    p(4, 'Retrig', 'On', 1, { style: 'switch' }),
    p(5, 'Level', '-6.0 dB', 0.75, { style: 'bar' }),
    p(6, 'Resonance', '35', 0.35, { unit: ' %', touched: true }),
    p(7, 'Drive', '2.4 dB', 0.2, { disabled: true }),
    p(8, 'Env Amount', '40', 0.7, { style: 'bipolar', automated: true }),
  ],
});

/** A drawing across four columns, its parameters still under their own encoders. */
export const spanning = screen('device', {
  top: row([{ label: 'Oscillator', colour: 20, selected: true }, { label: 'Filter', colour: 20 }]),
  bottom: TRACKS,
  body: [
    p(1, 'Octave', '0', 0.5, { style: 'bipolar', colour: 20 }),
    { type: 'trace', col: 2, span: 4, colour: 20, drawing: { kind: 'oscillator', col: 2, span: 4, label: 'Oscillator shape', points: Array.from({ length: 33 }, (_, i) => [i / 32, (i % 16) / 16] as [number, number]) } },
    p(6, 'Noise', '10 %', 0.1, { colour: 20 }),
    p(7, 'Sub', '40 %', 0.4, { colour: 20 }),
    p(8, 'Level', '-3.0 dB', 0.8, { colour: 20 }),
  ],
});

const items = (names: string[], folders = true) => names.map((name) => ({ id: name.toLowerCase(), label: name, ...(folders ? { mark: '›' } : {}) }));

/** A menu three columns deep: the enclosing menus stay in their columns, each with its choice marked. */
export const menu = screen('browse', {
  top: row([{ label: '', icon: 'close' }, null, null, null, null, null, { label: 'Preview', selected: true }, { label: 'Load' }]),
  body: [
    { type: 'list', col: 1, span: 2, label: 'Add', items: items(['Sounds', 'Drums', 'Instruments', 'Audio Effects', 'MIDI Effects', 'Max for Live', 'Clips', 'Samples', 'Packs', 'User Library']), chosen: 'sounds', enclosing: true },
    { type: 'list', col: 3, span: 2, label: 'Sounds', items: items(['Bass', 'Piano & Keys', 'Pad', 'Synth Lead']), chosen: 'bass', enclosing: true },
    { type: 'list', col: 5, span: 2, label: 'Bass', items: items(['Sub Bass', 'Acid Bass', 'Reese Bass'], false), chosen: 'acid bass' },
    { type: 'list', col: 7, span: 2, label: 'Synth Lead', items: [], loading: true },
  ],
});

/** A long list: the highlight is near the end, so the list has scrolled to keep it in view. */
export const longList = screen('sets', {
  top: row([{ label: '', icon: 'close' }]),
  body: [{ type: 'list', col: 1, span: 4, label: 'Sets', items: Array.from({ length: 14 }, (_, i) => ({ id: `set-${i + 1}`, label: `Set ${i + 1}`, mark: i === 2 ? 'Cloud' : undefined })), chosen: 'set-12' }],
});

export const noClip = screen('clip', { bottom: TRACKS, body: [{ type: 'text', col: 1, span: 8, text: 'No Clip', size: 'value', align: 'centre', tone: 'dim' }] });

const withOverlay = (overlays: Screen['overlays']): Screen => ({ ...parameters, overlays });

export const displayStories = defineFixtures<DisplayModelProps>()({
  /** One of each kind of parameter, with the tab row above and the track row below. */
  Parameters: { args: { screen: parameters } },
  /** A drawing spanning columns 2 to 5. */
  Spanning: { args: { screen: spanning } },
  /** A menu with its enclosing menus as columns and a folder still loading. */
  Menu: { args: { screen: menu } },
  /** A list scrolled to its highlight. */
  LongList: { args: { screen: longList } },
  /** A named empty state. */
  NoClip: { args: { screen: noClip } },
  /** A notice over the screen. */
  Notice: { args: { screen: withOverlay([{ type: 'notice', text: 'Tempo', value: '120.00 BPM' }]) } },
  /** A confirmation. */
  Confirm: { args: { screen: withOverlay([{ type: 'confirm', text: 'Delete “Sketch 14”?', yes: 'Delete', no: 'Cancel' }]) } },
  /** A dialog with a code and an address. */
  Dialog: { args: { screen: withOverlay([{ type: 'dialog', title: 'Pair this Push', text: 'Enter this code in Live.', code: '481 205', address: 'ableton.com/push' }]) } },
  /** Text entry: the text with its cursor, and the characters with one highlighted. */
  TextEntry: {
    args: {
      screen: {
        ...screen('text-entry', { top: row([{ label: '', icon: 'close' }, null, null, null, null, { label: 'Delete' }, { label: 'Space' }, { label: 'Done', icon: 'check' }]) }),
        overlays: [{ type: 'text-entry', title: 'Rename Set', text: 'Night Drive', caret: 5, characters: [...'abcdefghijklmnopqrstuvwxyz0123456789 '], highlighted: 10 }],
      },
    },
  },
  /** The status marks: a low battery, a count-in and a long task. */
  Status: { args: { screen: withOverlay([{ type: 'battery', percent: 5, charging: false, low: true }, { type: 'count-in', fraction: 0.5 }, { type: 'progress', label: 'Downloading Grand Piano', fraction: 0.4 }]) } },
  /** A setting's ways of showing a choice, a picture in place of a dial, and switches and a pair of options over the buttons. */
  Settings: {
    args: {
      screen: screen('setup', {
        top: row([{ label: 'Filter', icon: 'left', selected: true }, { label: 'Track', icon: 'switch-on' }, { label: 'Sync', icon: 'switch-off', dim: true }, { label: 'Trigger', options: ['Trigger', 'Gate'], chosen: 1 }]),
        bottom: row([{ label: 'Status' }, { label: 'Expression', selected: true }]),
        body: [
          { type: 'param', col: 1, span: 2, name: 'Expression Mode', value: 'MPE', fraction: 0, style: 'choice', layout: 'stack', choices: ['MPE', 'Poly Aftertouch', 'Mono Aftertouch'], chosen: 0 },
          { type: 'param', col: 3, name: 'Note Pitch Bend', value: 'On', fraction: 0, style: 'choice', layout: 'list', choices: ['Automatic', 'On', 'Off'], chosen: 1 },
          { type: 'param', col: 4, name: 'In Tune Location', value: 'Finger', fraction: 0, style: 'choice', choices: ['Finger', 'Pad'], chosen: 0, picture: 'finger' },
          { type: 'param', col: 5, name: 'In Tune Width', value: '10 mm', fraction: 0.5, style: 'arc', picture: 'width' },
          { type: 'param', col: 6, name: 'Shape', value: 'Saw', fraction: 0, style: 'choice', layout: 'single', choices: ['Sine', 'Saw'], chosen: 1, colour: 26 },
          { type: 'param', col: 7, span: 2, name: 'Mode', value: 'Classic', fraction: 0, style: 'value', choices: ['Classic', 'One-Shot', 'Slicing'], chosen: 0, colour: 26 },
        ],
      }),
    },
  },
  /** An address as a code to scan: beside a lesson's words, and in a dialog beside its text. */
  Code: {
    args: {
      screen: screen('lesson', {
        top: row([{ label: '', icon: 'close' }, { label: 'A tour of Push', selected: true }]),
        body: [{ type: 'text', col: 1, span: 5, text: 'The pads play notes and launch clips.', size: 'value' }, { type: 'code', col: 6, text: 'https://example.com/learn' }, { type: 'text', col: 7, span: 2, text: 'More at https://example.com/learn' }],
      }),
    },
  },
  CodeDialog: { args: { screen: withOverlay([{ type: 'dialog', title: 'Authorize this Push', code: '481 205', address: 'https://example.com/authorize', image: true }]) } },
  /** The unit is off: nothing at all. */
  Blank: { args: { screen: screen('blank') } },
  /** The display's light turned down. */
  LowLight: { args: { screen: parameters, light: 30 } },
  /** The dark ground off: the display follows the pack's mode. */
  FollowsMode: { args: { screen: parameters, dark: false } },
});
