// Track's model: a value on a rail, framework-free. A ratio sits on a log scale around a mark in
// the middle (twice the mark is as far right as half is left), with a fill from the mark to the
// dot; a share sits from nothing to all. Its tone says how it stands (good, close, short, bad) and
// can be set from outside; its name and value are its accessible name, and the value can show
// beside the rail at a fixed width, so rows of tracks line up.
import { h, styleText, when, type Node } from '../../foundation/view/Tree.model';
import { textNode } from '../../primitives/Text/Text.model';

export type TrackTone = 'good' | 'close' | 'short' | 'bad' | 'none';

export interface TrackModelProps {
  value: number;
  /** `ratio` (default): on a log scale around `mark`. `share`: from 0 to 1. */
  mode?: 'ratio' | 'share';
  /** A ratio's reach: the largest ratio to the mark shown, either way. Default 4 (a quarter to four times). */
  range?: number;
  /** A ratio's mark. Default 1; `false` draws none. */
  mark?: number | false;
  /** Draw the fill from the mark (or the start) to the dot. Default: a ratio's yes, a share's no. */
  fill?: boolean;
  /** How it stands. Default from a ratio: at or past the mark good, within a tenth below it close, else short. */
  tone?: TrackTone;
  /** Its accessible name: what it measures. */
  label: string;
  /** The value as it reads beside the rail (`2.4×`). */
  display?: string;
}

/** Where the dot sits and the fill runs, as percentages along the rail. */
export function trackPosition({ value, mode = 'ratio', range = 4, mark = 1 }: Pick<TrackModelProps, 'value' | 'mode' | 'range' | 'mark'>): { at: number; from: number; to: number; mid: number } {
  if (mode === 'share') {
    const at = Math.min(Math.max(value, 0), 1) * 100;
    return { at, from: 0, to: at, mid: 0 };
  }
  const base = mark === false ? 1 : mark;
  const reach = value > 0 && base > 0 ? Math.log(value / base) / Math.log(Math.max(range, 1.0001)) : -1;
  const at = 50 + Math.min(Math.max(reach, -1), 1) * 50;
  return { at, from: Math.min(50, at), to: Math.max(50, at), mid: 50 };
}

/** A ratio's tone when none is given. */
export function trackTone({ value, mode = 'ratio', mark = 1, tone }: Pick<TrackModelProps, 'value' | 'mode' | 'mark' | 'tone'>): TrackTone {
  if (tone) return tone;
  if (mode === 'share') return 'none';
  const base = mark === false ? 1 : mark;
  return value >= base ? 'good' : value >= 0.9 * base ? 'close' : 'short';
}

const round = (n: number) => `${Number(n.toFixed(2))}%`;

export function trackView(props: TrackModelProps): Node {
  const { mode = 'ratio', mark = 1, label, display } = props;
  const fill = props.fill ?? mode === 'ratio';
  const { at, from, to, mid } = trackPosition(props);
  const tone = trackTone(props);
  return h(
    'span',
    { class: 'lib-track', 'data-part': 'root', 'data-tone': tone, 'data-mode': mode },
    h(
      'span',
      { class: 'lib-track__rail', 'data-part': 'rail', role: 'img', 'aria-label': display ? `${label}: ${display}` : label },
      when(mode === 'ratio' && mark !== false, () => h('span', { class: 'lib-track__mark', 'data-part': 'mark', style: styleText({ left: round(mid) }) })),
      when(fill && to > from, () => h('span', { class: 'lib-track__fill', 'data-part': 'fill', style: styleText({ left: round(from), width: round(to - from) }) })),
      h('span', { class: 'lib-track__dot', 'data-part': 'dot', style: styleText({ left: round(at) }) }),
    ),
    when(display !== undefined, () => textNode({ role: 'body', size: 'label', tabular: true, className: 'lib-track__value' }, { 'data-part': 'value', 'aria-hidden': 'true' }, display!)),
  );
}
