// The buttons that mean the same everywhere: transport, undo, the buttons that choose what the
// display shows and what the pads do, and the pedals. Shift and Select do nothing alone.
import { PEDAL_DOUBLE_MS, POWER_HOLD_MS } from '../timing';
import { choice, DIM, isDown, lamp, pressed, push, screen, type Combo, type Ctx, type Layer } from '../engine';
import type { DisplayMode, PushSet } from '../types';
import { padMode } from './modes';

/** User Mode needs a computer running Live: it is offered in Control Mode only. */
export const userModeAvailable = (set: PushSet) => set.unit.mode === 'control';

const SCREEN_BUTTONS: Record<string, DisplayMode> = { device: 'device', mix: 'mix', clip: 'clip', 'session-screen': 'session' };
const MENU_BUTTONS: Record<string, DisplayMode> = { sets: 'sets', setup: 'setup', learn: 'learn' };

/** What the Record button asks. Pedal 1's tap asks the same. */
export function recordJob(ctx: Ctx) {
  push(ctx, 'record');
}

/** What the New button asks. Pedal 1's double tap asks the same. */
export function newJob(ctx: Ctx) {
  push(ctx, 'new-clip', { track: ctx.set.selection.track });
}

const combos: Combo[] = [
  {
    id: 'shift+undo',
    hold: ['shift'],
    press: 'undo',
    mode: 'Any',
    asks: 'Redo the last undone change',
    run: (ctx) => push(ctx, 'redo'),
    example: { press: 'undo' },
  },
];

export const global: Layer = {
  name: 'global',
  combos,
  step(ctx) {
    const { input, state, set } = ctx;
    const id = input.control;

    // Pedal 1: one tap is Record, a quick second tap is New instead. The first tap waits out the
    // double-tap time before it acts, so a double tap never also records.
    // The power button, held for its time, asks to switch the unit off: once, while still held.
    const power = state.held.power;
    if (power && !power.used && input.time - power.at >= POWER_HOLD_MS && (input.kind === 'tick' || id === 'power')) {
      power.used = true;
      push(ctx, 'power', { on: false });
    }
    if (id === 'power') return true;
    if (input.kind === 'tick') {
      if (state.pedalTap !== undefined && input.time - state.pedalTap >= PEDAL_DOUBLE_MS) {
        delete state.pedalTap;
        recordJob(ctx);
      }
      return true;
    }
    if (id === 'pedal-1') {
      if (input.kind !== 'down') return true;
      if (state.pedalTap !== undefined && input.time - state.pedalTap < PEDAL_DOUBLE_MS) {
        delete state.pedalTap;
        newJob(ctx);
      } else {
        if (state.pedalTap !== undefined) recordJob(ctx); // a slow second tap: the first was a tap of its own
        state.pedalTap = input.time;
      }
      return true;
    }
    if (id === 'pedal-2') {
      if (input.kind === 'down' || input.kind === 'up') push(ctx, 'sustain', { down: input.kind === 'down' });
      return true;
    }

    if (id === 'shift' || id === 'select') return true;

    if (isDown(ctx, 'play')) {
      push(ctx, set.transport.playing ? 'stop' : 'play');
      return true;
    }
    if (isDown(ctx, 'undo')) {
      push(ctx, 'undo');
      return true;
    }
    if (isDown(ctx) && id in SCREEN_BUTTONS) {
      const next = SCREEN_BUTTONS[id];
      // Mix pressed again steps between its two modes.
      if (next === 'mix' && state.display === 'mix') state.mix.mode = state.mix.mode === 'global' ? 'track' : 'global';
      state.display = next;
      return true;
    }
    if (isDown(ctx) && id in MENU_BUTTONS) {
      const next = MENU_BUTTONS[id];
      if (state.display === next) state.display = state.momentary?.display ?? 'device';
      else {
        if (!(state.display in { sets: 1, setup: 1, learn: 1 })) state.momentary = { ...state.momentary, display: state.display };
        state.display = next;
      }
      return true;
    }
    if (isDown(ctx, 'user')) {
      if (userModeAvailable(set)) state.user = true;
      return true;
    }
    // Note and Session: a quick press switches the pads for good; held, the other mode visits.
    if (id === 'note' || id === 'session') {
      if (pressed(ctx, id)) state.pads = id;
      return true;
    }
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const { transport } = set;
    lamps.play = lamp(transport.playing ? 'lit' : 'dim', 'play');
    lamps.undo = transport.canUndo || transport.canRedo ? DIM : { state: 'off' };
    for (const [id, mode] of Object.entries(SCREEN_BUTTONS)) lamps[id] = choice(state.display === mode);
    for (const [id, mode] of Object.entries(MENU_BUTTONS)) lamps[id] = choice(state.display === mode);
    lamps.user = choice(false, userModeAvailable(set));
    const pads = padMode(state);
    lamps.note = choice(pads === 'note');
    lamps.session = choice(pads === 'session');
    paint.screen = screen(state.display);
  },
};
