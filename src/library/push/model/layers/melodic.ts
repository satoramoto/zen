// The melodic sequencers: the Melodic Sequencer (every row a pitch, every column a step) and
// Melodic Sequencer + 32 Notes (notes below, 32 steps above), and what the sequencers share: the
// step size on the scene buttons, the page buttons, and editing held steps with the encoders
// (openspec: push-step-sequencing).
import { padAt, padId, indexOf } from '../layout';
import { inScale, isRoot, noteName, padPitch, SCALES } from '../scales';
import { loopPages, notesAt, pageBeats, pageInView, playingStep, seqClip, seqScene, stepBeats, stepStart, stepsPerRow, velocityShade } from '../seq';
import { clamp, selectedTrack } from '../state';
import { holdJob, isDown, isUp, lamp, OFF, push, screen, shift, use, type Combo, type Ctx, type Layer } from '../engine';
import type { Lamp, Note, PushSet, PushState } from '../types';
import { columns as deviceColumns } from './deviceView';
import { loopLamp, loopPad } from './drums';
import { instrumentKind, padLayout } from './modes';
import { noteParamCell, noteParams } from './noteParams';
import { noteLamp, sounding } from './notes';
import { notify } from './overlays';
import { turnParameter } from './params';

const GREY: Lamp = { state: 'lit', colour: 'white', shade: 'dark' };
const octaveOf = (state: PushState, set: PushSet) => state.notes.octave[selectedTrack(set).id] ?? 0;
const trackId = (set: PushSet) => selectedTrack(set).id;

/** Whether the loop length row is on the pads: Layout held, or locked for this track. */
const loopRow = (state: PushState, set: PushSet) => holdJob(state, 'layout') || !!state.seq.loopRows?.[trackId(set)];

/** The Melodic Sequencer's rows: the pitch of row `row`, counting scale notes (semitones, chromatic) up from the lowest. */
export function rowPitch(state: PushState, set: PushSet, row: number): number {
  const base = state.seq.rowBase[trackId(set)] ?? 0;
  return padPitch(8, 1 + (8 - row) + base, { ...set.scale, layout: '4ths' }, octaveOf(state, set));
}
const scaleSize = (set: PushSet) => (set.scale.inKey ? (SCALES[set.scale.scale] ?? SCALES.Major).length : 12);

/** What a pad is in a melodic sequencer. */
type Cell = { part: 'step'; index: number; pitch?: number } | { part: 'note'; pitch: number } | { part: 'loop'; page: number } | { part: 'none' };

function cellOf(state: PushState, set: PushSet, row: number, col: number): Cell {
  const per = stepsPerRow(state);
  if (padLayout(state, set) === 'melodic') {
    if (row === 1 && loopRow(state, set)) return { part: 'loop', page: col - 1 };
    return col > per ? { part: 'none' } : { part: 'step', index: col - 1, pitch: rowPitch(state, set, row) };
  }
  if (row >= 5) return { part: 'note', pitch: padPitch(row, col, set.scale, octaveOf(state, set)) };
  // The fifth row from the bottom shows the loop pages while Layout is held or locked.
  if (row === 4 && loopRow(state, set)) return { part: 'loop', page: col - 1 };
  return col > per ? { part: 'none' } : { part: 'step', index: (row - 1) * per + (col - 1) };
}
const stepsOf = (state: PushState, set: PushSet) => stepsPerRow(state) * (padLayout(state, set) === 'melodic' ? 1 : 4);
const about = (set: PushSet) => ({ track: trackId(set), scene: seqScene(set) });
const cellAt = (ctx: Ctx): Cell | undefined => {
  const at = ctx.target ? padAt(ctx.target.id) : undefined;
  return at ? cellOf(ctx.state, ctx.set, at.row, at.col) : undefined;
};
const inMelodic = (ctx: Ctx) => ['melodic', 'melodic-32'].includes(padLayout(ctx.state, ctx.set));
const onBass = (set: PushSet) => void ((set.selection.track = 't-bass'), (set.selection.device = 'd-bass'));

