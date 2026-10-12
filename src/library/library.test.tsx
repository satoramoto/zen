import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { toCssVars } from './contract';
import { packs } from './themes/packs';
import { palettes } from './themes/palettes';
import { ThemeScope, resolveTheme } from './theme';
import { ArrangerStage } from './screens/ArrangerStage';

// jsdom gives import.meta.url a non-file scheme; tests run from the repo root.
const dir = join(process.cwd(), 'src/library');
const read = (rel: string) => readFileSync(join(dir, rel), 'utf8');
const filesIn = (rel: string, ext: RegExp) =>
  readdirSync(join(dir, rel))
    .filter((f) => ext.test(f))
    .map((f) => `${rel}/${f}`);
/** Every file under `rel`, at any depth, matching `ext`; stories and tests excluded. */
const filesUnder = (rel: string, ext: RegExp) =>
  readdirSync(join(dir, rel), { recursive: true, encoding: 'utf8' })
    .filter((f) => ext.test(f) && !/\.(stories|test)\.tsx?$/.test(f))
    .map((f) => `${rel}/${f}`);

// Everything a component draws with: styles and markup, not theme data.
const COMPONENT_SOURCES = [
  'library.css',
  ...filesIn('components', /\.tsx$/),
  ...filesIn('screens', /\.(tsx|css)$/),
  ...filesUnder('yahaha', /\.(tsx?|css)$/),
];
const CONTRACT = new Set(Object.keys(toCssVars(packs[0].facets)));

// Colour maths for the palette checks: WCAG 2 contrast and OKLab distance, from #rrggbb.
const channels = (hex: string) => {
  expect(hex, 'palette colours are #rrggbb').toMatch(/^#[0-9a-f]{6}$/i);
  return [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
};
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const oklab = (hex: string) => {
  const [r, g, b] = channels(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const distance = (a: string, b: string) => {
  const [p, q] = [oklab(a), oklab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};
/** The least OKLab distance at which two role colours read as different at a glance. */
const DISTINCT = 0.12;

describe('token contract', () => {
  it('every theme pack fills every contract variable', () => {
    for (const pack of packs) {
      const vars = toCssVars(pack.facets);
      expect(new Set(Object.keys(vars))).toEqual(CONTRACT);
      for (const [name, value] of Object.entries(vars)) expect(value, `${pack.id} ${name}`).toBeTruthy();
    }
  });

  it('components only read contract variables or ones they declare', () => {
    const declared = new Set<string>();
    for (const file of COMPONENT_SOURCES) for (const m of read(file).matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
    for (const file of COMPONENT_SOURCES) {
      for (const m of read(file).matchAll(/var\((--[a-z0-9-]+)/g)) {
        expect(CONTRACT.has(m[1]) || declared.has(m[1]), `${file} reads ${m[1]}`).toBe(true);
      }
    }
  });

  it('components contain no literal colours or radii', () => {
    for (const file of COMPONENT_SOURCES) {
      const src = read(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src, `${file} has a colour literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
      expect(src, `${file} has a literal radius`).not.toMatch(/border-radius:(?!\s*var\()/);
      // The build rewrites light-dark() into variables only a literal color-scheme sets; the
      // library's scheme comes from var(--scheme), so it renders transparent.
      expect(src, `${file} uses light-dark()`).not.toMatch(/\blight-dark\(/);
    }
  });

  it('palettes keep four distinct categorical hues', () => {
    for (const p of palettes) expect(new Set(p.hues).size, p.id).toBe(4);
  });

  it('ink on a solid fill meets WCAG AA against it in every pack', () => {
    for (const { id, facets } of packs) {
      const p = facets.palette;
      const pairs: [string, string, string][] = [
        ['success', p.success, p.successText],
        ['warning', p.warning, p.warningText],
        ['danger', p.danger, p.dangerText],
        ['style', p.style, p.styleText],
        ['transport', p.transport, p.transportText],
      ];
      for (const [role, fill, ink] of pairs) expect(contrast(fill, ink), `${id} ${role}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every meaning-bearing colour is distinct from every other in every palette', () => {
    // Colour has one meaning (yahaha/hues.ts): the four parts, the three states, the two role
    // hues, next (--accent) and playing (--selected). No pair is exempt: no source defines two
    // of these roles as one colour. Exempt a pair here only with the source rule that joins them.
    for (const p of palettes) {
      const roles: [string, string][] = [
        ...p.hues.map((hue, i): [string, string] => [`hue-${i + 1}`, hue]),
        ['success', p.success],
        ['warning', p.warning],
        ['danger', p.danger],
        ['style', p.style],
        ['transport', p.transport],
        ['accent', p.accent],
        ['selected', p.selected],
      ];
      for (const [i, [a, x]] of roles.entries())
        for (const [b, y] of roles.slice(i + 1))
          expect(distance(x, y), `${p.id} ${a} ${x} vs ${b} ${y}`).toBeGreaterThanOrEqual(DISTINCT);
    }
  });

  it('white keys are light and black keys dark in every palette', () => {
    for (const p of palettes) {
      expect(luminance(p.keyWhite), p.id).toBeGreaterThan(luminance(p.keyBlack));
      expect(contrast(p.keyWhite, p.keyBlack), p.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the scheme flag is 1 in a light palette and 0 in a dark one', () => {
    for (const { id, facets } of packs)
      expect(toCssVars(facets)['--scheme-light'], id).toBe(facets.palette.scheme === 'light' ? '1' : '0');
  });
});

describe('theme mixing', () => {
  it('a facet override replaces only that facet', () => {
    const base = resolveTheme({ theme: 'linear' });
    const mixed = resolveTheme({ theme: 'linear', palette: 'push-dark' });
    expect(mixed.facets.palette.id).toBe('push-dark');
    expect(mixed.facets.chrome).toBe(base.facets.chrome);
    expect(mixed.facets.type).toBe(base.facets.type);
  });

  it('unknown ids fall back to the first pack and its facets', () => {
    const { pack, facets } = resolveTheme({ theme: 'nope', chrome: 'nope' });
    expect(pack).toBe(packs[0]);
    expect(facets.chrome).toBe(packs[0].facets.chrome);
  });

  it('the stage renders under every pack with that pack\'s variables', () => {
    for (const pack of packs) {
      const { container, unmount } = render(
        <ThemeScope facets={pack.facets}>
          <ArrangerStage />
        </ThemeScope>,
      );
      const scope = container.firstElementChild as HTMLElement;
      expect(scope.style.getPropertyValue('--action')).toBe(pack.facets.palette.action);
      expect(scope.style.getPropertyValue('--radius-card')).toBe(pack.facets.chrome.radiusCard);
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
      unmount();
    }
  });
});
