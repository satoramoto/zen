import { describe, expect, it } from 'vitest';
import { LAMPS, LAMP_NEUTRAL, LAMP_SHADES, isLampIndex, lampColour, lampLuminance, lampShadeCss, lampShadeHex, lampVar, lampVars } from './lamps';

describe('the lamp table', () => {
  it('has seventy hex colours', () => {
    expect(LAMPS).toHaveLength(70);
    for (const hex of LAMPS) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('gives the neutral lamp for an index it does not have', () => {
    for (const index of [-1, 70, 1.5, NaN, undefined, null, '3']) {
      expect(isLampIndex(index)).toBe(false);
      expect(lampColour(index)).toBe(LAMP_NEUTRAL);
      expect(lampVar(index)).toBe('var(--push-lamp-neutral)');
    }
    expect(lampColour(20)).toBe(LAMPS[20]);
    expect(lampVar(20)).toBe('var(--push-lamp-20)');
  });

  it('sets one property per colour and the neutral one', () => {
    const vars = lampVars();
    expect(Object.keys(vars)).toHaveLength(71);
    expect(vars['--push-lamp-0']).toBe(LAMPS[0]);
    expect(vars['--push-lamp-neutral']).toBe(LAMP_NEUTRAL);
  });
});

describe('derived shades', () => {
  it.each(LAMPS.map((hex, i) => [i, hex] as const))('every shade of lamp %i (%s) is derived from it', (_i, hex) => {
    const lum = Object.fromEntries(LAMP_SHADES.map((s) => [s, lampLuminance(lampShadeHex(hex, s))]));
    expect(lampShadeHex(hex, 'lit')).toBe(hex);
    // Toward white: never darker, and lighter still for `light`.
    expect(lum.bright).toBeGreaterThanOrEqual(lum.lit);
    expect(lum.light).toBeGreaterThanOrEqual(lum.bright);
    // Toward the unlit pad: `dark` sits between the unlit pad and `dim`, `dim` between `dark` and the colour.
    const unlit = lampLuminance('#0f0f10');
    const between = (v: number, a: number, b: number) => v >= Math.min(a, b) - 1e-9 && v <= Math.max(a, b) + 1e-9;
    expect(between(lum.dim, unlit, lum.lit)).toBe(true);
    expect(between(lum.dark, unlit, lum.dim)).toBe(true);
    for (const s of LAMP_SHADES) expect(lampShadeHex(hex, s)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('writes a shade as a mix of the one colour', () => {
    expect(lampShadeCss('var(--push-lamp-3)', 'lit')).toBe('var(--push-lamp-3)');
    expect(lampShadeCss('var(--push-lamp-3)', 'dim')).toBe('color-mix(in oklab, var(--push-lamp-3) 45%, var(--surface-1))');
    expect(lampShadeCss('var(--danger)', 'bright')).toBe('color-mix(in oklab, var(--danger) 70%, white)');
  });
});
