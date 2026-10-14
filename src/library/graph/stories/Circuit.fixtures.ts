// Sample circuits for the Circuit workflow stories: plain, JSON-safe `Circuit` data, each one
// valid (`validate(c)` returns `[]`). No React here. Every field the first pass of the Graph view
// can't draw yet (buses, pin placement, routing, trace labels, zones, controls, layout) is still
// written, so the data says what the drawing should one day be.
import type { HueSlot } from '../../components/core/hue';
import type { Param } from '../../components/core/Param/param';
import type { Chip, Circuit, Module, Pin, Trace } from '../model/circuit';

/** A kind's colour slot: a hue (`--hue-n`), or a role hue for a sample with more kinds than hues. */
export type KindInk = HueSlot | 'role-1' | 'role-2';

/** Each pin and trace kind's colour slot: the host's choice, not the model's. */
export const KIND_HUE: Record<string, KindInk> = {
  // patch
  audio: 1,
  mod: 2,
  // diffusion: six kinds, so the two that ride alongside (the VAE and the image) take the role hues
  model: 1,
  clip: 2,
  conditioning: 3,
  latent: 4,
  vae: 'role-1',
  image: 'role-2',
  // session, root
  flow: 1,
  fail: 4,
  // tdd
  spec: 1,
  code: 2,
  test: 3,
  result: 4,
  // brain
  thread: 1,
  context: 3,
  blocks: 4,
};

/** A display name per chip type, for chips that don't carry their own `name`. */
export const TYPE_NAMES: Record<string, string> = {
  osc: 'Osc',
  lfo: 'LFO',
  filter: 'Filter',
  out: 'Out',
  checkpoint: 'Load checkpoint',
  prompt: 'Prompt',
  'empty-latent': 'Empty latent',
  ksampler: 'KSampler',
  'vae-encode': 'VAE encode',
  'vae-decode': 'VAE decode',
  'upscale-sampler': 'Upscale sampler',
  reroute: 'Reroute',
  upscale: 'Upscale',
  preview: 'Preview',
  'save-image': 'Save image',
  stage: 'Stage',
  agent: 'Agent',
  thread: 'Thread',
  assistant: 'Assistant',
  context: 'Context',
  root: 'Root',
};

