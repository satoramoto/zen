import { describe, expect, it } from 'vitest';
import { barWidths } from './BarList.model';

describe('BarList', () => {
  it('sizes each bar against the largest, never below half a percent', () => {
    expect(barWidths([{ name: 'a', value: 10 }, { name: 'b', value: 5 }, { name: 'c', value: 0.001 }])).toEqual([100, 50, 0.5]);
    expect(barWidths([{ name: 'a', value: 0 }])).toEqual([0.5]);
  });
});
