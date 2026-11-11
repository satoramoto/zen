// A sample Set: enough of everything for the stories, the tests and the emulator's first run. It
// is a function, so every caller gets its own copy to change. Nothing here is special to the
// model: it is what an app would give.
import type { Bank, BrowserItem, Clip, Device, DrumPad, Note, Parameter, PushSet, Scene, Track, Unit } from './types';

const db = (v: number) => (v <= 0 ? '-inf dB' : `${(v * 76 - 70).toFixed(1)} dB`);
const pct = (v: number) => `${Math.round(v * 100)} %`;

/** A parameter. `display` defaults to a percentage. */
export function param(id: string, name: string, value: number, display: string = pct(value), more: Partial<Parameter> = {}): Parameter {
  return { id, name, value, display, kind: 'continuous', ...more };
}
const sw = (id: string, name: string, on: boolean): Parameter => ({ id, name, value: on ? 1 : 0, display: on ? 'On' : 'Off', kind: 'switch' });
const pick = (id: string, name: string, choices: string[], chosen: number): Parameter => ({ id, name, value: choices.length > 1 ? chosen / (choices.length - 1) : 0, display: choices[chosen], kind: 'choice', choices });
const pan = (id: string, value = 0.5): Parameter => ({ id, name: 'Pan', value, display: value === 0.5 ? 'C' : value < 0.5 ? `${Math.round((0.5 - value) * 100)}L` : `${Math.round((value - 0.5) * 100)}R`, kind: 'bipolar' });

/** Peaks of a made-up sample: a decaying wave, the same every time. */
export const peaks = (n = 240, seed = 1): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const env = Math.exp((-3 * i) / n) * (0.6 + 0.4 * Math.abs(Math.sin(i * 0.37 * seed)));
    const a = Math.abs(Math.sin(i * 0.9 * seed + seed)) * env;
    return [0.5 - a / 2, 0.5 + a / 2] as [number, number];
  });

const bank = (name: string, parameters: (Parameter | null)[], drawing?: Bank['drawing']): Bank => ({ name, parameters, ...(drawing ? { drawing } : {}) });

function synth(id: string, name: string): Device {
  const p = (key: string, label: string, v: number, d?: string, more?: Partial<Parameter>) => param(`${id}.${key}`, label, v, d, more);
  return {
    id,
    name,
    kind: 'instrument',
    on: true,
    mpe: true,
    preset: 'Warm Keys',
    banks: [
      bank('Oscillator', [pick(`${id}.wave`, 'Shape', ['Sine', 'Triangle', 'Saw', 'Square'], 2), p('octave', 'Octave', 0.5, '0', { kind: 'bipolar' }), p('detune', 'Detune', 0.5, '0 ct', { kind: 'bipolar' }), p('noise', 'Noise', 0.1), p('sub', 'Sub', 0.4), p('glide', 'Glide', 0, '0 ms'), sw(`${id}.retrig`, 'Retrig', true), p('level', 'Level', 0.8, '-3.0 dB')],
        { kind: 'oscillator', col: 1, span: 2, points: Array.from({ length: 33 }, (_, i) => [i / 32, (i % 16) / 16] as [number, number]) }),
      bank('Filter', [pick(`${id}.ftype`, 'Type', ['Low-pass', 'High-pass', 'Band-pass', 'Notch'], 0), p('cutoff', 'Frequency', 0.62, '1.20 kHz', { automated: true }), p('res', 'Resonance', 0.35), p('drive', 'Drive', 0.2, '2.4 dB'), p('fenv', 'Env Amount', 0.7, '40', { kind: 'bipolar' }), p('track', 'Key Track', 0.5), null, null],
        { kind: 'filter', col: 2, span: 2, points: [[0, 0.6], [0.5, 0.6], [0.6, 0.85], [0.66, 0.5], [0.8, 0.1], [1, 0]] }),
      bank('Envelope', [p('attack', 'Attack', 0.05, '4 ms'), p('decay', 'Decay', 0.4, '600 ms'), p('sustain', 'Sustain', 0.7, '-3.0 dB'), p('release', 'Release', 0.3, '250 ms'), null, null, p('vel', 'Vel > Vol', 0.5), p('volume', 'Volume', 0.75, '-6.0 dB')],
        { kind: 'envelope', col: 1, span: 4, points: [[0, 0], [0.05, 1], [0.35, 0.7], [0.7, 0.7], [1, 0]] }),
      bank('LFO', [pick(`${id}.lshape`, 'Shape', ['Sine', 'Triangle', 'Saw', 'Square', 'Random'], 0), p('rate', 'Rate', 0.3, '1/8', { disabled: false }), sw(`${id}.sync`, 'Sync', true), p('lamt', 'Amount', 0.2), p('phase', 'Phase', 0, '0°'), null, null, null]),
    ],
  };
}