/** The range and units of each numeric param, by param name. A param not listed is drawn 0–1. */
export const PARAM_SPECS: Record<string, Param> = {
  pitch: { kind: 'float', min: -24, max: 24, defaultValue: 0, unit: 'semitones', name: 'Pitch' },
  detune: { kind: 'float', min: 0, max: 1, defaultValue: 0, name: 'Detune' },
  level: { kind: 'float', min: 0, max: 1, defaultValue: 0.8, name: 'Level' },
  cutoff: { kind: 'float', min: 0, max: 1, defaultValue: 0.5, name: 'Cutoff' },
  res: { kind: 'float', min: 0, max: 1, defaultValue: 0.2, name: 'Resonance', shortName: 'Res' },
  drive: { kind: 'float', min: 0, max: 1, defaultValue: 0, name: 'Drive' },
  rate: { kind: 'float', min: 0.05, max: 20, defaultValue: 1, unit: 'hertz', exponent: 2, name: 'Rate' },
  volume: { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Volume' },
  seed: { kind: 'int', min: 0, max: 9999, defaultValue: 0, name: 'Seed' },
  steps: { kind: 'int', min: 1, max: 80, defaultValue: 20, name: 'Steps' },
  cfg: { kind: 'float', min: 1, max: 20, defaultValue: 7, name: 'CFG' },
  denoise: { kind: 'float', min: 0, max: 1, defaultValue: 1, name: 'Denoise' },
  scale: { kind: 'float', min: 1, max: 4, defaultValue: 2, name: 'Scale' },
  width: { kind: 'int', min: 256, max: 2048, defaultValue: 1024, name: 'Width' },
  height: { kind: 'int', min: 256, max: 2048, defaultValue: 1024, name: 'Height' },
  batch: { kind: 'int', min: 1, max: 8, defaultValue: 1, name: 'Batch' },
};

// ---------------------------------------------------------------------------------------------
// Small builders: they only spell plain objects.

const inPin = (id: string, kind?: string, more: Partial<Pin> = {}): Pin => ({ id, side: 'in', ...(kind ? { kind } : {}), ...more });
const outPin = (id: string, kind?: string, more: Partial<Pin> = {}): Pin => ({ id, side: 'out', ...(kind ? { kind } : {}), ...more });
const wire = (id: string, from: string, to: string, more: Partial<Trace> = {}): Trace => {
  const [fc, fp] = from.split('.');
  const [tc, tp] = to.split('.');
  return { id, from: { chip: fc, pin: fp }, to: { chip: tc, pin: tp }, ...more };
};
const mod = (m: Partial<Module> & { id: string }): Module => ({ chips: [], traces: [], inPins: [], outPins: [], ...m });

// ---------------------------------------------------------------------------------------------
// patch: oscillator → filter → out, an LFO modulating the filter's cutoff.

export const patch: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    board: mod({
      id: 'board',
      layout: 'lr',
      chips: [
        { id: 'osc', type: 'osc', x: 0, y: 24, pins: [outPin('out', 'audio', { label: 'Out' })], params: { wave: 'saw', pitch: 0, detune: 0.1, level: 0.8 } },
        { id: 'lfo', type: 'lfo', x: 0, y: 220, pins: [outPin('out', 'mod', { label: 'Out' })], params: { rate: 2.5, shape: 'sine' } },
        {
          id: 'filter',
          type: 'filter',
          x: 260,
          y: 64,
          pins: [inPin('in', 'audio', { label: 'In' }), inPin('cutoff', 'mod', { label: 'Cutoff', param: true }), outPin('out', 'audio', { label: 'Out' })],
          params: { cutoff: 0.6, res: 0.3, drive: 0.2, mode: 'lowpass' },
        },
        { id: 'out', type: 'out', x: 520, y: 96, pins: [inPin('in', 'audio', { label: 'In' })], params: { volume: -6 } },
      ],
      traces: [
        wire('osc-filter', 'osc.out', 'filter.in', { kind: 'audio' }),
        wire('filter-out', 'filter.out', 'out.in', { kind: 'audio' }),
        wire('lfo-cutoff', 'lfo.out', 'filter.cutoff', { kind: 'mod', role: 'modulation', amount: 0.4 }),
      ],
      controls: [{ id: 'cutoff', label: 'Cutoff', maps: { chip: 'filter', param: 'cutoff' } }],
    }),
  },
};

// ---------------------------------------------------------------------------------------------
// diffusion: a ComfyUI-like graph with a VAE bus and a reusable `upscale` module placed twice.

const upscale = mod({
  id: 'upscale',
  layout: 'lr',
  chips: [
    { id: 'reroute', type: 'reroute', x: -240, y: 170, pins: [inPin('in', 'vae'), outPin('out', 'vae')] },
    { id: 'encode', type: 'vae-encode', x: 0, y: 0, pins: [inPin('image', 'image', { label: 'Image' }), inPin('vae', 'vae', { label: 'VAE' }), outPin('latent', 'latent', { label: 'Latent' })] },
    {
      id: 'sampler',
      type: 'upscale-sampler',
      x: 240,
      y: 0,
      pins: [inPin('latent', 'latent', { label: 'Latent' }), outPin('latent', 'latent', { label: 'Latent' })],
      params: { scale: 2, denoise: 0.35, steps: 12 },
    },
    { id: 'decode', type: 'vae-decode', x: 480, y: 0, pins: [inPin('latent', 'latent', { label: 'Latent' }), inPin('vae', 'vae', { label: 'VAE' }), outPin('image', 'image', { label: 'Image' })] },
  ],
  traces: [
    wire('vae-encode', 'reroute.out', 'encode.vae', { kind: 'vae' }),
    wire('vae-decode', 'reroute.out', 'decode.vae', { kind: 'vae' }),
    wire('encode-sample', 'encode.latent', 'sampler.latent', { kind: 'latent' }),
    wire('sample-decode', 'sampler.latent', 'decode.latent', { kind: 'latent' }),
  ],
  inPins: [
    { id: 'image', kind: 'image', label: 'Image', maps: { chip: 'encode', pin: 'image' } },
    { id: 'vae', kind: 'vae', label: 'VAE', maps: { chip: 'reroute', pin: 'in' } },
  ],
  outPins: [{ id: 'image', kind: 'image', label: 'Image', maps: { chip: 'decode', pin: 'image' } }],
  controls: [
    { id: 'scale', label: 'Scale', maps: { chip: 'sampler', param: 'scale' } },
    { id: 'denoise', label: 'Denoise', maps: { chip: 'sampler', param: 'denoise' } },
  ],
});

