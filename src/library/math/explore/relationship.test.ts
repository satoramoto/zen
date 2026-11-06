import { describe, expect, it } from 'vitest';
import { orbitTime, relationshipSources, sineRelationship, TAU } from './relationship';

describe('linked sine relationship', () => {
  it('keeps orbit height and wave height equal across radius, turns and time', () => {
    for (const amplitude of [.35, 1, 1.65]) for (const frequency of [.5, 1, 2.75, 3]) for (const time of [0, .4, Math.PI, TAU]) {
      const derived = sineRelationship.derive({ amplitude, frequency, time });
      expect(Math.hypot(derived.x, derived.y)).toBeCloseTo(amplitude);
      expect(derived.y).toBeCloseTo(amplitude * Math.sin(frequency * time));
      expect(derived.period * frequency).toBeCloseTo(TAU);
    }
  });
  it('inverse dragging preserves the nearest turn rather than jumping back to the first', () => {
    const sources = { amplitude: 1, frequency: 3, time: 4.5 };
    const next = 4.6;
    expect(orbitTime(Math.cos(next * 3), Math.sin(next * 3), sources)).toBeCloseTo(next);
    expect(orbitTime(0, 0, sources)).toBe(sources.time);
  });
  it('does not jump at the atan2 seam or at the cycle endpoint', () => {
    expect(orbitTime(Math.cos(3.2), Math.sin(3.2), { amplitude: 1, frequency: 1, time: 3.1 })).toBeCloseTo(3.2);
    expect(orbitTime(1, 0, { amplitude: 1, frequency: 1, time: 6.2 })).toBeCloseTo(TAU);
  });
  it('bounds supplied values and replaces nonfinite inputs before rendering', () => {
    expect(relationshipSources(sineRelationship, { amplitude: -5, frequency: Infinity, time: 99 })).toEqual({ amplitude: .35, frequency: 1, time: TAU });
  });
});
