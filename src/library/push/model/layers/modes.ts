// What the pads are doing, worked out from the state and the Set: the one place that decides it,
// so every layer agrees.
import { holdJob } from '../engine';
import { instrumentOf, selectedTrack } from '../state';
import type { Device, PadMode, PushSet, PushState, Track } from '../types';

/** The pad layouts the unit has. */
export type PadLayout =
  | 'none' // nothing the pads can play
  | '64-notes' | 'melodic' | 'melodic-32' // a melodic instrument
  | 'loop-selector' | '16-velocities' | '64-pads' // a Drum Rack
  | '64-slices' // a sliced sample
  | 'session';

export const MELODIC_LAYOUTS = ['64-notes', 'melodic', 'melodic-32'] as const;
export const DRUM_LAYOUTS = ['loop-selector', '16-velocities', '64-pads'] as const;
export const LAYOUT_NAMES: Record<PadLayout, string> = {
  none: 'No instrument',
  '64-notes': '64 Notes',
  melodic: 'Melodic Sequencer',
  'melodic-32': 'Melodic Sequencer + 32 Notes',
  'loop-selector': 'Loop Selector',
  '16-velocities': '16 Velocities',
  '64-pads': '64 Pads',
  '64-slices': '64 Slices',
  session: 'Session',
};

/** What the pads do now: the mode chosen, or the other one while its button is held. */
export function padMode(state: PushState): PadMode {
  if (holdJob(state, 'session')) return 'session';
  if (holdJob(state, 'note')) return 'note';
  return state.pads;
}

/** What kind of thing the selected track gives the pads to play. */
export function instrumentKind(track: Track): { kind: 'none' | 'melodic' | 'drums' | 'slices'; device?: Device } {
  if (track.kind !== 'midi') return { kind: 'none' };
  const device = instrumentOf(track);
  if (!device) return { kind: 'none' };
  if (device.kind === 'drum-rack') return { kind: 'drums', device };
  if (device.kind === 'simpler' && device.sampler?.mode === 'slicing') return { kind: 'slices', device };
  return { kind: 'melodic', device };
}

/** The layouts Layout steps through on this track. */
export function layoutsFor(track: Track): readonly PadLayout[] {
  const { kind } = instrumentKind(track);
  if (kind === 'melodic') return MELODIC_LAYOUTS;
  if (kind === 'drums') return DRUM_LAYOUTS;
  if (kind === 'slices') return ['64-slices', ...DRUM_LAYOUTS.slice(0, 2)];
  return [];
}

/** The layout the pads show: Session, or the one remembered for the selected track (its first by default). */
export function padLayout(state: PushState, set: PushSet): PadLayout {
  if (padMode(state) === 'session') return 'session';
  const track = selectedTrack(set);
  const offered = layoutsFor(track);
  if (offered.length === 0) return 'none';
  const remembered = state.notes.layout[track.id] as PadLayout | undefined;
  return remembered && offered.includes(remembered) ? remembered : offered[0];
}
