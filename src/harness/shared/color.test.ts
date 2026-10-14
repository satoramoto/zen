import { describe, expect, it } from 'vitest';
import { apart, chroma, fromOklch, hex, hue, hueDistance, mix, oklch, parseColor } from './color';

describe('harness colour maths', () => {
  it('reads #rgb, #rrggbb, rgb() and rgba(), and nothing else', () => {
    expect(parseColor('#fa0')).toEqual([255, 170, 0]);
    expect(parseColor('#5BC08A')).toEqual([91, 192, 138]);
    expect(parseColor('rgba(108, 142, 245, 0.13)')).toEqual([108, 142, 245]);
    expect(parseColor('rgb(1 2 3)')).toEqual([1, 2, 3]);
    expect(parseColor('var(--x)')).toBeUndefined();
    expect(() => hex('linear-gradient(red, blue)')).toThrow();
  });

  it('finds hue and chroma: greys have none, blue sits between cyan and purple', () => {
    expect(chroma('#8a8a87')).toBeLessThan(0.01);
    expect(chroma('#6c8ef5')).toBeGreaterThan(0.1);
    expect(hue('#4fb3c8')).toBeLessThan(hue('#6c8ef5'));
    expect(hue('#6c8ef5')).toBeLessThan(hue('#9d85e8'));
    expect(hueDistance(350, 10)).toBe(20);
  });

  it('round-trips OKLCH within a unit per channel', () => {
    for (const c of ['#6c8ef5', '#5bc08a', '#e3a33b']) {
      const [l, k, h] = oklch(c);
      const back = parseColor(fromOklch(l, k, h))!;
      parseColor(c)!.forEach((v, i) => expect(Math.abs(v - back[i]!)).toBeLessThanOrEqual(1));
    }
  });

  it('mixes in sRGB', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#6c8ef5', '#6c8ef5', 0.3)).toBe('#6c8ef5');
  });

  it('steps a taken colour apart by the least change', () => {
    expect(apart('#112233', new Set())).toBe('#112233');
    expect(apart('#112233', new Set(['#112233']))).toBe('#112234');
    expect(apart('#112233', new Set(['#112233', '#112234']))).toBe('#112232');
    expect(apart('#1122ff', new Set(['#1122ff']))).toBe('#1122fe');
  });
});