export const diffusion: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    upscale,
    board: mod({
      id: 'board',
      layout: 'lr',
      routing: 'trace',
      zones: [
        { id: 'load', label: 'Load' },
        { id: 'condition', label: 'Condition' },
        { id: 'sample', label: 'Sample' },
        { id: 'finish', label: 'Upscale and save' },
      ],
      buses: [{ id: 'vae', label: 'VAE', kind: 'vae', rail: { axis: 'h' } }],
      chips: [
        {
          id: 'ckpt',
          type: 'checkpoint',
          zone: 'load',
          x: 0,
          y: 120,
          pins: [outPin('model', 'model', { label: 'Model' }), outPin('clip', 'clip', { label: 'CLIP' }), outPin('vae', 'vae', { label: 'VAE' })],
          params: { ckpt: 'sdxl-base-1.0.safetensors' },
        },
        {
          id: 'pos',
          type: 'prompt',
          name: 'Positive',
          zone: 'condition',
          x: 250,
          y: 0,
          pins: [inPin('clip', 'clip', { label: 'CLIP' }), outPin('cond', 'conditioning', { label: 'Cond' })],
          params: { text: 'a lighthouse at dusk, oil painting' },
        },
        {
          id: 'neg',
          type: 'prompt',
          name: 'Negative',
          zone: 'condition',
          x: 250,
          y: 130,
          pins: [inPin('clip', 'clip', { label: 'CLIP' }), outPin('cond', 'conditioning', { label: 'Cond' })],
          params: { text: 'blurry, low quality' },
        },
        {
          id: 'latent',
          type: 'empty-latent',
          zone: 'condition',
          x: 250,
          y: 260,
          pins: [outPin('latent', 'latent', { label: 'Latent' })],
          params: { width: 1024, height: 1024, batch: 1 },
        },
        {
          id: 'sampler',
          type: 'ksampler',
          zone: 'sample',
          x: 500,
          y: 60,
          pins: [
            inPin('model', 'model', { label: 'Model' }),
            inPin('positive', 'conditioning', { label: 'Pos' }),
            inPin('negative', 'conditioning', { label: 'Neg' }),
            inPin('latent', 'latent', { label: 'Latent' }),
            outPin('latent', 'latent', { label: 'Latent' }),
          ],
          params: { seed: 42, steps: 30, cfg: 7, sampler: 'dpmpp_2m', scheduler: 'karras', denoise: 1 },
        },
        {
          id: 'decode',
          type: 'vae-decode',
          zone: 'sample',
          x: 750,
          y: 80,
          pins: [inPin('latent', 'latent', { label: 'Latent' }), inPin('vae', 'vae', { label: 'VAE' }), outPin('image', 'image', { label: 'Image' })],
        },
        { id: 'up1', type: 'upscale', name: 'Upscale ×2', module: 'upscale', zone: 'finish', x: 990, y: 0, pins: [] },
        { id: 'up2', type: 'upscale', name: 'Upscale ×4', module: 'upscale', zone: 'finish', x: 990, y: 200, pins: [] },
        { id: 'preview', type: 'preview', zone: 'finish', x: 1230, y: 0, pins: [inPin('image', 'image', { label: 'Image' })] },
        { id: 'save', type: 'save-image', zone: 'finish', x: 1230, y: 200, pins: [inPin('image', 'image', { label: 'Image' })], params: { prefix: 'lighthouse' } },
      ],
      traces: [
        wire('model', 'ckpt.model', 'sampler.model', { kind: 'model' }),
        wire('clip-pos', 'ckpt.clip', 'pos.clip', { kind: 'clip' }),
        wire('clip-neg', 'ckpt.clip', 'neg.clip', { kind: 'clip' }),
        wire('pos', 'pos.cond', 'sampler.positive', { kind: 'conditioning' }),
        wire('neg', 'neg.cond', 'sampler.negative', { kind: 'conditioning' }),
        wire('empty', 'latent.latent', 'sampler.latent', { kind: 'latent' }),
        wire('sampled', 'sampler.latent', 'decode.latent', { kind: 'latent' }),
        { id: 'vae-source', from: { chip: 'ckpt', pin: 'vae' }, to: { bus: 'vae' }, kind: 'vae' },
        { id: 'vae-decode', from: { bus: 'vae' }, to: { chip: 'decode', pin: 'vae' }, kind: 'vae' },
        { id: 'vae-up1', from: { bus: 'vae' }, to: { chip: 'up1', pin: 'vae' }, kind: 'vae' },
        { id: 'vae-up2', from: { bus: 'vae' }, to: { chip: 'up2', pin: 'vae' }, kind: 'vae' },
        wire('decoded', 'decode.image', 'up1.image', { kind: 'image' }),
        wire('preview', 'up1.image', 'preview.image', { kind: 'image' }),
        wire('again', 'up1.image', 'up2.image', { kind: 'image' }),
        wire('saved', 'up2.image', 'save.image', { kind: 'image' }),
      ],
    }),
  },
};

