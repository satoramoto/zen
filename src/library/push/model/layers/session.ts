// Session: clips on the pads (Session Pad Mode, with its overview) and on the display (Session
// Screen Mode). Both show the same window of the Set (openspec: push-session).
import { indexOf, padAt, padId } from '../layout';
import { clamp, selectedTrack, visibleTracks } from '../state';
import { NOTICE_MS } from '../timing';
import { holdJob, holding, isDown, isUp, lamp, OFF, push, screen, shift, use, type Combo, type Ctx, type Layer } from '../engine';
import type { Clip, Lamp, PushSet, PushState, RowCell, Track } from '../types';
import { listChoose, listMove, nudged } from './dialogs';
import { padLayout, padMode, shownArmed } from './modes';
import { notify } from './overlays';

const tracksOf = (set: PushSet) => visibleTracks(set);
/** The window's top left, kept inside the Set. */
export function sessionWindow(state: PushState, set: PushSet): { track: number; scene: number } {
  return { track: clamp(state.session.track, 0, Math.max(0, tracksOf(set).length - 1)), scene: clamp(state.session.scene, 0, Math.max(0, set.scenes.length - 1)) };
}
/** The slot under a pad of the window: its track, its scene, and the clip there if any. */
export function slotAt(state: PushState, set: PushSet, row: number, col: number): { track?: Track; scene: number; clip?: Clip } {
  const w = sessionWindow(state, set);
  const track = tracksOf(set)[w.track + col - 1];
  const scene = w.scene + row - 1;
  return { track, scene, clip: scene < set.scenes.length ? (track?.clips[scene] ?? undefined) : undefined };
}

/** Move the window so a slot is inside it, moving it no further than it must. */
function reveal(state: PushState, track: number, scene: number): void {
  if (track < state.session.track) state.session.track = track;
  if (track > state.session.track + 7) state.session.track = track - 7;
  if (scene < state.session.scene) state.session.scene = scene;
  if (scene > state.session.scene + 7) state.session.scene = scene - 7;
}

/** In Control Mode, tell the app where the window is, so it can draw the Session Ring. */
function report(ctx: Ctx): void {
  if (ctx.set.unit.mode === 'control') push(ctx, 'move-session-ring', { track: ctx.state.session.track, scene: ctx.state.session.scene, tracks: 8, scenes: 8 });
}

function moveWindow(ctx: Ctx, tracks: number, scenes: number): void {
  const { state, set } = ctx;
  const before = `${state.session.track},${state.session.scene}`;
  state.session.track = clamp(state.session.track + tracks, 0, Math.max(0, tracksOf(set).length - 1));
  state.session.scene = clamp(state.session.scene + scenes, 0, Math.max(0, set.scenes.length - 1));
  if (before !== `${state.session.track},${state.session.scene}`) report(ctx);
}

/** A slot's lamp: the clip's colour, green while queued (blinking) or playing (pulsing), red while recording or waiting to on an armed track. */
export function slotLamp(state: PushState, set: PushSet, track: Track | undefined, scene: number, clip: Clip | undefined): Lamp {
  if (!track || scene >= set.scenes.length) return OFF;
  if (!clip) return track.kind !== 'group' && (track.armed || (shownArmed(state, set, track) && padMode(state) === 'note')) ? lamp('lit', 'record', 'dim') : OFF;
  if (clip.state === 'recording' || clip.state === 'queued-record') return lamp(clip.state === 'recording' ? 'lit' : 'blink', 'record');
  if (clip.state === 'queued') return lamp('blink', 'queue');
  if (clip.state === 'playing') return lamp('pulse', 'play');
  if (clip.state === 'queued-stop') return lamp('blink', clip.colour);
  return lamp('lit', clip.colour);
}

/** What Duplicate and New ask alone: by the Workflow preference. */
export const workflow = (set: PushSet): 'scene' | 'clip' => (set.unit.preferences.Workflow?.value === 'Clip' ? 'clip' : 'scene');

