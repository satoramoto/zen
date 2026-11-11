// A Drum Rack on the pads: Loop Selector (drums, loop length, steps), 16 Velocities and 64 Pads
// (openspec: push-drum-mode; the drum sequencer of push-step-sequencing).
import { padAt, padId, indexOf } from '../layout';
import { VELOCITIES, isTriplet, loopPages, notesAt, pageBeats, pageInView, playingPage, playingStep, seqClip, seqScene, stepBeats, stepStart, stepsPerRow, velocityShade } from '../seq';
import { clamp, selectedTrack } from '../state';
import { holdJob, holding, isDouble, isDown, isUp, lamp, OFF, push, shift, use, type Combo, type Ctx, type Layer } from '../engine';
import type { Device, DrumPad, Lamp, PushSet, PushState, Track } from '../types';
import { instrumentKind, padLayout, repeatOf, type PadLayout } from './modes';
import { notify } from './overlays';

const GREY: Lamp = { state: 'lit', colour: 'white', shade: 'dark' };
const DRUM_LAYOUTS: PadLayout[] = ['loop-selector', '16-velocities', '64-pads'];

/** The lowest slice's note: slices play upward from C1. */
export const SLICE_BASE = 36;

/**
 * What the drum layouts play: the track's Drum Rack, or, for a Simpler in Slicing mode, its slices
 * read as pads (one per slice, the selected slice the selected pad).
 */
const rackOf = (set: PushSet): Device | undefined => {
  const { kind, device } = instrumentKind(selectedTrack(set));
  if (kind === 'drums') return device;
  if (kind !== 'slices' || !device) return undefined;
  const slices = device.sampler?.slices ?? [];
  return { ...device, pads: slices.map((_, i) => ({ note: SLICE_BASE + i, name: `Slice ${i + 1}` })), selectedPad: SLICE_BASE + (device.sampler?.selectedSlice ?? 0) };
};
const sliced = (set: PushSet) => instrumentKind(selectedTrack(set)).kind === 'slices';

/** Ask to select a pad: a Drum Rack's pad, or a slice. */
function selectPad(ctx: Ctx, note: number): void {
  const track = selectedTrack(ctx.set);
  const rack = rackOf(ctx.set)!;
  if (sliced(ctx.set)) push(ctx, 'select-slice', { track: track.id, device: rack.id, slice: note - SLICE_BASE });
  else push(ctx, 'select-drum-pad', { track: track.id, device: rack.id, note });
}
/** The lowest note of the sixteen pads in view. */
export const drumBase = (state: PushState, track: Track) => state.drums.base[track.id] ?? 36;

/** What a pad of the grid is in a drum layout. */
export type DrumCell =
  | { part: 'drum'; note: number }
  | { part: 'velocity'; index: number }
  | { part: 'loop'; page: number }
  | { part: 'step'; index: number }
  | { part: 'none' };

/** Whether the bottom right quarter shows velocities (true) or loop pages (false). */
function quarterIsVelocity(state: PushState, layout: PadLayout): boolean {
  const borrowed = holdJob(state, 'layout') || state.drums.borrow === 'locked';
  return (layout === '16-velocities') !== borrowed;
}

export function drumCell(state: PushState, set: PushSet, row: number, col: number): DrumCell {
  const layout = padLayout(state, set);
  const base = drumBase(state, selectedTrack(set));
  if (layout === '64-pads') {
    // Loop pages along the top row while Layout is held or locked.
    if (row === 1 && (holdJob(state, 'layout') || state.drums.borrow === 'locked')) return { part: 'loop', page: col - 1 };
    // Four blocks of sixteen: the pads in view stay bottom left.
    const block = (row <= 4 ? 2 : 0) + (col > 4 ? 1 : 0);
    return { part: 'drum', note: base + block * 16 + (3 - ((row - 1) % 4)) * 4 + ((col - 1) % 4) };
  }
  if (row >= 5 && col <= 4) return { part: 'drum', note: base + (8 - row) * 4 + (col - 1) };
  if (row >= 5) {
    if (quarterIsVelocity(state, layout)) return { part: 'velocity', index: (8 - row) * 4 + (col - 5) };
    return { part: 'loop', page: (row - 5) * 4 + (col - 5) };
  }
  if (col > stepsPerRow(state)) return { part: 'none' };
  return { part: 'step', index: (row - 1) * stepsPerRow(state) + (col - 1) };
}