// ---------------------------------------------------------------------------------------------
// session: the syn job lifecycle, one chip per state, laid out as a meander with pins on the faces
// their neighbours are on, and each check's failure leaving from its own pin.

/** The lifecycle states, in the order a job meets them; each is a chip id in `session`. */
export const SESSION_STATES = [
  'asked',
  'routed',
  'working',
  'checked',
  'tested',
  'committed',
  'reviewed',
  'pr_open',
  'ci',
  'merged',
  'pulled',
  'done',
  'fixing',
  'failed',
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

type Face = 'n' | 'e' | 's' | 'w';

/**
 * A state: an in pin and an out pin on the faces its neighbours are on (the meander turns, so a
 * row that runs right to left has its in pin east), plus any named extra pins.
 */
const stage = (
  id: SessionState,
  x: number,
  y: number,
  faces: { in?: Face; out?: Face },
  params?: Chip['params'],
  extra: Pin[] = [],
): Chip => ({
  id,
  type: 'stage',
  name: id.replace('_', ' '),
  x,
  y,
  pins: [
    ...(faces.in ? [inPin('in', 'flow', { label: 'In', placement: faces.in })] : []),
    ...(faces.out ? [outPin('out', 'flow', { label: 'Out', placement: faces.out })] : []),
    ...extra,
  ],
  ...(params ? { params } : {}),
});
/** A check's way out when it fails: its own pin, so pass and fail leave from different faces. */
const failPin = (face: Face) => outPin('fail', 'fail', { label: 'Fail', placement: face });

// A meander four wide: Work runs left to right, Review comes back right to left, Ship runs out
// again, and Repair stands to the right. Columns leave room for a face at the widest spacing
// (the samples stretch positions by the pack's step).
const COL = 260;
const ROW = 200;
const REPAIR = COL * 4 + 40;

export const session: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    board: mod({
      id: 'board',
      layout: 'free',
      routing: 'trace',
      zones: [
        { id: 'work', label: 'Work' },
        { id: 'review', label: 'Check and review' },
        { id: 'ship', label: 'Ship' },
        { id: 'repair', label: 'Repair' },
      ],
      chips: [
        { ...stage('asked', 0, 0, { out: 'e' }, { from: 'Ryan' }), zone: 'work' },
        { ...stage('routed', COL, 0, { in: 'w', out: 'e' }, { agent: 'orchestrator' }), zone: 'work' },
        {
          ...stage('working', COL * 2, 0, { in: 'w', out: 'e' }, { agent: 'developer', effort: 'medium' }, [
            inPin('retry', 'flow', { label: 'Retry', placement: { face: 'n', at: 0.7 } }),
          ]),
          zone: 'work',
        },
        { ...stage('checked', COL * 3, 0, { in: 'w', out: 's' }, { check: 'npm run typecheck' }, [failPin('e')]), zone: 'work' },
        { ...stage('tested', COL * 3, ROW, { in: 'n', out: 'w' }, { check: 'npx vitest run' }, [failPin('e')]), zone: 'review' },
        { ...stage('committed', COL * 2, ROW, { in: 'e', out: 'w' }, { branch: 'lane' }), zone: 'review' },
        { ...stage('reviewed', COL, ROW, { in: 'e', out: 'w' }, { agent: 'reviewer' }, [failPin('s')]), zone: 'review' },
        { ...stage('pr_open', 0, ROW, { in: 'e', out: 's' }, { automerge: true }), zone: 'review' },
        { ...stage('ci', 0, ROW * 2, { in: 'n', out: 'e' }, { job: 'checks' }, [failPin('s')]), zone: 'ship' },
        { ...stage('merged', COL, ROW * 2, { in: 'w', out: 'e' }), zone: 'ship' },
        { ...stage('pulled', COL * 2, ROW * 2, { in: 'w', out: 'e' }), zone: 'ship' },
        { ...stage('done', COL * 3, ROW * 2, { in: 'w' }), zone: 'ship' },
        {
          ...stage('fixing', REPAIR, ROW * 0.6, { in: 'w' }, { agent: 'quick-fix', attempts: 3 }, [
            outPin('retry', 'flow', { label: 'Retry', placement: 'n' }),
            outPin('give-up', 'fail', { label: 'Give up', placement: 's' }),
          ]),
          zone: 'repair',
        },
        { ...stage('failed', REPAIR, ROW * 1.6, { in: 'n' }), zone: 'repair' },
      ],
      traces: [
        wire('asked-routed', 'asked.out', 'routed.in', { kind: 'flow' }),
        wire('routed-working', 'routed.out', 'working.in', { kind: 'flow' }),
        wire('working-checked', 'working.out', 'checked.in', { kind: 'flow' }),
        wire('checked-tested', 'checked.out', 'tested.in', { kind: 'flow', label: 'pass' }),
        wire('checked-fixing', 'checked.fail', 'fixing.in', { kind: 'fail', label: 'fail' }),
        wire('tested-committed', 'tested.out', 'committed.in', { kind: 'flow', label: 'pass' }),
        wire('tested-fixing', 'tested.fail', 'fixing.in', { kind: 'fail', label: 'fail' }),
        wire('committed-reviewed', 'committed.out', 'reviewed.in', { kind: 'flow' }),
        wire('reviewed-pr', 'reviewed.out', 'pr_open.in', { kind: 'flow', label: 'pass' }),
        wire('reviewed-fixing', 'reviewed.fail', 'fixing.in', { kind: 'fail', label: 'fail' }),
        wire('pr-ci', 'pr_open.out', 'ci.in', { kind: 'flow' }),
        wire('ci-merged', 'ci.out', 'merged.in', { kind: 'flow', label: 'pass' }),
        wire('ci-fixing', 'ci.fail', 'fixing.in', { kind: 'fail', label: 'fail' }),
        wire('merged-pulled', 'merged.out', 'pulled.in', { kind: 'flow' }),
        wire('pulled-done', 'pulled.out', 'done.in', { kind: 'flow' }),
        wire('fixing-working', 'fixing.retry', 'working.retry', { kind: 'flow', label: 'retry' }),
        wire('fixing-failed', 'fixing.give-up', 'failed.in', { kind: 'fail', label: 'give up' }),
      ],
    }),
  },
};