const effect = (id: string, name: string, banks: Bank[], more: Partial<Device> = {}): Device => ({ id, name, kind: 'audio-effect', on: true, banks, ...more });

const reverb = (id: string) => effect(id, 'Reverb', [bank('Reverb', [param(`${id}.decay`, 'Decay', 0.5, '2.50 s'), param(`${id}.size`, 'Size', 0.6), param(`${id}.pre`, 'Predelay', 0.1, '12 ms'), param(`${id}.hi`, 'High Cut', 0.7, '6.0 kHz'), param(`${id}.lo`, 'Low Cut', 0.2, '120 Hz'), param(`${id}.diff`, 'Diffusion', 0.8), param(`${id}.stereo`, 'Stereo', 1), param(`${id}.mix`, 'Dry/Wet', 0.3)])]);
const delay = (id: string) => effect(id, 'Delay', [bank('Delay', [param(`${id}.time`, 'Time', 0.4, '1/8'), sw(`${id}.sync`, 'Sync', true), param(`${id}.fb`, 'Feedback', 0.45), param(`${id}.filter`, 'Filter', 0.5, '1.0 kHz'), null, null, sw(`${id}.ping`, 'Ping Pong', false), param(`${id}.mix`, 'Dry/Wet', 0.25)])]);
const eq = (id: string) => effect(id, 'EQ Eight', [bank('Bands', [param(`${id}.f1`, 'Freq 1', 0.15, '80 Hz'), param(`${id}.g1`, 'Gain 1', 0.5, '0.0 dB', { kind: 'bipolar' }), param(`${id}.f2`, 'Freq 2', 0.4, '400 Hz'), param(`${id}.g2`, 'Gain 2', 0.4, '-2.5 dB', { kind: 'bipolar' }), param(`${id}.f3`, 'Freq 3', 0.7, '3.0 kHz'), param(`${id}.g3`, 'Gain 3', 0.6, '2.0 dB', { kind: 'bipolar' }), param(`${id}.f4`, 'Freq 4', 0.9, '10 kHz'), param(`${id}.g4`, 'Gain 4', 0.5, '0.0 dB', { kind: 'bipolar' })],
  { kind: 'spectrum', col: 1, span: 8, points: Array.from({ length: 41 }, (_, i) => [i / 40, 0.5 + 0.3 * Math.sin(i / 5) * Math.exp(-i / 40)] as [number, number]) })]);
const compressor = (id: string) => effect(id, 'Compressor', [bank('Compressor', [param(`${id}.thresh`, 'Threshold', 0.6, '-18 dB'), param(`${id}.ratio`, 'Ratio', 0.3, '4 : 1'), param(`${id}.attack`, 'Attack', 0.2, '10 ms'), param(`${id}.release`, 'Release', 0.4, '120 ms'), param(`${id}.knee`, 'Knee', 0.3, '6 dB'), param(`${id}.makeup`, 'Makeup', 0.5, '0.0 dB', { kind: 'bipolar' }), null, param(`${id}.mix`, 'Dry/Wet', 1)],
  { kind: 'gain-reduction', col: 7, span: 1, value: 0.35, label: '-4.2 dB' })]);
const tuner = (id: string) => effect(id, 'Tuner', [bank('Tuner', [null, null, null, null, null, null, null, param(`${id}.ref`, 'Reference', 0.5, '440 Hz')], { kind: 'tuner', col: 1, span: 7, value: -0.12, label: 'A' })]);