const STEPS = (state: PushState) => stepsPerRow(state) * 4;
const padOf = (rack: Device | undefined, note: number): DrumPad | undefined => rack?.pads?.find((p) => p.note === note);
const cellAt = (ctx: Ctx): DrumCell | undefined => {
  const at = ctx.target ? padAt(ctx.target.id) : undefined;
  return at ? drumCell(ctx.state, ctx.set, at.row, at.col) : undefined;
};
const drumAt = (ctx: Ctx) => {
  const c = cellAt(ctx);
  return c?.part === 'drum' ? c.note : undefined;
};
const inDrums = (ctx: Ctx) => DRUM_LAYOUTS.includes(padLayout(ctx.state, ctx.set));
const onDrum = (ctx: Ctx) => inDrums(ctx) && drumAt(ctx) !== undefined;
const KICK = { press: 'pad-8-1' };

/** A drum pad's lamp: its state first, then its colour. */
function drumLamp(pad: DrumPad | undefined, rack: Device, track: Track, sounding: ReadonlySet<number>, kinds: boolean): Lamp {
  if (!pad || pad.empty) return GREY;
  if (sounding.has(pad.note)) return lamp('lit', 'play');
  if (rack.selectedPad === pad.note) return lamp('lit', 'white');
  if (pad.soloed) return lamp('lit', 'solo', 'dim');
  const colour = pad.colour ?? track.colour;
  if (pad.muted) return lamp('lit', colour, 'dark');
  // A kit that marks its pads by kind is shaded in the track's colour: kicks and toms plain, the rest in its other shades.
  if (kinds && pad.colour === undefined) return lamp('lit', track.colour, pad.kind === 'kick' || pad.kind === 'tom' ? 'lit' : pad.kind === 'snare' ? 'bright' : pad.kind === 'hat' ? 'light' : 'dim');
  return lamp('lit', colour);
}

