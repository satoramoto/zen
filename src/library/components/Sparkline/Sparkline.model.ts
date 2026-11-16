// Sparkline's model: values drawn as a small line, framework-free. The line fills its box (the
// SVG stretches, the stroke keeps its width), an optional area sits under it, and an end dot marks
// the last value. Its tone says which way it went from its first value; its name says so in words.
import { h, styleText, when, type Node } from '../../foundation/view/Tree.model';

export type SparklineDirection = 'up' | 'down' | 'flat';

export interface SparklineModelProps {
  values: readonly number[];
  /** Its accessible name: what it is (`KRX yield, 30 days`). */
  label: string;
  /** Default from the first and last values. */
  direction?: SparklineDirection;
  /** Shade under the line. */
  area?: boolean;
  /** A dot at the last value. Default true. */
  dot?: boolean;
}

/** The box the line is drawn in: 100 wide, 24 high. */
export const SPARK_W = 100;
export const SPARK_H = 24;

/** Each value's place in the box, the highest at the top, with a little room at either edge. */
export function sparkPoints(values: readonly number[]): [number, number][] {
  if (!values.length) return [];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = high - low || 1;
  const step = values.length > 1 ? SPARK_W / (values.length - 1) : 0;
  return values.map((v, i) => [Number((i * step).toFixed(2)), Number((2 + (1 - (high === low ? 0.5 : (v - low) / spread)) * (SPARK_H - 4)).toFixed(2))]);
}

export function sparkDirection(values: readonly number[]): SparklineDirection {
  if (values.length < 2) return 'flat';
  const [first, last] = [values[0], values[values.length - 1]];
  return last > first ? 'up' : last < first ? 'down' : 'flat';
}

const WORDS: Record<SparklineDirection, string> = { up: 'up', down: 'down', flat: 'flat' };

export function sparklineView({ values, label, direction, area = false, dot = true }: SparklineModelProps): Node {
  const points = sparkPoints(values);
  const way = direction ?? sparkDirection(values);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const last = points[points.length - 1];
  return h(
    'span',
    { class: 'lib-spark', 'data-part': 'root', 'data-direction': way, role: 'img', 'aria-label': `${label}, ${WORDS[way]}` },
    h(
      'svg',
      { class: 'lib-spark__svg', viewBox: `0 0 ${SPARK_W} ${SPARK_H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
      when(area && points.length > 1, () => h('path', { class: 'lib-spark__area', d: `${line} L${SPARK_W} ${SPARK_H} L0 ${SPARK_H} Z` })),
      when(points.length > 1, () => h('path', { class: 'lib-spark__line', d: line })),
    ),
    when(dot && last !== undefined, () => h('span', { class: 'lib-spark__dot', 'data-part': 'dot', style: styleText({ left: `${last![0]}%`, top: `${Number(((last![1] / SPARK_H) * 100).toFixed(2))}%` }) })),
  );
}
