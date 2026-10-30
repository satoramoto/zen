// SetlistRiver's model: the night as a timeline, and the tree both renderers draw from it. No
// framework: `SetlistRiver.tsx` and `SetlistRiver.svelte` both pass `setlistRiverView` and
// `setlistRiverHandlers` to their `Tree`. The river holds no state and runs no clock: where the
// set is comes in as `progress`, a pick only asks `onPick` / `onScene`.
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { liveHead, livePane } from '../live.model';
import type { SetlistRiverForm } from './SetlistRiver.forms';

/** Where a song stands in the night. A jam is a free stretch with no song of its own. */
export const SONG_STATES = ['done', 'now', 'cued', 'ahead', 'jam'] as const;
export type SongState = (typeof SONG_STATES)[number];

/** Where a scene of the song now stands. */
export const SCENE_STATES = ['played', 'playing', 'ahead'] as const;
export type SceneState = (typeof SCENE_STATES)[number];

export interface RiverScene {
  id: string;
  name: string;
  /** The song section it belongs to: `'verse'`. */
  section: string;
  state: SceneState;
}

export interface RiverSong {
  id: string;
  /** Its number in the setlist (a jam's is ignored). */
  index: number;
  name: string;
  /** `'C'`, `'Am'`; a jam has none. */
  key?: string;
  tempo: number;
  /** Planned length, in minutes: the segment's width on the river. */
  minutes: number;
  state: SongState;
  /** The song's scenes, opened under it while it is the song now. */
  scenes?: readonly RiverScene[];
}

export interface SetlistRiverProps {
  /** The night, in order: songs and jams. */
  songs: readonly RiverSong[];
  /** How far through the song now (0–1). */
  progress: number;
  /** Bars until the cued song lands, when one is cued. */
  barsToCue?: number;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: SetlistRiverForm;
  /** A song was picked: cue it (the app decides what a pick of the song now means). Without it the songs are read-only. */
  onPick?: (songId: string) => void;
  /** A scene of the song now was picked: launch it. Without it the scenes are read-only. */
  onScene?: (sceneId: string) => void;
  className?: string;
}

/** A scene's `.live-cell` state: played reads as an unlit well, playing filled `--primary`, ahead a plain face. */
const SCENE_CELL: Record<SceneState, string> = { played: 'off', playing: 'on', ahead: 'stopped' };
const SONG_WORD: Record<SongState, string> = { done: 'played', now: 'now', cued: 'cued', ahead: 'ahead', jam: 'jam' };

/** `6 bars`, `1 bar`. */
const bars = (n: number): string => `${n} bar${n === 1 ? '' : 's'}`;
const pct = (n: number): string => `${(n * 100).toFixed(3)}%`;
const num = (n: number): string => Number(n.toFixed(3)).toString();