const combos: Combo[] = [
  {
    id: 'select+drum-pad',
    hold: ['select'],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: 'Select the drum pad without sounding it',
    when: onDrum,
    run: (ctx) => {
      const note = drumAt(ctx)!;
      ctx.state.held[ctx.input.control].drum = note;
      const track = selectedTrack(ctx.set);
      selectPad(ctx, note);
      if (ctx.state.unfoldedTrack === track.id && !ctx.state.device.unfolded.includes(rackOf(ctx.set)!.id)) ctx.state.device.unfolded.push(rackOf(ctx.set)!.id);
    },
    example: KICK,
  },
  ...(['mute', 'solo'] as const).map((action): Combo => ({
    id: `${action}+drum-pad`,
    hold: [action],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: `${action === 'mute' ? 'Mute or unmute' : 'Solo or unsolo'} the drum pad, without sounding it`,
    when: onDrum,
    run: (ctx) => {
      const note = drumAt(ctx)!;
      const pad = padOf(rackOf(ctx.set), note);
      push(ctx, 'set-drum-pad', { track: selectedTrack(ctx.set).id, device: rackOf(ctx.set)!.id, note, [action === 'mute' ? 'muted' : 'soloed']: !(action === 'mute' ? pad?.muted : pad?.soloed) });
    },
    example: KICK,
  })),
  {
    id: 'delete+drum-pad',
    hold: ['delete'],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: 'Delete the drum pad’s notes from the clip when it has any, else the pad’s devices',
    when: onDrum,
    run: (ctx) => {
      const note = drumAt(ctx)!;
      const track = selectedTrack(ctx.set);
      const clip = seqClip(ctx.set);
      if (clip?.clip.notes?.some((n) => n.pitch === note)) push(ctx, 'delete-notes', { track: track.id, scene: clip.scene, pitch: note });
      else push(ctx, 'delete-drum-pad', { track: track.id, device: rackOf(ctx.set)!.id, note });
    },
    example: KICK,
  },
  {
    id: 'duplicate+drum-pad',
    hold: ['duplicate'],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: 'Pick up the drum pad’s devices; the next pad pressed takes a copy of them',
    when: onDrum,
    run: (ctx) => {
      const note = drumAt(ctx)!;
      const from = ctx.state.drums.copy;
      if (from === undefined) ctx.state.drums.copy = note;
      else {
        push(ctx, 'duplicate-drum-pad', { track: selectedTrack(ctx.set).id, device: rackOf(ctx.set)!.id, from, to: note });
        delete ctx.state.drums.copy;
      }
    },
    example: KICK,
  },
  {
    id: 'shift+drum-pad',
    hold: ['shift'],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: 'Show the colours on the outer ring of pads, to give the drum pad one',
    when: onDrum,
    run: (ctx) => void (ctx.state.colourPick = { of: 'pad', track: selectedTrack(ctx.set).id, device: rackOf(ctx.set)!.id, note: drumAt(ctx)! }),
    example: KICK,
  },
  {
    id: 'quantize+drum-pad',
    hold: ['quantize'],
    press: 'pad',
    mode: 'Note Mode, a Drum Rack',
    asks: 'Quantize the drum pad’s notes only',
    when: onDrum,
    run: (ctx) => push(ctx, 'quantize', { track: selectedTrack(ctx.set).id, scene: seqScene(ctx.set), pitch: drumAt(ctx)! }),
    example: KICK,
  },
  {
    id: 'mute+step',
    hold: ['mute'],
    press: 'pad',
    mode: 'Note Mode, a drum sequencer',
    asks: 'Mute or unmute the notes in the step, without removing them',
    when: (ctx) => inDrums(ctx) && cellAt(ctx)?.part === 'step',
    run: (ctx) => {
      const cell = cellAt(ctx) as { part: 'step'; index: number };
      const clip = seqClip(ctx.set);
      const rack = rackOf(ctx.set)!;
      const notes = notesAt(clip?.clip, stepStart(ctx.state, ctx.set, STEPS(ctx.state), cell.index), stepBeats(ctx.state), rack.selectedPad);
      if (notes.length) push(ctx, 'mute-notes', { track: selectedTrack(ctx.set).id, scene: clip!.scene, notes: notes.map((n) => n.id), muted: !notes.every((n) => n.muted) });
    },
    example: { press: 'pad-1-1' },
  },
  ...(['duplicate', 'delete'] as const).map((action): Combo => ({
    id: `${action}+loop-pad`,
    hold: [action],
    press: 'pad',
    mode: 'Note Mode, a drum sequencer',
    asks: action === 'delete' ? 'Clear the page of steps' : 'Pick up the page of steps; the next loop length pad pressed takes a copy, added to what is there',
    when: (ctx) => inDrums(ctx) && cellAt(ctx)?.part === 'loop',
    run: (ctx) => {
      const { page } = cellAt(ctx) as { part: 'loop'; page: number };
      const steps = STEPS(ctx.state);
      const length = pageBeats(ctx.state, steps);
      const about = { track: selectedTrack(ctx.set).id, scene: seqScene(ctx.set) };
      if (action === 'delete') push(ctx, 'clear-steps', { ...about, start: page * length, length });
      else if (ctx.state.seq.pageCopied === undefined) ctx.state.seq.pageCopied = page;
      else {
        push(ctx, 'copy-steps', { ...about, from: ctx.state.seq.pageCopied * length, to: page * length, length });
        delete ctx.state.seq.pageCopied;
      }
    },
    example: { press: 'pad-5-5' },
  })),
  {
    id: 'shift+layout',
    hold: ['shift'],
    press: 'layout',
    mode: 'Note Mode, a Drum Rack or a melodic sequencer',
    asks: 'Lock the borrowed controls (velocity pads, or the loop length pads) until Layout is pressed again',
    when: (ctx) => padLayout(ctx.state, ctx.set) !== 'session' && padLayout(ctx.state, ctx.set) !== '64-notes' && padLayout(ctx.state, ctx.set) !== 'none',
    run: (ctx) => {
      const layout = padLayout(ctx.state, ctx.set);
      if (layout === 'melodic' || layout === 'melodic-32') {
        const track = selectedTrack(ctx.set).id;
        ctx.state.seq.loopRows = { ...ctx.state.seq.loopRows, [track]: !ctx.state.seq.loopRows?.[track] };
      } else ctx.state.drums.borrow = ctx.state.drums.borrow === 'locked' ? undefined : 'locked';
    },
    example: { press: 'layout' },
  },
];

