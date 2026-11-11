// Recording and the buttons around it: Record, New, Capture, Duplicate, Fixed Length, Repeat,
// Accent, Quantize, Metronome, Tap Tempo, Automate, Double Loop; and the menus that open while
// Fixed Length, Quantize or Metronome is held (openspec: push-recording).
import { indexOf } from '../layout';
import { activeClip, clamp, selectedTrack } from '../state';
import { choice, holdJob, isDown, isUp, lamp, OFF, pressed, push, screen, shift, type Combo, type Ctx, type Layer } from '../engine';
import type { BodyCell, PushSet, PushState, RowCell } from '../types';
import { instrumentKind, padLayout, padMode, repeatOf, shownArmed } from './modes';
import { gather } from './params';
import { inSession, launchSelected, workflow } from './session';

/** Whether any track is armed, by hand or by the unit. */
const anyArmed = (state: PushState, set: PushSet) => set.tracks.some((t) => shownArmed(state, set, t));

/** What Record asks: record a new clip, then stop recording and keep it playing, then overdub on or off. */
export function recordJob(ctx: Ctx, other = false): void {
  const { state, set } = ctx;
  const { transport } = set;
  const track = selectedTrack(set);
  // In Control Mode Record follows the view Live has in focus; Shift gives the other.
  const arrangement = set.unit.mode === 'control' && (transport.view === 'arrangement') !== other;
  if (arrangement) return void push(ctx, 'record-arrangement', { on: transport.recording !== 'arrangement' });
  if (transport.recording === 'session') return void push(ctx, 'record', { on: false, track: track.id });
  if (track.playing !== undefined && track.kind === 'midi') return void push(ctx, 'overdub', { on: !transport.overdub, track: track.id });
  if (!shownArmed(state, set, track)) return void push(ctx, 'record', { on: true });
  // A new clip, in the next free slot from the selected scene; audio starts with the next beat while the Set plays.
  const free = track.clips.findIndex((c, i) => i >= set.selection.scene && !c);
  push(ctx, 'record', { on: true, track: track.id, scene: free < 0 ? set.selection.scene : free, ...(track.kind === 'audio' && transport.playing ? { from: 'next-beat' } : {}) });
}

/** What New asks: an empty slot to record into, in the form the Workflow preference sets. */
export function newJob(ctx: Ctx): void {
  const { set } = ctx;
  const track = selectedTrack(set);
  if (workflow(set) === 'scene') push(ctx, 'new-scene', { keep: 'playing', empty: track.id });
  else push(ctx, 'new-clip', { track: track.id, ...(track.playing === undefined ? {} : { stop: track.playing }) });
}

/** What Duplicate asks alone: a new scene of the playing clips, or a copy of the selected clip. */
function duplicateJob(ctx: Ctx, scene: boolean): void {
  const { set } = ctx;
  if (scene) push(ctx, 'duplicate-scene', { playing: true });
  else push(ctx, 'duplicate-clip', { from: { track: set.selection.track, scene: set.selection.scene }, to: 'next' });
}

const combos: Combo[] = [
  {
    id: 'shift+record',
    hold: ['shift'],
    press: 'record',
    mode: 'Control Mode',
    asks: 'Record in the other view: the Arrangement when Session is in focus, Session when the Arrangement is',
    when: (ctx) => ctx.set.unit.mode === 'control',
    run: (ctx) => recordJob(ctx, true),
    example: { press: 'record', set: (set) => void (set.unit.mode = 'control') },
  },
  {
    id: 'shift+automate',
    hold: ['shift'],
    press: 'automate',
    mode: 'Any',
    asks: 'Re-enable all overridden automation',
    run: (ctx) => push(ctx, 're-enable-automation'),
    example: { press: 'automate' },
  },
  {
    id: 'delete+automate',
    hold: ['delete'],
    press: 'automate',
    mode: 'Any',
    asks: 'Delete all automation in the clip',
    run: (ctx) => {
      const slot = activeClip(ctx.set);
      push(ctx, 'delete-automation', { track: ctx.set.selection.track, scene: slot?.scene ?? ctx.set.selection.scene, all: true });
    },
    example: { press: 'automate' },
  },
  {
    id: 'shift+duplicate',
    hold: ['shift'],
    press: 'duplicate',
    mode: 'Clip Workflow',
    asks: 'Make a new scene holding all playing clips',
    when: (ctx) => workflow(ctx.set) === 'clip',
    run: (ctx) => duplicateJob(ctx, true),
    example: { press: 'duplicate', set: (set) => void (set.unit.preferences.Workflow.value = 'Clip') },
  },
  {
    id: 'shift+stop-clip',
    hold: ['shift'],
    press: 'stop-clip',
    mode: 'Any',
    asks: 'Stop all clips',
    run: (ctx) => push(ctx, 'stop-all-clips'),
    example: { press: 'stop-clip' },
  },
  {
    id: 'shift+dpad-centre',
    hold: ['shift'],
    press: 'dpad-centre',
    mode: 'Session',
    asks: 'Launch the selected clip (Scene Workflow) or the selected scene (Clip Workflow): the other of what the centre does alone',
    when: (ctx) => padLayout(ctx.state, ctx.set) === 'session' || ctx.state.display === 'session',
    run: launchSelected,
    example: { press: 'dpad-centre', state: inSession },
  },
];