/** Launch the selected scene, or the selected clip: which is the plain press depends on the workflow, and Shift gives the other. */
export function launchSelected(ctx: Ctx): void {
  const { set } = ctx;
  const scene = (workflow(set) === 'scene') !== shift(ctx);
  if (scene) push(ctx, 'launch-scene', { scene: set.selection.scene });
  else push(ctx, 'launch-clip', { track: set.selection.track, scene: set.selection.scene });
}

const overviewShown = (state: PushState) => holdJob(state, 'layout') || !!state.session.overviewLocked;
const onSessionPads = (ctx: Ctx) => padLayout(ctx.state, ctx.set) === 'session' && !overviewShown(ctx.state);
const padSlot = (ctx: Ctx) => {
  const at = ctx.target ? padAt(ctx.target.id) : undefined;
  return at ? slotAt(ctx.state, ctx.set, at.row, at.col) : undefined;
};
export const inSession = (state: PushState) => void (state.pads = 'session');
const FIRST = { press: 'pad-1-1', state: inSession };

const combos: Combo[] = [
  {
    id: 'select+clip-pad',
    hold: ['select'],
    press: 'pad',
    mode: 'Session Pad Mode',
    asks: 'Select the clip without launching it, and show its name',
    when: (ctx) => onSessionPads(ctx) && !!padSlot(ctx)?.track,
    run: (ctx) => {
      const { track, scene, clip } = padSlot(ctx)!;
      push(ctx, 'select-clip', { track: track!.id, scene });
      notify(ctx, clip ? clip.name || (clip.kind === 'midi' ? 'MIDI Clip' : 'Audio Clip') : 'Empty slot', `${track!.name}, scene ${scene + 1}`);
    },
    example: FIRST,
  },
  {
    id: 'delete+clip-pad',
    hold: ['delete'],
    press: 'pad',
    mode: 'Session Pad Mode',
    asks: 'Delete the clip',
    when: (ctx) => onSessionPads(ctx) && !!padSlot(ctx)?.clip,
    run: (ctx) => {
      const { track, scene } = padSlot(ctx)!;
      push(ctx, 'delete-clip', { track: track!.id, scene });
    },
    example: FIRST,
  },
  {
    id: 'duplicate+clip-pad',
    hold: ['duplicate'],
    press: 'pad',
    mode: 'Session Pad Mode',
    asks: 'Pick up the clip; the next pad pressed takes a copy of it',
    when: (ctx) => onSessionPads(ctx) && !!padSlot(ctx)?.track && (!!padSlot(ctx)?.clip || !!ctx.state.session.copied),
    run: (ctx) => {
      const { track, scene } = padSlot(ctx)!;
      const from = ctx.state.session.copied;
      if (!from) ctx.state.session.copied = { track: track!.id, scene };
      else {
        push(ctx, 'duplicate-clip', { from, to: { track: track!.id, scene } });
        delete ctx.state.session.copied;
      }
    },
    example: FIRST,
  },
  {
    id: 'shift+clip-pad',
    hold: ['shift'],
    press: 'pad',
    mode: 'Session Pad Mode',
    asks: 'Show the colours on the outer ring of pads, to give the clip one',
    when: (ctx) => onSessionPads(ctx) && !!padSlot(ctx)?.clip,
    run: (ctx) => {
      const { track, scene } = padSlot(ctx)!;
      ctx.state.colourPick = { of: 'clip', track: track!.id, scene };
    },
    example: FIRST,
  },
  {
    id: 'shift+layout-session',
    hold: ['shift'],
    press: 'layout',
    mode: 'Session Pad Mode',
    asks: 'Lock the Session Overview on the pads until Layout is pressed again',
    when: (ctx) => padLayout(ctx.state, ctx.set) === 'session',
    run: (ctx) => void (ctx.state.session.overviewLocked = !ctx.state.session.overviewLocked),
    example: { press: 'layout', state: inSession },
  },
];