/** Tap a step of the drum sequencer: add the selected pad's note there, or remove the one that is. */
function toggleStep(ctx: Ctx, index: number): void {
  const { state, set } = ctx;
  const rack = rackOf(set)!;
  const pitch = rack.selectedPad ?? drumBase(state, selectedTrack(set));
  const clip = seqClip(set);
  const start = stepStart(state, set, STEPS(state), index);
  const length = stepBeats(state);
  const about = { track: selectedTrack(set).id, scene: seqScene(set) };
  const there = notesAt(clip?.clip, start, length, pitch);
  if (there.length) push(ctx, 'remove-note', { ...about, notes: there.map((n) => n.id) });
  else {
    push(ctx, 'add-note', { ...about, pitch, start, length, velocity: state.accent ? 127 : (state.seq.velocity ?? 100) });
    // A step added to a stopped Set starts it.
    if (!set.transport.playing) push(ctx, 'play');
  }
}

/** A loop length pad: with another held, the loop runs between them; a double tap is that page alone; a tap inside the loop locks the view, outside it sets the loop. */
export function loopPad(ctx: Ctx, page: number, steps: number): void {
  const { state, set, input } = ctx;
  const id = input.control;
  const length = pageBeats(state, steps);
  const about = { track: selectedTrack(set).id, scene: seqScene(set) };
  const setLoop = (from: number, to: number) => {
    push(ctx, 'set-loop', { ...about, start: Math.min(from, to) * length, end: (Math.max(from, to) + 1) * length });
    state.seq.follow = true;
  };
  if (input.kind === 'down') {
    state.held[id].page = page;
    const other = Object.entries(state.held).find(([key, h]) => key !== id && h.page !== undefined);
    if (other) {
      use(ctx, id, other[0]);
      setLoop(other[1].page!, page);
    } else if (isDouble(ctx)) {
      use(ctx, id);
      setLoop(page, page);
    }
    return;
  }
  if (input.kind !== 'up' || state.held[id]?.used) return;
  if (page < loopPages(state, set, steps)) {
    state.seq.follow = false;
    state.seq.page = page;
  } else setLoop(page, page);
}

/** A loop length pad's lamp. */
export function loopLamp(state: PushState, set: PushSet, page: number, steps: number): Lamp {
  if (page >= loopPages(state, set, steps) || !seqClip(set)) return OFF;
  const clip = seqClip(set)!.clip;
  if (playingPage(state, set, steps) === page) return lamp('lit', clip.state === 'recording' ? 'record' : 'play');
  return page === pageInView(state, set, steps) ? lamp('lit', 'white') : GREY;
}

