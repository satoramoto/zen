// The track row: the bottom row of every screen about the Set, and the buttons that act on tracks
// (openspec: push-mix-view, "The lower display buttons select tracks" onward; push-display, "The
// bottom row is the track row on Set screens").
import { indexOf } from '../layout';
import { clamp, instrumentOf, selectedTrack, trackById, visibleTracks } from '../state';
import { holdJob, isDouble, isDown, lamp, pressed, push, shift, type Combo, type Ctx, type Layer } from '../engine';
import type { Chain, DrumPad, PushSet, PushState, RowCell, Track } from '../types';

/** One thing in the track row: a track, or a chain or drum pad of the unfolded Rack track. */
export interface RowItem {
  track: Track;
  chain?: Chain;
  pad?: DrumPad;
  /** The Rack device a chain or pad belongs to. */
  rack?: string;
}

/** The screens whose bottom row is the track row. */
export const SET_SCREENS = ['device', 'mix', 'clip', 'session'];

/** Every thing the row can show, in order: tracks in view, an unfolded Rack's chains or pads after their track, then the returns. */
export function rowItems(state: PushState, set: PushSet): RowItem[] {
  const out: RowItem[] = [];
  for (const track of visibleTracks(set)) {
    out.push({ track });
    if (state.unfoldedTrack !== track.id) continue;
    const rack = instrumentOf(track);
    if (rack?.kind === 'drum-rack') for (const pad of rack.pads ?? []) if (!pad.empty) out.push({ track, pad, rack: rack.id });
    if (rack?.kind === 'instrument-rack') for (const chain of rack.chains ?? []) out.push({ track, chain, rack: rack.id });
  }
  for (const track of set.returns) out.push({ track });
  return out;
}

const isSelected = (item: RowItem, set: PushSet): boolean => {
  if (item.pad || item.chain) return false;
  return item.track.id === set.selection.track;
};

/** Where the selected thing is in the row. A selected drum pad or chain of the unfolded track counts. */
function selectedAt(items: RowItem[], state: PushState, set: PushSet): number {
  const track = selectedTrack(set);
  if (state.unfoldedTrack === track.id) {
    const rack = instrumentOf(track);
    const at = items.findIndex((i) => i.track.id === track.id && ((i.pad && i.pad.note === rack?.selectedPad && state.device.unfolded.includes(rack.id)) || false));
    if (at >= 0) return at;
  }
  return items.findIndex((i) => isSelected(i, set));
}

/** The first item in view: the page the device remembers, moved only as far as keeps the selection in view. */
export function rowStart(state: PushState, set: PushSet): number {
  const items = rowItems(state, set);
  const at = selectedAt(items, state, set);
  let start = clamp(state.trackPage, 0, Math.max(0, items.length - 8));
  if (at >= 0 && at < start) start = at;
  if (at >= start + 8) start = at - 7;
  return start;
}

/** The eight items in view. */
export const rowInView = (state: PushState, set: PushSet): (RowItem | undefined)[] => {
  const items = rowItems(state, set);
  const start = rowStart(state, set);
  return Array.from({ length: 8 }, (_, i) => items[start + i]);
};

const anySolo = (set: PushSet) => [...set.tracks, ...set.returns].some((t) => t.soloed);

/** A track that makes no sound now: muted, or left out by another track's solo. */
export const silent = (track: Track, set: PushSet) => !!track.muted || (anySolo(set) && !track.soloed && track.kind !== 'main') || !!track.mutedBySolo;

const ICONS = { midi: 'midi', audio: 'audio', group: 'group', return: 'return', main: 'main' } as const;

function trackCell(item: RowItem, state: PushState, set: PushSet, selectedIndex: boolean): RowCell {
  const { track, pad, chain } = item;
  if (pad) return { label: pad.name, colour: pad.colour ?? track.colour, icon: 'drum-rack', selected: selectedIndex, fold: 'child', ...(pad.muted ? { dim: true } : {}) };
  if (chain) return { label: chain.name, colour: chain.colour ?? track.colour, icon: 'rack', fold: 'child', ...(chain.muted ? { dim: true } : {}) };
  const rack = instrumentOf(track);
  const icon = rack?.kind === 'drum-rack' ? 'drum-rack' : rack?.kind === 'instrument-rack' ? 'rack' : ICONS[track.kind];
  const playing = track.playing === undefined ? undefined : track.clips[track.playing];
  const length = playing ? Math.max(0.0001, playing.loop.end - playing.loop.start) : 0;
  const open = (track.kind === 'group' && !track.folded) || state.unfoldedTrack === track.id;
  return {
    label: track.kind === 'return' ? track.name : track.name,
    colour: track.colour,
    icon,
    ...(selectedIndex ? { selected: true } : {}),
    ...(state.trackOptions?.includes(track.id) ? { lamp: { state: 'blink' as const, colour: track.colour } } : {}),
    ...(silent(track, set) ? { dim: true } : {}),
    ...(track.armed || track.implicitArm ? { armed: true } : {}),
    ...(playing && (playing.state === 'playing' || playing.state === 'recording') ? { progress: clamp((((playing.position ?? 0) - playing.loop.start) % length) / length, 0, 1) } : {}),
    ...(open ? { fold: 'open' as const } : track.parent ? { fold: 'child' as const } : {}),
  };
}