/** Minutes as `m:ss`. */
export function clock(minutes: number): string {
  const s = Math.max(0, Math.round(minutes * 60));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The night's geometry: its length, where the playhead is (0–1 of the night), and each song's start. */
export function riverSpan(songs: readonly RiverSong[], progress: number): { total: number; at: number; starts: number[] } {
  const starts: number[] = [];
  let t = 0;
  for (const s of songs) {
    starts.push(t);
    t += Math.max(0, s.minutes);
  }
  const total = t;
  const now = songs.findIndex((s) => s.state === 'now');
  const p = Math.min(1, Math.max(0, progress));
  const done = songs.reduce((m, s, i) => (s.state === 'done' && (now < 0 || i < now) ? m + s.minutes : m), 0);
  const elapsed = now < 0 ? done : starts[now] + p * songs[now].minutes;
  return { total, at: total > 0 ? Math.min(1, elapsed / total) : 0, starts };
}

/** The tempo band the contour spans: a little room below the slowest song, more above the fastest for its label. */
export function tempoBand(songs: readonly RiverSong[]): { lo: number; hi: number } {
  if (!songs.length) return { lo: 60, hi: 140 };
  const tempos = songs.map((s) => s.tempo);
  const min = Math.min(...tempos);
  const max = Math.max(...tempos);
  const span = Math.max(max - min, 24);
  return { lo: min - span * 0.2, hi: max + span * 0.55 };
}

/** The tempo contour as a step path in a `total × 100` box: each song a plateau at its BPM (y down). */
export function contourPath(songs: readonly RiverSong[]): string {
  const { lo, hi } = tempoBand(songs);
  let x = 0;
  return songs
    .map((s, i) => {
      const y = num(100 - ((s.tempo - lo) / (hi - lo)) * 100);
      const from = x;
      x += Math.max(0, s.minutes);
      return `${i === 0 ? 'M' : 'L'}${num(from)} ${y}L${num(x)} ${y}`;
    })
    .join('');
}

/** The ruler's step: a tick every 2, 5 or 10 minutes, by the night's length. */
const rulerStep = (total: number): number => (total <= 20 ? 2 : total <= 60 ? 5 : 10);

function songLabel(s: RiverSong, barsToCue: number | undefined): string {
  if (s.state === 'jam') return `Jam, free, ${s.tempo} BPM`;
  const cue = s.state === 'cued' && barsToCue !== undefined ? `, in ${bars(barsToCue)}` : '';
  return `${s.index} ${s.name}${s.key ? `, ${s.key}` : ''}, ${s.tempo} BPM, ${SONG_WORD[s.state]}${cue}`;
}

/** One song's cell: its number and name over its key · tempo (a jam: `~` and `free`; the cued song its countdown). */
function songCell(s: RiverSong, barsToCue: number | undefined, inert: boolean, scenes: Node | null): Node {
  const jam = s.state === 'jam';
  return h(
    'li',
    { class: 'live-river-song', 'data-state': s.state, 'data-open': scenes ? 'true' : undefined },
    wire(
      h(
        'button',
        {
          class: 'live-river-face',
          type: 'button',
          'data-state': s.state,
          disabled: inert ? '' : undefined,
          'aria-current': s.state === 'now' ? 'step' : undefined,
          'aria-label': songLabel(s, barsToCue),
          title: jam ? 'Jam' : s.name,
        },
        h('span', { class: 'live-river-name' }, h('span', { class: 'live-river-index' }, jam ? '~' : String(s.index)), h('b', {}, s.name)),
        h(
          'span',
          { class: 'live-river-meta' },
          jam ? `free · ${s.tempo}` : `${s.key ?? '–'} · ${s.tempo}`,
          when(s.state === 'cued' && barsToCue !== undefined, () => h('span', { class: 'live-river-cue' }, ` · in ${bars(barsToCue ?? 0)}`)),
        ),
      ),
      { on: { click: `pick:${s.id}` } },
    ),
    scenes,
  );
}

/** The song now's scenes, launchable: mix[flow]'s launch cells, the playing one filled `--primary`. */
function sceneRow(s: RiverSong, inert: boolean): Node {
  return h(
    'div',
    { class: 'live-river-scenes', role: 'group', 'aria-label': `${s.name} scenes` },
    ...each(s.scenes ?? [], (sc) => sc.id, (sc) =>
      wire(
        h(
          'button',
          {
            class: 'live-cell live-river-scene',
            type: 'button',
            'data-state': SCENE_CELL[sc.state],
            'data-scene': sc.state,
            disabled: inert ? '' : undefined,
            'aria-current': sc.state === 'playing' ? 'true' : undefined,
            'aria-label': `${sc.name}, ${sc.section}, ${sc.state}`,
            title: `${sc.name} · ${sc.section}`,
          },
          h('span', { class: 'live-river-glyph', 'aria-hidden': 'true' }, sc.state === 'playing' ? '▶' : '▷'),
          h('span', { class: 'live-river-scene-name' }, sc.name),
        ),
        { on: { click: `scene:${sc.id}` } },
      ),
    ),
  );
}

/**
 * The tree SetlistRiver draws: (in `river`) a head with the song now and the night's clock, then
 * one body whose bands share one timeline — the tempo contour lane, the songs as one row of cells
 * as wide as their minutes (the song now opened into its scenes), the minute ruler — and one 1px
 * playhead through all of them. `strip` keeps the row of songs and the playhead. `form` is the
 * binding's (`useForm` / `getForm`).
 */
export function setlistRiverView({ songs, progress, barsToCue, onPick, onScene, className }: SetlistRiverProps, form: SetlistRiverForm): Node {
  const river = form === 'river';
  const { total, at, starts } = riverSpan(songs, progress);
  const minutes = total || 1;
  const cols = songs.length ? songs.map((s) => `minmax(0, ${num(Math.max(s.minutes, 0.001))}fr)`).join(' ') : 'minmax(0, 1fr)';
  const nowSong = songs.find((s) => s.state === 'now');
  const cued = songs.find((s) => s.state === 'cued');
  const played = at * total;
  const { lo, hi } = tempoBand(songs);
  const contour = contourPath(songs);
  const step = rulerStep(total);
  const ticks = total > 0 ? Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => i * step).filter((t) => t === 0 || total - t > step * 0.6) : [];
  const sub = nowSong ? `now ${nowSong.name}${cued ? ` · ${cued.name} ${barsToCue !== undefined ? `in ${bars(barsToCue)}` : 'cued'}` : ''}` : songs.length ? 'between songs' : 'no songs';
  const count = songs.filter((s) => s.state !== 'jam').length;

  return livePane(
    'river',
    { class: className, 'data-form': form, 'aria-label': 'Setlist', style: styleText({ '--river-at': pct(at), '--river-cols': cols }) },
    when(river, () => liveHead({ title: 'Setlist', sub, aside: `${clock(played)} / ${clock(total)} · ${count} songs` })),
    h(
      'div',
      { class: 'live-river-body', 'data-part': 'body' },
      when(river, () =>
        h(
          'div',
          { class: 'live-river-lane', 'data-part': 'contour', 'aria-hidden': 'true' },
          h(
            'svg',
            { class: 'live-river-contour', viewBox: `0 0 ${num(minutes)} 100`, preserveAspectRatio: 'none' },
            ...Array.from({ length: Math.floor(total) }, (_, m) => (m === 0 ? null : h('line', { class: 'live-river-minute', x1: String(m), x2: String(m), y1: '0', y2: '100' }))),
            ...starts.slice(1).map((x) => h('line', { class: 'live-river-bound', x1: num(x), x2: num(x), y1: '0', y2: '100' })),
            when(songs.length > 0, () => h('path', { class: 'live-river-fill', d: `${contour}L${num(total)} 100L0 100Z` })),
            when(songs.length > 0, () => h('path', { class: 'live-river-line', d: contour })),
            when(played > 0, () => h('rect', { class: 'live-river-past', x: '0', y: '0', width: num(played), height: '100' })),
          ),
          ...songs.map((s, i) =>
            h(
              'span',
              {
                class: 'live-river-bpm',
                'data-state': s.state,
                style: styleText({ left: pct(starts[i] / minutes), width: pct(s.minutes / minutes), bottom: pct((s.tempo - lo) / (hi - lo)) }),
              },
              String(s.tempo),
            ),
          ),
        ),
      ),
      h(
        'ol',
        { class: 'live-river-songs', 'data-part': 'songs', 'aria-label': 'Songs' },
        ...each(songs, (s) => s.id, (s) => songCell(s, barsToCue, onPick === undefined, river && s.state === 'now' && s.scenes?.length ? sceneRow(s, onScene === undefined) : null)),
      ),
      when(river, () =>
        h(
          'div',
          { class: 'live-river-ruler', 'data-part': 'ruler', 'aria-hidden': 'true' },
          ...ticks.map((t) => h('span', { class: 'live-river-tick', style: styleText({ left: pct(t / minutes) }) }, `${t}′`)),
          h('span', { class: 'live-river-end' }, `${num(Math.round(total * 10) / 10)}′`),
        ),
      ),
      when(total > 0, () => h('span', { class: 'live-river-playhead', 'data-part': 'playhead', 'aria-hidden': 'true' })),
    ),
  );
}

/** The callbacks the tree names: one pick per song (`pick:<id>`), one launch per scene (`scene:<id>`). */
export function setlistRiverHandlers({ songs, onPick, onScene }: SetlistRiverProps): Handlers {
  const handlers: Handlers = {};
  for (const s of songs) {
    handlers[`pick:${s.id}`] = () => onPick?.(s.id);
    for (const sc of s.scenes ?? []) handlers[`scene:${sc.id}`] = () => onScene?.(sc.id);
  }
  return handlers;
}
