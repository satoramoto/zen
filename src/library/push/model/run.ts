// The scripted runner (openspec: push-device-model, "The model can be scripted"): a list of inputs
// in, and after each one the intents, the lamps and the screen description, as data. No renderer,
// no browser, no clock: a script gives its own times.
import { project } from './project';
import { initialState } from './state';
import { step } from './step';
import type { InputKind, Projection, PushInput, PushIntent, PushSet, PushState } from './types';

export interface RunStep extends Projection {
  input: PushInput;
  state: PushState;
  intents: PushIntent[];
}

/**
 * Applies `inputs` in order from `state` over `set`. `apply`, when given, is the app: it takes
 * each intent and returns the Set that results (or the same one, refusing it).
 */
export function run(set: PushSet, inputs: readonly PushInput[], state: PushState = initialState(), apply?: (set: PushSet, intent: PushIntent) => PushSet): RunStep[] {
  const out: RunStep[] = [];
  let current = state;
  let now = set;
  for (const input of inputs) {
    const result = step(current, now, input);
    current = result.state;
    if (apply) for (const intent of result.intents) now = apply(now, intent);
    out.push({ input, state: current, intents: result.intents, ...project(current, now) });
  }
  return out;
}

/** A script written short: `press('play', 0)` is a down and an up, `hold`, `turn` and the rest one input each. */
export const input = (control: string, kind: InputKind, time: number, more: Partial<PushInput> = {}): PushInput => ({ control, kind, time, ...more });
export const press = (control: string, time: number, length = 50, more: Partial<PushInput> = {}): PushInput[] => [input(control, 'down', time, more), input(control, 'up', time + length)];
export const turn = (control: string, steps: number, time: number): PushInput => input(control, 'turn', time, { value: steps });
