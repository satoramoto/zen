// What the sequencers share (openspec: push-step-sequencing): step sizes, pages of steps, where a
// step is in the clip and which notes it holds. Pure functions over the Set's clip.
import { REPEAT_INTERVALS } from './layout';
import { activeClip, clamp, selectedTrack } from './state';
import type { Clip, Note, PushSet, PushState } from './types';

/** The step sizes the scene buttons choose, top to bottom, in beats. A triplet is two thirds of its plain value. */
export const STEP_BEATS = [0.125 * (2 / 3), 0.125, 0.25 * (2 / 3), 0.25, 0.5 * (2 / 3), 0.5, 1 * (2 / 3), 1] as const;
export const STEP_NAMES = REPEAT_INTERVALS;
export const DEFAULT_STEP = 3; // 1/16

export const stepBeats = (state: PushState) => STEP_BEATS[clamp(state.seq.step, 0, 7)];
/** A triplet step size uses six of a row's eight pads. */
export const isTriplet = (state: PushState) => state.seq.step % 2 === 0;
export const stepsPerRow = (state: PushState) => (isTriplet(state) ? 6 : 8);

/** The clip the sequencers edit: the selected track's playing clip, else its selected slot's. */
export const seqClip = (set: PushSet): { clip: Clip; scene: number } | undefined => activeClip(set, selectedTrack(set));
/** The slot a new note goes to when there is no clip yet. */
export const seqScene = (set: PushSet) => seqClip(set)?.scene ?? set.selection.scene;

/** How many beats a page of `steps` steps is. */
export const pageBeats = (state: PushState, steps: number) => stepBeats(state) * steps;

/** How many pages the clip's loop is, at `steps` steps a page (at least one, at most sixteen). */
export function loopPages(state: PushState, set: PushSet, steps: number): number {
  const clip = seqClip(set)?.clip;
  if (!clip) return 1;
  return clamp(Math.ceil((clip.loop.end - 1e-9) / pageBeats(state, steps)), 1, 16);
}

/** The page playback is on, or undefined when the clip is not playing. */
export function playingPage(state: PushState, set: PushSet, steps: number): number | undefined {
  const clip = seqClip(set)?.clip;
  if (!clip || (clip.state !== 'playing' && clip.state !== 'recording') || clip.position === undefined) return undefined;
  return Math.floor(clip.position / pageBeats(state, steps));
}

/** The page of steps in view: the playing one while following, else the one chosen. */
export function pageInView(state: PushState, set: PushSet, steps: number): number {
  const playing = playingPage(state, set, steps);
  const page = state.seq.follow && playing !== undefined ? playing : state.seq.page;
  return clamp(page, 0, 15);
}

/** Where a step of the page in view starts, in beats from the clip's start. */
export const stepStart = (state: PushState, set: PushSet, steps: number, index: number) => (pageInView(state, set, steps) * steps + index) * stepBeats(state);

/** The clip's notes that start within a step, optionally of one pitch. */
export function notesAt(clip: Clip | undefined, start: number, length: number, pitch?: number): Note[] {
  return (clip?.notes ?? []).filter((n) => n.start >= start - 1e-9 && n.start < start + length - 1e-9 && (pitch === undefined || n.pitch === pitch));
}

/** The step of the page in view that playback is on, or undefined. */
export function playingStep(state: PushState, set: PushSet, steps: number): number | undefined {
  const clip = seqClip(set)?.clip;
  if (!clip || playingPage(state, set, steps) !== pageInView(state, set, steps) || clip.position === undefined) return undefined;
  return Math.floor(clip.position / stepBeats(state)) % steps;
}

/** A note's brightness from its velocity. */
export const velocityShade = (velocity: number) => (velocity >= 100 ? 'bright' : velocity >= 60 ? 'lit' : 'dim') as 'bright' | 'lit' | 'dim';

/** The sixteen fixed velocities of the velocity pads, lowest first. */
export const VELOCITIES = Array.from({ length: 16 }, (_, i) => 8 * (i + 1) - 1);