const DRUM_NAMES = ['Kick', 'Rim', 'Snare', 'Clap', 'Snare 2', 'Tom Low', 'Hat Closed', 'Tom Mid', 'Hat Pedal', 'Tom High', 'Hat Open', 'Perc', 'Crash', 'Shaker', 'Ride', 'Cowbell'];
const DRUM_KINDS: DrumPad['kind'][] = ['kick', 'perc', 'snare', 'snare', 'snare', 'tom', 'hat', 'tom', 'hat', 'tom', 'hat', 'perc', 'cymbal', 'perc', 'cymbal', 'perc'];
const DRUM_COLOURS = [14, 1, 3, 3, 3, 15, 5, 15, 5, 15, 5, 9, 12, 9, 12, 9];

function simpler(id: string, name: string, mode: 'classic' | 'one-shot' | 'slicing' = 'classic'): Device {
  const p = (key: string, label: string, v: number, d?: string, more?: Partial<Parameter>) => param(`${id}.${key}`, label, v, d, more);
  return {
    id,
    name,
    kind: 'simpler',
    on: true,
    preset: name,
    sampler: { mode, sample: `${name}.wav`, peaks: peaks(240, 2), start: 0.02, end: 0.9, loop: { start: 0.3, end: 0.7, on: mode === 'classic' }, zoom: 0, warped: false, sliceBy: 'transient', slices: [0.02, 0.14, 0.27, 0.4, 0.52, 0.66, 0.78], selectedSlice: 0, playback: 'mono', trigger: 'trigger' },
    banks: [
      bank('Sample', [p('zoom', 'Zoom', 0), p('start', 'Start', 0.02, '0.02'), p('end', 'End', 0.9, '0.90'), pick(`${id}.mode`, 'Mode', ['Classic', 'One-Shot', 'Slicing'], mode === 'classic' ? 0 : mode === 'one-shot' ? 1 : 2), sw(`${id}.warp`, 'Warp', false), p('gain', 'Gain', 0.5, '0.0 dB', { kind: 'bipolar' }), p('transp', 'Transpose', 0.5, '0 st', { kind: 'bipolar' }), p('detune', 'Detune', 0.5, '0 ct', { kind: 'bipolar' })]),
      bank('Filter', [sw(`${id}.fon`, 'Filter', true), p('freq', 'Frequency', 0.8, '8.0 kHz'), p('res', 'Resonance', 0.1), null, null, null, null, p('vol', 'Volume', 0.75, '-6.0 dB')]),
    ],
  };
}

function drumRack(id: string): Device {
  const pads: DrumPad[] = DRUM_NAMES.map((name, i) => ({
    note: 36 + i,
    name,
    colour: DRUM_COLOURS[i],
    kind: DRUM_KINDS[i],
    choke: name.startsWith('Hat') ? 1 : 0,
    transpose: 0,
    devices: [simpler(`${id}.pad${36 + i}`, name, 'one-shot')],
    volume: param(`${id}.pad${36 + i}.volume`, 'Volume', 0.85, db(0.85)),
    pan: pan(`${id}.pad${36 + i}.pan`),
  }));
  // The next bank up has two filled pads and the rest empty.
  for (let i = 16; i < 32; i++) pads.push(i < 18 ? { note: 36 + i, name: `FX ${i - 15}`, colour: 11, kind: 'other', devices: [simpler(`${id}.pad${36 + i}`, `FX ${i - 15}`, 'one-shot')] } : { note: 36 + i, name: '', empty: true });
  return {
    id,
    name: '808 Core Kit',
    kind: 'drum-rack',
    on: true,
    preset: '808 Core Kit',
    pads,
    selectedPad: 36,
    macroCount: 8,
    macros: ['Kick Tune', 'Snare Tune', 'Hat Decay', 'Drive', 'Reverb', 'Delay', 'Filter', 'Volume'].map((name, i) => param(`${id}.macro${i + 1}`, name, 0.5 + (i % 3) * 0.1)),
    variations: ['Clean', 'Driven'],
    variation: 0,
    banks: [],
  };
}

