// How the model is put together (design D3): layers, highest first. A layer takes an input or
// passes it down, and paints the lamps and screen parts it owns. A layer's combinations (a held
// button and another control) are data: the list a developer reads is the table the layers
// dispatch on, so the two cannot drift.
import { CONTROLS, control, padAt, type Control } from './layout';
import { DOUBLE_MS, HOLD_MS } from './timing';
import type { IntentAction } from './intents';
import { ask } from './intents';
import type { ControlId, InputKind, Lamp, Overlay, PadNotes, PushInput, PushIntent, PushSet, PushState, Screen, StripLamps } from './types';

/** One step in progress. `state` is a copy the layers change in place. */
export interface Ctx {
  state: PushState;
  set: PushSet;
  input: PushInput;
  intents: PushIntent[];
  /** The control the input names, when the surface has it. */
  target?: Control;
  /** The id of the combination that took this input, for the trace. */
  combo?: string;
}

/** One projection in progress: layers paint from the lowest up, so a higher one overwrites. */
export interface Paint {
  state: PushState;
  set: PushSet;
  lamps: Record<ControlId, Lamp>;
  screen: Screen;
  notes: PadNotes;
  strip: StripLamps;
}

/** What a combination's `press` may name besides one control's id: any control of a class. */
export type PressClass = 'pad' | 'upper' | 'lower' | 'scene' | 'encoder' | 'any-encoder';

export interface Combo {
  id: string;
  /** The buttons held, in any order. */
  hold: ControlId[];
  /** The control pressed with them: an id, or a class of controls. */
  press: ControlId | PressClass;
  /** What happens to it. Default: it goes down. */
  kind?: InputKind;
  /** Where it applies, in words. */
  mode: string;
  /** What it asks, in words. */
  asks: string;
  /** Whether it applies now. */
  when?(ctx: Ctx): boolean;
  run(ctx: Ctx): void;
  /** A state and Set in which it applies and a control to press, for the reachability test and the docs. */
  example?: { press: ControlId; value?: number; state?(state: PushState, set: PushSet): void; set?(set: PushSet): void };
}

export interface Layer {
  name: string;
  /** Whether the layer is in effect. Default: always. */
  active?(state: PushState, set: PushSet): boolean;
  /** It takes the device over while it is in effect (a unit that is off, User Mode, a dialog): no combination of a layer under it applies. */
  modal?: boolean;
  combos?: Combo[];
  /** Take the input (true) or pass it down (false). */
  step?(ctx: Ctx): boolean;
  paint?(paint: Paint): void;
}

/** Buttons with a press job and a hold job: the hold job begins after the hold time. */
export const HOLD_BUTTONS = ['metronome', 'quantize', 'fixed-length', 'layout', 'repeat', 'accent', 'session', 'note'] as const;

/* ---------- what a layer asks about the input ---------- */

export const push = (ctx: Ctx, action: IntentAction, detail: Record<string, unknown> = {}) => void ctx.intents.push(ask(action, detail));

export const isDown = (ctx: Ctx, id?: ControlId) => ctx.input.kind === 'down' && (id === undefined || ctx.input.control === id);
export const isUp = (ctx: Ctx, id?: ControlId) => ctx.input.kind === 'up' && (id === undefined || ctx.input.control === id);

/** Whether a button is down now (other than by this very input going up). */
export const holding = (state: PushState, id: ControlId) => id in state.held;
export const shift = (ctx: Ctx) => holding(ctx.state, 'shift');

/**
 * A button's own press, for a button that can also be held with another control: true when it
 * comes up without having been used in a combination and without its hold job having begun.
 */
export function pressed(ctx: Ctx, id: ControlId): boolean {
  if (!isUp(ctx, id)) return false;
  const held = ctx.state.held[id];
  return !!held && !held.used && !held.holding;
}

/** Whether a hold button's hold job is running. */
export const holdJob = (state: PushState, id: ControlId) => state.held[id]?.holding === true;

/** Whether this press is the second of a double press. */
export const isDouble = (ctx: Ctx) => ctx.input.kind === 'down' && ctx.state.last?.control === ctx.input.control && ctx.input.time - ctx.state.last.at <= DOUBLE_MS;

/** Mark held buttons as used by a combination, so their own press does not also fire. */
export function use(ctx: Ctx, ...ids: ControlId[]) {
  for (const id of ids) if (ctx.state.held[id]) ctx.state.held[id].used = true;
}

/** Whether a control has a hold job: the buttons the manual gives two jobs, and the upper display buttons (a Rack's chains). */
export const canHold = (id: ControlId) => (HOLD_BUTTONS as readonly string[]).includes(id) || id.startsWith('upper-') || id === 'page-left' || id === 'page-right';

/** Begin the hold job of every such button that has been down long enough. */
export function matureHolds(state: PushState, time: number) {
  for (const [id, held] of Object.entries(state.held)) {
    if (canHold(id) && !held.holding && !held.used && time - held.at >= HOLD_MS) held.holding = true;
  }
}

/* ---------- combinations ---------- */

const CLASS: Record<PressClass, (c: Control) => boolean> = {
  pad: (c) => c.kind === 'pad',
  upper: (c) => c.cluster === 'upper',
  lower: (c) => c.cluster === 'lower',
  scene: (c) => c.cluster === 'scenes',
  encoder: (c) => c.cluster === 'encoders',
  'any-encoder': (c) => c.kind === 'encoder' || c.kind === 'wheel',
};

export const pressMatches = (press: string, target: Control) => (press in CLASS ? CLASS[press as PressClass](target) : press === target.id);

/** The first control a combination's `press` names. */
export const firstOf = (press: string): Control | undefined => (press in CLASS ? CONTROLS.find(CLASS[press as PressClass]) : control(press));

/**
 * The combination among `combos` that this input performs: its buttons are all held, no other
 * button that any combination holds is down, it names this control and this kind of input, and
 * it applies now.
 */
export function findCombo(ctx: Ctx, combos: readonly Combo[], modifiers: ReadonlySet<string>): Combo | undefined {
  const { target, input, state } = ctx;
  if (!target) return undefined;
  const down = Object.keys(state.held).filter((id) => modifiers.has(id) && id !== input.control);
  if (down.length === 0) return undefined;
  return combos.find(
    (c) =>
      (c.kind ?? 'down') === input.kind &&
      c.hold.length === down.length &&
      c.hold.every((id) => down.includes(id)) &&
      pressMatches(c.press, target) &&
      (c.when?.(ctx) ?? true),
  );
}

/* ---------- lamps ---------- */

export const OFF: Lamp = { state: 'off' };
export const DIM: Lamp = { state: 'dim' };
export const LIT: Lamp = { state: 'lit' };
export const lamp = (state: Lamp['state'], colour?: Lamp['colour'], shade?: Lamp['shade']): Lamp => ({ state, ...(colour === undefined ? {} : { colour }), ...(shade ? { shade } : {}) });

/** Lit when `on`, dim when it can be chosen, unlit when `available` is false. */
export const choice = (on: boolean, available = true, colour?: Lamp['colour']): Lamp => (!available ? OFF : lamp(on ? 'lit' : 'dim', colour));

/* ---------- screens ---------- */

export const emptyRow = (): null[] => [null, null, null, null, null, null, null, null];
export const screen = (kind: string, more: Partial<Screen> = {}): Screen => ({ kind, top: emptyRow(), bottom: emptyRow(), body: [], overlays: [], ...more });

export const overlay = (paint: Paint, o: Overlay) => void paint.screen.overlays.push(o);

/** A pad's row and column, 1 to 8 from the top left. */
export { padAt };
