// Playing a melodic instrument from the pads: the 64 Notes layout, each pad's expression, the
// octave buttons, the Scale menu, Layout, and the touch strip (openspec: push-note-mode,
// push-pads, push-encoders).
import { padAt, padId, indexOf } from '../layout';
import { KEY_ROWS, NOTE_NAMES, SCALE_NAMES, canShift, gridRange, inScale, isRoot, noteName, padPitch } from '../scales';
import { clamp, selectedTrack } from '../state';
import { STEPS_PER_CHOICE } from '../timing';
import { choice, isDown, lamp, OFF, push, screen, type Combo, type Ctx, type Layer, type Paint } from '../engine';
import type { PushSet, PushState, RowCell, ScaleSettings } from '../types';
import { LAYOUT_NAMES, instrumentKind, layoutsFor, padLayout } from './modes';
import { notify } from './overlays';

const octaveOf = (state: PushState, set: PushSet) => state.notes.octave[selectedTrack(set).id] ?? 0;

/** What a pad plays in the 64 Notes layout. */
const pitchAt = (state: PushState, set: PushSet, row: number, col: number) => padPitch(row, col, set.scale, octaveOf(state, set));

/** A sideways bend, in pads, as semitones from the pad's own note: a straight run from each pad's note to the next one's along the row. */
export function bendSemitones(state: PushState, set: PushSet, row: number, col: number, pads: number): number {
  const at = (c: number) => {
    // Off the grid's edge the row carries on as it was going.
    const inside = clamp(c, 1, 8);
    const edge = pitchAt(state, set, row, inside);
    if (c === inside) return edge;
    const step = inside === 8 ? edge - pitchAt(state, set, row, 7) : pitchAt(state, set, row, 2) - edge;
    return edge + (c - inside) * step;
  };
  const whole = Math.floor(pads);
  const rest = pads - whole;
  const from = at(col + whole);
  return from + (at(col + whole + 1) - from) * rest - at(col);
}

/** Whether a sideways move bends the note: the setting, or on automatic, whether the instrument takes per-note bend. */
function bends(set: PushSet): boolean {
  const { noteBend } = set.unit.expression;
  if (noteBend === 'on') return true;
  if (noteBend === 'off') return false;
  return instrumentKind(selectedTrack(set)).device?.mpe === true;
}

const SCALE_ROWS = 5;

/** The Scale menu: layout and Fixed on the first column, the twelve keys on the buttons, the scales as a list. */
function scaleScreen(paint: Paint) {
  const s = paint.set.scale;
  const key = (root: number): RowCell => ({ label: NOTE_NAMES[root], selected: s.root === root });
  const at = SCALE_NAMES.indexOf(s.scale);
  paint.screen = screen('scale', {
    top: [{ label: s.fixed ? 'Fixed: On' : 'Fixed: Off', selected: s.fixed }, ...KEY_ROWS.upper.map(key), null],
    bottom: [{ label: s.inKey ? 'In Key' : 'Chromatic', selected: true }, ...KEY_ROWS.lower.map(key), null],
    body: [
      { type: 'param', col: 1, name: 'Layout', value: s.layout === 'sequential' ? 'Sequential' : s.layout, fraction: ['4ths', '3rds', 'sequential'].indexOf(s.layout) / 2, style: 'choice', choices: ['4ths', '3rds', 'Sequential'], chosen: ['4ths', '3rds', 'sequential'].indexOf(s.layout) },
      { type: 'list', col: 2, span: 6, label: 'Scale', items: SCALE_NAMES.map((name) => ({ id: name, label: name })), chosen: SCALE_NAMES[Math.max(0, at)] },
    ],
  });
  void SCALE_ROWS;
}