export const drums: Layer = {
  name: 'drums',
  active: (state, set) => DRUM_LAYOUTS.includes(padLayout(state, set)),
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const track = selectedTrack(set);
    const rack = rackOf(set)!;
    const layout = padLayout(state, set);
    const steps = STEPS(state);

    // Layout: locked controls unlock on a press; otherwise it steps the layout (the layer below does), and held it borrows.
    if (target.id === 'layout' && isUp(ctx) && state.drums.borrow === 'locked' && state.held.layout && !state.held.layout.used && !state.held.layout.holding) {
      delete state.drums.borrow;
      return true;
    }

    // The scene buttons choose the step size, unless Repeat has them.
    const scene = indexOf(target.id, 'scene');
    if (scene !== undefined && !repeatOf(state, set).on && layout !== '64-pads') {
      if (input.kind === 'down') state.seq.step = scene - 1;
      return true;
    }

    // Octave Up and Down, and the strip, move the sixteen pads in view: a bank, or a row of four with Shift.
    if (isDown(ctx, 'octave-up') || isDown(ctx, 'octave-down')) {
      const by = (target.id === 'octave-up' ? 1 : -1) * (shift(ctx) ? 4 : 16);
      state.drums.base[track.id] = clamp(drumBase(state, track) + by, 0, 112);
      return true;
    }
    if (target.kind === 'strip') {
      if (input.kind === 'touch' || input.kind === 'move') state.drums.base[track.id] = clamp(4 + Math.round((input.value ?? 0) * 6.75) * 16, 0, 112);
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
    // Holding a page button turns following back on.
    if ((target.id === 'page-left' || target.id === 'page-right') && input.kind === 'up') {
      if (state.held[target.id]?.holding) state.seq.follow = true;
      return true;
    }

    if (target.kind !== 'pad') return false;
    const at = padAt(target.id)!;
    const cell = drumCell(state, set, at.row, at.col);
    const held = state.held[target.id];

    if (cell.part === 'drum') {
      if (input.kind === 'down') {
        held.note = cell.note;
        push(ctx, 'note-on', { pitch: cell.note, velocity: state.accent ? 127 : (input.velocity ?? 100), track: track.id, pad: target.id });
        if (rack.selectedPad !== cell.note) selectPad(ctx, cell.note);
      } else if (input.kind === 'up' && held?.note !== undefined) push(ctx, 'note-off', { pitch: held.note, track: track.id, pad: target.id });
      else if (input.kind === 'pressure' && held?.note !== undefined && set.unit.expression.mode !== 'off') push(ctx, 'pressure', { pitch: held.note, value: input.value ?? 0, track: track.id });
      return true;
    }
    if (cell.part === 'velocity') {
      const velocity = VELOCITIES[cell.index];
      const pitch = rack.selectedPad ?? drumBase(state, track);
      if (input.kind === 'down') {
        // With a step held, the velocity pad sets that step's notes; else it plays, and the next step takes it.
        const heldSteps = Object.entries(state.held).filter(([, h]) => h.step);
        if (heldSteps.length) {
          const clip = seqClip(set);
          const notes = heldSteps.flatMap(([, h]) => notesAt(clip?.clip, h.step!.start, stepBeats(state), pitch));
          use(ctx, ...heldSteps.map(([key]) => key));
          if (notes.length) push(ctx, 'set-note', { track: track.id, scene: clip!.scene, notes: notes.map((n) => n.id), velocity });
          return true;
        }
        state.seq.velocity = velocity;
        held.note = pitch;
        push(ctx, 'note-on', { pitch, velocity, track: track.id, pad: target.id });
      } else if (input.kind === 'up' && held?.note !== undefined) push(ctx, 'note-off', { pitch: held.note, track: track.id, pad: target.id });
      return true;
    }
    if (cell.part === 'loop') {
      loopPad(ctx, cell.page, steps);
      return true;
    }
    if (cell.part === 'step') {
      if (input.kind === 'down') held.step = { start: stepStart(state, set, steps, cell.index) };
      // A tap acts when the step comes up, so a held step can be edited instead.
      else if (input.kind === 'up' && held && !held.used) toggleStep(ctx, cell.index);
      return true;
    }
    return true;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const track = selectedTrack(set);
    const rack = rackOf(set)!;
    const layout = padLayout(state, set);
    const steps = STEPS(state);
    const clip = seqClip(set)?.clip;
    const sound = new Set(set.sounding ?? []);
    for (const h of Object.values(state.held)) if (h.note !== undefined) sound.add(h.note);
    const kinds = (rack.pads ?? []).some((p) => p.kind !== undefined);
    const colour = clip?.colour ?? track.colour;
    const playing = playingStep(state, set, steps);
    const pitch = rack.selectedPad ?? drumBase(state, track);

    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const id = padId(row, col);
        const cell = drumCell(state, set, row, col);
        paint.notes[id] = cell.part === 'drum' ? cell.note : null;
        if (cell.part === 'drum') lamps[id] = drumLamp(padOf(rack, cell.note), rack, track, sound, kinds);
        else if (cell.part === 'velocity') lamps[id] = lamp('lit', track.colour, state.seq.velocity === VELOCITIES[cell.index] ? 'bright' : cell.index < 6 ? 'dark' : cell.index < 11 ? 'dim' : 'lit');
        else if (cell.part === 'loop') lamps[id] = loopLamp(state, set, cell.page, steps);
        else if (cell.part === 'step') {
          const there = notesAt(clip, stepStart(state, set, steps, cell.index), stepBeats(state), pitch);
          if (state.held[id]) lamps[id] = lamp('lit', 'white');
          else if (playing === cell.index) lamps[id] = lamp('lit', clip?.state === 'recording' ? 'record' : 'play');
          else if (!there.length) lamps[id] = GREY;
          else if (there.every((n) => n.muted)) lamps[id] = lamp('lit', colour, 'light');
          else lamps[id] = lamp('lit', colour, velocityShade(Math.max(...there.map((n) => n.velocity))));
        } else lamps[id] = OFF;
      }

    if (layout !== '64-pads' && !repeatOf(state, set).on) for (let r = 1; r <= 8; r++) lamps[`scene-${r}`] = lamp(state.seq.step === r - 1 ? 'lit' : 'dim');
    const base = drumBase(state, track);
    lamps['octave-up'] = lamp(base < 112 ? 'dim' : 'off');
    lamps['octave-down'] = lamp(base > 0 ? 'dim' : 'off');
    paint.strip = { kind: 'range', from: base / 128, to: (base + 16) / 128 };
    lamps.strip = lamp('lit');
    const page = pageInView(state, set, steps);
    const pages = loopPages(state, set, steps);
    lamps['page-left'] = lamp(layout !== '64-pads' && page > 0 ? 'dim' : 'off');
    lamps['page-right'] = lamp(layout !== '64-pads' && page < pages - 1 ? 'dim' : 'off');
    void isTriplet;
    void holding;
    void notify;
  },
};