function instrumentRack(id: string): Device {
  const a = synth(`${id}.a`, 'Wavetable');
  const b = synth(`${id}.b`, 'Operator');
  a.banks[1].parameters[1]!.macro = 1;
  a.banks[1].parameters[2]!.macro = 2;
  return {
    id,
    name: 'Layered Keys',
    kind: 'instrument-rack',
    on: true,
    preset: 'Layered Keys',
    macroCount: 8,
    macros: [param(`${id}.macro1`, 'Brightness', 0.62), param(`${id}.macro2`, 'Bite', 0.35), param(`${id}.macro3`, 'Attack', 0.1), param(`${id}.macro4`, 'Release', 0.4), param(`${id}.macro5`, 'Space', 0.3), param(`${id}.macro6`, 'Echo', 0.2), null, param(`${id}.macro8`, 'Volume', 0.8)],
    variations: ['Soft', 'Bright', 'Wide'],
    variation: 1,
    chains: [
      { id: `${id}.chain1`, name: 'Wavetable', colour: 8, devices: [a, reverb(`${id}.a.rev`)] },
      { id: `${id}.chain2`, name: 'Operator', colour: 10, devices: [b] },
    ],
    banks: [],
  };
}

let noteId = 0;
const note = (pitch: number, start: number, length = 0.25, velocity = 100, more: Partial<Note> = {}): Note => ({ id: `n${++noteId}`, pitch, start, length, velocity, ...more });

/** A one-bar drum beat: kick on the beats, snare on two and four, hats on the eighths. */
export const drumBeat = (): Note[] => [
  ...[0, 1, 2, 3].map((b) => note(36, b, 0.25, 110)),
  ...[1, 3].map((b) => note(38, b, 0.25, 100)),
  ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b, i) => note(42, b, 0.25, i % 2 ? 60 : 90)),
];

export const melody = (): Note[] => [note(60, 0, 1, 100), note(64, 1, 0.5, 80), note(67, 1.5, 0.5, 90), note(72, 2, 1, 110), note(71, 3, 0.5, 70), note(67, 3.5, 0.5, 85), note(65, 4, 2, 95), note(64, 6, 2, 60, { muted: true })];

const midiClip = (name: string, colour: number, notes: Note[], length = 4, more: Partial<Clip> = {}): Clip => ({ name, colour, kind: 'midi', state: 'stopped', length, loop: { on: true, start: 0, end: length }, startMarker: 0, notes, ...more });
const audioClip = (name: string, colour: number, length = 8, more: Partial<Clip> = {}): Clip => ({ name, colour, kind: 'audio', state: 'stopped', length, loop: { on: true, start: 0, end: length }, startMarker: 0, audio: { peaks: peaks(240, colour), warp: true, warpMode: 'Beats', gain: 0.5, transpose: 0.5, detune: 0.5, bpm: 120 }, ...more });

const SCENES = 8;
const slots = (filled: Record<number, Clip>): (Clip | null)[] => Array.from({ length: SCENES }, (_, i) => filled[i] ?? null);

function track(id: string, name: string, colour: number, kind: Track['kind'], more: Partial<Track> = {}): Track {
  return {
    id,
    name,
    colour,
    kind,
    volume: param(`${id}.volume`, 'Volume', 0.85, db(0.85)),
    pan: pan(`${id}.pan`),
    sends: [param(`${id}.sendA`, 'A Reverb', 0.2, '-24 dB'), param(`${id}.sendB`, 'B Delay', 0, '-inf dB')],
    routing: {
      inputType: kind === 'audio' ? 'Ext. In' : 'All Ins', inputTypes: kind === 'audio' ? ['Ext. In', 'Resampling', 'No Input'] : ['All Ins', 'Push 3', 'No Input'],
      inputChannel: kind === 'audio' ? '1' : 'All Channels', inputChannels: kind === 'audio' ? ['1', '2', '1/2'] : ['All Channels', 'Ch. 1', 'Ch. 2'],
      outputType: 'Main', outputTypes: ['Main', 'Ext. Out', 'Sends Only'], outputChannel: '1/2', outputChannels: ['1/2', '3/4'], monitor: 'auto',
    },
    devices: [],
    clips: slots({}),
    ...more,
  };
}

