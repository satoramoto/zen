// The device's starting state, and how the model reads a Set. Pure.
import type { Clip, Device, PushSet, PushState, Track } from './types';

/** A device as it is when switched on: Device View on the display, Note Mode on the pads. */
export function initialState(): PushState {
  return {
    display: 'device',
    pads: 'note',
    user: false,
    held: {},
    touched: [],
    mix: { mode: 'global', parameter: 0, page: 0 },
    device: { banks: {}, unfolded: [], page: 0 },
    clip: { selected: [] },
    session: { track: 0, scene: 0, workflow: 'scene' },
    notes: { octave: {}, layout: {}, shift: 0 },
    drums: { base: {} },
    seq: { step: 3, page: 0, follow: true, rowBase: {} },
    repeat: { on: false, interval: 3 },
    accent: false,
    trackPage: 0,
    browse: { path: [], highlight: 0, places: {} },
    sets: { highlight: 0, sort: 'date' },
    setup: { tab: 0, highlight: 0 },
    learn: { highlight: 0 },
    tempoMode: 'tempo',
  };
}

/** A copy a layer may change in place. The state is plain data, so JSON copies all of it. */
export const copyState = (state: PushState): PushState => JSON.parse(JSON.stringify(state)) as PushState;

/** Every track the Set has: tracks, then returns, then the Main track. */
export const everyTrack = (set: PushSet): Track[] => [...set.tracks, ...set.returns, set.main];

export const trackById = (set: PushSet, id: string | undefined): Track | undefined => everyTrack(set).find((t) => t.id === id);

/** The selected track, or the first one when the selection names none. */
export const selectedTrack = (set: PushSet): Track => trackById(set, set.selection.track) ?? set.tracks[0] ?? set.main;

/** The tracks in view: a folded group's children are hidden. */
export function visibleTracks(set: PushSet): Track[] {
  const folded = new Set(set.tracks.filter((t) => t.kind === 'group' && t.folded).map((t) => t.id));
  const hidden = (t: Track): boolean => {
    for (let p = t.parent; p; p = set.tracks.find((x) => x.id === p)?.parent) if (folded.has(p)) return true;
    return false;
  };
  return set.tracks.filter((t) => !hidden(t));
}

/** Every device on a track, with those inside Racks, depth first. */
export function everyDevice(devices: Device[]): Device[] {
  return devices.flatMap((d) => [d, ...everyDevice((d.chains ?? []).flatMap((c) => c.devices)), ...everyDevice((d.pads ?? []).flatMap((p) => p.devices ?? []))]);
}

export const deviceById = (track: Track | undefined, id: string | undefined): Device | undefined => (track && id ? everyDevice(track.devices).find((d) => d.id === id) : undefined);

/** The selected device of the selected track, or its first. */
export function selectedDevice(set: PushSet): Device | undefined {
  const track = selectedTrack(set);
  return deviceById(track, set.selection.device) ?? track.devices[0];
}

/** The first instrument on a track, looking inside nothing: what the pads play. */
export const instrumentOf = (track: Track): Device | undefined =>
  track.devices.find((d) => d.kind === 'instrument' || d.kind === 'instrument-rack' || d.kind === 'drum-rack' || d.kind === 'simpler' || d.kind === 'max');

/** The clip in the selected track's selected scene. */
export const selectedClip = (set: PushSet): Clip | undefined => selectedTrack(set).clips[set.selection.scene] ?? undefined;

/** The clip that is playing or recording on a track, else the selected slot's. */
export function activeClip(set: PushSet, track: Track = selectedTrack(set)): { clip: Clip; scene: number } | undefined {
  const scene = track.playing ?? set.selection.scene;
  const clip = track.clips[scene];
  return clip ? { clip, scene } : undefined;
}

export const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
