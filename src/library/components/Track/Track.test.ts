import { describe, expect, it } from 'vitest';
import { trackPosition, trackTone } from './Track.model';

describe('Track', () => {
  it('places a ratio on a log scale around the mark, a quarter to four times by default', () => {
    expect(trackPosition({ value: 1 }).at).toBe(50);
    expect(trackPosition({ value: 2 }).at).toBe(75);
    expect(trackPosition({ value: 0.5 }).at).toBe(25);
    expect(trackPosition({ value: 100 }).at).toBe(100);
    expect(trackPosition({ value: 0 }).at).toBe(0);
    expect(trackPosition({ value: 2, range: 16 }).at).toBe(62.5);
    expect(trackPosition({ value: 3, mark: 1.5 }).at).toBe(75);
  });
  it('runs the fill from the mark to the dot, and a share from the start', () => {
    expect(trackPosition({ value: 0.5 })).toMatchObject({ from: 25, to: 50 });
    expect(trackPosition({ value: 0.3, mode: 'share' })).toMatchObject({ at: 30, from: 0, to: 30 });
  });
  it('reads good at or past the mark, close within a tenth below it, else short; a given tone wins', () => {
    expect(trackTone({ value: 1 })).toBe('good');
    expect(trackTone({ value: 0.95 })).toBe('close');
    expect(trackTone({ value: 0.5 })).toBe('short');
    expect(trackTone({ value: 0.5, tone: 'good' })).toBe('good');
    expect(trackTone({ value: 0.5, mode: 'share' })).toBe('none');
    expect(trackTone({ value: 0.85, close: 0.8 })).toBe('close');
  });
});
