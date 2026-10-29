// LoopGrid's model: a folded set over eight track columns, and the tree both renderers draw.
// No framework: `LoopGrid.tsx` (React) and `LoopGrid.svelte` (Svelte) both pass `loopGridView`
// and `loopGridHandlers` to their `Tree`. The grid holds no state: a cell asks for `onLaunch`,
// a song header for `onToggleSong`, a stop pie for `onStopTrack`, the master stop for `onStop`.
// Live's session view is the behaviour reference (folded scenes, column-aligned tracks, a stop
// row with one stop per track plus stop-all); the cells' pies are
// LoopPie wedges drawn inline, so this model needs no registered component.
import type { HueSlot } from '../../core/hue';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView } from '../../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { loopWedge } from '../LoopPie/LoopPie.model';
import type { LiveCell, LiveCellRef, LiveLoop, LiveSong, LiveTrack } from '../live.model';
import type { LoopGridForm } from './LoopGrid.forms';

/** Every LoopGrid prop (the grid has no framework children). */
export interface LoopGridModelProps {
  /** The set's songs, top to bottom; an `open` song shows its tracks under it. */
  songs: readonly LiveSong[];
  /** The track columns, left to right; the widest `cells.length` wins, never fewer than eight. */
  tracks: readonly LiveTrack[];
  /** The stop row's own loop: where the set is. */
  loop: LiveLoop;
  /** The selected track's id: it keeps a rule under its name. */
  selected?: string;
  /** A cell was launched. */
  onLaunch?: (cell: LiveCellRef) => void;
  /** The stop row's stop was pressed. */
  onStop?: () => void;
  /** A track header was selected. */
  onSelectTrack?: (id: string) => void;
  /** A song header was folded or unfolded. */
  onToggleSong?: (id: string) => void;
  /** A track's stop pie was pressed (Live's per-track stop under the grid). */
  onStopTrack?: (trackId: string) => void;
  /** Shown, dimmed, deaf: the set is drawn but nothing fires. */
  disabled?: boolean;
  /** Classes added to the root, after the grid's own. */
  className?: string;
}

/** A cell's accessible name: track, slot and state. */
export const cellName = (track: string, cell: LiveCell): string =>
  cell.name ? `${track} ${cell.name}, ${cell.state}` : `${track} slot, ${cell.state}`;

function pieNode(phase: number, hue: HueSlot | undefined, part: string): Node {
  const at = Math.max(0, Math.min(1, phase));
  return h(
    'svg',
    { class: 'yh-loopgrid__pie', viewBox: '0 0 10 10', 'aria-hidden': 'true', 'data-part': part },
    h('circle', { class: 'yh-loopgrid__track', cx: '5', cy: '5', r: '4.5' }),
    at <= 0
      ? null
      : at >= 1
        ? h('circle', { class: 'yh-loopgrid__wedge', cx: '5', cy: '5', r: '5', 'data-hue': hue === undefined ? undefined : String(hue) })
        : h('path', { class: 'yh-loopgrid__wedge', d: loopWedge(at), 'data-hue': hue === undefined ? undefined : String(hue) }),
  );
}

function cellNode(track: LiveTrack, cell: LiveCell, inert: boolean): Node {
  const surface = surfaceView({ material: 'key', radius: 'control', className: 'yh-loopgrid__cell' });
  const live = cell.state === 'playing' || cell.state === 'queued' || cell.state === 'recording';
  const name = textView({ role: 'caption', tone: cell.state === 'empty' ? 'faint' : undefined, className: 'yh-loopgrid__cellname' });
  return wire(
    h(
      'button',
      {
        class: surface.className,
        ...surface.attrs,
        type: 'button',
        'data-part': 'cell',
        'data-state': cell.state,
        'data-hue': String(track.hue),
        'data-track': track.id,
        'data-cell': cell.id,
        'aria-label': cellName(track.name, cell),
        'aria-disabled': inert ? 'true' : undefined,
      },
      live && cell.phase !== undefined ? pieNode(cell.phase, track.hue, 'pie') : null,
      cell.name ? h('span', { class: name.className, ...name.attrs, 'data-part': 'cellname' }, cell.name) : null,
      cell.state === 'recording' && cell.bars !== undefined
        ? h('span', { class: name.className, ...name.attrs, 'data-part': 'bars' }, String(cell.bars))
        : null,
    ),
    { on: { click: `cell:${track.id}:${cell.id}` } },
  );
}

function trackNode(track: LiveTrack, selected: string | undefined, inert: boolean, cells: number): Node {
  const name = textView({ role: 'label', leading: 'tight', className: 'yh-loopgrid__trackname' });
  const padded: readonly (LiveCell | null)[] = Array.from({ length: cells }, (_, i) => track.cells[i] ?? null);
  return h(
    'div',
    {
      class: 'yh-loopgrid__track',
      'data-part': 'track',
      'data-track': track.id,
      'data-hue': String(track.hue),
      'data-selected': track.id === selected ? 'true' : undefined,
      'data-parked': track.parked ? 'true' : undefined,
    },
    wire(
      h(
        'button',
        {
          class: 'yh-loopgrid__trackhead',
          type: 'button',
          'data-part': 'trackhead',
          'data-selected': track.id === selected ? 'true' : undefined,
          'aria-label': `select ${track.name}`,
          'aria-current': track.id === selected ? 'true' : undefined,
          'aria-disabled': inert ? 'true' : undefined,
        },
        h('span', { class: 'yh-loopgrid__mark', 'data-part': 'mark', 'aria-hidden': 'true' }),
        h('span', { class: name.className, ...name.attrs, 'data-part': 'trackname' }, track.name),
      ),
      { on: { click: `track:${track.id}` } },
    ),
    each(padded, (_, i) => `c${i}`, (cell) =>
      cell === null
        ? h('span', { class: 'yh-loopgrid__cell yh-loopgrid__cell--hole', 'data-part': 'hole', 'aria-hidden': 'true' })
        : cellNode(track, cell, inert),
    ),
  );
}

