// Helpers for the model's own tests: run inputs over the sample Set with the stand-in host
// answering, and read what was asked.
import { applyIntent } from './host';
import { run, type RunStep } from './run';
import { sampleSet } from './sample';
import { initialState } from './state';
import type { PushInput, PushIntent, PushSet, PushState } from './types';

export interface Played {
  state: PushState;
  set: PushSet;
  intents: PushIntent[];
  actions: string[];
  steps: RunStep[];
  last: RunStep;
}

/** Applies inputs in order; the stand-in host answers each intent unless `host` is false. */
export function play(inputs: PushInput[], options: { set?: PushSet; state?: PushState; host?: boolean } = {}): Played {
  const start = options.set ?? sampleSet();
  let set = start;
  const steps = run(start, inputs, options.state ?? initialState(), options.host === false ? undefined : (now, intent) => (set = applyIntent(now, intent)));
  const intents = steps.flatMap((s) => s.intents);
  return { state: steps.at(-1)?.state ?? options.state ?? initialState(), set, intents, actions: intents.map((i) => i.action), steps, last: steps.at(-1)! };
}

/** The sample Set with a track selected (and its first device). */
export function setOn(track: string, change: (set: PushSet) => void = () => {}): PushSet {
  const set = sampleSet();
  set.selection.track = track;
  set.selection.device = [...set.tracks, ...set.returns, set.main].find((t) => t.id === track)?.devices[0]?.id;
  change(set);
  return set;
}

let clock = 0;
/** A time later than the last one handed out, for scripts that do not care when. */
export const t = (step = 20) => (clock += step);
export const pad = (row: number, col: number, kind: PushInput['kind'] = 'down', more: Partial<PushInput> = {}): PushInput => ({ control: `pad-${row}-${col}`, kind, time: t(), ...(kind === 'down' ? { velocity: 100 } : {}), ...more });
export const tap = (control: string, more: Partial<PushInput> = {}): PushInput[] => [{ control, kind: 'down', time: t(), ...more }, { control, kind: 'up', time: t() }];
export const hold = (control: string): PushInput => ({ control, kind: 'down', time: t() });
export const release = (control: string): PushInput => ({ control, kind: 'up', time: t() });
export const twist = (control: string, steps: number): PushInput => ({ control, kind: 'turn', time: t(), value: steps });
