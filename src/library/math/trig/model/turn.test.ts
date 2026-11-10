import { describe, expect, it } from 'vitest';
import { continueTurn, turnState } from './turn';

describe('signed journeys', () => {
  it.each([[0, 0, 0], [360, 0, 1], [-360, 0, 1], [-90, 270, 0], [390, 30, 1], [630, 270, 1], [990, 270, 2]])('retains total %s', (total, endpoint, laps) => {
    expect(turnState(total)).toMatchObject({ total, endpoint, laps });
  });
  it('unwraps a pointer through zero in either direction without losing laps', () => {
    expect(continueTurn(359, 1)).toBe(361);
    expect(continueTurn(-359, 359)).toBe(-361);
    expect(continueTurn(719, 1)).toBe(721);
    expect(continueTurn(-1, 1)).toBe(1);
    expect(continueTurn(-89, 359, 90)).toBe(-91);
  });
  it('keeps axes distinct from quadrants and respects a clock start', () => {
    expect(turnState(-225, 90).region).toBe('quadrant III');
    expect([45, 135, 225, 315].map((angle) => turnState(angle).region)).toEqual(['quadrant I', 'quadrant II', 'quadrant III', 'quadrant IV']);
    expect(turnState(180).region).toBe('negative horizontal axis');
    expect(() => turnState(Infinity)).toThrow(RangeError);
  });
});