/** How long a tap can be from the last and still be the same tempo: two seconds. */
const TAP_GAP_MS = 2000; // added

export const recording: Layer = {
  name: 'recording',
  combos,
  step(ctx) {
    const { input, state, set } = ctx;
    const id = input.control;
    const { transport } = set;
    const track = selectedTrack(set);

    // A pad held with Repeat on asks for a stream of notes: each tick that is due asks the next of every held pad.
    if (input.kind === 'tick') {
      if (state.repeatAt !== undefined && input.time >= state.repeatAt) {
        const playing = Object.entries(state.held).filter(([, h]) => h.note !== undefined);
        const repeat = repeatOf(state, set);
        if (!playing.length || !repeat.on || padMode(state) !== 'note') delete state.repeatAt;
        else {
          for (const [pad, h] of playing) {
            push(ctx, 'note-off', { pitch: h.note, track: track.id, pad });
            // The velocity follows the pad's pressure, where it has any.
            push(ctx, 'note-on', { pitch: h.note, velocity: state.accent ? 127 : h.pressure ? clamp(Math.round(h.pressure * 127), 1, 127) : (h.velocity ?? 100), track: track.id, pad, repeat: true });
          }
          state.repeatAt += repeatMs(state, set, input.time);
        }
      }
      return false;
    }

    if (id === 'record') {
      if (pressed(ctx, 'record')) recordJob(ctx);
      return true;
    }
    if (isDown(ctx, 'new')) return newJob(ctx), true;
    if (isDown(ctx, 'capture')) {
      if (anyArmed(state, set)) push(ctx, 'capture');
      return true;
    }
    if (id === 'duplicate') {
      if (pressed(ctx, 'duplicate')) duplicateJob(ctx, workflow(set) === 'scene');
      return true;
    }
    if (isDown(ctx, 'double-loop')) {
      const slot = activeClip(set);
      if (slot) push(ctx, 'double-loop', { track: track.id, scene: slot.scene });
      return true;
    }
    if (id === 'fixed-length') {
      if (pressed(ctx, id)) push(ctx, 'fixed-length', { on: !transport.fixedLength.on });
      return true;
    }
    if (id === 'metronome') {
      if (pressed(ctx, id)) push(ctx, 'metronome', { on: !transport.metronome });
      return true;
    }
    if (id === 'quantize') {
      const slot = activeClip(set);
      if (pressed(ctx, id) && slot) push(ctx, 'quantize', { track: track.id, scene: slot.scene, ...(state.clip.selected.length ? { notes: [...state.clip.selected] } : {}) });
      return true;
    }
    if (id === 'automate') {
      if (isDown(ctx)) push(ctx, 'automation-arm', { on: !transport.automationArm });
      return true;
    }
    if (id === 'repeat') {
      // A quick press latches it; held, it is on only while held.
      if (pressed(ctx, id)) state.repeats[track.id] = { ...repeatOf(state, set), on: !(state.repeats[track.id]?.on ?? false) };
      return true;
    }
    if (id === 'accent') {
      if (isDown(ctx)) state.accent = !state.accent;
      // Held past the hold time, it was momentary: letting go puts it back.
      else if (isUp(ctx) && state.held.accent?.holding) state.accent = !state.accent;
      return true;
    }
    if (isDown(ctx, 'tap-tempo')) {
      const taps = [...(state.taps ?? []).filter((t) => input.time - t < TAP_GAP_MS * 4), input.time];
      const recent = taps.filter((t, i) => i === taps.length - 1 || taps[i + 1] - t < TAP_GAP_MS);
      state.taps = recent.length === taps.length ? taps : [input.time];
      push(ctx, 'tap-tempo', { time: input.time });
      const gaps = state.taps.slice(1).map((t, i) => t - state.taps![i]);
      if (gaps.length) push(ctx, 'set-tempo', { value: Math.round((60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)) * 10) / 10 });
      // The taps of one bar start a stopped Set.
      if (!transport.playing && state.taps.length === transport.signature[0]) push(ctx, 'play');
      return true;
    }

    // With Repeat on the scene buttons choose the interval.
    const scene = ctx.target ? indexOf(ctx.target.id, 'scene') : undefined;
    if (scene !== undefined && repeatOf(state, set).on && padLayout(state, set) !== 'session') {
      if (input.kind === 'down') {
        state.repeats[track.id] = { on: state.repeats[track.id]?.on ?? false, interval: scene - 1 };
        push(ctx, 'set-repeat-interval', { track: track.id, interval: scene - 1 });
      }
      return true;
    }
    // A pad going down with Repeat on starts the stream; the note itself is asked by the pads' own layer.
    if (ctx.target?.kind === 'pad' && input.kind === 'down' && repeatOf(state, set).on && padMode(state) === 'note' && state.repeatAt === undefined) state.repeatAt = input.time + repeatMs(state, set, input.time);
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const { transport } = set;
    const track = selectedTrack(set);
    const recordingNow = transport.recording !== 'off' || transport.overdub;
    lamps.record = transport.countingIn !== undefined ? lamp('blink', 'record') : lamp(recordingNow ? 'lit' : 'dim', 'record');
    lamps.new = lamp('dim');
    lamps.capture = anyArmed(state, set) ? lamp(transport.canCapture ? 'lit' : 'dim') : OFF;
    lamps.duplicate = lamp('dim');
    lamps.delete = lamp('dim');
    lamps['double-loop'] = activeClip(set) ? lamp('dim') : OFF;
    lamps['fixed-length'] = lamp(transport.fixedLength.on ? 'lit' : 'dim');
    lamps.metronome = transport.metronome ? lamp('pulse') : lamp('dim');
    lamps.quantize = activeClip(set) ? lamp('dim') : OFF;
    lamps.automate = transport.automationArm ? lamp('lit', 'record') : lamp('dim', 'white');
    lamps['tap-tempo'] = lamp('dim');
    const repeat = repeatOf(state, set);
    const playable = padMode(state) === 'note' && instrumentKind(track).kind !== 'none';
    lamps.repeat = !playable ? OFF : repeat.on ? lamp('pulse') : lamp('dim');
    lamps.accent = choice(state.accent, playable);
    if (repeat.on && padLayout(state, set) !== 'session') for (let r = 1; r <= 8; r++) lamps[`scene-${r}`] = repeat.interval === r - 1 ? lamp('lit', 'play') : lamp('dim');
  },
};