function scaleStep(ctx: Ctx): boolean {
  const { input, state, set, target } = ctx;
  const s = set.scale;
  if (isDown(ctx, 'scale')) {
    state.scaleMenu = false;
    return true;
  }
  if (!target) return false;
  const upper = indexOf(target.id, 'upper');
  const lower = indexOf(target.id, 'lower');
  if (input.kind === 'down' && upper !== undefined) {
    if (upper === 1) push(ctx, 'set-scale', { fixed: !s.fixed });
    else if (upper <= 7) push(ctx, 'set-scale', { root: KEY_ROWS.upper[upper - 2] });
    return true;
  }
  if (input.kind === 'down' && lower !== undefined) {
    if (lower === 1) push(ctx, 'set-scale', { inKey: !s.inKey });
    else if (lower <= 7) push(ctx, 'set-scale', { root: KEY_ROWS.lower[lower - 2] });
    return true;
  }
  const encoder = indexOf(target.id, 'encoder');
  const by = (steps: number, names: readonly string[], now: string) => names[clamp(names.indexOf(now) + steps, 0, names.length - 1)];
  if (input.kind === 'turn' && encoder !== undefined) {
    // An encoder moves a choice once every few steps, so a list does not fly past.
    state.notes.shift += input.value ?? 0;
    const moved = Math.trunc(state.notes.shift / STEPS_PER_CHOICE);
    if (moved === 0) return true;
    state.notes.shift -= moved * STEPS_PER_CHOICE;
    if (encoder === 1) {
      const next = by(moved, ['4ths', '3rds', 'sequential'], s.layout);
      if (next !== s.layout) push(ctx, 'set-scale', { layout: next });
    } else if (encoder <= 7) {
      const next = by(moved, SCALE_NAMES, s.scale);
      if (next !== s.scale) push(ctx, 'set-scale', { scale: next });
    }
    return true;
  }
  if (input.kind === 'down' && (target.id === 'dpad-up' || target.id === 'dpad-down')) {
    const next = by(target.id === 'dpad-up' ? -1 : 1, SCALE_NAMES, s.scale);
    if (next !== s.scale) push(ctx, 'set-scale', { scale: next });
    return true;
  }
  if (input.kind === 'turn' && target.id === 'jog') {
    const next = by(Math.sign(input.value ?? 0), SCALE_NAMES, s.scale);
    if (next !== s.scale) push(ctx, 'set-scale', { scale: next });
    return true;
  }
  return false;
}

/** The Scale menu, over whatever the display showed. */
export const scaleMenu: Layer = {
  name: 'scale-menu',
  active: (state) => state.scaleMenu === true,
  step: scaleStep,
  paint(paint) {
    scaleScreen(paint);
    paint.lamps.scale = lamp('lit');
    const at = SCALE_NAMES.indexOf(paint.set.scale.scale);
    paint.lamps['dpad-up'] = choice(false, at > 0);
    paint.lamps['dpad-down'] = choice(false, at < SCALE_NAMES.length - 1);
  },
};

const combos: Combo[] = [
  {
    id: 'select+strip',
    hold: ['select'],
    press: 'strip',
    kind: 'touch',
    mode: 'Note Mode, a playing layout',
    asks: 'Switch the touch strip between pitch bend and the modulation wheel',
    when: (ctx) => ['64-notes', 'melodic-32'].includes(padLayout(ctx.state, ctx.set)),
    run: (ctx) => {
      ctx.state.strip = { mode: ctx.state.strip.mode === 'bend' ? 'mod' : 'bend', value: 0 };
      notify(ctx, 'Touch Strip', ctx.state.strip.mode === 'bend' ? 'Pitch Bend' : 'Mod Wheel');
    },
    example: { press: 'strip', value: 0.5, set: (set) => void (set.selection.track = 't-bass') },
  },
];

/** The buttons that belong to playing whatever the layout: Scale, Layout, the octave buttons, the strip. */
export const playing: Layer = {
  name: 'playing',
  active: (state, set) => padLayout(state, set) !== 'session',
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    const track = selectedTrack(set);
    const layout = padLayout(state, set);
    if (isDown(ctx, 'scale')) {
      if (instrumentKind(track).kind === 'melodic') state.scaleMenu = true;
      return true;
    }
    if (isDown(ctx, 'octave-up') || isDown(ctx, 'octave-down')) {
      if (layout !== '64-notes' && layout !== 'melodic-32' && layout !== 'melodic') return false;
      const by = input.control === 'octave-up' ? 1 : -1;
      const now = octaveOf(state, set);
      if (!canShift(set.scale, now, by)) return true;
      state.notes.octave[track.id] = now + by;
      const { low, high } = gridRange(set.scale, now + by);
      notify(ctx, 'Note Range', `${noteName(low)} to ${noteName(high)}`);
      return true;
    }
    if (target?.id === 'layout' && input.kind === 'up') {
      const held = state.held.layout;
      if (!held || held.used || held.holding) return true;
      const offered = layoutsFor(track);
      if (offered.length === 0) return true;
      const next = offered[(offered.indexOf(layout) + 1) % offered.length];
      state.notes.layout[track.id] = next;
      notify(ctx, 'Layout', LAYOUT_NAMES[next]);
      return true;
    }
    if (target?.id === 'layout') return true;
    if (target?.kind === 'strip' && (layout === '64-notes' || layout === 'melodic-32')) {
      const value = input.value ?? 0.5;
      if (state.strip.mode === 'bend') {
        if (input.kind === 'touch' || input.kind === 'move') {
          state.strip = { mode: 'bend', value: value * 2 - 1, touched: true };
          push(ctx, 'pitch-bend', { value: state.strip.value, track: track.id });
        } else if (input.kind === 'release') {
          state.strip = { mode: 'bend', value: 0 };
          push(ctx, 'pitch-bend', { value: 0, track: track.id });
        }
      } else if (input.kind === 'touch' || input.kind === 'move') {
        state.strip = { mode: 'mod', value };
        push(ctx, 'modulation', { value, track: track.id });
      }
      return true;
    }
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const track = selectedTrack(set);
    const layout = padLayout(state, set);
    const melodic = instrumentKind(track).kind === 'melodic';
    lamps.scale = choice(false, melodic);
    lamps.layout = choice(false, layoutsFor(track).length > 1);
    const notes = layout === '64-notes' || layout === 'melodic-32' || layout === 'melodic';
    lamps['octave-up'] = choice(false, notes && canShift(set.scale, octaveOf(state, set), 1));
    lamps['octave-down'] = choice(false, notes && canShift(set.scale, octaveOf(state, set), -1));
    if (layout === '64-notes' || layout === 'melodic-32') {
      paint.strip = state.strip.mode === 'bend' ? { kind: 'bend', value: state.strip.value } : { kind: 'level', value: state.strip.value };
      lamps.strip = lamp('lit');
    }
  },
};

