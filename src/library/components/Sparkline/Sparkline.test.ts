import { describe, expect, it } from 'vitest';
import { sparkDirection, sparkPoints } from './Sparkline.model';

describe('Sparkline', () => {
  it('spreads the values across the box, the highest at the top', () => {
    expect(sparkPoints([1, 3, 2])).toEqual([[0, 22], [50, 2], [100, 12]]);
    expect(sparkPoints([5, 5])).toEqual([[0, 12], [100, 12]]);
    expect(sparkPoints([])).toEqual([]);
  });
  it('reads its way from its first value to its last', () => {
    expect(sparkDirection([1, 2])).toBe('up');
    expect(sparkDirection([2, 1])).toBe('down');
    expect(sparkDirection([2, 2])).toBe('flat');
    expect(sparkDirection([2])).toBe('flat');
  });
});
