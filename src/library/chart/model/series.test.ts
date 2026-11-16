import { describe, expect, it } from 'vitest';
import { DAY, direction, drawable, formatChange, formatTime, formatValue, lastChange, prepared, rebase, spanStart, valueAt, windowed, type ChartSeries } from './series';

const t0 = Date.UTC(2026, 10, 1);
const coin: ChartSeries = { name: 'KRX', points: [[t0, 2], [t0 + DAY, 3], [t0 + 8 * DAY, 4], [t0 + 9 * DAY, 5]] };

describe('a time chart\'s series', () => {
  it('a span starts its length back from the last reading', () => {
    expect(spanStart([coin], { label: '1W', ms: 7 * DAY })).toBe(t0 + 2 * DAY);
    expect(spanStart([coin], { label: 'All', ms: null })).toBeNull();
    expect(spanStart([{ name: 'none', points: [] }], { label: '1W', ms: 7 * DAY })).toBeNull();
  });

  it('windows and rebases to the first point inside the span, keeping the points before it', () => {
    const start = t0 + 2 * DAY;
    expect(windowed(coin.points, start)).toEqual([[t0 + 8 * DAY, 4], [t0 + 9 * DAY, 5]]);
    const drawn = prepared(coin, true, start);
    expect(drawn).toHaveLength(4);
    expect(drawn[2][1]).toBe(0);
    expect(drawn[3][1]).toBeCloseTo(0.25);
    expect(drawn[0][1]).toBeCloseTo(-0.5);
    expect(prepared(coin, false, start)).toEqual(coin.points);
    expect(rebase([[t0, 1]], 0)).toEqual([]);
  });

  it('needs two points in the span to draw', () => {
    expect(drawable([coin], null)).toBe(true);
    expect(drawable([coin], t0 + 9 * DAY)).toBe(false);
  });

  it('reads the value at or before a moment, and the change across the span', () => {
    expect(valueAt(coin.points, t0 + 5 * DAY)).toBe(3);
    expect(valueAt(coin.points, t0 - 1)).toBeNull();
    expect(lastChange(coin.points, null)).toEqual({ last: 5, change: 1.5 });
    expect(lastChange(coin.points, t0 + 9 * DAY)).toEqual({ last: 5, change: null });
    expect(direction(0.1)).toBe('up');
    expect(direction(-0.1)).toBe('down');
    expect(direction(null)).toBe('flat');
  });

  it('formats small values in significant digits with a unit, percents with a sign, big ones compact', () => {
    expect(formatValue(0.0000027, { unit: 'USD / H/s / day' })).toBe('0.0000027 USD / H/s / day');
    expect(formatValue(0.042, { style: 'percent' })).toBe('+4.2%');
    expect(formatChange(-0.0113)).toBe('−1.1%'.replace('−', '-'));
    expect(formatValue(1234567, { style: 'currency' })).toBe('$1.23M');
    expect(formatValue(2.5, { scale: 1e-6, digits: 2, unit: 'MH/s' })).toBe('0.0000025 MH/s');
    expect(formatValue(null)).toBe('–');
  });

  it('formats a moment with the time only for a short span', () => {
    expect(formatTime(t0, DAY)).toBe('1 Nov, 00:00');
    expect(formatTime(t0, null)).toBe('1 Nov 2026');
  });
});
