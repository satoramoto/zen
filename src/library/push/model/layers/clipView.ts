// Clip View: the selected clip as a piano roll or a waveform, its loop and markers under the
// encoders, Note Edit mode, an audio clip's warp controls and edit options, and Convert
// (openspec: push-clip-view).
import { indexOf } from '../layout';
import { isTriplet, pageBeats, pageInView, seqClip, stepsPerRow } from '../seq';
import { activeClip, clamp, selectedDevice, selectedTrack } from '../state';
import { isDown, lamp, OFF, pressed, push, screen, shift, type Ctx, type Layer } from '../engine';
import type { BodyCell, Clip, Device, Note, PushSet, PushState, RowCell } from '../types';
import { listChoose, listMove } from './dialogs';
import { drumBase } from './drums';
import { rowPitch } from './melodic';
import { instrumentKind, padLayout } from './modes';
import { noteParamCell, noteParams } from './noteParams';
import { gather } from './params';

const WARP_MODES = ['Beats', 'Tones', 'Texture', 'Re-Pitch', 'Complex', 'Complex Pro'];

/** The clip Clip View shows: the selected track's playing clip, else the one in its selected slot. */
const shown = (set: PushSet): { clip: Clip; scene: number } | undefined => activeClip(set, selectedTrack(set));
const ordered = (clip: Clip): Note[] => [...(clip.notes ?? [])].sort((a, b) => a.start - b.start || a.pitch - b.pitch);
/** The highlighted note: the one remembered, else the first in clip order. */
function highlighted(state: PushState, clip: Clip): Note | undefined {
  const notes = ordered(clip);
  return notes.find((n) => n.id === state.clip.highlighted) ?? notes[0];
}
/** The notes an edit applies to: the selected ones and the highlighted one. */
function editing(state: PushState, clip: Clip): Note[] {
  const one = highlighted(state, clip);
  return ordered(clip).filter((n) => state.clip.selected.includes(n.id) || n.id === one?.id);
}

/** The part of the clip in view, in beats: all of it, narrowed by Zoom around the position last adjusted, and moved to keep the playhead in it. */
export function clipWindow(state: PushState, clip: Clip): { from: number; to: number } {
  const length = Math.max(clip.length, clip.loop.end, 0.25);
  const width = length / (1 + (state.clip.zoom ?? 0) * 15);
  let from = clamp((state.clip.zoomAt ?? 0) - width / 2, 0, Math.max(0, length - width));
  const playing = clip.state === 'playing' || clip.state === 'recording';
  if (playing && clip.position !== undefined && (clip.position < from || clip.position >= from + width)) from = clamp(Math.floor(clip.position / width) * width, 0, Math.max(0, length - width));
  return { from, to: from + width };
}

/** What Convert offers for what is selected. */
export function conversions(state: PushState, set: PushSet): { id: string; label: string }[] {
  const track = selectedTrack(set);
  const clip = shown(set)?.clip;
  if ((state.display === 'clip' || state.display === 'session') && clip?.kind === 'audio') {
    return [
      { id: 'simpler', label: 'Simpler' },
      { id: 'drum-pad', label: 'Drum Pad' },
      // Audio to MIDI is not in Live Intro.
      ...(set.unit.edition === 'intro' ? [] : [{ id: 'harmony-midi', label: 'Harmony-MIDI' }, { id: 'melody-midi', label: 'Melody-MIDI' }, { id: 'drums-midi', label: 'Drums-MIDI' }]),
    ];
  }
  const device: Device | undefined = selectedDevice(set);
  if (device?.kind === 'simpler') return [{ id: device.sampler?.mode === 'slicing' ? 'slices-to-drum-rack' : 'drum-rack', label: 'Drum Rack' }];
  const rack = track.devices.find((d) => d.kind === 'drum-rack');
  if (rack && device && rack.pads?.some((p) => p.devices?.some((d) => d.id === device.id))) return [{ id: 'pad-to-simpler', label: 'Simpler' }];
  if (track.kind === 'midi' && track.devices.length && !rack) return [{ id: 'devices-to-drum-rack', label: 'Drum Rack' }];
  return [];
}