/** Where slice `k` (from 0) sits: the left half in rows of four from the bottom, then the right half the same way. */
export function slicePad(k: number): { row: number; col: number } | undefined {
  if (k < 0 || k >= 64) return undefined;
  const half = k < 32 ? 0 : 1;
  const within = k % 32;
  return { row: 8 - Math.floor(within / 4), col: 1 + half * 4 + (within % 4) };
}
const sliceAt = (row: number, col: number) => (col > 4 ? 32 : 0) + (8 - row) * 4 + ((col - 1) % 4);

/** 64 Slices: one lit pad per slice of a sliced sample. */
export const slices: Layer = {
  name: '64-slices',
  active: (state, set) => padLayout(state, set) === '64-slices',
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (target?.kind !== 'pad') return false;
    const { row, col } = padAt(target.id)!;
    const k = sliceAt(row, col);
    const device = rackOf(set)!;
    const track = selectedTrack(set).id;
    const held = state.held[target.id];
    if (k >= (device.sampler?.slices?.length ?? 0)) return true;
    if (input.kind === 'down') {
      held.note = SLICE_BASE + k;
      if (!holding(state, 'select')) push(ctx, 'note-on', { pitch: SLICE_BASE + k, velocity: state.accent ? 127 : (input.velocity ?? 100), track, pad: target.id });
      if (device.sampler?.selectedSlice !== k) push(ctx, 'select-slice', { track, device: device.id, slice: k });
    } else if (input.kind === 'up' && held?.note !== undefined && !holding(state, 'select')) push(ctx, 'note-off', { pitch: held.note, track, pad: target.id });
    return true;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const track = selectedTrack(set);
    const device = rackOf(set)!;
    const count = device.sampler?.slices?.length ?? 0;
    const sound = new Set(set.sounding ?? []);
    for (const h of Object.values(state.held)) if (h.note !== undefined) sound.add(h.note);
    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const k = sliceAt(row, col);
        const id = padId(row, col);
        paint.notes[id] = k < count ? SLICE_BASE + k : null;
        lamps[id] = k >= count ? OFF : sound.has(SLICE_BASE + k) ? lamp('lit', 'play') : device.sampler?.selectedSlice === k ? lamp('lit', 'white') : lamp('lit', track.colour);
      }
  },
};