function browserTree(): BrowserItem[] {
  const leaf = (id: string, name: string, kind: BrowserItem['kind'], more: Partial<BrowserItem> = {}): BrowserItem => ({ id, name, loadable: true, kind, preview: true, ...more });
  const folder = (id: string, name: string, children?: BrowserItem[], more: Partial<BrowserItem> = {}): BrowserItem => ({ id, name, folder: true, ...(children ? { children } : {}), ...more });
  return [
    folder('sounds', 'Sounds', [
      folder('sounds.bass', 'Bass', [leaf('sounds.bass.sub', 'Sub Bass', 'preset', { favourite: true }), leaf('sounds.bass.acid', 'Acid Bass', 'preset'), leaf('sounds.bass.reese', 'Reese Bass', 'preset', { collections: [14] })]),
      folder('sounds.keys', 'Piano & Keys', [leaf('sounds.keys.warm', 'Warm Keys', 'preset'), leaf('sounds.keys.grand', 'Grand Piano', 'preset'), leaf('sounds.keys.rhodes', 'Electric Piano', 'preset')]),
      folder('sounds.pad', 'Pad', [leaf('sounds.pad.glass', 'Glass Pad', 'preset'), leaf('sounds.pad.slow', 'Slow Motion', 'preset')]),
      folder('sounds.lead', 'Synth Lead'), // not listed yet: it shows as loading
    ]),
    folder('drums', 'Drums', [
      leaf('drums.808', '808 Core Kit', 'drum'), leaf('drums.909', '909 Core Kit', 'drum'), leaf('drums.acoustic', 'Studio Kit', 'drum'),
      folder('drums.hits', 'Drum Hits', [leaf('drums.hits.kick', 'Kick 808', 'sample'), leaf('drums.hits.snare', 'Snare 808', 'sample'), leaf('drums.hits.hat', 'Hat 808', 'sample'), leaf('drums.hits.clap', 'Clap 808', 'sample')]),
    ]),
    folder('instruments', 'Instruments', [
      folder('instruments.wavetable', 'Wavetable', [leaf('instruments.wavetable.default', 'Wavetable', 'instrument', { preview: false }), leaf('instruments.wavetable.warm', 'Warm Keys', 'preset')]),
      leaf('instruments.operator', 'Operator', 'instrument', { preview: false }), leaf('instruments.simpler', 'Simpler', 'instrument', { preview: false }), leaf('instruments.drumrack', 'Drum Rack', 'drum', { preview: false }), leaf('instruments.rack', 'Instrument Rack', 'instrument', { preview: false }),
    ]),
    folder('audio-effects', 'Audio Effects', [leaf('fx.reverb', 'Reverb', 'audio-effect', { preview: false }), leaf('fx.delay', 'Delay', 'audio-effect', { preview: false }), leaf('fx.eq', 'EQ Eight', 'audio-effect', { preview: false }), leaf('fx.comp', 'Compressor', 'audio-effect', { preview: false }), leaf('fx.tuner', 'Tuner', 'audio-effect', { preview: false })]),
    folder('midi-effects', 'MIDI Effects', [leaf('mfx.arp', 'Arpeggiator', 'midi-effect', { preview: false }), leaf('mfx.chord', 'Chord', 'midi-effect', { preview: false }), leaf('mfx.scale', 'Scale', 'midi-effect', { preview: false })]),
    folder('max', 'Max for Live', [leaf('max.lfo', 'LFO', 'max', { preview: false })]),
    folder('clips', 'Clips', [leaf('clips.beat', 'House Beat 120', 'clip'), leaf('clips.bass', 'Bassline 120', 'clip')]),
    folder('samples', 'Samples', [leaf('samples.break', 'Funk Break 98', 'sample'), leaf('samples.vox', 'Vocal Chop', 'sample'), leaf('samples.pad', 'Texture Loop', 'sample')]),
    folder('packs', 'Packs', []),
    folder('user', 'User Library', [leaf('user.mybass', 'My Bass', 'preset', { favourite: true }), folder('user.recordings', 'Recordings', [leaf('user.recordings.take1', 'Take 1', 'sample')])]),
    folder('favourites', 'Favorites', [leaf('sounds.bass.sub', 'Sub Bass', 'preset', { favourite: true }), leaf('user.mybass', 'My Bass', 'preset', { favourite: true })]),
  ];
}