// ---------------------------------------------------------------------------------------------
// tdd: a `tdd` module (contract → developer and test-engineer in parallel → run against each
// other), used inside a `feature` module, which the board places. Three levels of nesting.

const tdd = mod({
  id: 'tdd',
  layout: 'lr',
  zones: [{ id: 'parallel', label: 'In parallel' }],
  chips: [
    { id: 'contract', type: 'agent', name: 'Contract', x: 0, y: 90, pins: [inPin('spec', 'spec', { label: 'Spec' }), outPin('contract', 'spec', { label: 'Contract' })], params: { doc: 'docs/<feature>.md' } },
    {
      id: 'developer',
      type: 'agent',
      name: 'Developer',
      zone: 'parallel',
      x: 250,
      y: 0,
      pins: [inPin('contract', 'spec', { label: 'Contract' }), outPin('code', 'code', { label: 'Code' })],
      params: { agent: 'developer', effort: 'medium' },
    },
    {
      id: 'tester',
      type: 'agent',
      name: 'Test engineer',
      zone: 'parallel',
      x: 250,
      y: 180,
      pins: [inPin('contract', 'spec', { label: 'Contract' }), outPin('tests', 'test', { label: 'Tests' })],
      params: { agent: 'test-engineer' },
    },
    {
      id: 'run',
      type: 'agent',
      name: 'Run against each other',
      x: 500,
      y: 90,
      pins: [inPin('code', 'code', { label: 'Code' }), inPin('tests', 'test', { label: 'Tests' }), outPin('result', 'result', { label: 'Result' })],
      params: { command: 'npx vitest run' },
    },
  ],
  traces: [
    wire('to-dev', 'contract.contract', 'developer.contract', { kind: 'spec' }),
    wire('to-tests', 'contract.contract', 'tester.contract', { kind: 'spec' }),
    wire('code', 'developer.code', 'run.code', { kind: 'code' }),
    wire('tests', 'tester.tests', 'run.tests', { kind: 'test' }),
  ],
  inPins: [{ id: 'spec', kind: 'spec', label: 'Spec', maps: { chip: 'contract', pin: 'spec' } }],
  outPins: [{ id: 'result', kind: 'result', label: 'Result', maps: { chip: 'run', pin: 'result' } }],
});