/** Every pitch sounding: what the Set reports, and what the pads hold. */
export function sounding(state: PushState, set: PushSet): Set<number> {
  const all = new Set(set.sounding ?? []);
  for (const held of Object.values(state.held)) if (held.note !== undefined) all.add(held.note);
  return all;
}

/** A note pad's lamp: green while its note sounds, the track's colour on the key's root, white in the scale, unlit outside it. */
export function noteLamp(pitch: number, s: ScaleSettings, trackColour: number, sound: Set<number>) {
  if (sound.has(pitch)) return lamp('lit', 'note');
  if (isRoot(pitch, s)) return lamp('lit', trackColour);
  return inScale(pitch, s) ? lamp('lit', 'white', 'dim') : OFF;
}

/** The 64 Notes layout: every pad plays a note. */
export const notes64: Layer = {
  name: '64-notes',
  active: (state, set) => padLayout(state, set) === '64-notes',
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target || target.kind !== 'pad') return false;
    const { row, col } = padAt(target.id)!;
    const track = selectedTrack(set).id;
    const held = state.held[target.id];
    const { mode } = set.unit.expression;
    if (input.kind === 'down') {
      const pitch = pitchAt(state, set, row, col);
      held.note = pitch;
      push(ctx, 'note-on', { pitch, velocity: state.accent ? 127 : (input.velocity ?? 100), track, pad: target.id, ...(mode === 'mpe' && input.value !== undefined ? { slide: input.value } : {}) });
      return true;
    }
    if (!held || held.note === undefined) return true;
    if (input.kind === 'up') {
      push(ctx, 'note-off', { pitch: held.note, track, pad: target.id });
      return true;
    }
    if (input.kind === 'pressure') {
      held.pressure = input.value ?? 0;
      if (mode === 'mpe' || mode === 'poly-aftertouch') push(ctx, 'pressure', { pitch: held.note, value: held.pressure, track });
      else if (mode === 'mono-aftertouch') push(ctx, 'pressure', { value: Math.max(...Object.values(state.held).map((h) => h.pressure ?? 0)), track });
      return true;
    }
    if (input.kind === 'slide') {
      if (mode === 'mpe') push(ctx, 'slide', { pitch: held.note, value: input.value ?? 0, track });
      return true;
    }
    if (input.kind === 'bend') {
      if (mode !== 'mpe' || set.unit.expression.noteBend === 'off') return true;
      const pads = input.value ?? 0;
      if (bends(set)) {
        push(ctx, 'bend', { pitch: held.note, semitones: Math.round(bendSemitones(state, set, row, col, pads) * 1000) / 1000, track });
        return true;
      }
      // The instrument cannot bend one note: sliding on to another pad ends this note and starts that one.
      const over = clamp(col + Math.round(pads), 1, 8);
      const next = pitchAt(state, set, row, over);
      if (next !== held.note) {
        push(ctx, 'note-off', { pitch: held.note, track, pad: target.id });
        held.note = next;
        held.glide = over;
        push(ctx, 'note-on', { pitch: next, velocity: state.accent ? 127 : (held.velocity ?? 100), track, pad: padId(row, over) });
      }
      return true;
    }
    return true;
  },
  paint(paint) {
    const { state, set } = paint;
    const colour = selectedTrack(set).colour;
    const sound = sounding(state, set);
    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const pitch = pitchAt(state, set, row, col);
        paint.notes[padId(row, col)] = pitch;
        paint.lamps[padId(row, col)] = noteLamp(pitch, set.scale, colour, sound);
      }
  },
};