/** Session Pad Mode and its overview. */
export const sessionPads: Layer = {
  name: 'session-pads',
  active: (state, set) => padLayout(state, set) === 'session',
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const overview = overviewShown(state);

    if (target.id === 'layout') {
      // Locked, a press of Layout unlocks the overview.
      if (isUp(ctx) && state.session.overviewLocked && state.held.layout && !state.held.layout.used && !state.held.layout.holding) delete state.session.overviewLocked;
      return true;
    }

    const scene = indexOf(target.id, 'scene');
    if (scene !== undefined) {
      if (input.kind !== 'down') return true;
      // In the overview a scene button is a further block of 64 scenes.
      if (overview) {
        if ((scene - 1) * 64 < set.scenes.length) state.session.overviewBank = scene - 1;
      } else if (sessionWindow(state, set).scene + scene - 1 < set.scenes.length) push(ctx, 'launch-scene', { scene: sessionWindow(state, set).scene + scene - 1 });
      return true;
    }

    if (isDown(ctx)) {
      const moves: Record<string, [number, number]> = { 'dpad-left': [-1, 0], 'dpad-right': [1, 0], 'dpad-up': [0, -1], 'dpad-down': [0, 1], 'page-left': [-8, 0], 'page-right': [8, 0], 'octave-up': [0, -8], 'octave-down': [0, 8] };
      const move = moves[target.id];
      if (move) return moveWindow(ctx, move[0], move[1]), true;
      if (state.display !== 'session' && (target.id === 'dpad-centre' || target.id === 'jog')) return launchSelected(ctx), true;
    }

    if (target.kind !== 'pad') return false;
    const at = padAt(target.id)!;
    if (overview) {
      if (input.kind === 'down') {
        const bank = (state.session.overviewBank ?? 0) * 64;
        const track = (at.col - 1) * 8;
        const sceneAt = bank + (at.row - 1) * 8;
        if (track < tracksOf(set).length && sceneAt < set.scenes.length) {
          state.session.track = track;
          state.session.scene = sceneAt;
          report(ctx);
        }
        use(ctx, 'layout');
      }
      return true;
    }
    if (input.kind !== 'down') return true;
    const slot = slotAt(state, set, at.row, at.col);
    if (!slot.track || slot.scene >= set.scenes.length) return true;
    if (slot.clip) push(ctx, 'launch-clip', { track: slot.track.id, scene: slot.scene });
    else if (slot.track.armed) push(ctx, 'record-clip', { track: slot.track.id, scene: slot.scene });
    else push(ctx, 'stop-clip', { track: slot.track.id });
    return true;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const w = sessionWindow(state, set);
    const tracks = tracksOf(set);
    paint.strip = { kind: 'off' };
    lamps.strip = OFF;
    lamps.layout = lamp(state.session.overviewLocked ? 'lit' : 'dim');
    lamps.scale = OFF;
    if (overviewShown(state)) {
      const bank = (state.session.overviewBank ?? 0) * 64;
      for (let row = 1; row <= 8; row++)
        for (let col = 1; col <= 8; col++) {
          const track = (col - 1) * 8;
          const scene = bank + (row - 1) * 8;
          const id = padId(row, col);
          paint.notes[id] = null;
          if (track >= tracks.length || scene >= set.scenes.length) lamps[id] = OFF;
          else if (w.track >= track && w.track < track + 8 && w.scene >= scene && w.scene < scene + 8) lamps[id] = lamp('lit', 'white');
          else if (tracks.slice(track, track + 8).some((t) => t.playing !== undefined && t.playing >= scene && t.playing < scene + 8)) lamps[id] = lamp('lit', 'play');
          else lamps[id] = lamp('lit', 'white', 'dark');
        }
      for (let r = 1; r <= 8; r++) lamps[`scene-${r}`] = (r - 1) * 64 < set.scenes.length && set.scenes.length > 64 ? lamp((state.session.overviewBank ?? 0) === r - 1 ? 'lit' : 'dim') : OFF;
      return;
    }
    for (let row = 1; row <= 8; row++)
      for (let col = 1; col <= 8; col++) {
        const slot = slotAt(state, set, row, col);
        paint.notes[padId(row, col)] = null;
        lamps[padId(row, col)] = slotLamp(state, set, slot.track, slot.scene, slot.clip);
      }
    for (let r = 1; r <= 8; r++) {
      const scene = set.scenes[w.scene + r - 1];
      lamps[`scene-${r}`] = !scene ? OFF : scene.queued ? lamp('blink', 'queue') : lamp('dim', scene.colour ?? 'white');
    }
    // An arrow is lit only when there is somewhere to go that way.
    lamps['dpad-left'] = lamp(w.track > 0 ? 'dim' : 'off');
    lamps['dpad-right'] = lamp(w.track + 8 < tracks.length ? 'dim' : 'off');
    lamps['dpad-up'] = lamp(w.scene > 0 ? 'dim' : 'off');
    lamps['dpad-down'] = lamp(w.scene + 8 < set.scenes.length ? 'dim' : 'off');
    lamps['dpad-centre'] = lamp('dim');
    lamps['page-left'] = lamps['dpad-left'];
    lamps['page-right'] = lamps['dpad-right'];
    lamps['octave-up'] = lamps['dpad-up'];
    lamps['octave-down'] = lamps['dpad-down'];
  },
};