function convertTo(ctx: Ctx, to: string): void {
  const slot = shown(ctx.set);
  push(ctx, 'convert', { track: ctx.set.selection.track, to, ...(slot && (to.endsWith('midi') || to === 'simpler' || to === 'drum-pad') ? { scene: slot.scene } : {}), ...(ctx.set.selection.device && !slot?.clip.audio ? { device: ctx.set.selection.device } : {}) });
}

/** Convert, wherever the device is: one conversion is asked at once, several are offered on the upper display buttons. */
export const convert: Layer = {
  name: 'convert',
  step(ctx) {
    const { state, set, input, target } = ctx;
    const offers = conversions(state, set);
    if (isDown(ctx, 'convert')) {
      if (state.clip.convert) delete state.clip.convert;
      else if (offers.length === 1) convertTo(ctx, offers[0].id);
      else if (offers.length > 1) state.clip.convert = true;
      return true;
    }
    if (!state.clip.convert) return false;
    const upper = target ? indexOf(target.id, 'upper') : undefined;
    if (upper === undefined) return false;
    if (input.kind === 'down') {
      if (upper === 1) delete state.clip.convert;
      else if (offers[upper - 2]) {
        convertTo(ctx, offers[upper - 2].id);
        delete state.clip.convert;
      }
    }
    return true;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const offers = conversions(state, set);
    lamps.convert = offers.length ? lamp(state.clip.convert ? 'lit' : 'dim') : OFF;
    if (!state.clip.convert || !offers.length) return;
    paint.screen = { ...paint.screen, top: [{ label: '', icon: 'close' }, ...offers.map((o): RowCell => ({ label: o.label })), ...Array.from({ length: 7 - offers.length }, () => null)], close: true };
  },
};

const beats = (v: number) => `${Math.floor(v / 4) + 1}.${Math.floor(v % 4) + 1}.${Math.round((v % 1) * 4) + 1}`;
/** A length as the unit words it: bars, beats and sixteenths, each from nought. */
const span = (v: number) => `${Math.floor(v / 4)}.${Math.floor(v % 4)}.${Math.round((v % 1) * 4)}`;
const value = (col: number, name: string, text: string, more: Partial<BodyCell> = {}): BodyCell => ({ type: 'param', col, name, value: text, fraction: 0, style: 'value', ...more }) as BodyCell;

/** The pitches the roll shows, highest first: every note's, and what the pads reach in a sequencer. */
function pitches(clip: Clip, low?: number, high?: number): number[] {
  const all = (clip.notes ?? []).map((n) => n.pitch);
  if (low !== undefined) all.push(low);
  if (high !== undefined) all.push(high);
  if (!all.length) return Array.from({ length: 12 }, (_, i) => 71 - i);
  const top = Math.max(...all);
  const bottom = Math.min(...all);
  return Array.from({ length: top - bottom + 1 }, (_, i) => top - i);
}

