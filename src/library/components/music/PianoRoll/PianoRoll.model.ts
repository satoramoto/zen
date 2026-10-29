// PianoRoll's model: a compact keyboard and note timeline, and the tree both renderers draw.
// No framework: `PianoRoll.tsx` (React) and `PianoRoll.svelte` (Svelte) both pass `pianoRollView`
// to their `Tree`. The roll holds no state and names no handlers: it is read, not played. widgets'
// PianoRoll is the behaviour reference (aligned rows, bar/beat ruling, note blocks, a playhead);
// colours arrive as hue slots and the playhead as a 0–1 fraction, since the host owns the engine.
import type { HueSlot } from '../../core/hue';
import { h, styleText, type Handlers, type Node } from '../../../view/Tree.model';
import type { PianoRollForm } from './PianoRoll.forms';

/** One keyboard row, highest pitch first. */
export interface PianoRollKey {
  pitch: number;
  label: string;
  black: boolean;
  emphasis?: boolean;
}

/** One note block on the timeline. */
export interface PianoRollNote {
  id?: string;
  from: number;
  to: number;
  pitch: number;
  label?: string;
  /** The note's categorical hue slot. What it means is the app's. */
  hue?: HueSlot;
  /** A musically important note: the stronger outline. */
  emphasis?: boolean;
  /** An exceptional note: the corner mark. */
  marked?: boolean;
}

/** Every PianoRoll prop (the roll has no framework children). */
export interface PianoRollModelProps {
  /** Keyboard rows, highest pitch first. */
  keys: readonly PianoRollKey[];
  /** The notes on the timeline. */
  notes: readonly PianoRollNote[];
  /** The timeline's start, in beats. */
  from: number;
  /** The timeline's end, in beats. */
  to: number;
  /** Beats in a bar, for the ruling. */
  beatsPerBar: number;
  /** The playhead, 0–1 across the shown span. */
  playhead?: number;
  /** Label a note only when it covers this percent of the span; default 4.5. */
  labelAt?: number;
  /** Shown, dimmed: the roll is read, not played. */
  disabled?: boolean;
  /** Classes added to the root, after the roll's own. */
  className?: string;
}

/**
 * The tree PianoRoll draws: the key column, the grid with bar and beat ruling, the note blocks
 * and the playhead. `form` is the binding's: `full` labels keys and numbers bars, `compact` draws
 * grid and notes alone.
 */
export function pianoRollView({ keys, notes, from, to, beatsPerBar, playhead, labelAt = 4.5, disabled, className }: PianoRollModelProps, form: PianoRollForm): Node {
  const inert = disabled === true;
  const span = to - from;
  const rows = keys.length;
  if (!(span > 0) || rows === 0) {
    return h('div', { class: `yh-pianoroll${className ? ` ${className}` : ''}`, 'data-part': 'root', 'data-form': form, 'data-empty': 'true' });
  }
  const rowOf = new Map(keys.map((key, at) => [key.pitch, at]));
  const bars = Math.max(1, Math.round(span / beatsPerBar));
  const beats = bars <= 8 && Number.isInteger(beatsPerBar) ? beatsPerBar : 0;
  const full = form === 'full';
  const at = playhead === undefined ? null : Math.max(0, Math.min(1, playhead));
  return h(
    'div',
    {
      class: `yh-pianoroll${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      role: 'img',
      'aria-label': `${rows} rows, ${notes.length} notes, bars ${from} to ${to}`,
      'data-disabled': inert ? 'true' : undefined,
      style: styleText({ '--yh-roll-rows': String(rows) }),
    },
    full
      ? h(
          'div',
          { class: 'yh-pianoroll__keys', 'data-part': 'keys' },
          ...keys.map((key) =>
            h('span', { class: 'yh-pianoroll__key', 'data-part': 'key', 'data-black': key.black ? 'true' : undefined, key: String(key.pitch) }, key.label),
          ),
        )
      : null,
    h(
      'div',
      { class: 'yh-pianoroll__grid', 'data-part': 'grid' },
      ...keys.map((key) =>
        h('div', {
          class: 'yh-pianoroll__lane',
          'data-part': 'lane',
          'data-black': key.black ? 'true' : undefined,
          'data-emphasis': key.emphasis ? 'true' : undefined,
          key: `lane${key.pitch}`,
        }),
      ),
      ...Array.from({ length: bars - 1 }, (_, i) =>
        h('div', {
          class: 'yh-pianoroll__barline',
          'data-part': 'barline',
          style: styleText({ left: `${((i + 1) / bars) * 100}%` }),
          key: `bar${i}`,
          'aria-hidden': 'true',
        }),
      ),
      ...Array.from({ length: bars * beats }, (_, i) => i).flatMap((i) =>
        i === 0 || i % beats === 0
          ? []
          : [
              h('div', {
                class: 'yh-pianoroll__beatline',
                'data-part': 'beatline',
                style: styleText({ left: `${(i / (bars * beats)) * 100}%` }),
                key: `beat${i}`,
                'aria-hidden': 'true',
              }),
            ],
      ),
      ...notes.flatMap((note, i) => {
        const row = rowOf.get(note.pitch);
        if (row === undefined) return [];
        const width = ((note.to - note.from) / span) * 100;
        return [
          h(
            'div',
            {
              class: 'yh-pianoroll__note',
              'data-part': 'note',
              'data-emphasis': note.emphasis ? 'true' : undefined,
              'data-marked': note.marked ? 'true' : undefined,
              'data-hue': note.hue === undefined ? undefined : String(note.hue),
              title: note.label,
              style: styleText({
                left: `${((note.from - from) / span) * 100}%`,
                width: `${width}%`,
                top: `${(row / rows) * 100}%`,
                height: `${100 / rows}%`,
              }),
              key: note.id ?? `${note.from}:${note.pitch}:${i}`,
            },
            width >= labelAt ? (note.label ?? '') : '',
          ),
        ];
      }),
      at === null
        ? null
        : h('div', {
            class: 'yh-pianoroll__playhead',
            'data-part': 'playhead',
            style: styleText({ left: `${at * 100}%` }),
            'aria-hidden': 'true',
          }),
    ),
    full
      ? h(
          'ol',
          { class: 'yh-pianoroll__bars', 'data-part': 'bars' },
          ...Array.from({ length: bars }, (_, i) => h('li', { key: `n${i}` }, String(i + 1))),
        )
      : null,
  );
}

/** PianoRoll names no handlers: there is nothing to press. */
export function pianoRollHandlers(): Handlers {
  return {};
}