function songNode(song: LiveSong, inert: boolean): Node {
  const name = textView({ role: 'label', leading: 'tight', className: 'yh-loopgrid__songname' });
  const meta = textView({ role: 'caption', tone: 'muted', className: 'yh-loopgrid__songmeta' });
  const bits = [song.tempo !== undefined ? `${song.tempo}` : null, song.key ?? null].filter((x) => x !== null).join(' · ');
  return wire(
    h(
      'button',
      {
        class: 'yh-loopgrid__song',
        type: 'button',
        'data-part': 'song',
        'data-song': song.id,
        'data-open': song.open ? 'true' : undefined,
        'aria-expanded': song.open ? 'true' : 'false',
        'aria-label': `${song.index} ${song.name}${song.open ? ', open' : ', folded'}`,
        'aria-disabled': inert ? 'true' : undefined,
      },
      h('span', { class: 'yh-loopgrid__chevron', 'data-part': 'chevron', 'aria-hidden': 'true' }, song.open ? '▾' : '▸'),
      h('span', { class: name.className, ...name.attrs, 'data-part': 'songname' }, `${song.index} ${song.name}`),
      song.summary && !song.open ? h('span', { class: meta.className, ...meta.attrs, 'data-part': 'summary' }, song.summary) : null,
      bits ? h('span', { class: meta.className, ...meta.attrs, 'data-part': 'songmeta' }, bits) : null,
    ),
    { on: { click: `song:${song.id}` } },
  );
}

/**
 * The tree LoopGrid draws: song headers, the open songs' track columns, and the pinned stop row:
 * one pie per track (its playing cell's phase, else 0), the set loop's phase, and the stop button.
 * `form` is the binding's: `full` keeps song headers, `rows` drops them.
 */
export function loopGridView({ songs, tracks, loop, selected, disabled, className, onStopTrack }: LoopGridModelProps, form: LoopGridForm): Node {
  const inert = disabled === true;
  const width = Math.max(8, ...tracks.map((t) => t.cells.length));
  const open = songs.filter((s) => s.open);
  const shown = form === 'rows' ? open : songs;
  const stopLabel = textView({ role: 'label', className: 'yh-loopgrid__stopname' });
  return h(
    'div',
    {
      class: `yh-loopgrid${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      'data-disabled': inert ? 'true' : undefined,
    },
    each(shown, (s) => s.id, (song) => songNode(song, inert)),
    each(open.length > 0 ? open : [], (s) => `t${s.id}`, (song) =>
      h(
        'div',
        { class: 'yh-loopgrid__columns', 'data-part': 'columns', 'data-song': song.id },
        each(tracks, (t) => t.id, (track) => trackNode(track, selected, inert, width)),
      ),
    ),
    h(
      'div',
      { class: 'yh-loopgrid__stop', 'data-part': 'stop' },
      each(tracks, (t) => t.id, (track) => {
        const playing = track.cells.find((c) => c.state === 'playing' || c.state === 'queued' || c.state === 'recording');
        const pie = pieNode(playing?.phase ?? 0, track.hue, 'stoppie');
        return h(
          'span',
          { class: 'yh-loopgrid__stopcell', 'data-part': 'stopcell', 'data-track': track.id },
          onStopTrack === undefined || inert
            ? pie
            : wire(
                h(
                  'button',
                  {
                    class: 'yh-loopgrid__stopcellbutton',
                    type: 'button',
                    'data-part': 'stopcellbutton',
                    'aria-label': `stop ${track.name}`,
                    'aria-disabled': inert ? 'true' : undefined,
                  },
                  pie,
                ),
                { on: { click: `stop:${track.id}` } },
              ),
        );
      }),
      h(
        'span',
        { class: 'yh-loopgrid__master', 'data-part': 'master' },
        pieNode(loop.phase, undefined, 'masterpie'),
        loop.bars !== undefined ? h('span', { class: stopLabel.className, ...stopLabel.attrs, 'data-part': 'bars' }, String(loop.bars)) : null,
      ),
      wire(
        h(
          'button',
          {
            class: 'yh-loopgrid__stopbutton',
            type: 'button',
            'data-part': 'stopbutton',
            'aria-label': 'stop all',
            'aria-disabled': inert ? 'true' : undefined,
          },
          '■',
        ),
        { on: { click: 'stop' } },
      ),
    ),
  );
}

/** The callbacks `loopGridView`'s tree names: launches, selects, folds and the stops. */
export function loopGridHandlers({ songs, tracks, onLaunch, onStop, onSelectTrack, onToggleSong, onStopTrack }: LoopGridModelProps): Handlers {
  const handlers: Handlers = {};
  songs.forEach((song) => {
    handlers[`song:${song.id}`] = () => onToggleSong?.(song.id);
  });
  tracks.forEach((track) => {
    handlers[`track:${track.id}`] = () => onSelectTrack?.(track.id);
    track.cells.forEach((cell) => {
      handlers[`cell:${track.id}:${cell.id}`] = () => onLaunch?.({ track: track.id, cell: cell.id });
    });
    handlers[`stop:${track.id}`] = () => onStopTrack?.(track.id);
  });
  handlers['stop'] = () => onStop?.();
  return handlers;
}
