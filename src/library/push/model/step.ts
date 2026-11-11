// The model's first pure function: one input, with the state and the Set, gives the next state and
// what the device asks (openspec: push-device-model). Nothing else is read and nothing else is
// changed: time comes with the input, and the Set is never touched.
import { control } from './layout';
import { canHold, findCombo, matureHolds, use, type Ctx } from './engine';
import { LAYERS } from './layers';
import { copyState } from './state';
import { HOLD_MS, PEDAL_DOUBLE_MS, POWER_HOLD_MS } from './timing';
import type { InputKind, PushInput, PushIntent, PushSet, PushState } from './types';

export interface StepResult {
  state: PushState;
  intents: PushIntent[];
}

const KINDS: ReadonlySet<InputKind> = new Set(['down', 'up', 'turn', 'touch', 'release', 'move', 'nudge', 'pressure', 'slide', 'bend', 'tick']);
/** Inputs that are not on the face: the two pedal jacks and the power button on the back. */
const PEDALS = new Set(['pedal-1', 'pedal-2', 'power']);

/** Every button some combination holds: only these make a held set. */
const MODIFIERS: ReadonlySet<string> = new Set(LAYERS.flatMap((l) => l.combos ?? []).flatMap((c) => c.hold));

/** Whether the model can read this input: a known kind, a time, and a control the surface has. */
export function readable(input: unknown): input is PushInput {
  if (typeof input !== 'object' || input === null) return false;
  const { control: id, kind, time } = input as Partial<PushInput>;
  if (typeof kind !== 'string' || !KINDS.has(kind as InputKind) || typeof time !== 'number' || !Number.isFinite(time)) return false;
  if (kind === 'tick') return true;
  return typeof id === 'string' && (control(id) !== undefined || PEDALS.has(id));
}

/** `step`, also saying which combination took the input (for the combination list's own test). */
export function stepTraced(state: PushState, set: PushSet, input: PushInput): StepResult & { combo?: string } {
  if (!readable(input)) return { state, intents: [] };
  const ctx: Ctx = { state: copyState(state), set, input, intents: [], target: control(input.control) };
  const next = ctx.state;
  const id = input.control;

  matureHolds(next, input.time);
  if (next.notice && input.time >= next.notice.until) delete next.notice;

  if (input.kind === 'down') {
    // A pad or scene button pressed while Note or Session is held makes that hold a visit at once.
    if (ctx.target && (ctx.target.kind === 'pad' || ctx.target.cluster === 'scenes')) for (const mode of ['note', 'session']) if (next.held[mode]) next.held[mode].holding = true;
    next.held[id] = { at: input.time, ...(input.velocity === undefined ? {} : { velocity: input.velocity }) };
  }
  if (input.kind === 'touch' && !next.touched.includes(id)) next.touched.push(id);

  for (const layer of LAYERS) {
    if (layer.active && !layer.active(next, set)) continue;
    const combo = layer.combos ? findCombo(ctx, layer.combos, MODIFIERS) : undefined;
    if (combo) {
      // The held buttons were modifiers, and the control pressed with them did the combination's
      // job: none of them also does its own when it comes up.
      use(ctx, ...combo.hold, id);
      combo.run(ctx);
      ctx.combo = combo.id;
      break;
    }
    if (layer.step?.(ctx)) break;
  }

  if (input.kind === 'up') delete next.held[id];
  if (input.kind === 'release') next.touched = next.touched.filter((t) => t !== id);
  if (input.kind === 'down') next.last = { control: id, at: input.time };
  return { state: next, intents: ctx.intents, ...(ctx.combo ? { combo: ctx.combo } : {}) };
}

/** One input: the next state and the intents. Pure. */
export function step(state: PushState, set: PushSet, input: PushInput): StepResult {
  const { state: next, intents } = stepTraced(state, set, input);
  return { state: next, intents };
}

/**
 * The next time the state changes by itself (a hold maturing, a notice ending, a pedal tap
 * settling), or undefined when it will not. Whoever holds the state gives the model a `tick` then.
 */
export function nextTick(state: PushState): number | undefined {
  const times: number[] = [];
  for (const [id, held] of Object.entries(state.held)) if (canHold(id) && !held.holding && !held.used) times.push(held.at + HOLD_MS);
  if (state.notice) times.push(state.notice.until);
  if (state.pedalTap !== undefined) times.push(state.pedalTap + PEDAL_DOUBLE_MS);
  if (state.held.power && !state.held.power.used) times.push(state.held.power.at + POWER_HOLD_MS);
  return times.length ? Math.min(...times) : undefined;
}

/** A tick at a time. */
export const tick = (time: number): PushInput => ({ control: '', kind: 'tick', time });