const feature = mod({
  id: 'feature',
  layout: 'lr',
  chips: [
    { id: 'plan', type: 'agent', name: 'Plan', x: 0, y: 0, pins: [inPin('ask', 'spec', { label: 'Ask' }), outPin('spec', 'spec', { label: 'Spec' })], params: { agent: 'orchestrator' } },
    { id: 'tdd', type: 'tdd', name: 'TDD', module: 'tdd', x: 240, y: 0, pins: [] },
    { id: 'review', type: 'agent', name: 'Review', x: 480, y: 0, pins: [inPin('result', 'result', { label: 'Result' }), outPin('result', 'result', { label: 'Result' })], params: { agent: 'reviewer', model: 'sonnet' } },
    { id: 'merge', type: 'agent', name: 'Merge', x: 720, y: 0, pins: [inPin('result', 'result', { label: 'Result' }), outPin('merged', 'result', { label: 'Merged' })], params: { automerge: true } },
  ],
  traces: [
    wire('spec', 'plan.spec', 'tdd.spec', { kind: 'spec' }),
    wire('result', 'tdd.result', 'review.result', { kind: 'result' }),
    wire('approved', 'review.result', 'merge.result', { kind: 'result', label: 'pass' }),
  ],
  inPins: [{ id: 'ask', kind: 'spec', label: 'Ask', maps: { chip: 'plan', pin: 'ask' } }],
  outPins: [{ id: 'merged', kind: 'result', label: 'Merged', maps: { chip: 'merge', pin: 'merged' } }],
});