/** The time from one repeated note to the next, in milliseconds: the interval at the Set's tempo, with swing pushing every second note later. */
function repeatMs(state: PushState, set: PushSet, _now: number): number {
  const beats = [0.125 * (2 / 3), 0.125, 0.25 * (2 / 3), 0.25, 0.5 * (2 / 3), 0.5, 1 * (2 / 3), 1][repeatOf(state, set).interval] ?? 0.25;
  return (60000 / Math.max(20, set.transport.tempo)) * beats;
}

/* ---------- the menus that open on a hold ---------- */

const row = (cells: (RowCell | null)[]): (RowCell | null)[] => Array.from({ length: 8 }, (_, i) => cells[i] ?? null);
const pick = (name: string, col: number, value: string, choices: string[], more: Partial<BodyCell> = {}): BodyCell => ({ type: 'param', col, name, value, fraction: 0, style: 'choice', choices, chosen: Math.max(0, choices.indexOf(value)), ...more }) as BodyCell;
const level = (name: string, col: number, value: number, word: string): BodyCell => ({ type: 'param', col, name, value: word, fraction: value, style: 'arc' });
const NUMERATORS = Array.from({ length: 16 }, (_, i) => String(i + 1));
const DENOMINATORS = ['1', '2', '4', '8', '16'];

type Menu = 'metronome' | 'quantize' | 'fixed-length';
const menuOf = (state: PushState): Menu | undefined => (['metronome', 'quantize', 'fixed-length'] as const).find((id) => holdJob(state, id));

