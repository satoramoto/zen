// A time chart's data and its text, framework-free: the series as the host gives them, windowed to
// a span and rebased to percent change, read at a moment, summed up, and formatted. TimeChart's
// tree (its legend, readout and summary) and its store (what Lightweight Charts draws) both read
// these, so the numbers a person reads are the numbers drawn.

/** One reading: [epoch milliseconds, value]. */
export type Point = readonly [number, number];

/** How a series is drawn. */
export type SeriesKind = 'line' | 'area' | 'baseline' | 'histogram';

/** What a colour says: a state (good, close, short or bad), the accent, or nothing in particular. */
export type ChartTone = 'good' | 'close' | 'short' | 'bad' | 'accent' | 'none';

export interface ChartSeries {
  name: string;
  /** Default `line`. */
  kind?: SeriesKind;
  /** In time order. */
  points: readonly Point[];
  /** A baseline's base value: above it is drawn in success, below in danger. Default the first point. */
  base?: number;
  /** Where the series' name links to, in the legend. */
  href?: string;
  /** Draw each reading as a mark on the line (sparse, irregular series). */
  marks?: boolean;
}

/** A horizontal line at a value (a break-even), with its label and tone. */
export interface ChartLine {
  value: number;
  label?: string;
  tone?: ChartTone;
  /** Which series' scale it is on, by position. Default 0. */
  series?: number;
}

/** An event marked on a series at a time. */
export interface ChartMarker {
  time: number;
  label?: string;
  tone?: ChartTone;
  /** By position. Default 0. */
  series?: number;
}

/** A span a person can choose: its label and its length (`null`: all of it). */
export interface ChartSpan {
  label: string;
  ms: number | null;
}

/** How values read: significant digits, a scale they are multiplied by, a unit after them. */
export interface ValueFormat {
  style?: 'number' | 'percent' | 'currency';
  /** Significant digits. Default 3. */
  digits?: number;
  /** Multiplied in before formatting (1e6 to read H/s as MH/s). */
  scale?: number;
  /** After the number, with a thin space: `USD / H/s / day`. */
  unit?: string;
  /** For `currency`. Default USD. */
  currency?: string;
}

export const DAY = 86_400_000;

/** The spans a chart offers by default: a day, a week, a month and all of it. */
export const DEFAULT_SPANS: ChartSpan[] = [
  { label: '1D', ms: DAY },
  { label: '1W', ms: 7 * DAY },
  { label: '1M', ms: 30 * DAY },
  { label: 'All', ms: null },
];

/** The last time any series has, or null when none has a point. */
export function lastTime(series: readonly ChartSeries[]): number | null {
  const times = series.flatMap((s) => (s.points.length ? [s.points[s.points.length - 1][0]] : []));
  return times.length ? Math.max(...times) : null;
}

/** The first time a span shows: its length back from the last time, or null for all of it. */
export function spanStart(series: readonly ChartSeries[], span: ChartSpan | undefined): number | null {
  const last = lastTime(series);
  return span?.ms == null || last === null ? null : last - span.ms;
}

/** The points from `start` on (all of them for null). */
export function windowed(points: readonly Point[], start: number | null): Point[] {
  return start === null ? [...points] : points.filter(([t]) => t >= start);
}

/** Every point as its change from `from` (a fraction: 0.05 is +5%); none when `from` is 0. */
export function rebase(points: readonly Point[], from: number): Point[] {
  if (from === 0) return [];
  return points.map(([t, v]) => [t, v / from - 1] as const);
}

/** What the chart draws of a series: rebased to its first point inside the span when `rebased`,
 *  every point kept so the chart can scroll back. */
export function prepared(series: ChartSeries, rebased: boolean, start: number | null): Point[] {
  if (!rebased) return [...series.points];
  const first = windowed(series.points, start)[0];
  return first ? rebase(series.points, first[1]) : [];
}

/** Whether there is anything to draw: some series with two points in the span. */
export function drawable(series: readonly ChartSeries[], start: number | null): boolean {
  return series.some((s) => windowed(s.points, start).length >= 2);
}

/** The reading at or just before `time`, or null before the first. */
export function valueAt(points: readonly Point[], time: number): number | null {
  let found: number | null = null;
  for (const [t, v] of points) {
    if (t > time) break;
    found = v;
  }
  return found;
}

/** A series' last value in the span and its change across it (a fraction), or nulls. */
export function lastChange(points: readonly Point[], start: number | null): { last: number | null; change: number | null } {
  const shown = windowed(points, start);
  if (!shown.length) return { last: null, change: null };
  const first = shown[0][1];
  const last = shown[shown.length - 1][1];
  return { last, change: shown.length < 2 || first === 0 ? null : last / first - 1 };
}

/** A value as it reads: `0.0000027 USD / H/s / day`, `+4.2%`, `$1.2k`. */
export function formatValue(value: number | null, format: ValueFormat = {}): string {
  if (value === null || !Number.isFinite(value)) return '–';
  const { style = 'number', digits = 3, scale = 1, unit, currency = 'USD' } = format;
  const scaled = value * scale;
  if (style === 'percent') {
    const text = new Intl.NumberFormat('en-US', { style: 'percent', maximumSignificantDigits: digits, signDisplay: 'exceptZero' }).format(scaled);
    return unit ? `${text} ${unit}` : text;
  }
  const big = Math.abs(scaled) >= 10_000;
  const text = new Intl.NumberFormat('en-US', {
    ...(style === 'currency' ? { style: 'currency', currency } : {}),
    ...(big ? { notation: 'compact', maximumSignificantDigits: digits } : { maximumSignificantDigits: digits }),
  }).format(scaled);
  return unit ? `${text} ${unit}` : text;
}

/** A change as it reads: `+4.2%`, `−1.1%`, or `–` when there is none. */
export const formatChange = (change: number | null): string => formatValue(change, { style: 'percent', digits: 2 });

/** Up, down or flat, for a change's tone. */
export const direction = (change: number | null): 'up' | 'down' | 'flat' => (change === null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down');

/** A moment as it reads: the date, with the time when the span is shorter than two days. */
export function formatTime(ms: number, spanMs: number | null): string {
  const withTime = spanMs !== null && spanMs < 2 * DAY;
  return new Intl.DateTimeFormat('en-GB', withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' } : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(ms);
}

/** Where a reference line sits against what the span shows: inside it, or above or below it (off
 *  the scale, so the chart says where in words). */
export function lineSide(series: readonly ChartSeries[], value: number, rebased: boolean, start: number | null): 'inside' | 'above' | 'below' {
  const shown = series.flatMap((s) => windowed(prepared(s, rebased, start), start).map(([, v]) => v));
  if (!shown.length) return 'inside';
  const low = Math.min(...shown);
  const high = Math.max(...shown);
  const pad = (high - low) * 0.08;
  return value > high + pad ? 'above' : value < low - pad ? 'below' : 'inside';
}
