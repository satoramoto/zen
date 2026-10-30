// LaunchGrid's model: the looper's session grid in mix[flow]'s face, and the tree both renderers
// draw. No framework: `LaunchGrid.tsx` and `LaunchGrid.svelte` both pass `launchGridView` and
// `launchGridHandlers` to their `Tree`. DeckStrip's `play-grid` is the anatomy: a 16px axis row of
// names in their stem label colour, then 24px launch cells, a stop row with ■ per column. Tracks
// are the columns, loop slots the rows; the set's songs fold above it. The grid holds no state and
// runs no clock: a cell asks `onLaunch`, a column's name `onSelectTrack`, a song `onToggleSong`, a
// ■ `onStopTrack`, Stop `onStop`. A part with no callback is drawn but can't be pressed.
import { component, each, h, styleText, when, wire, type ChildArg, type Handlers, type Node } from '../../../view/Tree.model';
import { inkStyle, liveAxis, livePane, liveReading, type LiveTrackRef } from '../live.model';
import type { LaunchGridForm } from './LaunchGrid.forms';

/** What a loop slot is doing. */
export const LAUNCH_CELL_STATES = ['empty', 'stopped', 'queued', 'playing', 'recording'] as const;
export type LaunchCellState = (typeof LAUNCH_CELL_STATES)[number];

/** One loop slot of a track. */
export interface LaunchCell {
  id: string;
  /** The loop's name; an empty slot has none. */
  name?: string;
  state: LaunchCellState;
  /** 0–1, where a playing or recording loop is in its own length. */
  phase?: number;
  /** Bars recorded so far (a recording slot). */
  bars?: number;
}

/** One track column: its name, its stem ink and its slots, top to bottom. */
export interface LaunchTrack extends LiveTrackRef {
  cells: readonly LaunchCell[];
}

/** One song of the set: a folded header row over the grid. */
export interface LaunchSong {
  id: string;
  /** Its place in the set, from 1. */
  index: number;
  name: string;
  /** Unfolded: its header is marked open. */
  open: boolean;
  /** Its sections at a glance (`■■□`), shown while folded. */
  summary?: string;
  /** BPM. */
  tempo?: number;
  key?: string;
}

/** The set's own loop: where the whole set is in its cycle. */
export interface LaunchLoop {
  /** 0–1. */
  phase: number;
  /** Its length in bars, when it has one. */
  bars?: number;
}

/** A launched slot: its track's id and its own. */
export interface LaunchCellRef {
  track: string;
  cell: string;
}

