// TimeChart's stories as plain props: TimeChart.stories.tsx draws them with any renderer, and the
// tree snapshot records every one. The readings are made, not measured: a coin's yield per hash
// over a month, two coins to compare, a handful of measured runs against a published median.
import { defineFixtures } from '../../../fixtures';
import { DAY, type ChartSeries, type Point } from '../../model/series';
import type { TimeChartModelProps } from './TimeChart.model';

const START = Date.UTC(2026, 9, 17);
const HOUR = DAY / 24;

/** `n` readings every `step` ms from START, each the last times (1 + drift + a wobble). */
function walk(n: number, step: number, first: number, drift: number, wobble: number, phase = 0): Point[] {
  const points: Point[] = [];
  let value = first;
  for (let i = 0; i < n; i++) {
    points.push([START + i * step, Number(value.toPrecision(5))]);
    value *= 1 + drift + wobble * Math.sin(i * 0.7 + phase);
  }
  return points;
}

export const yieldSeries: ChartSeries = { name: 'KRX', kind: 'area', points: walk(31 * 6, 4 * HOUR, 0.0000027, 0.0008, 0.012) };
export const coins: ChartSeries[] = [
  { name: 'KRX', href: '#coin-krx', points: walk(31 * 6, 4 * HOUR, 0.0000027, 0.0008, 0.012) },
  { name: 'PRL', href: '#coin-prl', points: walk(31 * 6, 4 * HOUR, 0.31, -0.0004, 0.01, 1.3) },
  { name: 'EPIC', href: '#coin-epic', points: walk(31 * 6, 4 * HOUR, 12.4, 0.0002, 0.016, 2.1) },
];
const runs: Point[] = [[START + 2 * DAY, 101], [START + 3 * DAY + 5 * HOUR, 99.2], [START + 9 * DAY, 103.5], [START + 16 * DAY, 104.1], [START + 23 * DAY, 97.8], [START + 29 * DAY, 105.6]];

export const timeChartStories = defineFixtures<TimeChartModelProps>()({
  /** A coin's yield per hash over a month, an area with its unit; small numbers in significant digits. */
  Yield: { args: { series: [yieldSeries], label: 'KRX yield per hash', format: { unit: 'USD / H/s / day', digits: 2 }, lines: [{ value: 0.0000029, label: 'Break-even at 2×', tone: 'good' }] } },
  /** Three coins rebased to their change since the first reading in the span, each linking to its page. */
  Compare: { args: { series: coins, rebase: true, label: 'Yield per hash, change', markers: [{ time: START + 20 * DAY, label: 'In reach', tone: 'good', series: 0 }] } },
  /** Measured runs, a few irregular points, against the published median as a baseline. */
  Measured: { args: { series: [{ name: 'Measured', kind: 'baseline', base: 100, marks: true, points: runs }], spans: false, label: 'Measured hashrate against the published median', format: { unit: 'kH/s' }, lines: [{ value: 100, label: 'Published median', tone: 'none' }] } },
  /** A coin far above its break-even: the line is off the scale, so the chart says where it is. */
  FarAbove: { args: { series: [yieldSeries], spans: false, label: 'KRX yield per hash', format: { unit: 'USD / H/s / day', digits: 2 }, lines: [{ value: 0.0000004, label: 'Break-even at 2×', tone: 'good' }] } },
  /** One reading so far: the empty message, no plot. */
  Empty: { args: { series: [{ name: 'KRX', points: [[START, 1]] }], label: 'KRX yield per hash', empty: 'One reading so far. The line starts with the next collector run.' } },
  /** Volume-like bars, no legend, short. */
  Bars: { args: { series: [{ name: 'Runs', kind: 'histogram', points: walk(30, DAY, 40, 0, 0.3) }], legend: false, height: 120, spans: false, label: 'Runs a day' } },
});
