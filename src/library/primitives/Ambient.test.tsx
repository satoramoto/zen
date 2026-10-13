import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AMBIENT_FALLBACKS, AMBIENT_VARS, toCssVars } from '../contract';
import { packs } from '../themes/packs';
import { Ambient } from './Ambient';
import { easeFactor, linearToOklab, oklabCss, REGIONS, regionBuffer, sampleRegions, scratchBuffer, smoothToward, type Pixels } from './Ambient.model';

/** An ImageData stub: `paint(x, y)` gives each pixel's [r, g, b, a]. */
function pixels(w: number, h: number, paint: (x: number, y: number) => [number, number, number, number]): Pixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(paint(x, y), (y * w + x) * 4);
  return { data, width: w, height: h };
}
const region = (buf: Float32Array, name: (typeof REGIONS)[number]) => {
  const k = REGIONS.indexOf(name);
  return [buf[k * 3], buf[k * 3 + 1], buf[k * 3 + 2]];
};
const RED = [0.628, 0.2249, 0.1258];
const BLUE = [0.452, -0.0325, -0.3115];
const near = (got: number[], want: number[], tol = 2e-3) => got.forEach((v, i) => expect(v).toBeCloseTo(want[i], -Math.log10(tol)));

describe('Ambient colour maths', () => {
  it('converts sRGB primaries to OKLab', () => {
    const out = regionBuffer();
    linearToOklab(1, 0, 0, out, 0);
    near([out[0], out[1], out[2]], RED);
    linearToOklab(1, 1, 1, out, 3);
    near([out[3], out[4], out[5]], [1, 0, 0]);
  });

  it('a flat picture gives every region its colour', () => {
    const out = regionBuffer();
    expect(sampleRegions(pixels(16, 9, () => [255, 0, 0, 255]), out, scratchBuffer())).toBe(true);
    for (const r of REGIONS) near(region(out, r), RED);
  });

  it('averages each region on its own: left quarter, right quarter, top and bottom third, centre', () => {
    const out = regionBuffer();
    // Red on the left half, blue on the right.
    sampleRegions(pixels(16, 9, (x) => (x < 8 ? [255, 0, 0, 255] : [0, 0, 255, 255])), out, scratchBuffer());
    near(region(out, 'left'), RED);
    near(region(out, 'right'), BLUE);
    // Centre and average are the mix of the two in linear light, the same for both.
    const mix = regionBuffer();
    linearToOklab(0.5, 0, 0.5, mix, 0);
    near(region(out, 'centre'), [mix[0], mix[1], mix[2]]);
    near(region(out, 'avg'), [mix[0], mix[1], mix[2]]);
    // Top rows white, the rest black.
    sampleRegions(pixels(16, 9, (_, y) => (y < 3 ? [255, 255, 255, 255] : [0, 0, 0, 255])), out, scratchBuffer());
    near(region(out, 'top'), [1, 0, 0]);
    near(region(out, 'bottom'), [0, 0, 0]);
    near(region(out, 'centre'), [0, 0, 0]);
  });

  it('weighs by alpha, keeps a region with no opaque pixel, and reports an empty picture', () => {
    const out = regionBuffer();
    const acc = scratchBuffer();
    sampleRegions(pixels(16, 9, () => [255, 0, 0, 255]), out, acc);
    // Blue only in the left quarter; everything else transparent.
    expect(sampleRegions(pixels(16, 9, (x) => (x < 4 ? [0, 0, 255, 255] : [0, 255, 0, 0])), out, acc)).toBe(true);
    near(region(out, 'left'), BLUE);
    near(region(out, 'right'), RED);
    near(region(out, 'avg'), BLUE);
    expect(sampleRegions(pixels(4, 4, () => [9, 9, 9, 0]), out, acc)).toBe(false);
    near(region(out, 'right'), RED);
  });

  it('eases exponentially, freezes at an infinite time constant, snaps at zero', () => {
    expect(easeFactor(600, 600)).toBeCloseTo(1 - Math.exp(-1), 6);
    expect(easeFactor(100, Infinity)).toBe(0);
    expect(easeFactor(0, 600)).toBe(0);
    expect(easeFactor(16, 0)).toBe(1);
    const cur = new Float32Array([0, 1]);
    const tgt = new Float32Array([1, 1]);
    expect(smoothToward(cur, tgt, 0.25)).toBeCloseTo(0.25, 6);
    expect([...cur]).toEqual([0.25, 1]);
    // Two half-steps of dt cover the same as one of 2·dt.
    const a = new Float32Array([0]);
    smoothToward(a, tgt, easeFactor(50, 600));
    smoothToward(a, tgt, easeFactor(50, 600));
    expect(a[0]).toBeCloseTo(easeFactor(100, 600), 5);
  });

  it('writes OKLab CSS, clamping lightness', () => {
    const buf = new Float32Array([1.2, 0.1, -0.05]);
    expect(oklabCss(buf, 0)).toBe('oklab(1.000 0.1000 -0.0500)');
  });

  it('the theme scope sets every ambient variable to a neutral fallback at strength 0', () => {
    for (const { id, facets } of packs)
      for (const mode of ['light', 'dark'] as const) {
        const vars = toCssVars(facets, mode);
        for (const v of AMBIENT_VARS) expect(vars[v], `${id} ${mode} ${v}`).toBe(AMBIENT_FALLBACKS[v]);
        expect(vars['--ambient-strength']).toBe('0');
      }
  });
});

describe('Ambient', () => {
  afterEach(() => vi.useRealTimers());

  it('writes the sampled colours on its own element', () => {
    vi.useFakeTimers();
    const red = pixels(16, 9, () => [255, 0, 0, 255]);
    const { container } = render(
      <Ambient source={() => red} data-testid="a">
        <span>inside</span>
      </Ambient>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toBe('lib-ambient');
    vi.advanceTimersByTime(1000);
    const avg = el.style.getPropertyValue('--ambient-avg');
    expect(avg).toMatch(/^oklab\(0\.62\d /);
    for (const v of AMBIENT_VARS.slice(0, 6)) expect(el.style.getPropertyValue(v)).toBe(avg);
  });

  it('writes nothing with no picture, so the fallbacks hold', () => {
    vi.useFakeTimers();
    const { container } = render(<Ambient source={() => null} />);
    vi.advanceTimersByTime(1000);
    const el = container.firstElementChild as HTMLElement;
    for (const v of AMBIENT_VARS) expect(el.style.getPropertyValue(v)).toBe('');
  });
});
