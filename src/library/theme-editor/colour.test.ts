import { describe, expect, it } from 'vitest';
import type { Mode, Palette } from '../contract';
import { packs } from '../themes/packs';
import { contrast, hexToHsl, hslToHex, paletteWarnings } from './colour';

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const MODES: Mode[] = ['light', 'dark'];

describe('hex and HSL', () => {
  it.each(['#000000', '#ffffff', '#808080', '#333333', '#ff0000', '#00ff00', '#0000ff'])('%s survives a round trip exactly', (hex) => {
    expect(hslToHex(hexToHsl(hex))).toBe(hex);
  });

  // HSL is kept in whole numbers (the editor's fields): half a degree of hue on a saturated
  // colour moves a channel by up to about 2 units, so that is the most a round trip may drift.
  it.each(['#ff7a59', '#1e90ff', '#c4f042', '#5a3e8c'])('%s survives a round trip within two units per channel', (hex) => {
    const back = hslToHex(hexToHsl(hex));
    expect(back).toMatch(/^#[0-9a-f]{6}$/);
    channels(back).forEach((c, i) => expect(Math.abs(c - channels(hex)[i])).toBeLessThanOrEqual(2));
  });

  it('reads greys as unsaturated and primaries at full saturation', () => {
    expect(hexToHsl('#808080')).toMatchObject({ s: 0 });
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('wraps hue and clamps saturation and lightness', () => {
    expect(hslToHex({ h: 360, s: 100, l: 50 })).toBe('#ff0000');
    expect(hslToHex({ h: -120, s: 100, l: 50 })).toBe('#0000ff');
    expect(hslToHex({ h: 0, s: 150, l: 120 })).toBe('#ffffff');
  });
});

describe('contrast', () => {
  it('is 21 for black on white, in either order', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1 for a colour against itself', () => {
    expect(contrast('#ff7a59', '#ff7a59')).toBe(1);
  });
});

describe('paletteWarnings', () => {
  const palettes = [...new Map(packs.map((p) => [p.facets.palette.id, p.facets.palette])).values()];

  for (const palette of palettes)
    for (const mode of MODES)
      it(`finds nothing in zen's ${palette.id} palette (${mode})`, () => {
        expect(paletteWarnings(palette, mode)).toEqual([]);
      });

  const withScheme = (palette: Palette, mode: Mode, change: Partial<Palette['dark']>): Palette => ({
    ...palette,
    [mode]: { ...palette[mode], ...change },
  });

  it('names danger text that matches its fill', () => {
    const p = packs[0].facets.palette;
    const warnings = paletteWarnings(withScheme(p, 'dark', { dangerText: p.dark.danger }), 'dark');
    expect(warnings.some((w) => w.startsWith('Danger text is 1.0:1'))).toBe(true);
  });

  it('names two hues that read alike', () => {
    const p = packs[0].facets.palette;
    const [h1, , h3, h4] = p.light.hues;
    const warnings = paletteWarnings(withScheme(p, 'light', { hues: [h1, h1, h3, h4] }), 'light');
    expect(warnings).toContain('Hue 1 and Hue 2 read alike.');
  });

  it('checks only the mode asked for', () => {
    const p = packs[0].facets.palette;
    expect(paletteWarnings(withScheme(p, 'dark', { dangerText: p.dark.danger }), 'light')).toEqual([]);
  });
});
