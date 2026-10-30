// ProgressionStrip's model: the progression loop the band follows, and the tree both renderers draw
// from it. No framework: `ProgressionStrip.tsx` and `ProgressionStrip.svelte` both pass
// `progressionStripView` and `progressionStripHandlers` to their `Tree`. The strip holds no state
// and runs no clock: where the loop is comes in as `beat`, and every press only asks.
import { component, each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { liveAxis, liveHead, livePane } from '../live.model';
import type { ProgressionStripForm } from './ProgressionStrip.forms';

/** What the band follows: the chord the player is on (`live`), or the loop as written (`loop`). */
export const PROGRESSION_FOLLOWS = ['live', 'loop'] as const;
export type ProgressionFollow = (typeof PROGRESSION_FOLLOWS)[number];

/** What a chord cell is doing: the one at `index` is now, the one after it (round the loop) next. */
export const CHORD_STATES = ['now', 'next', 'idle'] as const;
export type ChordState = (typeof CHORD_STATES)[number];

/** One chord in the loop. */
export interface ProgressionChord {
  id: string;
  /** `'Am7'`. */
  name: string;
  /** `['A', 'C', 'E', 'G']`, when the app knows the voicing. */
  notes?: readonly string[];
  /** Its length in beats (default 4): the cell's width. */
  beats?: number;
}

export interface ProgressionStripProps {
  /** The loop, left to right. Empty: one quiet well. */
  chords: readonly ProgressionChord[];
  /** The chord the band is on now. */
  index: number;
  /** Beats into the loop (a float; wraps at the loop's length): the progress bar under the strip. */
  beat?: number;
  /** Beats in a bar (default 4): the head's bar count and position. */
  beatsPerBar?: number;
  /** What the band follows (default `live`). */
  follow?: ProgressionFollow;
  /** The Follow switch was pressed. Without it the switch is read-only. */
  onFollow?: (mode: ProgressionFollow) => void;
  /** The chord the mutation buttons act on: a 2px foot rule. */
  selected?: string;
  /** A chord was pressed: select it. Without it the cells are read-only. */
  onSelect?: (id: string) => void;
  /** Mutate the selected chord. Without it the button is disabled. */
  onMutate?: () => void;
  /** Keep the mutation. */
  onKeep?: () => void;
  /** Revert to the chord before the mutation. */
  onRevert?: () => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: ProgressionStripForm;
  className?: string;
}

/** A cell's state from its place in the loop; next wraps round to the first chord. */
export function chordState(at: number, index: number, count: number): ChordState {
  if (at === index) return 'now';
  return count > 1 && at === (index + 1) % count ? 'next' : 'idle';
}

const beatsOf = (chord: ProgressionChord): number => Math.max(chord.beats ?? 4, 0.25);

/** Each chord's share of the bar under it: 0 before the position, 1 past it, the fraction inside it. */
export function chordProgress(chords: readonly ProgressionChord[], beat: number | undefined): number[] {
  const total = chords.reduce((sum, c) => sum + beatsOf(c), 0);
  if (beat === undefined || !Number.isFinite(beat) || total <= 0) return chords.map(() => 0);
  const at = ((beat % total) + total) % total;
  let start = 0;
  return chords.map((c) => {
    const len = beatsOf(c);
    const frac = Math.min(1, Math.max(0, (at - start) / len));
    start += len;
    return frac;
  });
}

const FOLLOW_ITEMS = ['Live', 'Loop'] as const;

const ACTIONS = [
  { key: 'mutate', label: 'Mutate', hint: 'Mutate the selected chord' },
  { key: 'keep', label: 'Keep', hint: 'Keep the mutated chord' },
  { key: 'revert', label: 'Revert', hint: 'Revert to the chord before' },
] as const;

function cell(chord: ProgressionChord, at: number, index: number, count: number, selected: string | undefined, full: boolean, inert: boolean): Node {
  const state = chordState(at, index, count);
  const notes = chord.notes ?? [];
  const isSelected = chord.id === selected;
  const spoken = `${chord.name}${state === 'idle' ? '' : `, ${state}`}${isSelected ? ', selected' : ''}${notes.length ? `: ${notes.join(' ')}` : ''}`;
  return wire(
    h(
      'button',
      {
        class: 'live-cell live-prog-cell',
        type: 'button',
        'data-part': 'chord',
        'data-state': state,
        'data-selected': isSelected ? 'true' : undefined,
        'aria-current': state === 'now' ? 'true' : undefined,
        'aria-pressed': inert ? undefined : isSelected ? 'true' : 'false',
        'aria-label': spoken,
        disabled: inert ? '' : undefined,
      },
      h('span', { class: 'live-prog-name', 'data-part': 'name' }, chord.name),
      when(full && notes.length > 0, () => h('span', { class: 'live-prog-notes', 'data-part': 'notes' }, notes.join(' '))),
    ),
    { on: { click: `select:${chord.id}` } },
  );
}

/**
 * The tree ProgressionStrip draws: the head (title, the playhead's bar, the loop's length, the
 * Follow switch and the three mutation buttons), a row of chord cells as wide as their beats (now
 * filled, next outlined, the selection on a foot rule), and the thin progress bar under them.
 * `form` is the binding's (`useForm` / `getForm`).
 */
export function progressionStripView(
  { chords, index, beat, beatsPerBar = 4, follow = 'live', onFollow, selected, onSelect, onMutate, onKeep, onRevert, className }: ProgressionStripProps,
  form: ProgressionStripForm,
): Node {
  const full = form === 'full';
  const count = chords.length;
  const total = chords.reduce((sum, c) => sum + beatsOf(c), 0);
  const bars = total / beatsPerBar;
  const progress = chordProgress(chords, beat);
  const at = beat !== undefined && total > 0 ? ((beat % total) + total) % total : undefined;
  const position = at === undefined ? undefined : `bar ${Math.floor(at / beatsPerBar) + 1}.${Math.floor(at % beatsPerBar) + 1}`;
  const passed = { mutate: onMutate, keep: onKeep, revert: onRevert } as const;
  // One column per chord, as wide as its beats; the cells and the bar share it, so a segment sits under its cell.
  const columns = styleText({ 'grid-template-columns': chords.map((c) => `minmax(0, ${beatsOf(c)}fr)`).join(' ') });
  return livePane(
    'prog',
    { class: className, 'data-form': form, role: 'region', 'aria-label': 'Progression' },
    liveHead(
      { title: 'Progression', sub: position, aside: count ? `${Number.isInteger(bars) ? bars : bars.toFixed(1)} bars` : undefined },
      h(
        'div',
        { class: 'live-prog-tools', 'data-part': 'tools' },
        when(full, () => liveAxis('Follow')),
        component(
          'MusicSegmented',
          { items: FOLLOW_ITEMS, index: PROGRESSION_FOLLOWS.indexOf(follow), label: 'Follow', disabled: onFollow === undefined, className: 'live-prog-follow' },
          { on: { onChange: 'follow' } },
        ),
        h(
          'div',
          { class: 'live-prog-actions', 'data-part': 'actions' },
          ...ACTIONS.map((a) =>
            component('MusicButton', { label: a.label, title: a.hint, disabled: passed[a.key] === undefined }, { on: { onPress: a.key }, slots: { children: [a.label] }, key: a.key }),
          ),
        ),
      ),
    ),
    count === 0
      ? h('div', { class: 'live-prog-empty', 'data-part': 'empty' }, liveAxis('No chords'))
      : h(
          'div',
          { class: 'live-prog-body', 'data-part': 'body' },
          h(
            'div',
            { class: 'live-prog-cells', 'data-part': 'chords', role: 'group', 'aria-label': 'Chords', style: columns },
            ...each(chords, (c) => c.id, (c, i) => cell(c, i, index, count, selected, full, onSelect === undefined)),
          ),
          h(
            'div',
            { class: 'live-prog-bar', 'data-part': 'progress', 'aria-hidden': 'true', style: columns },
            ...each(chords, (c) => c.id, (c, i) =>
              h(
                'span',
                { class: 'live-prog-seg', 'data-state': chordState(i, index, count) },
                h('span', { style: styleText({ width: `${(progress[i] * 100).toFixed(2)}%` }) }),
              ),
            ),
          ),
        ),
  );
}

/** The callbacks the tree names: one select per chord (`select:<id>`), the switch and the three buttons. */
export function progressionStripHandlers({ chords, onFollow, onSelect, onMutate, onKeep, onRevert }: ProgressionStripProps): Handlers {
  const handlers: Handlers = {
    follow: (next: number) => onFollow?.(PROGRESSION_FOLLOWS[next] ?? 'live'),
    mutate: onMutate && (() => onMutate()),
    keep: onKeep && (() => onKeep()),
    revert: onRevert && (() => onRevert()),
  };
  for (const { id } of chords) handlers[`select:${id}`] = () => onSelect?.(id);
  return handlers;
}