/* ---------- Session Screen Mode ---------- */

const trackAt = (ctx: Ctx) => {
  const col = ctx.target ? indexOf(ctx.target.id, 'upper') : undefined;
  return col === undefined ? undefined : tracksOf(ctx.set)[sessionWindow(ctx.state, ctx.set).track + col - 1];
};
const screenShown = (state: PushState) => state.display === 'session' || state.peek !== undefined;
const onScreen = (ctx: Ctx) => ctx.state.display === 'session' && !!trackAt(ctx);
const SCREEN = { press: 'upper-1', state: (state: PushState) => void (state.display = 'session') };

const screenCombos: Combo[] = [
  {
    id: 'delete+session-upper',
    hold: ['delete'],
    press: 'upper',
    mode: 'Session Screen Mode',
    asks: 'Delete the clip of the track above the button, in the selected scene',
    when: onScreen,
    run: (ctx) => push(ctx, 'delete-clip', { track: trackAt(ctx)!.id, scene: ctx.set.selection.scene }),
    example: SCREEN,
  },
  {
    id: 'duplicate+session-upper',
    hold: ['duplicate'],
    press: 'upper',
    mode: 'Session Screen Mode',
    asks: 'Pick up the clip of the track above the button in the selected scene; pressed again after moving the selection, paste it there',
    when: onScreen,
    run: (ctx) => {
      const to = { track: trackAt(ctx)!.id, scene: ctx.set.selection.scene };
      const from = ctx.state.session.copied;
      if (!from) ctx.state.session.copied = to;
      else {
        push(ctx, 'duplicate-clip', { from, to });
        delete ctx.state.session.copied;
      }
    },
    example: SCREEN,
  },
];

/** Ask to select the scene `by` away, and bring it into the window. */
function stepScene(ctx: Ctx, by: number): void {
  const { set, state } = ctx;
  const next = clamp(set.selection.scene + by, 0, set.scenes.length - 1);
  if (next === set.selection.scene) return;
  push(ctx, 'select-scene', { scene: next });
  const before = `${state.session.track},${state.session.scene}`;
  reveal(state, clamp(tracksOf(set).findIndex((t) => t.id === set.selection.track), 0, 999), next);
  if (before !== `${state.session.track},${state.session.scene}`) report(ctx);
}
function stepTrack(ctx: Ctx, by: number): void {
  const { set, state } = ctx;
  const tracks = tracksOf(set);
  const at = tracks.findIndex((t) => t.id === set.selection.track);
  const next = tracks[clamp(at + by, 0, tracks.length - 1)];
  if (!next || next.id === set.selection.track) return;
  push(ctx, 'select-track', { track: next.id });
  const before = `${state.session.track},${state.session.scene}`;
  reveal(state, tracks.indexOf(next), set.selection.scene);
  if (before !== `${state.session.track},${state.session.scene}`) report(ctx);
}

