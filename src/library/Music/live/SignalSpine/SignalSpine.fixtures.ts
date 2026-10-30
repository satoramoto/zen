// SignalSpine's stories as plain props: SignalSpine.stories.tsx draws them with React's or Svelte's
// `Tree`. Keys: a Keystation in, an arp, an SF2 piano, an 8-bar loop with three layers (the middle
// one muted), a dotted-eighth delay, out to the mains and an in-ear.
import { defineFixtures } from '../../../fixtures';
import type { SignalSpineProps, SpineLayer, SpineStage, SpineTrack } from './SignalSpine.model';

export const spineTracks: readonly SpineTrack[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', source: 'pads' },
  { id: 'bass', name: 'Bass', ink: 'bass', source: 'in 5 · bus' },
  { id: 'keys', name: 'Keys', ink: 'piano', source: 'bus → arp' },
  { id: 'vox', name: 'Vox', ink: 'vocals', source: 'mic 3' },
  { id: 'gtr', name: 'Gtr', ink: 'guitar', source: 'in 4' },
  { id: 'perc', name: 'Perc', ink: 'drums', source: 'pads' },
  { id: 'syn', name: 'Syn', ink: 'other', source: 'chance' },
  { id: 'fx', name: 'FX', ink: 'other', source: 'resample' },
];

const keys = spineTracks[2];

export const keysChain: readonly SpineStage[] = [
  { id: 'input', title: 'Input', value: 'MIDI · Keystation', options: ['audio · in 1/2', 'chord bus', 'resample'] },
  {
    id: 'gen',
    title: 'Generator',
    value: 'Arp · up-down',
    options: ['euclid', 'chance', 'chord player'],
    params: [
      { name: 'rate', value: '1/16' },
      { name: 'gate', value: '60%', amount: 0.6 },
      { name: 'oct', value: '2' },
    ],
  },
  {
    id: 'inst',
    title: 'Instrument',
    value: 'SF2 · E.Piano 2',
    options: ['AU plugin', 'MIDI out', 'none'],
    params: [
      { name: 'tone', value: '42%', amount: 0.42 },
      { name: 'rel', value: '0.8 s', amount: 0.3 },
    ],
  },
  {
    id: 'looper',
    title: 'Looper',
    value: 'MIDI loop · 8 bars',
    options: ['audio loop'],
    params: [
      { name: 'sync', value: 'clock' },
      { name: 'quant', value: 'bar' },
      { name: 'fb', value: '100%', amount: 1 },
    ],
  },
  {
    id: 'fx',
    title: 'FX',
    value: 'Delay 1/8d',
    options: ['plate → send B', 'none'],
    params: [
      { name: 'fb', value: '35%', amount: 0.35 },
      { name: 'mix', value: '22%', amount: 0.22 },
    ],
  },
];

export const keysLayers: readonly SpineLayer[] = [
  { id: 'l1', kind: 'base', at: '0:00' },
  { id: 'l2', kind: 'dub', at: '0:18', muted: true },
  { id: 'l3', kind: 'dub', at: '0:32' },
];

/** Keys at bar 3 of its 8-bar loop. */
export const signalSpineBoard: SignalSpineProps = { track: keys, chain: keysChain, layers: keysLayers, loopBars: 8, beat: 10.5, outs: ['Main L/R', 'IEM 2'], level: 0.62 };

/** Vox: the mic straight in, no generator or instrument (both thru), a long loop with five layers. */
const voxChain: readonly SpineStage[] = [
  { id: 'input', title: 'Input', value: 'audio · mic 3', options: ['MIDI', 'resample'], params: [{ name: 'gain', value: '+12 dB', amount: 0.7 }] },
  { id: 'gen', title: 'Generator', value: 'none', options: ['arp', 'euclid', 'chance'], bypass: true },
  { id: 'inst', title: 'Instrument', value: 'none', options: ['SF2', 'AU plugin'], bypass: true },
  { ...keysChain[3], value: 'audio loop · 4 bars', options: ['MIDI loop'] },
  { id: 'fx', title: 'FX', value: 'Plate', options: ['delay', 'none'], params: [{ name: 'size', value: '70%', amount: 0.7 }, { name: 'mix', value: '30%', amount: 0.3 }] },
];
const voxLayers: readonly SpineLayer[] = [
  { id: 'v1', kind: 'base', at: '1:04' },
  { id: 'v2', kind: 'dub', at: '1:12' },
  { id: 'v3', kind: 'dub', at: '1:20', muted: true },
  { id: 'v4', kind: 'dub', at: '1:28' },
  { id: 'v5', kind: 'dub', at: '1:36', muted: true },
];

/** The controls, the same in both Storybooks. */
export const signalSpineArgTypes = {
  track: { control: 'object' },
  chain: { control: 'object' },
  layers: { control: 'object' },
  loopBars: { control: { type: 'number', min: 1 } },
  beat: { control: { type: 'range', min: 0, max: 64, step: 0.25 } },
  outs: { control: 'object' },
  level: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  form: { control: 'inline-radio', options: ['chain', 'column'] },
  onPrev: { control: false },
  onNext: { control: false },
  onStage: { control: false },
  onUndo: { control: false },
  onMuteLayer: { control: false },
  onParam: { control: false },
  onLevel: { control: false },
} as const;

/** Every story's args by export name. */
export const signalSpineStories = defineFixtures<SignalSpineProps>()({
  Default: { args: signalSpineBoard },
  /** Bypassed stages, base and dubs with two muted, knobs and readings, a hot level. */
  EveryState: { args: { track: spineTracks[3], chain: voxChain, layers: voxLayers, loopBars: 4, beat: 5.75, outs: ['Main L/R', 'IEM 1', 'IEM 2'], level: 0.88 } },
  /** Only the base take: nothing to peel. */
  BaseOnly: { args: { ...signalSpineBoard, layers: keysLayers.slice(0, 1), beat: 2 } },
  Dense: { args: { ...signalSpineBoard, form: 'column' } },
  /** Nothing caught yet: the looper's rings empty, no level. */
  Empty: { args: { track: keys, chain: keysChain, layers: [], loopBars: 8, beat: 0, level: 0 } },
  Disabled: { args: signalSpineBoard },
});
