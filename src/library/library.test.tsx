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

// Everything a component draws with: styles and markup, not theme data.
const COMPONENT_SOURCES = ['library.css', ...filesIn('components', /\.tsx$/), ...filesIn('screens', /\.(tsx|css)$/)];
const CONTRACT = new Set(Object.keys(toCssVars(packs[0].facets)));

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
    }
  });

  it('palettes keep four distinct categorical hues', () => {
    for (const p of palettes) expect(new Set(p.hues).size, p.id).toBe(4);
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