const combos: Combo[] = [
  {
    id: 'duplicate+step',
    hold: ['duplicate'],
    press: 'pad',
    mode: 'Note Mode, Melodic Sequencer + 32 Notes',
    asks: 'Pick up the step’s notes; the next step pressed takes a copy of them',
    when: (ctx) => padLayout(ctx.state, ctx.set) === 'melodic-32' && cellAt(ctx)?.part === 'step',
    run: (ctx) => {
      const { index } = cellAt(ctx) as { part: 'step'; index: number };
      const start = stepStart(ctx.state, ctx.set, stepsOf(ctx.state, ctx.set), index);
      if (ctx.state.seq.stepCopied === undefined) ctx.state.seq.stepCopied = start;
      else {
        push(ctx, 'copy-steps', { ...about(ctx.set), from: ctx.state.seq.stepCopied, to: start, length: stepBeats(ctx.state) });
        delete ctx.state.seq.stepCopied;
      }
    },
    example: { press: 'pad-1-1', set: onBass, state: (state) => void (state.notes.layout['t-bass'] = 'melodic-32') },
  },
  ...(['duplicate', 'delete'] as const).map((action): Combo => ({
    id: `${action}+melodic-loop-pad`,
    hold: [action],
    press: 'pad',
    mode: 'Note Mode, a melodic sequencer with its loop length row shown',
    asks: action === 'delete' ? 'Clear the page of steps' : 'Pick up the page of steps; the next loop length pad pressed takes a copy, added to what is there',
    when: (ctx) => inMelodic(ctx) && cellAt(ctx)?.part === 'loop',
    run: (ctx) => {
      const { page } = cellAt(ctx) as { part: 'loop'; page: number };
      const length = pageBeats(ctx.state, stepsOf(ctx.state, ctx.set));
      if (action === 'delete') push(ctx, 'clear-steps', { ...about(ctx.set), start: page * length, length });
      else if (ctx.state.seq.pageCopied === undefined) ctx.state.seq.pageCopied = page;
      else {
        push(ctx, 'copy-steps', { ...about(ctx.set), from: ctx.state.seq.pageCopied * length, to: page * length, length });
        delete ctx.state.seq.pageCopied;
      }
    },
    example: { press: 'pad-1-1', set: onBass, state: (state) => void ((state.notes.layout['t-bass'] = 'melodic'), (state.seq.loopRows = { 't-bass': true })) },
  })),
];

/** Add the pitches at a step that are not there yet; when they all are, remove them. */
function place(ctx: Ctx, start: number, pitches: number[]): void {
  const { state, set } = ctx;
  if (pitches.length === 0) return;
  const clip = seqClip(set)?.clip;
  const length = stepBeats(state);
  const there = pitches.map((pitch) => notesAt(clip, start, length, pitch));
  if (there.every((n) => n.length)) {
    push(ctx, 'remove-note', { ...about(set), notes: there.flat().map((n) => n.id) });
    return;
  }
  pitches.forEach((pitch, i) => {
    if (!there[i].length) push(ctx, 'add-note', { ...about(set), pitch, start, length, velocity: state.accent ? 127 : 100 });
  });
  if (!set.transport.playing) push(ctx, 'play');
}

