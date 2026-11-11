import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LAYERS, SCOPE_VARS, toCssVars, type Layer, type Mode, type Palette, type Scheme } from './contract';
import { packs } from './foundation/themes/packs';
import { palettes } from './foundation/themes/palettes';
import { materials } from './foundation/themes/materials';
import { ThemeScope, resolveTheme } from './theme';
import { Region, Screen } from './layouts';
import { checkContract } from './checks';

// jsdom gives import.meta.url a non-file scheme; tests run from the repo root.
const dir = join(process.cwd(), 'src/library');
const read = (rel: string) => readFileSync(join(dir, rel), 'utf8');
/** Every file under `rel`, at any depth, matching `ext`; stories and tests excluded. A missing folder has none. */
const filesUnder = (rel: string, ext: RegExp) =>
  existsSync(join(dir, rel))
    ? readdirSync(join(dir, rel), { recursive: true, encoding: 'utf8' })
        .filter((f) => ext.test(f) && !/\.(stories|test)\.tsx?$/.test(f))
        .map((f) => `${rel}/${f}`)
    : [];

// Everything a component draws with: styles and markup, not theme data.
const COMPONENT_SOURCES = [
  'library.css',
  ...filesUnder('components', /\.(tsx?|css)$/),
  ...filesUnder('music', /\.(tsx?|css)$/),
  ...filesUnder('graph', /\.(tsx?|css)$/),
  ...filesUnder('layouts', /\.(tsx?|css)$/),
  ...filesUnder('yahaha', /\.(tsx?|css)$/),
  ...filesUnder('report', /\.(tsx?|css)$/),
  ...filesUnder('compendium', /\.(tsx?|css)$/),
  ...filesUnder('openspec', /\.(tsx?|css)$/),
  ...filesUnder('push', /\.(tsx?|css)$/),
];
const MODES: Mode[] = ['light', 'dark'];
const CONTRACT = new Set([...Object.keys(toCssVars(packs[0].facets, 'dark')), ...SCOPE_VARS]);

/**
 * The mix[flow] port and the live panes built in its face still speak the reference's own
 * vocabulary (`--wdg-*`, values a model sets inline, the reference's radii and spectral colours;
 * `docs/music.md`). These files of `music/` are excused from the two rules below; every other file
 * there, the older token-drawn parts among them, is held like any component. A file comes off the
 * list when it meets the contract, and none is added: a new music file reads the contract.
 */
const PORT_VOCABULARY = new Set([
  'music/base.css',
  'music/components/DeckStrip/DeckStrip.fixtures.ts',
  'music/components/Frames/frames.fixtures.ts',
  'music/components/Frames/frames.model.ts',
  'music/components/Meter/Meter.css',
  'music/components/SeekBar/SeekBar.css',
  'music/components/mixer.css',
  'music/components/parameters.css',
  'music/components/pressables.css',
  'music/live/components/CutPads/CutPads.css',
  'music/live/components/LaunchGrid/LaunchGrid.css',
  'music/live/components/SectionBar/SectionBar.css',
  'music/live/components/SetlistRiver/SetlistRiver.css',
  'music/live/components/StemDeck/StemDeck.css',
  'music/live/components/StemDeck/StemDeck.model.ts',
  'music/live/components/ThrowPads/ThrowPads.css',
  'music/live/live.css',
  'music/live/live.model.ts',
  'music/model/spectralOutline.ts',
  'music/model/spectralPainter.ts',
  'music/model/theme/resolve.ts',
  'music/model/theme/spectral.ts',
  'music/preview.css',
  'music/theme.css',
]);

/** What a component source reads or writes outside the contract (`checks.ts`, run on zen's own sources). */
const contract = checkContract(dir, { files: COMPONENT_SOURCES });
const contractProblems = (file: string): string[] => contract.filter((f) => f.file === file).map((f) => f.message);
/** Each mode of a palette, named for messages. */
const schemes = (p: Palette): [string, Scheme][] => MODES.map((mode) => [`${p.id} ${mode}`, p[mode]]);

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

/** Solid fills and the ink drawn on them; each must meet WCAG AA. */
const inkPairs = (p: Scheme): [string, string, string][] => [
  ['success', p.success, p.successText],
  ['warning', p.warning, p.warningText],
  ['danger', p.danger, p.dangerText],
  ['role-1', p.roles[0], p.roleText[0]],
  ['role-2', p.roles[1], p.roleText[1]],
];
/** Every meaning-bearing colour (yahaha/hues.ts): the five categorical hues, the three states, the two roles,
 *  next (--accent) and playing (--selected). */