function unit(): Unit {
  return {
    mode: 'standalone',
    power: 'on',
    edition: 'suite',
    processor: true,
    battery: { percent: 72, charging: false },
    adat: false,
    name: 'Push',
    storage: { used: '86 GB', total: '256 GB', fraction: 0.34 },
    ledBrightness: 100,
    displayLight: 100,
    wifi: { on: true, networks: [{ name: 'Studio', strength: 0.9, secured: true, known: true, connected: true }, { name: 'Upstairs', strength: 0.5, secured: true }, { name: 'Cafe', strength: 0.3, secured: false }], address: '192.168.1.42' },
    hotspot: { on: false, name: 'Push-1A2B', password: 'makemusic' },
    expression: { mode: 'mpe', noteBend: 'auto', slideRange: 'full', inTune: 'pad', inTuneWidth: 0.25, trace: false },
    sensitivity: { threshold: 0.2, drive: 0.5, compand: 0.5, range: 1, curve: 'linear' },
    audio: {
      sampleRate: '48000', sampleRates: ['44100', '48000', '88200', '96000'], buffer: '128', buffers: ['64', '128', '256', '512'],
      inputs: [{ name: 'In 1', type: 'line', types: ['Line', 'Instrument', 'High'], gain: 0.3, level: 0.2 }, { name: 'In 2', type: 'line', types: ['Line', 'Instrument', 'High'], gain: 0.3, level: 0.1, linked: false }],
      outputs: [{ name: 'Out 1/2', level: 0.8, source: 'Main', sources: ['Main', 'Cue'] }, { name: 'Phones', level: 0.6, source: 'Main', sources: ['Main', 'Cue'] }],
      clock: 'Internal', clocks: ['Internal', 'ADAT'], latency: '5.3 ms',
    },
    midi: { ports: [{ id: 'din', name: 'MIDI In/Out', input: { track: true, sync: false, remote: false }, output: { track: true, sync: false, remote: false } }, { id: 'usb', name: 'Keystation', input: { track: true, sync: false, remote: true } }], externalSync: false },
    jacks: {
      'In 1': {}, 'In 2': {}, 'Out 1': { plugged: 'cable' }, 'Out 2': { plugged: 'cable' }, Phones: { plugged: 'headphones' }, 'ADAT In': {}, 'ADAT Out': {}, 'MIDI In': {}, 'MIDI Out': {},
      'USB-A': { plugged: 'device' }, 'USB-C': {}, Power: { plugged: 'cable' },
      'Pedal 1': { plugged: 'footswitch', job: 'Record / New', jobs: ['Record / New', 'CV Out'] }, 'Pedal 2': { job: 'Sustain', jobs: ['Sustain', 'CV Out'] },
    },
    preferences: {
      Workflow: { value: 'Scene', choices: ['Scene', 'Clip'] },
      'Exclusive Arm': { value: 'On', choices: ['On', 'Off'] },
      'Exclusive Solo': { value: 'On', choices: ['On', 'Off'] },
      'Pad Preview': { value: 'On', choices: ['On', 'Off'] },
      'Record Count-In': { value: '1 bar', choices: ['none', '1 bar', '2 bars', '4 bars'] },
    },
    software: { version: '12.3', licence: 'Live 12 Suite', authorized: true, usageData: false },
    volumeTarget: 'Main Out', volumeTargets: ['Main Out', 'Phones', 'Main Track', 'Cue'],
    volume: { value: 0.8, display: '-6.0 dB' },
  };
}