export const holdMenus: Layer = {
  name: 'hold-menus',
  active: (state) => menuOf(state) !== undefined,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const menu = menuOf(state)!;
    const { transport } = set;
    const encoder = indexOf(target.id, 'encoder');
    const upper = indexOf(target.id, 'upper');
    const lower = indexOf(target.id, 'lower');
    if (encoder === undefined && upper === undefined && lower === undefined) return false;
    const moved = input.kind === 'turn' ? gather(state.notes, input.value ?? 0) : 0;
    const next = (list: readonly string[], now: string) => list[clamp(list.indexOf(now) + moved, 0, list.length - 1)];

    if (menu === 'fixed-length') {
      const { fixedLength } = transport;
      if (input.kind === 'down' && upper !== undefined && fixedLength.choices[upper - 1]) push(ctx, 'set-fixed-length', { bars: fixedLength.choices[upper - 1] });
      if (input.kind === 'down' && lower === 1) push(ctx, 'set-fixed-length', { phrase: !fixedLength.phrase });
      return true;
    }
    if (menu === 'quantize') {
      const q = transport.quantize;
      if (input.kind === 'down' && upper === 1) push(ctx, 'set-quantize', { record: q.recordTo === 'Off' ? q.to : 'Off' });
      if (input.kind === 'turn' && encoder === 1) push(ctx, 'set-quantize', { swing: clamp(Math.round((q.swing + (input.value ?? 0) / 100) * 100) / 100, 0, 1) });
      if (moved && encoder === 2 && next(q.choices, q.to) !== q.to) push(ctx, 'set-quantize', { to: next(q.choices, q.to) });
      if (input.kind === 'turn' && encoder === 3) push(ctx, 'set-quantize', { amount: clamp(Math.round((q.amount + (input.value ?? 0) / 100) * 100) / 100, 0, 1) });
      return true;
    }
    // Metronome.
    const click = transport.click;
    const counts = ['none', '1 bar', '2 bars', '4 bars'];
    if (!moved) return true;
    if (encoder === 1) {
      // With Link on there is no count-in to set.
      if (!transport.link?.on && next(counts, transport.countIn) !== transport.countIn) push(ctx, 'set-count-in', { value: next(counts, transport.countIn) });
    } else if (encoder === 2 && click && next(click.sounds, click.sound) !== click.sound) push(ctx, 'metronome', { sound: next(click.sounds, click.sound) });
    else if (encoder === 3 && click && next(click.rhythms, click.rhythm) !== click.rhythm) push(ctx, 'metronome', { rhythm: next(click.rhythms, click.rhythm) });
    else if (encoder === 4) {
      const n = Number(next(NUMERATORS, String(transport.signature[0])));
      if (n !== transport.signature[0]) push(ctx, 'set-signature', { numerator: n, denominator: transport.signature[1] });
    } else if (encoder === 5) {
      const d = Number(next(DENOMINATORS, String(transport.signature[1])));
      if (d !== transport.signature[1]) push(ctx, 'set-signature', { numerator: transport.signature[0], denominator: d });
    }
    return true;
  },
  paint(paint) {
    const { state, set } = paint;
    const menu = menuOf(state)!;
    const { transport } = set;
    if (menu === 'fixed-length') {
      const { fixedLength } = transport;
      paint.screen = screen('fixed-length', {
        top: row(fixedLength.choices.map((label) => ({ label, selected: label === fixedLength.bars }))),
        bottom: row([{ label: 'Phrase Sync', selected: !!fixedLength.phrase }]),
        body: [{ type: 'text', col: 1, span: 8, text: 'Fixed Length', size: 'value', align: 'centre' }],
      });
      return;
    }
    if (menu === 'quantize') {
      const q = transport.quantize;
      paint.screen = screen('quantize', {
        top: row([{ label: 'Rec. Quantize', selected: q.recordTo !== 'Off' }]),
        body: [level('Swing Amount', 1, q.swing, `${Math.round(q.swing * 100)} %`), pick('Quantize To', 2, q.to, q.choices), level('Quantize Amount', 3, q.amount, `${Math.round(q.amount * 100)} %`)],
      });
      return;
    }
    const click = transport.click;
    const linked = !!transport.link?.on;
    paint.screen = screen('metronome', {
      body: [
        pick('Count-In', 1, transport.countIn, ['none', '1 bar', '2 bars', '4 bars'], linked ? { disabled: true } : {}),
        ...(click ? [pick('Sound', 2, click.sound, click.sounds), pick('Rhythm', 3, click.rhythm, click.rhythms)] : []),
        pick('Numerator', 4, String(transport.signature[0]), NUMERATORS),
        pick('Denominator', 5, String(transport.signature[1]), DENOMINATORS),
      ],
    });
  },
};
