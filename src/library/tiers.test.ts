import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  adoption,
  compare,
  countByFolder,
  folderOf,
  scanCss,
  scanLibrary,
  scanTsx,
  stripTsComments,
  type Counts,
  type Finding,
} from './tiers';
import baseline from './tiers.baseline.json';

const rules = (fs: Finding[], rule: Finding['rule']) => fs.filter((f) => f.rule === rule);

describe('tiers scanner', () => {
  it('keys files to folders', () => {
    expect(folderOf('components/core/Button/Button.css')).toBe('components/core/Button');
    expect(folderOf('components/core/hue.ts')).toBe('components/core');
    expect(folderOf('yahaha/Stage/Stage.css')).toBe('yahaha/Stage');
    expect(folderOf('yahaha/tokens.css')).toBe('yahaha');
    expect(folderOf('layout/Group.css')).toBe('layout');
    expect(folderOf('primitives/Surface/Surface.css')).toBe('primitives');
  });

  it('counts CSS pixels except 0, 1, 2 and media-query preludes', () => {
    const css = `/* 99px in a comment */
.a { border: 1px solid; outline: 2px solid; inset: 0px -1px; }
.b { width: 48px; margin: 0.5px -3px; --yh-w: 12px; }
@media (max-width: 900px) { .c { gap: 4px; } }
@container (min-width: 600px) { .d { top: 0; } }`;
    const px = rules(scanCss('yahaha/X/X.css', css, { knobs: ['--yh-w'] }), 'pixels');
    expect(px.map((f) => [f.line, f.snippet])).toEqual([
      [3, 'width: 48px'],
      [3, 'margin: 0.5px -3px'],
      [3, 'margin: 0.5px -3px'],
      [3, '--yh-w: 12px'],
      [4, 'gap: 4px'],
    ]);
  });

  it('does not count pixels in primitives', () => {
    expect(scanCss('primitives/Surface/Surface.css', '.s { width: 48px; }')).toEqual([]);
    expect(scanTsx('primitives/Text/Text.tsx', "const w = '48px';")).toEqual([]);
  });

  it('counts TSX px strings and bare style lengths', () => {
    const tsx = `// width: '99px' in a comment
const url = 'https://example.com/a'; // 77px
const a = '12px';
const b = { border: '1px solid' };
export const X = () => <div style={{ width: 560, height: 2, padding: 0, opacity: 0.5, top: -8 }} />;
/* margin: 40px */`;
    const px = scanTsx('yahaha/X/X.tsx', tsx);
    expect(px.map((f) => f.line)).toEqual([3, 5, 5]);
    expect(stripTsComments(tsx)).toContain("'https://example.com/a'");
  });

  it('counts margins on a control root, not on its parts or resets', () => {
    const css = `.yh-rackcell { margin: 4px; }
.yh-pad[data-state='on']:hover { margin-top: var(--space-2); }
.yh-fader__cap { margin: 3px; }
.yh-keys .black { margin-left: -4px; }
.yh-x { margin: 0 0; margin-inline: 0px; }
.lib-y:not(.a .b) { margin-block-end: auto; }`;
    const m = rules(scanCss('components/core/X/X.css', css), 'margins');
    expect(m.map((f) => f.line)).toEqual([1, 2, 6]);
    // Not a rule for app folders.
    expect(rules(scanCss('yahaha/X/X.css', '.yh-x { margin: 4px; }'), 'margins')).toEqual([]);
  });

  it('classifies painting by tier', () => {
    const paint = `.lib-group { background: var(--surface); box-shadow: none; border-radius: var(--r); }`;
    expect(rules(scanCss('layout/Group.css', paint), 'painting')).toHaveLength(1);
    expect(rules(scanCss('layout/Layer.css', paint), 'painting')).toHaveLength(0);
    expect(rules(scanCss('layout/Tabs.css', paint), 'painting')).toHaveLength(0);
    expect(rules(scanCss('components/core/X/X.css', paint), 'painting')).toHaveLength(0);

    const region = `.lib-region { background: var(--fill); backdrop-filter: blur(var(--b)); }
.lib-region:not(:has(> .lib-region__head)) { border: 1px solid; }
.lib-region__head[data-x='y'] { box-shadow: var(--rule); }
.lib-region__body { background: var(--fill); }`;
    expect(rules(scanCss('layout/Region.css', region), 'painting').map((f) => f.line)).toEqual([4]);

    const app = `.yh-stage .lib-region { box-shadow: var(--s); }
.yh-pad { background: var(--fill); }
.yh-x[data-part='group'] { border-top: 1px solid var(--line); }
.yh-y { background: transparent; }`;
    expect(rules(scanCss('yahaha/Stage/Stage.css', app), 'painting').map((f) => f.line)).toEqual([1, 3]);
  });

  it('counts knobs not listed under **Tuning knobs**', () => {
    const css = `.yh-f { --yh-fader-h: 1; --yh-cap: 2; --yh-free: 3; --yh-other: 4; --lib-local: 5; }`;
    const knobs = scanCss('yahaha/F/F.css', css, { knobs: ['--yh-fader-*', '--yh-cap'] });
    expect(rules(knobs, 'knobs').map((f) => f.snippet)).toEqual(['--yh-free', '--yh-other']);

    const lonely = `/* Tokens.
   **Tuning knobs.** --yh-a, --yh-b-*
   **Other.** --yh-c */
.lib-scope { --yh-a: 1; --yh-b-x: 2; --yh-c: 3; }`;
    expect(rules(scanCss('yahaha/tokens.css', lonely), 'knobs').map((f) => f.snippet)).toEqual(['--yh-c']);
  });

  it('counts type declarations outside Text, except CSS-wide resets and Text knobs', () => {
    const css = `.yh-a { font-size: var(--size-label); font-weight: 600; line-height: 1; }
.yh-b { letter-spacing: 0.02em; text-transform: uppercase; font-variant-numeric: tabular-nums; }
.yh-c { font: inherit; line-height: inherit !important; font-size: unset; }
.yh-d { --text-size: calc(var(--size-label) * 0.9); --text-leading: 1; font-family: var(--font-mono); }
.yh-e { font: 600 12px var(--font-sans); }`;
    const t = rules(scanCss('components/core/X/X.css', css), 'type');
    expect(t.map((f) => f.line)).toEqual([1, 1, 1, 2, 2, 2, 5]);
    expect(rules(scanCss('primitives/Text.css', css), 'type')).toEqual([]);

    const tsx = `// fontSize: 12 in a comment
const s = { fontSize: 12 };
export const X = () => <div style={{ fontWeight: 600, lineHeight: 1, color: 'red' }} />;
export const Y = () => <div style={{ '--text-size': '1em' } as React.CSSProperties} />;`;
    expect(rules(scanTsx('yahaha/X/X.tsx', tsx), 'type').map((f) => f.line)).toEqual([3, 3]);
    expect(scanTsx('primitives/Text.tsx', tsx)).toEqual([]);
  });

  it('compares counts against the baseline', () => {
    const findings: Finding[] = [{ file: 'yahaha/A/A.css', line: 3, rule: 'pixels', snippet: 'width: 48px' }];
    const counts = countByFolder(Object.assign(findings, { folders: ['yahaha/A', 'primitives', 'components/core/B'] }));
    expect(counts).toEqual({
      'yahaha/A': { pixels: 1, painting: 0, knobs: 0, type: 0 },
      primitives: {},
      'components/core/B': { pixels: 0, margins: 0, knobs: 0, type: 0 },
    });
    expect(compare(counts, { 'yahaha/A': { pixels: 1 } })).toEqual([]);
    expect(compare(counts, { 'yahaha/A': { pixels: 2 } })).toEqual([]);
    const [zero] = compare(counts, {});
    expect(zero).toMatch(/^yahaha\/A pixels: 1 \(rule is an error here: baseline 0\) — use a scale step/);
    expect(zero).toContain('yahaha/A/A.css:3 width: 48px');
    const more = countByFolder([...findings, ...findings]);
    expect(compare(more, { 'yahaha/A': { pixels: 1 } })[0]).toMatch(/^yahaha\/A pixels: 2 > baseline 1 — /);
  });
});

describe('tiers adoption', () => {
  it('counts the widget folders that render Text and Surface', () => {
    const a = adoption(join(process.cwd(), 'src/library'));
    expect(a.components).toContain('components/core/Button');
    expect(a.components).toContain('yahaha/Stage');
    expect(a.components.some((f) => f === 'components/core' || f === 'yahaha')).toBe(false);
    expect(a.text).toContain('yahaha/SongForm');
    expect(a.surface).toContain('components/music/Fader');
    for (const f of [...a.text, ...a.surface]) expect(a.components).toContain(f);
  });
});

describe('tiers ratchet', () => {
  it('no folder breaks a rule more than its baseline (tiers.baseline.json)', () => {
    // jsdom gives import.meta.url a non-file scheme; tests run from the repo root.
    const failures = compare(countByFolder(scanLibrary(join(process.cwd(), 'src/library'))), baseline as Counts);
    expect(failures, `\n${failures.join('\n\n')}\n(after a deliberate improvement, run \`npm run tiers -- --write\`)`).toEqual([]);
  });
});