/** The track row as display cells. */
export function trackRow(state: PushState, set: PushSet): (RowCell | null)[] {
  const items = rowItems(state, set);
  const start = rowStart(state, set);
  const at = selectedAt(items, state, set);
  return Array.from({ length: 8 }, (_, i) => (items[start + i] ? trackCell(items[start + i], state, set, start + i === at) : null));
}

/** Ask to arm or disarm a track, disarming the others when the preference says arming is exclusive. */
export function askArm(ctx: Ctx, track: Track): void {
  const exclusive = ctx.set.unit.preferences['Exclusive Arm']?.value !== 'Off';
  push(ctx, 'arm', { track: track.id, on: !track.armed, ...(exclusive && !track.armed ? { exclusive: true } : {}) });
}
export function askSolo(ctx: Ctx, track: Track): void {
  const exclusive = ctx.set.unit.preferences['Exclusive Solo']?.value !== 'Off';
  push(ctx, 'solo', { track: track.id, on: !track.soloed, ...(exclusive && !track.soloed ? { exclusive: true } : {}) });
}
export const askMute = (ctx: Ctx, track: Track) => push(ctx, 'mute', { track: track.id, on: !track.muted });
export const askStop = (ctx: Ctx, track: Track) => push(ctx, 'stop-clip', { track: track.id });

/** The item under a lower display button, when this input presses one. */
function itemAt(ctx: Ctx): RowItem | undefined {
  const col = ctx.target ? indexOf(ctx.target.id, 'lower') : undefined;
  return col === undefined ? undefined : rowInView(ctx.state, ctx.set)[col - 1];
}

const rowShown = (ctx: Ctx) => SET_SCREENS.includes(ctx.state.display) && !ctx.state.device.bankList;
const example = { press: 'lower-5' };

const ACTIONS = { mute: askMute, solo: askSolo, 'stop-clip': askStop } as const;
const LOCK_NAMES = { mute: 'Mute', solo: 'Solo', 'stop-clip': 'Stop Clip' } as const;

const combos: Combo[] = [
  ...(['mute', 'solo', 'stop-clip'] as const).map((action): Combo => ({
    id: `${action}+lower`,
    hold: [action],
    press: 'lower',
    mode: 'A screen with the track row',
    asks: `${LOCK_NAMES[action]} the track above the button, leaving the selection as it is`,
    when: (ctx) => rowShown(ctx) && !!itemAt(ctx),
    run: (ctx) => ACTIONS[action](ctx, itemAt(ctx)!.track),
    example,
  })),
  {
    id: 'record+lower',
    hold: ['record'],
    press: 'lower',
    mode: 'A screen with the track row',
    asks: 'Arm or disarm the track above the button',
    when: (ctx) => rowShown(ctx) && !!itemAt(ctx),
    run: (ctx) => askArm(ctx, itemAt(ctx)!.track),
    example,
  },
  {
    id: 'duplicate+lower',
    hold: ['duplicate'],
    press: 'lower',
    mode: 'A screen with the track row',
    asks: 'Duplicate the track above the button',
    when: (ctx) => rowShown(ctx) && !!itemAt(ctx),
    run: (ctx) => push(ctx, 'duplicate-track', { track: itemAt(ctx)!.track.id }),
    example,
  },
  {
    id: 'delete+lower',
    hold: ['delete'],
    press: 'lower',
    mode: 'A screen with the track row',
    asks: 'Delete the track above the button',
    when: (ctx) => rowShown(ctx) && !!itemAt(ctx),
    run: (ctx) => push(ctx, 'delete-track', { track: itemAt(ctx)!.track.id }),
    example,
  },
  {
    id: 'shift+lower',
    hold: ['shift'],
    press: 'lower',
    mode: 'A screen with the track row',
    asks: 'Show the track’s options (Rename, Group, Freeze, Flatten) and its colours on the pads; a further track adds it for grouping',
    when: (ctx) => rowShown(ctx) && !!itemAt(ctx),
    run: (ctx) => {
      const id = itemAt(ctx)!.track.id;
      const marked = ctx.state.trackOptions ?? [];
      ctx.state.trackOptions = marked.includes(id) ? marked : [...marked, id];
      ctx.state.colourPick = { of: 'track', track: ctx.state.trackOptions[0] };
    },
    example,
  },
  ...(['mute', 'solo', 'stop-clip'] as const).map((action): Combo => ({
    id: `lock+${action}`,
    hold: ['lock'],
    press: action,
    mode: 'A screen with the track row',
    asks: `Lock ${LOCK_NAMES[action]} to the lower display buttons, until Lock or ${LOCK_NAMES[action]} is pressed again`,
    run: (ctx) => void (ctx.state.lock = ctx.state.lock === action ? undefined : action),
    example: { press: action },
  })),
];