export const tddCircuit: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    tdd,
    feature,
    board: mod({
      id: 'board',
      layout: 'lr',
      chips: [
        { id: 'ask', type: 'agent', name: 'Ask', x: 0, y: 0, pins: [outPin('ask', 'spec', { label: 'Ask' })], params: { from: 'Ryan' } },
        { id: 'feature', type: 'feature', name: 'Feature', module: 'feature', x: 240, y: 0, pins: [] },
        { id: 'ship', type: 'agent', name: 'Ship', x: 480, y: 0, pins: [inPin('merged', 'result', { label: 'Merged' })] },
      ],
      traces: [wire('ask', 'ask.ask', 'feature.ask', { kind: 'spec' }), wire('shipped', 'feature.merged', 'ship.merged', { kind: 'result' })],
    }),
  },
};

// ---------------------------------------------------------------------------------------------
// brain: threads that feed, dogfood and block each other, and assistants on a shared context bus.

/** A thread: what it needs on the west, what it gives on the east (or `gives` elsewhere), and a dogfood inlet on top for one that has one. */
const thread = (id: string, name: string, x: number, y: number, status: string, more: { gives?: Pin['placement']; dogfood?: boolean } = {}): Chip => ({
  id,
  type: 'thread',
  name,
  zone: 'threads',
  x,
  y,
  pins: [
    inPin('needs', 'thread', { label: 'Needs' }),
    outPin('gives', 'thread', { label: 'Gives', ...(more.gives ? { placement: more.gives } : {}) }),
    ...(more.dogfood ? [inPin('dogfood', 'thread', { label: 'Dogfood', placement: 'n' as const })] : []),
  ],
  params: { status },
});

const assistant = (id: string, name: string, x: number, y: number, model: string): Chip => ({
  id,
  type: 'assistant',
  name,
  zone: 'assistants',
  x,
  y,
  pins: [inPin('context', 'context', { label: 'Context' }), outPin('work', 'thread', { label: 'Work' })],
  params: { model },
});

export const brain: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    board: mod({
      id: 'board',
      layout: 'free',
      routing: 'trace',
      zones: [
        { id: 'assistants', label: 'Assistants' },
        { id: 'threads', label: 'Threads' },
      ],
      buses: [{ id: 'base-context', label: 'Base context', kind: 'context', rail: { axis: 'v' } }],
      chips: [
        { id: 'lexicon', type: 'context', name: 'Lexicon + CLAUDE.md', x: 0, y: 190, pins: [outPin('context', 'context', { label: 'Context' })], params: { files: 2 } },
        assistant('orchestrator', 'Orchestrator', 250, 40, 'opus'),
        assistant('developer', 'Developer', 250, 190, 'opus'),
        assistant('reviewer', 'Reviewer', 250, 340, 'sonnet'),
        thread('syn', 'syn', 520, 20, 'running', { gives: 's', dogfood: true }),
        thread('zen', 'zen circuit model', 520, 210, 'open', { dogfood: true }),
        thread('visuals', 'visuals', 790, 110, 'waiting'),
        thread('session', 'session machine', 790, 310, 'draft'),
        thread('awesome', 'awesome-claude', 1060, 210, 'open', { gives: 'n' }),
      ],
      traces: [
        { id: 'ctx-source', from: { chip: 'lexicon', pin: 'context' }, to: { bus: 'base-context' }, kind: 'context' },
        { id: 'ctx-orchestrator', from: { bus: 'base-context' }, to: { chip: 'orchestrator', pin: 'context' }, kind: 'context' },
        { id: 'ctx-developer', from: { bus: 'base-context' }, to: { chip: 'developer', pin: 'context' }, kind: 'context' },
        { id: 'ctx-reviewer', from: { bus: 'base-context' }, to: { chip: 'reviewer', pin: 'context' }, kind: 'context' },
        wire('runs-syn', 'orchestrator.work', 'syn.needs', { kind: 'thread', label: 'feeds' }),
        wire('builds-zen', 'developer.work', 'zen.needs', { kind: 'thread', label: 'feeds' }),
        wire('reviews', 'reviewer.work', 'awesome.needs', { kind: 'thread', label: 'feeds' }),
        wire('zen-visuals', 'zen.gives', 'visuals.needs', { kind: 'thread', label: 'feeds' }),
        wire('zen-session', 'zen.gives', 'session.needs', { kind: 'thread', label: 'feeds' }),
        wire('session-awesome', 'session.gives', 'awesome.needs', { kind: 'blocks', label: 'blocks' }),
        wire('awesome-syn', 'awesome.gives', 'syn.dogfood', { kind: 'thread', label: 'dogfoods' }),
        wire('syn-zen', 'syn.gives', 'zen.dogfood', { kind: 'thread', label: 'dogfoods' }),
      ],
    }),
  },
};