export const melodic: Layer = {
  name: 'melodic',
  active: (state, set) => ['melodic', 'melodic-32'].includes(padLayout(state, set)),
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const layout = padLayout(state, set);
    const steps = stepsOf(state, set);
    const track = trackId(set);

    const scene = indexOf(target.id, 'scene');
    if (scene !== undefined && !state.repeat.on) {
      if (input.kind === 'down') state.seq.step = scene - 1;
      return true;
    }
    if (isDown(ctx, 'page-left') || isDown(ctx, 'page-right')) {
      const next = pageInView(state, set, steps) + (target.id === 'page-left' ? -1 : 1);
      if (next >= 0 && next < loopPages(state, set, steps)) {
        state.seq.page = next;
        state.seq.follow = false;
      }
      return true;
    }
    if ((target.id === 'page-left' || target.id === 'page-right') && isUp(ctx)) {
      if (state.held[target.id]?.holding) state.seq.follow = true;
      return true;
    }

    if (layout === 'melodic') {
      // Octave Up and Down move the rows an octave, or one scale note with Shift; the strip the other way round.
      const size = scaleSize(set);
      const moveRows = (by: number) => {
        const now = state.seq.rowBase[track] ?? 0;
        const low = padPitch(8, 1 + now + by, { ...set.scale, layout: '4ths' }, octaveOf(state, set));
        const high = padPitch(8, 8 + now + by, { ...set.scale, layout: '4ths' }, octaveOf(state, set));
        if (low < 0 || high > 127) return;
        state.seq.rowBase[track] = now + by;
        notify(ctx, 'Note Range', `${noteName(low)} to ${noteName(high)}`);
      };
      if (isDown(ctx, 'octave-up') || isDown(ctx, 'octave-down')) {
        moveRows((target.id === 'octave-up' ? 1 : -1) * (shift(ctx) ? 1 : size));
        return true;
      }
      if (target.kind === 'strip') {
        // The strip only moves the range: it sends no bend and no modulation here.
        if (input.kind === 'touch') state.strip = { ...state.strip, value: input.value ?? 0.5 };
        else if (input.kind === 'move') {
          const moved = Math.round(((input.value ?? 0) - state.strip.value) * 16);
          if (moved !== 0) {
            moveRows(moved * (shift(ctx) ? size : 1));
            state.strip = { ...state.strip, value: input.value ?? 0 };
          }
        }
        return true;
      }
    }

    if (target.kind !== 'pad') return false;
    const at = padAt(target.id)!;
    const cell = cellOf(state, set, at.row, at.col);
    const held = state.held[target.id];
    const clip = seqClip(set)?.clip;

    if (cell.part === 'loop') {
      loopPad(ctx, cell.page, steps);
      return true;
    }
    if (cell.part === 'none') return true;

    if (cell.part === 'note') {
      const heldSteps = Object.entries(state.held).filter(([, h]) => h.step);
      if (input.kind === 'down') {
        // With a step held, a note it contains is taken out of it, without sounding.
        if (heldSteps.length) {
          const notes = heldSteps.flatMap(([, h]) => notesAt(clip, h.step!.start, stepBeats(state), cell.pitch));
          use(ctx, ...heldSteps.map(([id]) => id));
          if (notes.length) push(ctx, 'remove-note', { ...about(set), notes: notes.map((n) => n.id) });
          return true;
        }
        const others = Object.entries(state.held).some(([id, h]) => id !== target.id && h.note !== undefined);
        state.seq.selected = others ? [...new Set([...(state.seq.selected ?? []), cell.pitch])] : [cell.pitch];
        held.note = cell.pitch;
        push(ctx, 'note-on', { pitch: cell.pitch, velocity: state.accent ? 127 : (input.velocity ?? 100), track, pad: target.id });
      } else if (input.kind === 'up' && held?.note !== undefined) push(ctx, 'note-off', { pitch: held.note, track, pad: target.id });
      else if (input.kind === 'pressure' && held?.note !== undefined && set.unit.expression.mode !== 'off') push(ctx, 'pressure', { pitch: held.note, value: input.value ?? 0, track });
      return true;
    }

    // A step.
    const start = stepStart(state, set, steps, cell.index);
    if (input.kind === 'down') held.step = { start, ...(cell.pitch === undefined ? {} : { pitch: cell.pitch }) };
    else if (input.kind === 'up' && held && !held.used) place(ctx, start, cell.pitch === undefined ? (state.seq.selected ?? []) : [cell.pitch]);
    return true;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const track = selectedTrack(set);
    const layout = padLayout(state, set);
    const steps = stepsOf(state, set);
    const clip = seqClip(set)?.clip;
    const colour = clip?.colour ?? track.colour;
    const playing = playingStep(state, set, steps);
    const sound = sounding(state, set);
    const length = stepBeats(state);
    // The notes of every held step, to light on the lower half.
    const inHeld = new Set(Object.values(state.held).flatMap((h) => (h.step ? notesAt(clip, h.step.start, length).map((n) => n.pitch) : [])));
    const anyStepHeld = Object.values(state.held).some((h) => h.step);

    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const id = padId(row, col);
        const cell = cellOf(state, set, row, col);
        paint.notes[id] = cell.part === 'note' ? cell.pitch : null;
        if (cell.part === 'none') lamps[id] = OFF;
        else if (cell.part === 'loop') lamps[id] = loopLamp(state, set, cell.page, steps);
        else if (cell.part === 'note') {
          if (anyStepHeld) lamps[id] = inHeld.has(cell.pitch) ? lamp('lit', colour, 'bright') : GREY;
          else if (!sound.has(cell.pitch) && state.seq.selected?.includes(cell.pitch)) lamps[id] = lamp('lit', track.colour, 'light');
          else lamps[id] = noteLamp(cell.pitch, set.scale, track.colour, sound);
        } else {
          const there = notesAt(clip, stepStart(state, set, steps, cell.index), length, cell.pitch);
          if (state.held[id]) lamps[id] = lamp('lit', 'white');
          else if (playing === cell.index) lamps[id] = lamp('lit', clip?.state === 'recording' ? 'record' : 'play');
          else if (there.length) lamps[id] = there.every((n) => n.muted) ? lamp('lit', colour, 'light') : lamp('lit', colour, velocityShade(Math.max(...there.map((n) => n.velocity))));
          else if (cell.pitch === undefined) lamps[id] = GREY;
          // An empty pad of the Melodic Sequencer: the root's rows white, the scale's grey, the rest unlit.
          else lamps[id] = isRoot(cell.pitch, set.scale) ? lamp('lit', 'white', 'dim') : inScale(cell.pitch, set.scale) ? GREY : OFF;
        }
      }

    if (!state.repeat.on) for (let r = 1; r <= 8; r++) lamps[`scene-${r}`] = lamp(state.seq.step === r - 1 ? 'lit' : 'dim');
    const page = pageInView(state, set, steps);
    lamps['page-left'] = lamp(page > 0 ? 'dim' : 'off');
    lamps['page-right'] = lamp(page < loopPages(state, set, steps) - 1 ? 'dim' : 'off');
    if (layout === 'melodic') {
      const low = rowPitch(state, set, 8);
      const high = rowPitch(state, set, 1);
      lamps['octave-up'] = lamp(high + 12 <= 127 ? 'dim' : 'off');
      lamps['octave-down'] = lamp(low - 12 >= 0 ? 'dim' : 'off');
      paint.strip = { kind: 'range', from: low / 128, to: (high + 1) / 128 };
      lamps.strip = lamp('lit');
    }
  },
};