export const tracks: Layer = {
  name: 'tracks',
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    const id = input.control;

    // Lock, pressed again, or the locked action's own button, unlocks.
    if (state.lock) {
      if (isDown(ctx, 'lock') || isDown(ctx, state.lock)) {
        delete state.lock;
        if (state.held[id]) state.held[id].used = true;
        return true;
      }
    }
    if (id === 'lock') return true;

    // Mute, Solo and Stop Clip alone act on the selected track, when they come up unused.
    for (const action of ['mute', 'solo', 'stop-clip'] as const) {
      if (id !== action) continue;
      if (pressed(ctx, action)) ACTIONS[action](ctx, selectedTrack(set));
      return true;
    }

    // Main selects the Main track; again, the track selected before.
    if (isDown(ctx, 'main')) {
      if (set.selection.track === set.main.id) {
        const back = trackById(set, state.beforeMain) ?? set.tracks[0];
        if (back) push(ctx, 'select-track', { track: back.id });
        delete state.beforeMain;
      } else {
        // The Main track's mixer is what Main shows.
        state.beforeMain = set.selection.track;
        state.display = 'mix';
        state.mix.mode = 'track';
        state.mix.io = false;
        push(ctx, 'select-track', { track: set.main.id });
      }
      return true;
    }

    if (!SET_SCREENS.includes(state.display)) return false;

    if (isDown(ctx, 'dpad-left') || isDown(ctx, 'dpad-right')) {
      if (state.display === 'session') return false;
      const items = rowItems(state, set);
      const at = selectedAt(items, state, set);
      const next = items[at + (id === 'dpad-left' ? -1 : 1)];
      if (next) select(ctx, next);
      return true;
    }

    const item = !state.device.bankList ? itemAt(ctx) : undefined;
    if (target && indexOf(target.id, 'lower') !== undefined && !state.device.bankList) {
      if (input.kind !== 'down' || !item) return true;
      if (state.lock) {
        ACTIONS[state.lock](ctx, item.track);
        return true;
      }
      // A second quick press arms the track.
      if (isDouble(ctx) && !item.pad && !item.chain) {
        askArm(ctx, item.track);
        return true;
      }
      const items = rowItems(state, set);
      const already = rowStart(state, set) + indexOf(target.id, 'lower')! - 1 === selectedAt(items, state, set);
      if (already && !item.pad && !item.chain) {
        // The selected track again: a group folds, a Rack track unfolds to its chains or pads.
        const rack = instrumentOf(item.track);
        if (item.track.kind === 'group') push(ctx, 'fold-track', { track: item.track.id, folded: !item.track.folded });
        else if (rack?.kind === 'drum-rack' || rack?.kind === 'instrument-rack') state.unfoldedTrack = state.unfoldedTrack === item.track.id ? undefined : item.track.id;
        return true;
      }
      select(ctx, item);
      return true;
    }
    void shift;
    void holdJob;
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const track = selectedTrack(set);
    const blink = (action: string) => state.lock === action;
    lamps.mute = blink('mute') ? lamp('blink', 'mute') : lamp(track.muted ? 'lit' : 'dim', 'mute');
    lamps.solo = blink('solo') ? lamp('blink', 'solo') : lamp(track.soloed ? 'lit' : 'dim', 'solo');
    lamps['stop-clip'] = blink('stop-clip') ? lamp('blink', 'stop') : lamp('dim', 'stop');
    lamps.lock = state.lock ? lamp('blink') : lamp('dim');
    lamps.main = lamp(set.selection.track === set.main.id ? 'lit' : 'dim');
    if (!SET_SCREENS.includes(state.display)) return;
    paint.screen.bottom = trackRow(state, set);
    if (state.display !== 'session') {
      const items = rowItems(state, set);
      const at = selectedAt(items, state, set);
      lamps['dpad-left'] = lamp(at > 0 ? 'dim' : 'off');
      lamps['dpad-right'] = lamp(at >= 0 && at < items.length - 1 ? 'dim' : 'off');
    }
  },
};

/** Ask to select what a row item is. */
function select(ctx: Ctx, item: RowItem): void {
  if (item.pad) {
    // Chosen from the row, the pad's own device is what the device then shows.
    push(ctx, 'select-drum-pad', { track: item.track.id, device: item.rack, note: item.pad.note, show: true });
    if (item.rack && !ctx.state.device.unfolded.includes(item.rack)) ctx.state.device.unfolded.push(item.rack);
  } else if (item.chain) push(ctx, 'select-chain', { track: item.track.id, device: item.rack, chain: item.chain.id });
  else push(ctx, 'select-track', { track: item.track.id });
}
