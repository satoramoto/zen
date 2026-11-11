// A track's options (Shift and its lower display button): Rename, Group, Freeze and Flatten on the
// lower display buttons, and the track colours on the pads. The colour picker on the pads is its
// own layer, since a clip and a drum pad are coloured the same way (openspec: push-mix-view,
// "Shift and a track's button opens its options"; push-theme, "The colour picker shows the table").
import { padAt, padId, indexOf } from '../layout';
import { trackById } from '../state';
import { holding, isDown, lamp, push, type Layer } from '../engine';
import type { PushSet, PushState, RowCell } from '../types';

/** The pads show the first sixty-four colours of the lamp table, in its order, from the top left. */
export const pickerColour = (row: number, col: number) => (row - 1) * 8 + (col - 1);

/** The outer ring of pads, clockwise from the top left: twenty-eight pads, for the table's first twenty-eight colours. */
export const RING: readonly [number, number][] = [
  ...Array.from({ length: 8 }, (_, i): [number, number] => [1, i + 1]),
  ...Array.from({ length: 6 }, (_, i): [number, number] => [i + 2, 8]),
  ...Array.from({ length: 8 }, (_, i): [number, number] => [8, 8 - i]),
  ...Array.from({ length: 6 }, (_, i): [number, number] => [7 - i, 1]),
];
const ringColour = (row: number, col: number) => RING.findIndex(([r, c]) => r === row && c === col);

/** The colour the thing being coloured has now. */
function currentColour(state: PushState, set: PushSet): number | undefined {
  const pick = state.colourPick;
  if (!pick) return undefined;
  const track = trackById(set, pick.track);
  if (pick.of === 'track') return track?.colour;
  if (pick.of === 'clip') return track?.clips[pick.scene ?? 0]?.colour;
  return track?.devices.flatMap((d) => d.pads ?? []).find((p) => p.note === pick.note)?.colour;
}

export const colourPicker: Layer = {
  name: 'colour-picker',
  active: (state) => !!state.colourPick && !holding(state, 'shift'),
  step(ctx) {
    const { state, input, target } = ctx;
    if (target?.kind !== 'pad') return false;
    if (input.kind === 'down') {
      const { row, col } = padAt(target.id)!;
      const { of, track, scene, note, device } = state.colourPick!;
      // A drum pad's colours are on the outer ring; a tap on one gives it and the grid returns to its layout.
      const colour = of === 'pad' ? ringColour(row, col) : pickerColour(row, col);
      if (colour >= 0) push(ctx, 'set-colour', { of, track, ...(scene === undefined ? {} : { scene }), ...(note === undefined ? {} : { note }), ...(device === undefined ? {} : { device }), colour });
      if (of !== 'track') delete state.colourPick;
      // The tap chose a colour: when it comes up it is not also a press of what the pad is underneath.
      state.held[target.id].used = true;
    }
    return true;
  },
  paint(paint) {
    const now = currentColour(paint.state, paint.set);
    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const colour = paint.state.colourPick!.of === 'pad' ? ringColour(row, col) : pickerColour(row, col);
        paint.lamps[padId(row, col)] = colour < 0 ? { state: 'off' } : lamp(colour === now ? 'pulse' : 'lit', colour);
        paint.notes[padId(row, col)] = null;
      }
  },
};

const OPTIONS = ['Rename', 'Group', 'Freeze', 'Flatten'] as const;

export const trackOptions: Layer = {
  name: 'track-options',
  // While Shift is still held the row is the tracks, so more can be added; let go, the options show.
  active: (state) => !!state.trackOptions?.length && !holding(state, 'shift'),
  step(ctx) {
    const { state, set, input, target } = ctx;
    const ids = state.trackOptions!;
    const track = trackById(set, ids[0]);
    const close = () => {
      delete state.trackOptions;
      delete state.colourPick;
    };
    if (!track) return close(), false;
    if (isDown(ctx, 'upper-1')) return close(), true;
    const lower = target ? indexOf(target.id, 'lower') : undefined;
    if (lower !== undefined) {
      if (input.kind !== 'down') return true;
      const option = OPTIONS[lower - 1];
      if (option === 'Rename') state.textEntry = { title: 'Rename Track', text: track.name, highlighted: 0, then: { kind: 'edit', action: 'rename', track: track.id } };
      else if (option === 'Group') push(ctx, 'group-tracks', { tracks: [...ids] });
      else if (option === 'Freeze' && !track.frozen) push(ctx, 'freeze-track', { track: track.id });
      else if (option === 'Flatten' && track.frozen) push(ctx, 'flatten-track', { track: track.id });
      else return true;
      close();
      return true;
    }
    if (target?.kind === 'pad' || target?.kind === 'encoder' || target?.id === 'shift') return false;
    // Any other button leaves the options and does its own job.
    if (input.kind === 'down' && target?.kind === 'button') close();
    return false;
  },
  paint(paint) {
    const { state, set } = paint;
    const track = trackById(set, state.trackOptions![0]);
    if (!track) return;
    const cell = (label: string, available = true): RowCell => ({ label, colour: track.colour, ...(available ? {} : { dim: true }) });
    paint.screen = {
      ...paint.screen,
      top: [{ label: '', icon: 'close' }, { label: state.trackOptions!.length > 1 ? `${state.trackOptions!.length} tracks` : track.name, colour: track.colour, selected: true }, null, null, null, null, null, null],
      bottom: [cell('Rename'), cell('Group'), cell('Freeze', !track.frozen), cell('Flatten', !!track.frozen), null, null, null, null],
      close: true,
    };
  },
};