// ---------------------------------------------------------------------------------------------
// root: a centre chip whose traces flow outward in every direction, pins placed on the faces
// that point at their other ends. `layout: 'free'`: the radial shape is in the stored positions.

const root = (id: string, name: string, x: number, y: number, pins: Pin[]): Chip => ({ id, type: 'root', name, x, y, pins });

export const rootSystem: Circuit = {
  version: 1,
  board: 'board',
  modules: {
    board: mod({
      id: 'board',
      layout: 'free',
      routing: 'trace',
      chips: [
        root('seed', 'Seed', 400, 280, [
          outPin('n', 'flow', { label: 'N', placement: 'n' }),
          outPin('ne', 'flow', { label: 'NE', placement: { face: 'n', at: 0.85 } }),
          outPin('e', 'flow', { label: 'E', placement: 'e' }),
          outPin('s', 'flow', { label: 'S', placement: 's' }),
          outPin('w', 'flow', { label: 'W', placement: 'w' }),
          outPin('sw', 'flow', { label: 'SW', placement: { face: 's', at: 0.15 } }),
        ]),
        root('shoot', 'Shoot', 400, 40, [inPin('in', 'flow', { placement: 's' })]),
        root('branch', 'Branch', 660, 90, [inPin('in', 'flow', { placement: { face: 'w', at: 0.7 } })]),
        root('lateral-e', 'Lateral east', 700, 280, [inPin('in', 'flow', { placement: 'w' })]),
        root('taproot', 'Taproot', 400, 500, [inPin('in', 'flow', { placement: 'n' }), outPin('out', 'flow', { placement: 'e' })]),
        root('tip', 'Tip', 640, 560, [inPin('in', 'flow', { placement: 'w' })]),
        root('lateral-w', 'Lateral west', 80, 280, [inPin('in', 'flow', { placement: 'e' })]),
        root('hair', 'Root hair', 140, 470, [inPin('in', 'flow', { placement: { x: 1, y: 0 } })]),
      ],
      traces: [
        wire('up', 'seed.n', 'shoot.in', { kind: 'flow' }),
        wire('up-right', 'seed.ne', 'branch.in', { kind: 'flow' }),
        wire('right', 'seed.e', 'lateral-e.in', { kind: 'flow' }),
        wire('down', 'seed.s', 'taproot.in', { kind: 'flow' }),
        wire('left', 'seed.w', 'lateral-w.in', { kind: 'flow' }),
        wire('down-left', 'seed.sw', 'hair.in', { kind: 'flow' }),
        wire('deeper', 'taproot.out', 'tip.in', { kind: 'flow' }),
      ],
    }),
  },
};

/** Every sample, by story. */
export const CIRCUITS = { patch, diffusion, session, tdd: tddCircuit, brain, root: rootSystem } as const;