const SCENE_NAMES = ['Intro', 'Verse', 'Build', 'Drop', 'Break', 'Verse 2', 'Drop 2', 'Outro'];

/** The sample Set. Standalone, Suite, stopped, the first track selected. */
export function sampleSet(): PushSet {
  noteId = 0;
  const drums = track('t-drums', 'Drums', 14, 'midi', {
    devices: [drumRack('d-kit'), compressor('d-kit-comp')],
    clips: slots({ 0: midiClip('Beat A', 14, drumBeat(), 4), 1: midiClip('Beat B', 15, drumBeat(), 4), 3: midiClip('Fill', 1, drumBeat().slice(0, 6), 4) }),
  });
  const bass = track('t-bass', 'Bass', 22, 'midi', { devices: [synth('d-bass', 'Analog Bass'), eq('d-bass-eq')], clips: slots({ 0: midiClip('Bassline', 22, melody().map((n) => ({ ...n, pitch: n.pitch - 24 })), 8), 2: midiClip('Bass Drop', 23, melody().slice(0, 4), 4) }) });
  const keys = track('t-keys', 'Keys', 8, 'midi', { devices: [instrumentRack('d-keys'), delay('d-keys-delay')], clips: slots({ 1: midiClip('Chords', 8, melody(), 8) }) });
  const sampler = track('t-sampler', 'Sampler', 3, 'midi', { devices: [simpler('d-simpler', 'Funk Break', 'slicing')], clips: slots({}) });
  const vocals = track('t-vocals', 'Vocals', 26, 'audio', { devices: [compressor('d-vox-comp'), reverb('d-vox-rev')], clips: slots({ 1: audioClip('Verse Vox', 26, 16), 3: audioClip('Hook', 12, 8) }) });
  const guitar = track('t-guitar', 'Guitar', 17, 'audio', { devices: [tuner('d-gtr-tuner'), eq('d-gtr-eq')], clips: slots({ 0: audioClip('Riff', 17, 8) }) });
  const group = track('t-synths', 'Synths', 10, 'group', { folded: false, devices: [] });
  const pad = track('t-pad', 'Pad', 9, 'midi', { parent: 't-synths', devices: [synth('d-pad', 'Glass Pad')], clips: slots({ 2: midiClip('Pad Swell', 9, melody().slice(0, 3), 8) }) });
  const lead = track('t-lead', 'Lead', 11, 'midi', { parent: 't-synths', devices: [synth('d-lead', 'Saw Lead')], clips: slots({ 3: midiClip('Lead Line', 11, melody(), 8) }) });
  const fx = track('t-fx', 'FX', 20, 'audio', { clips: slots({ 2: audioClip('Riser', 20, 8), 4: audioClip('Impact', 21, 4) }) });
  const emptyMidi = track('t-empty', 'MIDI 10', 5, 'midi');
  const emptyAudio = track('t-audio', 'Audio 11', 6, 'audio');
  const returns = [track('r-a', 'A Reverb', 36, 'return', { sends: [], devices: [reverb('d-ret-rev')], clips: [] }), track('r-b', 'B Delay', 37, 'return', { sends: [], devices: [delay('d-ret-delay')], clips: [] })];
  const main = track('main', 'Main', 13, 'main', { sends: [], devices: [compressor('d-main-comp')], clips: [], extras: [param('main.cue', 'Cue Volume', 0.7, '-9.0 dB')] });
  const scenes: Scene[] = SCENE_NAMES.map((name) => ({ name }));
  return {
    unit: unit(),
    transport: {
      playing: false, recording: 'off', overdub: false, tempo: 120, swing: 0, beat: 0, signature: [4, 4], metronome: false, countIn: '1 bar', automationArm: false,
      fixedLength: { on: false, bars: '2 Bars', choices: ['1 Beat', '2 Beats', '1 Bar', '2 Bars', '4 Bars', '8 Bars', '16 Bars', '32 Bars'] },
      quantize: { to: '1/16', choices: ['1/4', '1/8', '1/8t', '1/8 + t', '1/16', '1/16t', '1/16 + t', '1/32'], amount: 1, swing: 0, recordTo: 'Off', recordChoices: ['Off', '1/4', '1/8', '1/8t', '1/8 + t', '1/16', '1/16t', '1/16 + t', '1/32'] },
      canUndo: true, canRedo: false, canCapture: false, link: { on: false, peers: 0 }, view: 'session',
    },
    tracks: [drums, bass, keys, sampler, vocals, guitar, group, pad, lead, fx, emptyMidi, emptyAudio],
    returns,
    main,
    scenes,
    selection: { track: 't-drums', scene: 0, device: 'd-kit' },
    scale: { root: 0, scale: 'Major', inKey: true, fixed: false, layout: '4ths' },
    browser: { roots: browserTree(), preview: true, hotSwapPath: ['drums', 'drums.808'] },
    sets: [
      { id: 'set-1', name: 'Night Drive', modified: '2025-09-12', current: true },
      { id: 'set-2', name: 'Sketch 14', modified: '2025-09-10' },
      { id: 'set-3', name: 'Live Set Berlin', modified: '2025-08-30', cloud: true },
      { id: 'set-4', name: 'Ambient Study', modified: '2025-08-02' },
    ],
    packs: [
      { id: 'pack-1', name: 'Drum Essentials', size: '1.2 GB', state: 'installed' },
      { id: 'pack-2', name: 'Synth Essentials', size: '2.1 GB', state: 'available' },
      { id: 'pack-3', name: 'Grand Piano', size: '3.4 GB', state: 'downloading', progress: 0.4 },
      { id: 'pack-4', name: 'Chop and Swing', size: '640 MB', state: 'downloaded' },
    ],
    lessons: [
      { id: 'lesson-1', name: 'A tour of Push', steps: ['The pads', 'The display', 'The encoders'] },
      { id: 'lesson-2', name: 'Make a beat', steps: ['Add a Drum Rack', 'Tap steps', 'Change the loop length'], done: true },
      { id: 'lesson-3', name: 'Play a melody', steps: ['Pick a scale', 'Record a clip'] },
    ],
  };
}