export interface LaunchGridProps {
  /** The set's songs, top to bottom (only the `full` form draws them). */
  songs: readonly LaunchSong[];
  /** The track columns, left to right; the widest decides the rows (never fewer than `LAUNCH_GRID_MIN_ROWS`). */
  tracks: readonly LaunchTrack[];
  /** The set loop's phase, read under the stop row. */
  loop?: LaunchLoop;
  /** The selected track's id: its column's name is marked. */
  selected?: string;
  /** A slot was pressed: launch it (or record into it, when empty). */
  onLaunch?: (cell: LaunchCellRef) => void;
  /** Stop was pressed: stop every track. */
  onStop?: () => void;
  /** A track's ■ was pressed: stop that track. */
  onStopTrack?: (trackId: string) => void;
  /** A column's name was pressed: select that track. */
  onSelectTrack?: (trackId: string) => void;
  /** A song's header was pressed: fold or unfold it. */
  onToggleSong?: (songId: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: LaunchGridForm;
  className?: string;
}

/** The fewest slot rows the grid draws, however short its columns. */
export const LAUNCH_GRID_MIN_ROWS = 4;

/** How many slot rows `tracks` need: the widest column, never fewer than `LAUNCH_GRID_MIN_ROWS`. */
export const launchRows = (tracks: readonly LaunchTrack[]): number => Math.max(LAUNCH_GRID_MIN_ROWS, ...tracks.map((t) => t.cells.length));

const clamp01 = (v: number | undefined): number => (v === undefined || !Number.isFinite(v) ? 0 : Math.max(0, Math.min(1, v)));
const barsWord = (bars: number): string => `${bars} ${bars === 1 ? 'bar' : 'bars'}`;

/** The glyph a slot shows: mix[flow]'s ▶ playing, ◷ waiting for its launch, ▷ ready, ● recording. */
const GLYPH: Record<LaunchCellState, string> = { empty: '', stopped: '▷', queued: '◷', playing: '▶', recording: '●' };

/** A slot's accessible name: track, loop (or its slot number) and state. */
export const cellLabel = (track: string, cell: LaunchCell, row: number): string =>
  `${track} ${cell.name ?? `slot ${row + 1}`}, ${cell.state}${cell.state === 'recording' && cell.bars !== undefined ? ` ${barsWord(cell.bars)}` : ''}`;

/** The set loop's reading: the bar it is in of its bars, else a percentage. */
export function loopText({ phase, bars }: LaunchLoop): string {
  const at = clamp01(phase);
  return bars !== undefined && bars > 0 ? `${Math.min(bars, Math.floor(at * bars) + 1)}/${bars}` : `${Math.round(at * 100)}%`;
}

function songRow(song: LaunchSong, inert: boolean): Node {
  const meta = [song.tempo !== undefined ? `${song.tempo} BPM` : null, song.key ?? null].filter((x) => x !== null).join(' · ');
  return wire(
    h(
      'button',
      {
        class: 'live-launch-grid-song',
        type: 'button',
        'data-part': 'song',
        'data-song': song.id,
        'data-open': song.open ? 'true' : undefined,
        'aria-expanded': song.open ? 'true' : 'false',
        'aria-label': `${song.index} ${song.name}, ${song.open ? 'open' : 'folded'}`,
        disabled: inert ? '' : undefined,
      },
      h('span', { class: 'live-launch-grid-chevron', 'aria-hidden': 'true' }, song.open ? '▾' : '▸'),
      h('span', { class: 'live-launch-grid-index' }, String(song.index).padStart(2, '0')),
      h('span', { class: 'live-launch-grid-name' }, song.name),
      h('span', { class: 'live-launch-grid-summary' }, song.summary && !song.open ? song.summary : ''),
      h('span', { class: 'live-launch-grid-meta' }, meta),
    ),
    { on: { click: `song:${song.id}` } },
  );
}

function cellNode(track: LaunchTrack, cell: LaunchCell, row: number, inert: boolean): Node {
  const running = cell.state === 'playing' || cell.state === 'recording';
  return wire(
    h(
      'button',
      {
        class: 'live-cell live-launch-grid-cell',
        type: 'button',
        'data-part': 'cell',
        'data-state': cell.state,
        'data-track': track.id,
        'data-cell': cell.id,
        style: inkStyle(track.ink, running ? { '--live-phase': String(clamp01(cell.phase)) } : {}),
        'aria-label': cellLabel(track.name, cell, row),
        disabled: inert ? '' : undefined,
      },
      when(GLYPH[cell.state] !== '', () => h('span', { class: 'live-launch-grid-glyph', 'aria-hidden': 'true' }, GLYPH[cell.state])),
      when(cell.state === 'recording' && cell.bars !== undefined, () => h('span', { class: 'live-launch-grid-bars' }, barsWord(cell.bars!))),
      when(cell.name !== undefined && cell.state !== 'recording', () => h('span', { class: 'live-launch-grid-loopname' }, cell.name!)),
      when(running && cell.phase !== undefined, () => h('span', { class: 'live-launch-grid-phase', 'aria-hidden': 'true' })),
    ),
    { on: { click: `cell:${track.id}:${cell.id}` } },
  );
}

function trackHead(track: LaunchTrack, selected: boolean, inert: boolean): Node {
  return wire(
    h(
      'button',
      {
        class: 'live-launch-grid-track',
        type: 'button',
        'data-part': 'track',
        'data-track': track.id,
        'data-selected': selected ? 'true' : undefined,
        style: inkStyle(track.ink),
        'aria-label': `Select ${track.name}`,
        'aria-current': selected ? 'true' : undefined,
        disabled: inert ? '' : undefined,
      },
      track.name,
    ),
    { on: { click: `track:${track.id}` } },
  );
}

/** A Music button: the stop row's faces, as DeckStrip's. */
const stopButton = (label: string, key: string, inert: boolean, text: string, className: string): ChildArg => ({
  ...component('MusicButton', { label, disabled: inert, className }, { on: { onPress: key }, slots: { children: [text] } }),
  key,
});

function gridNode({ tracks, loop, selected, onLaunch, onStop, onStopTrack, onSelectTrack }: LaunchGridProps): Node {
  const rows = launchRows(tracks);
  return h(
    'div',
    {
      class: 'live-launch-grid-grid',
      'data-part': 'grid',
      role: 'group',
      'aria-label': 'Loops',
      style: styleText({ '--live-tracks': String(tracks.length), '--live-rows': String(rows) }),
    },
    h('span', { class: 'live-launch-grid-rule', 'aria-hidden': 'true' }),
    liveAxis('Slot', { class: 'live-axis live-launch-grid-corner' }),
    ...each(tracks, (t) => `head:${t.id}`, (t) => trackHead(t, t.id === selected, onSelectTrack === undefined)),
    ...Array.from({ length: rows }, (_, row) => [
      { ...liveAxis(String(row + 1), { class: 'live-axis live-launch-grid-row' }), key: `row:${row}` },
      ...tracks.map((t) => {
        const cell = t.cells[row];
        return cell === undefined
          ? { ...h('span', { class: 'live-launch-grid-hole', 'data-part': 'hole', 'aria-hidden': 'true' }), key: `hole:${t.id}:${row}` }
          : { ...cellNode(t, cell, row, onLaunch === undefined), key: `cell:${t.id}:${cell.id}` };
      }),
    ]),
    stopButton('Stop all', 'stop', onStop === undefined, 'Stop', 'live-launch-grid-stopall'),
    ...tracks.map((t) => stopButton(`Stop ${t.name}`, `stop:${t.id}`, onStopTrack === undefined, '■', 'live-launch-grid-stop')),
    when(loop !== undefined, () => [
      liveReading(loopText(loop!), { class: 'live-reading live-launch-grid-loopreading', 'data-part': 'loop-reading' }),
      h(
        'span',
        {
          class: 'live-launch-grid-loop',
          'data-part': 'loop',
          role: 'progressbar',
          'aria-label': loop!.bars ? `Set loop, bar ${loopText(loop!).split('/')[0]} of ${loop!.bars}` : 'Set loop',
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-valuenow': String(Math.round(clamp01(loop!.phase) * 100)),
          style: styleText({ '--live-phase': String(clamp01(loop!.phase)), '--live-bars': loop!.bars ? String(loop!.bars) : undefined }),
        },
        h('span', { class: 'live-launch-grid-loopfill' }),
      ),
    ]),
  );
}

/**
 * The tree LaunchGrid draws: in `full`, every song's folded header row (index, name, its sections'
 * summary, tempo · key); then the grid — the axis of track names, one row of slots per loop, the
 * stop row (Stop, then ■ per track) and the set loop's phase. `rows` draws the grid alone.
 * `form` is the binding's (`useForm` / `getForm`).
 */
export function launchGridView(props: LaunchGridProps, form: LaunchGridForm): Node {
  const { songs, tracks, className, onToggleSong } = props;
  return livePane(
    'launch-grid',
    { class: className, 'data-form': form, 'aria-label': 'Session' },
    when(form === 'full' && songs.length > 0, () =>
      h('div', { class: 'live-launch-grid-songs', 'data-part': 'songs', role: 'group', 'aria-label': 'Songs' }, ...each(songs, (s) => s.id, (s) => songRow(s, onToggleSong === undefined))),
    ),
    tracks.length > 0 ? gridNode(props) : h('p', { class: 'live-launch-grid-none', 'data-part': 'none' }, 'No tracks'),
  );
}

/** The callbacks the tree names: `song:<id>`, `track:<id>`, `cell:<track>:<cell>`, `stop:<track>`, `stop`. */
export function launchGridHandlers({ songs, tracks, onLaunch, onStop, onStopTrack, onSelectTrack, onToggleSong }: LaunchGridProps): Handlers {
  const handlers: Handlers = { stop: () => onStop?.() };
  for (const { id } of songs) handlers[`song:${id}`] = () => onToggleSong?.(id);
  for (const track of tracks) {
    handlers[`track:${track.id}`] = () => onSelectTrack?.(track.id);
    handlers[`stop:${track.id}`] = () => onStopTrack?.(track.id);
    for (const cell of track.cells) handlers[`cell:${track.id}:${cell.id}`] = () => onLaunch?.({ track: track.id, cell: cell.id });
  }
  return handlers;
}
