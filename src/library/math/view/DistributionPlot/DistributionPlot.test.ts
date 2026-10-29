import { describe, expect, it } from 'vitest';
import { binProportion, distributionBinLabel } from './DistributionPlot.model';
describe('distribution proportions', () => {
  it('uses each bin denominator rather than normalizing to the highest bar', () => {
    expect(binProportion({ count: 25, total: 100 })).toBe(.25);
    expect(binProportion({ count: 25, total: 50 })).toBe(.5);
    expect(binProportion({ count: 0, total: 50 })).toBe(0);
    expect(binProportion({ count: 50, total: 50 })).toBe(1);
  });
  it('distinguishes missing or malformed observations from a measured zero', () => {
    for (const pair of [{count:0,total:0},{count:2,total:1},{count:-1,total:4},{count:1.5,total:4},{count:NaN,total:4},{count:1,total:Infinity}]) expect(binProportion(pair)).toBeNull();
    expect(distributionBinLabel({ id:'missing', label:'1–100', count:0,total:0 })).toBe('1–100: no valid observations');
  });
  it('keeps exact counts available alongside rounded percentages', () => {
    expect(distributionBinLabel({ id:'third', label:'1–3', count:1,total:3 })).toBe('1–3: 1 of 3 (33.33%)');
  });
});