const meaningColours = (p: Scheme): [string, string][] => [
  ...p.hues.map((hue, i): [string, string] => [`hue-${i + 1}`, hue]),
  ['success', p.success],
  ['warning', p.warning],
  ['danger', p.danger],
  ['role-1', p.roles[0]],
  ['role-2', p.roles[1]],
  ['accent', p.accent],
  ['selected', p.selected],
];
const expectAA = (name: string, p: Scheme) => {
  for (const [role, fill, ink] of inkPairs(p)) expect(contrast(fill, ink), `${name} ${role} ${fill} on ${ink}`).toBeGreaterThanOrEqual(4.5);
};
const expectDistinct = (name: string, p: Scheme) => {
  // No pair is exempt: no source defines two of these roles as one colour. Exempt a pair here
  // only with the source rule that joins them.
  const roles = meaningColours(p);
  for (const [i, [a, x]] of roles.entries())
    for (const [b, y] of roles.slice(i + 1))
      expect(distance(x, y), `${name} ${a} ${x} vs ${b} ${y}`).toBeGreaterThanOrEqual(DISTINCT);
};

describe('token contract', () => {
  it('every theme pack fills every contract variable, in both modes', () => {
    for (const pack of packs)
      for (const mode of MODES) {
        const vars = toCssVars(pack.facets, mode);
        expect(new Set([...Object.keys(vars), ...SCOPE_VARS]), `${pack.id} ${mode}`).toEqual(CONTRACT);
        for (const [name, value] of Object.entries(vars)) expect(value, `${pack.id} ${mode} ${name}`).toBeTruthy();
      }
  });

  it('components only read contract variables or ones they declare, and contain no literal colours or radii', () => {
    const problems = COMPONENT_SOURCES.filter((f) => !PORT_VOCABULARY.has(f)).flatMap(contractProblems);
    expect(problems).toEqual([]);
  });

  it('every file excused as the mix[flow] port still needs the excuse (the list only shrinks)', () => {
    for (const file of PORT_VOCABULARY) {
      expect(COMPONENT_SOURCES, `${file} is listed in PORT_VOCABULARY but is not a component source`).toContain(file);
      expect(contractProblems(file), `${file} now meets the contract: take it off PORT_VOCABULARY`).not.toEqual([]);
    }
  });

  it('scrolling behind a pinned region is declared (`under`, `over`), never painted', () => {
    // The assembled screen clips and fades a slot that scrolls behind (layouts/Assembly/Assembly.css).
    // Anywhere else, a vertical fade mask or a clip read from the scroll-behind room is that look hand-rolled.
    for (const file of COMPONENT_SOURCES.filter((f) => !f.startsWith('layouts/Assembly/'))) {
      const src = read(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src, `${file} hand-rolls a scroll fade: declare under/over instead`).not.toMatch(/\bmask(-image)?\s*:[^;]*linear-gradient\(\s*(to (top|bottom)|0deg|180deg)/);
      expect(src, `${file} hand-rolls a scroll fade: declare under/over instead`).not.toMatch(/\bmaskImage\b/);
      expect(src, `${file} hand-rolls a scroll-under clip: declare under/over instead`).not.toMatch(/\bclip-?path\s*:[^;]*--[a-z0-9-]*(under|over|hole|bar-top|clip)/i);
    }
  });

  it('palettes keep five distinct categorical hues in each mode', () => {
    for (const p of palettes) for (const [name, s] of schemes(p)) expect(new Set(s.hues).size, name).toBe(5);
  });

  it('ink on a solid fill meets WCAG AA against it in both modes of every palette', () => {
    for (const p of palettes) for (const [name, s] of schemes(p)) expectAA(name, s);
  });

  it('ink on a solid fill meets WCAG AA against it in every pack', () => {
    for (const { id, facets } of packs) for (const mode of MODES) expectAA(`${id} ${mode}`, facets.palette[mode]);
  });

  it('every meaning-bearing colour is distinct from every other in both modes of every palette', () => {
    for (const p of palettes) for (const [name, s] of schemes(p)) expectDistinct(name, s);
  });

  it('every meaning-bearing colour is distinct from every other in every pack', () => {
    for (const { id, facets } of packs) for (const mode of MODES) expectDistinct(`${id} ${mode}`, facets.palette[mode]);
  });

  it('white keys are light and black keys dark in each mode of every palette', () => {
    for (const p of palettes)
      for (const [name, { keys }] of schemes(p)) {
        expect(luminance(keys.white), name).toBeGreaterThan(luminance(keys.black));
        expect(contrast(keys.white, keys.black), name).toBeGreaterThanOrEqual(4.5);
      }
  });

  it('the scheme flag is 1 in light and 0 in dark', () => {
    for (const { id, facets } of packs) {
      expect(toCssVars(facets, 'light')['--scheme-light'], id).toBe('1');
      expect(toCssVars(facets, 'dark')['--scheme-light'], id).toBe('0');
    }
  });

  it('every material set draws every layer, with every layer field filled', () => {
    const fields: (keyof Layer)[] = ['fill', 'solid', 'texture', 'backdrop', 'cast', 'edge'];
    for (const m of materials) {
      expect(Object.keys(m.layers).sort(), m.id).toEqual([...LAYERS].sort());
      for (const name of LAYERS)
        for (const field of fields) expect(m.layers[name][field]?.trim(), `${m.id} ${name}.${field}`).toBeTruthy();
    }
  });

  it('every material and layer variable is in the contract', () => {
    for (const name of LAYERS)
      for (const field of ['fill', 'solid', 'texture', 'backdrop', 'cast', 'edge'])
        expect(CONTRACT.has(`--layer-${name}-${field}`), `--layer-${name}-${field}`).toBe(true);
    for (const role of ['well', 'screen', 'key', 'handle'])
      for (const part of ['fill', 'shadow', 'texture'])
        expect(CONTRACT.has(`--mat-${role}-${part}`), `--mat-${role}-${part}`).toBe(true);
    for (const part of ['track', 'tab', 'chosen'])
      for (const field of ['fill', 'shadow', 'texture'])
        expect(CONTRACT.has(`--mat-tabs-${part}-${field}`), `--mat-tabs-${part}-${field}`).toBe(true);
    for (const v of ['--mat-key-pressed', '--mat-lit-glow', '--mat-lit-radius', '--mat-lit-strength', '--light-angle', '--mat-plate-inset', '--mat-plate-gap', '--radius-card'])
      expect(CONTRACT.has(v), v).toBe(true);
  });
});

describe('theme mixing', () => {
  it('a facet override replaces only that facet', () => {
    const base = resolveTheme({ theme: 'linear' });
    const other = palettes.find((p) => p.id !== base.facets.palette.id)!;
    const mixed = resolveTheme({ theme: 'linear', palette: other.id });
    expect(mixed.facets.palette).toBe(other);
    expect(mixed.facets.faces).toBe(base.facets.faces);
    expect(mixed.facets.scale).toBe(base.facets.scale);
    expect(mixed.facets.materials).toBe(base.facets.materials);
  });

  it('unknown ids fall back to the first pack and its facets', () => {
    const { pack, facets } = resolveTheme({ theme: 'nope', palette: 'nope', faces: 'nope', scale: 'nope', materials: 'nope' });
    expect(pack).toBe(packs[0]);
    expect(facets).toEqual(packs[0].facets);
    expect(facets.materials).toBe(packs[0].facets.materials);
  });

  it("a layout screen renders under every pack with that pack's variables", () => {
    for (const pack of packs)
      for (const mode of MODES) {
        const { container, unmount } = render(
          <ThemeScope facets={pack.facets} mode={mode}>
            <Screen name="Stage" areas={['main']}>
              <Region name="Mixer" label="Mixer" area="main">
                <button type="button">Start</button>
              </Region>
            </Screen>
          </ThemeScope>,
        );
        const scope = container.firstElementChild as HTMLElement;
        expect(scope.dataset.mode).toBe(mode);
        expect(scope.style.getPropertyValue('--action'), `${pack.id} ${mode}`).toBe(pack.facets.palette[mode].action);
        expect(scope.style.getPropertyValue('--radius-card'), pack.id).toBe(pack.facets.materials.radiusCard);
        expect(screen.getByRole('group', { name: 'Stage' })).toContainElement(screen.getByRole('region', { name: 'Mixer' }));
        expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
        unmount();
      }
  });
});