export const sessionScreen: Layer = {
  name: 'session-screen',
  active: screenShown,
  combos: screenCombos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (input.kind === 'tick') {
      if (state.peek !== undefined && input.time >= state.peek) delete state.peek;
      return false;
    }
    if (!target || state.display !== 'session') return false;
    const vertical = listMove(ctx, 'vertical');
    if (vertical) return stepScene(ctx, vertical), true;
    const sideways = nudged(ctx) || listMove(ctx, 'horizontal');
    if (sideways && target.id !== 'jog') return stepTrack(ctx, sideways), true;
    if (sideways) return stepTrack(ctx, sideways), true;
    if (listChoose(ctx)) return launchSelected(ctx), true;
    const upper = indexOf(target.id, 'upper');
    if (upper !== undefined) {
      const track = trackAt(ctx);
      if (input.kind === 'down' && track) push(ctx, 'launch-clip', { track: track.id, scene: set.selection.scene });
      return true;
    }
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const w = sessionWindow(state, set);
    const tracks = tracksOf(set);
    const names = state.touched.includes('jog');
    const rows = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => {
        const track = tracks[w.track + c];
        const scene = w.scene + r;
        const clip = scene < set.scenes.length ? track?.clips[scene] : undefined;
        const selected = track?.id === set.selection.track && scene === set.selection.scene;
        if (!clip) return selected ? { label: '', selected: true } : null;
        return { label: clip.name || (clip.kind === 'midi' ? 'MIDI Clip' : 'Audio Clip'), colour: clip.colour, state: clip.state, ...(selected ? { selected: true } : {}) };
      }),
    );
    const labels = Array.from({ length: 8 }, (_, r) => {
      const scene = set.scenes[w.scene + r];
      if (!scene) return '';
      const playing = tracks.some((t) => t.playing === w.scene + r) || scene.queued;
      return `${playing ? '▶ ' : ''}${names ? scene.name || String(w.scene + r + 1) : String(w.scene + r + 1)}`;
    });
    // The top row: the selected scene's clips, each launched by the button over it.
    const top: (RowCell | null)[] = Array.from({ length: 8 }, (_, c) => {
      const track = tracks[w.track + c];
      if (!track) return null;
      const clip = track.clips[set.selection.scene] ?? undefined;
      return { label: clip ? clip.name || track.name : '', colour: clip?.colour ?? track.colour, lamp: slotLamp(state, set, track, set.selection.scene, clip) };
    });
    paint.screen = screen('session', { top, bottom: paint.screen.bottom, body: [{ type: 'grid', col: 1, span: 8, rows, labels }] });
    if (state.display === 'session') {
      const at = tracks.findIndex((t) => t.id === set.selection.track);
      lamps['dpad-left'] = lamp(at > 0 ? 'dim' : 'off');
      lamps['dpad-right'] = lamp(at >= 0 && at < tracks.length - 1 ? 'dim' : 'off');
      lamps['dpad-up'] = lamp(set.selection.scene > 0 ? 'dim' : 'off');
      lamps['dpad-down'] = lamp(set.selection.scene < set.scenes.length - 1 ? 'dim' : 'off');
      lamps['dpad-centre'] = lamp('dim');
    }
    void holding;
    void selectedTrack;
  },
};

/** From Clip View, the D-pad's up and down step to the clip above or below: the grid shows for a moment, then Clip View returns. */
export function peekScene(ctx: Ctx, by: number): void {
  stepScene(ctx, by);
  ctx.state.peek = ctx.input.time + NOTICE_MS;
}