export const clipView: Layer = {
  name: 'clip-view',
  active: (state) => state.display === 'clip',
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const track = selectedTrack(set);
    const slot = shown(set);
    if (!slot) return false;
    const { clip, scene } = slot;
    const about = { track: track.id, scene };
    const c = state.clip;
    const upper = indexOf(target.id, 'upper');
    const encoder = indexOf(target.id, 'encoder');
    const fine = shift(ctx);

    /* ----- Note Edit mode ----- */
    if (c.noteEdit && clip.kind === 'midi') {
      const notes = ordered(clip);
      const move = listMove(ctx);
      if (move && notes.length) {
        const at = notes.findIndex((n) => n.id === highlighted(state, clip)?.id);
        c.highlighted = notes[clamp(at + move, 0, notes.length - 1)].id;
        return true;
      }
      if (listChoose(ctx)) {
        const one = highlighted(state, clip);
        if (one) c.selected = c.selected.includes(one.id) ? c.selected.filter((id) => id !== one.id) : [...c.selected, one.id];
        return true;
      }
      if (target.id === 'delete') {
        if (pressed(ctx, 'delete')) {
          const gone = c.selected.length ? [...c.selected] : highlighted(state, clip) ? [highlighted(state, clip)!.id] : [];
          if (gone.length) push(ctx, 'delete-notes', { ...about, notes: gone });
          c.selected = [];
        }
        return true;
      }
      if (upper !== undefined) {
        if (input.kind !== 'down') return true;
        if (upper === 2) c.selected = notes.map((n) => n.id);
        else if (upper === 3) c.selected = [];
        else if (upper === 8 || upper === 1) delete c.noteEdit;
        return true;
      }
      if (encoder !== undefined) {
        if (input.kind !== 'turn') return true;
        const p = noteParams(instrumentKind(track).kind === 'drums')[encoder - 1];
        const of = editing(state, clip);
        if (p && of.length) push(ctx, 'set-note', { ...about, notes: of.map((n) => n.id), [p.key]: { delta: (input.value ?? 0) * (fine ? p.fine : p.step) } });
        return true;
      }
      return false;
    }

    /* ----- an audio clip's edit options ----- */
    if (c.audioEdit !== undefined && clip.kind === 'audio') {
      const move = listMove(ctx);
      if (move) return (c.audioEdit = clamp(c.audioEdit + move * 0.25, 0, clip.length)), true;
      if (upper !== undefined) {
        if (input.kind !== 'down') return true;
        if (upper === 2) push(ctx, 'set-clip', { ...about, startAt: c.audioEdit });
        else if (upper === 3) push(ctx, 'set-clip', { ...about, warpToGrid: true });
        else if (upper === 8 || upper === 1) delete c.audioEdit;
        return true;
      }
      return encoder !== undefined;
    }

    // The jog wheel, turned or pressed, enters the edit mode of the clip's kind.
    if (target.id === 'jog' && (input.kind === 'turn' || input.kind === 'down')) {
      if (clip.kind === 'midi') c.noteEdit = true;
      else c.audioEdit = clip.position ?? 0;
      return true;
    }

    if (upper !== undefined) {
      if (input.kind !== 'down') return true;
      if (upper === 2) push(ctx, 'set-loop', { ...about, on: !clip.loop.on });
      else if (upper === 3 && clip.kind === 'midi') push(ctx, 'crop-clip', about);
      else if (upper === 6 && clip.audio) push(ctx, 'set-clip', { ...about, warp: !clip.audio.warp });
      else if (upper === 8) {
        if (clip.kind === 'midi') c.noteEdit = true;
        else c.audioEdit = clip.position ?? 0;
      }
      return true;
    }

    if (encoder !== undefined) {
      if (input.kind !== 'turn') return true;
      const steps = input.value ?? 0;
      const by = steps * (fine ? 0.25 : 1);
      if (encoder === 1) c.zoom = clamp((c.zoom ?? 0) + steps / 40, 0, 1);
      else if (clip.loop.on && encoder === 2) {
        push(ctx, 'set-loop', { ...about, start: Math.max(0, clip.loop.start + by), end: Math.max(0, clip.loop.start + by) + (clip.loop.end - clip.loop.start) });
        c.zoomAt = Math.max(0, clip.loop.start + by);
      } else if (clip.loop.on && encoder === 3) {
        push(ctx, 'set-loop', { ...about, end: Math.max(clip.loop.start + 0.25, clip.loop.end + by) });
        c.zoomAt = clip.loop.end + by;
      } else if (clip.loop.on && encoder === 4) {
        push(ctx, 'set-clip', { ...about, startMarker: Math.max(0, (clip.startMarker ?? 0) + by) });
        c.zoomAt = Math.max(0, (clip.startMarker ?? 0) + by);
      } else if (!clip.loop.on && encoder === 2) {
        push(ctx, 'set-clip', { ...about, startMarker: Math.max(0, (clip.startMarker ?? 0) + by) });
        c.zoomAt = Math.max(0, (clip.startMarker ?? 0) + by);
      } else if (!clip.loop.on && encoder === 3) {
        push(ctx, 'set-clip', { ...about, end: Math.max(0.25, clip.length + by) });
        c.zoomAt = clip.length + by;
      } else if (clip.audio && encoder === 6) {
        const moved = gather(state.notes, steps);
        const next = WARP_MODES[clamp(WARP_MODES.indexOf(clip.audio.warpMode ?? 'Beats') + moved, 0, WARP_MODES.length - 1)];
        if (moved && next !== clip.audio.warpMode) push(ctx, 'set-clip', { ...about, warpMode: next });
      } else if (clip.audio && encoder === 7) {
        // Semitones, between minus 48 and plus 48; cents with Shift.
        if (fine) push(ctx, 'set-clip', { ...about, detune: clamp(clip.audio.detune + steps, -50, 50) });
        else push(ctx, 'set-clip', { ...about, transpose: clamp(clip.audio.transpose + steps, -48, 48) });
      } else if (clip.audio && encoder === 8) push(ctx, 'set-clip', { ...about, gain: clamp(Math.round((clip.audio.gain + steps * (fine ? 0.1 : 1)) * 10) / 10, -70, 24) });
      return true;
    }
    return false;
  },
  paint(paint) {
    const { state, set } = paint;
    const track = selectedTrack(set);
    const slot = shown(set);
    const bottom = paint.screen.bottom;
    if (!slot) {
      // A named empty state; an empty audio slot invites a sample.
      const text = track.kind === 'audio' ? 'No Clip. Press Swap to load a sample.' : 'No Clip';
      paint.screen = screen('clip', { bottom, body: [{ type: 'text', col: 1, span: 8, text, size: 'value', align: 'centre', tone: 'dim' }] });
      return;
    }
    const { clip } = slot;
    const c = state.clip;
    const colour = clip.colour;
    const name: RowCell = { label: clip.name || (clip.kind === 'midi' ? 'MIDI Clip' : 'Audio Clip'), colour, selected: true };
    const window = clipWindow(state, clip);
    const length = Math.max(clip.length, clip.loop.end, 0.25);
    const playing = clip.state === 'playing' || clip.state === 'recording';
    const touched = (col: number) => (state.touched.includes(`encoder-${col}`) ? { touched: true } : {});

    let under: BodyCell;
    if (clip.kind === 'audio') {
      const at = (b: number) => clamp(b / length, 0, 1);
      under = {
        type: 'wave', col: 1, span: 8, under: true, colour, label: `${name.label} waveform`, peaks: clip.audio?.peaks ?? [], from: at(window.from), to: at(window.to),
        region: clip.loop.on ? [at(clip.loop.start), at(clip.loop.end)] : undefined,
        markers: [{ at: at(clip.startMarker ?? 0), kind: 'start' }, { at: at(clip.length), kind: 'end' }, ...(playing && clip.position !== undefined ? [{ at: at(clip.position), kind: 'playhead' as const }] : []), ...(c.audioEdit === undefined ? [] : [{ at: at(c.audioEdit), kind: 'cursor' as const }])],
      };
    } else {
      // With a sequencer on the pads, the roll marks what the pads reach and how full each pitch is.
      const layout = padLayout(state, set);
      const sequencing = layout === 'melodic' || layout === 'melodic-32' || layout === 'loop-selector' || layout === '16-velocities';
      let box: { from: number; to: number; low: number; high: number } | undefined;
      if (sequencing && seqClip(set)?.clip === clip) {
        const steps = stepsPerRow(state) * (layout === 'melodic' ? 1 : 4);
        const from = pageInView(state, set, steps) * pageBeats(state, steps);
        const low = layout === 'melodic' ? rowPitch(state, set, 8) : layout === 'melodic-32' ? Math.min(...(clip.notes ?? []).map((n) => n.pitch), 36) : drumBase(state, track);
        const high = layout === 'melodic' ? rowPitch(state, set, 1) : layout === 'melodic-32' ? Math.max(...(clip.notes ?? []).map((n) => n.pitch), 36) : drumBase(state, track) + 15;
        box = { from, to: from + pageBeats(state, steps), low, high };
      }
      const rows = pitches(clip, box?.low, box?.high);
      const kit = instrumentKind(track).kind === 'drums' ? instrumentKind(track).device : undefined;
      const one = c.noteEdit ? highlighted(state, clip) : undefined;
      under = {
        type: 'roll', col: 1, span: 8, under: true, colour, pitches: rows, from: window.from, to: window.to, beatsPerBar: set.transport.signature[0],
        notes: (clip.notes ?? []).map((n) => ({ id: n.id, pitch: n.pitch, start: n.start, length: n.length, velocity: n.velocity, ...(n.muted ? { muted: true } : {}), ...(kit ? { colour: kit.pads?.find((p) => p.note === n.pitch)?.colour ?? colour } : {}), ...(c.noteEdit && c.selected.includes(n.id) ? { selected: true } : {}), ...(one?.id === n.id ? { highlighted: true } : {}) })),
        ...(clip.loop.on ? { loop: [clip.loop.start, clip.loop.end] as [number, number] } : {}),
        markers: [{ at: clip.startMarker ?? 0, kind: 'start' }, { at: clip.length, kind: 'end' }],
        ...(playing && clip.position !== undefined ? { playhead: clip.position } : {}),
        ...(box ? { box, density: rows.map((pitch) => (clip.notes ?? []).filter((n) => n.pitch === pitch).length) } : {}),
      };
    }

    if (c.noteEdit && clip.kind === 'midi') {
      const of = editing(state, clip);
      paint.screen = screen('clip-notes', {
        top: [name, { label: 'Select All' }, { label: 'Deselect All' }, null, null, null, null, { label: 'Done', icon: 'check' }],
        bottom,
        body: [under, ...noteParams(instrumentKind(track).kind === 'drums').map((p, i) => ({ ...noteParamCell(p, of, i + 1, { colour, ...touched(i + 1) }), style: 'value' as const }))],
      });
      return;
    }
    if (c.audioEdit !== undefined && clip.kind === 'audio') {
      paint.screen = screen('clip-audio-edit', {
        top: [name, { label: 'Set 1.1.1' }, { label: 'Warp to Grid' }, null, null, null, null, { label: 'Done', icon: 'check' }],
        bottom,
        body: [under, value(1, 'Position', beats(c.audioEdit), { colour })],
      });
      return;
    }

    const box = (label: string, on: boolean): RowCell => ({ label, colour, icon: on ? 'switch-on' : 'switch-off', ...(on ? {} : { dim: true }) });
    const zoom: BodyCell = { type: 'param', col: 1, name: 'Zoom', value: `${Math.round((window.from / length) * 100)} to ${Math.round((window.to / length) * 100)} %`, fraction: (window.to - window.from) / length, style: 'bar', colour, ...touched(1) };
    const loop = clip.loop.on
      ? [value(2, 'Loop Position', beats(clip.loop.start), { colour, ...touched(2) }), value(3, 'Loop Length', span(clip.loop.end - clip.loop.start), { colour, ...touched(3) }), value(4, 'Start Offset', beats(clip.startMarker ?? 0), { colour, ...touched(4) })]
      : [value(2, 'Start', beats(clip.startMarker ?? 0), { colour, ...touched(2) }), value(3, 'End', beats(clip.length), { colour, ...touched(3) })];
    const audio = clip.audio
      ? [
          // The unit's columns: the three of an audio clip are the last three, under its Warp switch.
          value(6, 'Warp', clip.audio.warp ? (clip.audio.warpMode ?? 'Beats') : 'Off', { colour, ...(clip.audio.warp ? { choices: [...WARP_MODES], chosen: Math.max(0, WARP_MODES.indexOf(clip.audio.warpMode ?? 'Beats')) } : { disabled: true }), ...touched(6) }),
          value(7, 'Transpose', `${clip.audio.transpose} st${clip.audio.detune ? ` ${clip.audio.detune} ct` : ''}`, { colour, ...touched(7) }),
          value(8, 'Gain', `${clip.audio.gain.toFixed(1)} dB`, { colour, ...touched(8) }),
        ]
      : [];
    paint.screen = screen('clip', {
      // As on the unit: Loop a switch at the second button, Crop (a MIDI clip) at the third, Warp (an audio clip) a switch over its mode, Edit at the last.
      top: [name, box('Loop', clip.loop.on), clip.kind === 'midi' ? { label: 'Crop', colour } : null, null, null, clip.audio ? box('Warp', !!clip.audio.warp) : null, null, { label: 'Edit', colour }],
      bottom,
      body: [under, zoom, ...loop, ...audio],
    });
    void isTriplet;
  },
};