/* ---------- held steps and the encoders ---------- */

/** The notes the held steps and a silently held drum pad stand for. */
export function heldNotes(state: PushState, set: PushSet): { notes: Note[]; steps: { start: number }[]; keys: string[] } {
  const clip = seqClip(set)?.clip;
  const length = stepBeats(state);
  const { kind, device } = instrumentKind(selectedTrack(set));
  const notes: Note[] = [];
  const steps: { start: number }[] = [];
  const keys: string[] = [];
  for (const [id, h] of Object.entries(state.held)) {
    if (h.step) {
      notes.push(...notesAt(clip, h.step.start, length, h.step.pitch ?? (kind === 'drums' ? device?.selectedPad : undefined)));
      steps.push({ start: h.step.start });
      keys.push(id);
    } else if (h.drum !== undefined) {
      // Every step of the pad.
      notes.push(...(clip?.notes ?? []).filter((n) => n.pitch === h.drum));
      keys.push(id);
    }
  }
  return { notes, steps, keys };
}

/** Held steps turn the encoders to those steps: the notes' own parameters in Clip View, a parameter's automation at their time in Device View. */
export const stepEdit: Layer = {
  name: 'step-edit',
  active: (state, set) => padLayout(state, set) !== 'session' && Object.values(state.held).some((h) => h.step || h.drum !== undefined) && !('select' in state.held),
  step(ctx) {
    const { input, state, set, target } = ctx;
    const encoder = target ? indexOf(target.id, 'encoder') : undefined;
    if (encoder === undefined) return false;
    const held = heldNotes(state, set);
    use(ctx, ...held.keys);
    if (input.kind !== 'turn') return true;
    const steps = input.value ?? 0;
    const length = stepBeats(state);
    if (state.display === 'device') {
      const p = deviceColumns(state, set)[encoder - 1];
      if (p) for (const step of held.steps) turnParameter(ctx, p, steps, { track: trackId(set), automation: { start: step.start, length } });
      return true;
    }
    if (state.display !== 'clip') return true;
    const p = noteParams(instrumentKind(selectedTrack(set)).kind === 'drums')[encoder - 1];
    if (p && held.notes.length) push(ctx, 'set-note', { ...about(set), notes: held.notes.map((n) => n.id), [p.key]: { delta: steps * (shift(ctx) ? p.fine : p.step) } });
    return true;
  },
  paint(paint) {
    const { state, set } = paint;
    if (state.display !== 'clip') return;
    const held = heldNotes(state, set);
    const starts = held.steps.map((s) => s.start);
    const colour = seqClip(set)?.clip.colour ?? selectedTrack(set).colour;
    paint.screen = screen('step-edit', {
      top: [{ label: held.steps.length ? `${held.steps.length} step${held.steps.length === 1 ? '' : 's'}` : 'All steps', colour, selected: true }, null, null, null, null, null, null, null],
      bottom: paint.screen.bottom,
      body: noteParams(instrumentKind(selectedTrack(set)).kind === 'drums').map((p, i) => noteParamCell(p, held.notes, i + 1, { colour })),
    });
    void starts;
    void clamp;
  },
};