/** What must hold of any Set for the model to read it, as a list of what is wrong. */
export function setProblems(set: PushSet): string[] {
  const problems: string[] = [];
  const all = [...set.tracks, ...set.returns, set.main];
  const ids = all.map((t) => t.id);
  if (new Set(ids).size !== ids.length) problems.push('track ids repeat');
  if (!ids.includes(set.selection.track)) problems.push(`the selected track ${set.selection.track} is not in the Set`);
  if (set.selection.scene < 0 || set.selection.scene >= set.scenes.length) problems.push('the selected scene is not in the Set');
  for (const t of set.tracks) {
    if (t.clips.length !== set.scenes.length) problems.push(`${t.id} has ${t.clips.length} slots for ${set.scenes.length} scenes`);
    if (t.parent && !set.tracks.some((g) => g.id === t.parent && g.kind === 'group')) problems.push(`${t.id}'s group ${t.parent} is missing`);
    if (t.sends.length !== set.returns.length) problems.push(`${t.id} has ${t.sends.length} sends for ${set.returns.length} returns`);
    for (const clip of t.clips) if (clip && (clip.kind === 'midi') !== (t.kind === 'midi')) problems.push(`${t.id} holds a ${clip.kind} clip`);
  }
  const deviceIds: string[] = [];
  const walk = (devices: Device[]) => {
    for (const d of devices) {
      deviceIds.push(d.id);
      for (const b of d.banks) if (b.parameters.length > 8) problems.push(`${d.id}'s bank ${b.name} has more than eight parameters`);
      walk((d.chains ?? []).flatMap((c) => c.devices));
      walk((d.pads ?? []).flatMap((p) => p.devices ?? []));
    }
  };
  for (const t of all) walk(t.devices);
  if (new Set(deviceIds).size !== deviceIds.length) problems.push('device ids repeat');
  for (const p of [...all.flatMap((t) => [t.volume, t.pan, ...t.sends])]) if (p.value < 0 || p.value > 1) problems.push(`${p.id} is outside 0 to 1`);
  return problems;
}
