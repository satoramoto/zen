// PushTwin's model: the Ableton Push under the player's hands, on screen, and the tree both
// renderers draw from it. No framework: `PushTwin.tsx` and `PushTwin.svelte` both pass
// `pushTwinView` and `pushTwinHandlers` to their `Tree`. The twin holds no state: what every pad is
// lit as comes in as props, a press only asks `onPad` / `onScene`.
import { h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { inkStyle, liveAxis, livePane, type StemInk } from '../live.model';
import { arc, polar } from '../polar';
import type { PushTwinForm } from './PushTwin.forms';

/** The one layout's eight rows, top to bottom: five of clips, a stop row, the sections, the transitions. */
export const PUSH_ROWS = ['clips', 'clips', 'clips', 'clips', 'clips', 'stop', 'sections', 'transitions'] as const;
export type PushRow = (typeof PUSH_ROWS)[number];

/** A clip pad's state: the launch cell's. */
export const PUSH_CELL_STATES = ['empty', 'stopped', 'queued', 'playing', 'recording'] as const;
export type PushCellState = (typeof PUSH_CELL_STATES)[number];

export interface PushCell {
  id: string;
  name?: string;
  state: PushCellState;
}

/** One column: its name and ink, its level (the encoder) and its clip cells (rows 1–5, top first). */
export interface PushTrack {
  id: string;
  name: string;
  ink: StemInk;
  /** 0–1; 0.75 is unity (0 dB). */
  level: number;
  cells: readonly PushCell[];
}

/** A pad as a press names it. */
export interface PushPadRef {
  row: PushRow;
  /** 0–7, left to right. */
  column: number;
  /** For a clip pad, its slot (0–4, top to bottom). */
  slot?: number;
}

export interface PushTwinProps {
  /** The eight columns: their clip cells fill rows 1–5, their levels the display's encoders. */
  tracks: readonly PushTrack[];
  /** Row 7's eight sections, and the index of the one playing. */
  sections: readonly string[];
  section: number;
  /** A section queued to come in on the phrase (blinks). */
  queuedSection?: number;
  /** Row 8's eight transitions ("cuts"), and the one held down, if any. */
  transitions: readonly string[];
  held?: string;
  /** The scene buttons right of the grid, and the index of the scene playing. */
  scenes: readonly string[];
  scene?: number;
  /** The selected column's track id: its display strip and its stop pad are marked. */
  selected?: string;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: PushTwinForm;
  /** A pad was pressed. Without it the pads are read-only. */
  onPad?: (pad: PushPadRef) => void;
  /** A scene button was pressed. Without it the scenes are read-only. */
  onScene?: (index: number) => void;
  className?: string;
}

const COLUMNS = 8;
const CLIP_ROWS = 5;

/** A level as the Push display reads it, in dB with 0.75 as unity: `+1.2`, `−3.5`, `−∞`. */
export function levelDb(level: number): string {
  if (level <= 0) return '−∞';
  const db = 20 * Math.log10(level / 0.75);
  const text = Math.abs(db).toFixed(1);
  return text === '0.0' ? '0.0' : `${db > 0 ? '+' : '−'}${text}`;
}

const f = (n: number): string => Number(n.toFixed(2)).toString();

/** The encoder: a 270° ring like MusicKnob's, its fill in the column's ink, a marker at the value. */
function encoder(level: number): Node {
  const v = Math.min(1, Math.max(0, level));
  const from = -0.375;
  const to = from + v * 0.75;
  const a = polar(0, 0, 2.5, to);
  const b = polar(0, 0, 7.5, to);
  return h(
    'svg',
    { class: 'live-push-encoder', viewBox: '-10 -10 20 20', 'aria-hidden': 'true' },
    h('path', { class: 'live-push-ring', d: arc(0, 0, 7.5, from, -from) }),
    when(v > 0.005, () => h('path', { class: 'live-push-fill', d: arc(0, 0, 7.5, from, to) })),
    h('line', { class: 'live-push-marker', x1: f(a.x), y1: f(a.y), x2: f(b.x), y2: f(b.y) }),
  );
}

const playing = (t: PushTrack | undefined): boolean => t?.cells.some((c) => c.state === 'playing' || c.state === 'recording') ?? false;

function pad(row: PushRow, column: number, slot: number | undefined, state: string, label: string, inert: boolean, ink: StemInk | undefined, extra: Record<string, string | undefined>, ...children: Node[]): Node {
  return wire(
    h(
      'button',
      {
        class: 'live-cell live-push-pad',
        type: 'button',
        'data-row': row,
        'data-state': state,
        disabled: inert ? '' : undefined,
        'aria-label': label,
        style: inkStyle(ink),
        ...extra,
      },
      ...children,
    ),
    { on: { click: `pad:${row}:${column}:${slot ?? ''}` } },
  );
}

const word = (text: string | undefined): Node[] => (text ? [h('span', { class: 'live-push-word' }, text)] : []);

/** The 64 pads, row by row: clips (each track's cells), stop per track, sections, transitions. */
function pads({ tracks, sections, section, queuedSection, transitions, held, selected, onPad }: PushTwinProps): Node[] {
  const out: Node[] = [];
  const none = onPad === undefined;
  for (let slot = 0; slot < CLIP_ROWS; slot++) {
    for (let c = 0; c < COLUMNS; c++) {
      const t = tracks[c];
      const cell = t?.cells[slot];
      const state = cell?.state ?? 'empty';
      const label = t ? `${t.name} clip ${slot + 1}${cell?.name ? `, ${cell.name}` : ''}, ${state}` : `Column ${c + 1} clip ${slot + 1}, no track`;
      out.push(pad('clips', c, slot, state, label, none || !t, t?.ink, {}, ...word(cell?.name)));
    }
  }
  for (let c = 0; c < COLUMNS; c++) {
    const t = tracks[c];
    const on = playing(t);
    out.push(
      pad('stop', c, undefined, on ? 'stopped' : 'empty', t ? `Stop ${t.name}, ${on ? 'playing' : 'silent'}` : `Stop ${c + 1}, no track`, none || !t, t?.ink, { 'data-selected': t && t.id === selected ? 'true' : undefined }, h('span', { class: 'live-push-glyph', 'aria-hidden': 'true' }, '■')),
    );
  }
  for (let c = 0; c < COLUMNS; c++) {
    const name = sections[c];
    const state = !name ? 'empty' : c === section ? 'on' : c === queuedSection ? 'queued' : 'stopped';
    const said = state === 'on' ? 'playing' : state === 'queued' ? 'queued' : state === 'empty' ? 'empty' : 'ready';
    out.push(pad('sections', c, undefined, state, `Section ${name ?? c + 1}, ${said}`, none || !name, undefined, {}, ...word(name)));
  }
  for (let c = 0; c < COLUMNS; c++) {
    const name = transitions[c];
    const state = !name ? 'empty' : name === held ? 'held' : 'stopped';
    out.push(pad('transitions', c, undefined, state, `Transition ${name ?? c + 1}, ${state === 'held' ? 'held' : state === 'empty' ? 'empty' : 'ready'}`, none || !name, undefined, {}, ...word(name)));
  }
  return out;
}

/**
 * The tree PushTwin draws. `full`: one grid whose first column is the row bands, the next eight
 * the pads (with the display's eight strips over them) and the last the scene buttons; the
 * display, bands, pads and scenes are subgrids of it, so their rows and columns are shared exactly.
 * `grid`: the 8×8 pads alone. Pads stay square either way. `form` is the binding's.
 */
export function pushTwinView(props: PushTwinProps, form: PushTwinForm): Node {
  const { tracks, scenes, scene, selected, onScene, className } = props;
  const full = form === 'full';
  const columns = Array.from({ length: COLUMNS }, (_, c) => tracks[c]);
  return livePane(
    'push',
    { class: className, 'data-form': form, 'aria-label': 'Push' },
    h(
      'div',
      { class: 'live-push-board', 'data-part': 'board' },
      when(full, () => h('span', { class: 'live-push-corner', 'aria-hidden': 'true' }, 'Push')),
      when(full, () =>
        h(
          'div',
          { class: 'live-push-display', 'data-part': 'display', role: 'group', 'aria-label': 'Display' },
          ...columns.map((t) =>
            t
              ? h(
                  'div',
                  { class: 'live-push-strip', style: inkStyle(t.ink), 'data-selected': t.id === selected ? 'true' : undefined, 'aria-label': `${t.name}, ${levelDb(t.level)} dB`, role: 'img' },
                  h('span', { class: 'live-push-name' }, t.name),
                  encoder(t.level),
                  h('span', { class: 'live-push-db' }, levelDb(t.level)),
                )
              : h('div', { class: 'live-push-strip', 'data-empty': 'true' }),
          ),
        ),
      ),
      when(full, () => liveAxis('Scene', { class: 'live-axis live-push-scene-head', 'aria-hidden': 'true' })),
      when(full, () =>
        h(
          'div',
          { class: 'live-push-bands', 'data-part': 'bands', 'aria-hidden': 'true' },
          liveAxis('Clips', { class: 'live-axis live-push-band', 'data-band': 'clips' }),
          liveAxis('Stop', { class: 'live-axis live-push-band', 'data-band': 'stop' }),
          liveAxis('Sections', { class: 'live-axis live-push-band', 'data-band': 'sections' }),
          liveAxis('Cuts', { class: 'live-axis live-push-band', 'data-band': 'transitions' }),
        ),
      ),
      h('div', { class: 'live-push-pads', 'data-part': 'pads', role: 'group', 'aria-label': 'Pads' }, ...pads(props)),
      when(full, () =>
        h(
          'div',
          { class: 'live-push-scenes', 'data-part': 'scenes', role: 'group', 'aria-label': 'Scenes' },
          ...Array.from({ length: COLUMNS }, (_, i) => {
            const name = scenes[i];
            const state = !name ? 'empty' : i === scene ? 'on' : 'stopped';
            return wire(
              h(
                'button',
                {
                  class: 'live-cell live-push-scene',
                  type: 'button',
                  'data-state': state,
                  disabled: onScene === undefined || !name ? '' : undefined,
                  'aria-label': name ? `Scene ${i + 1}, ${name}${state === 'on' ? ', playing' : ''}` : `Scene ${i + 1}, empty`,
                  'aria-current': state === 'on' ? 'true' : undefined,
                },
                h('span', { class: 'live-push-glyph', 'aria-hidden': 'true' }, state === 'on' ? '▶' : '▷'),
                ...word(name),
              ),
              { on: { click: `scene:${i}` } },
            );
          }),
        ),
      ),
    ),
  );
}

/** The callbacks the tree names: one per pad (`pad:<row>:<column>:<slot>`) and one per scene (`scene:<i>`). */
export function pushTwinHandlers({ onPad, onScene }: PushTwinProps): Handlers {
  const handlers: Handlers = {};
  PUSH_ROWS.forEach((row, r) => {
    const slot = row === 'clips' ? r : undefined;
    for (let column = 0; column < COLUMNS; column++) handlers[`pad:${row}:${column}:${slot ?? ''}`] = () => onPad?.(slot === undefined ? { row, column } : { row, column, slot });
  });
  for (let i = 0; i < COLUMNS; i++) handlers[`scene:${i}`] = () => onScene?.(i);
  return handlers;
}

