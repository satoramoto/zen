// The Stage's layout, proved without a browser: the solver's placement of STAGE_SPEC under every
// pack at the board (1440 × 900), the small screen (1217 × 752) and 900 × 700.
import { describe, expect, it } from 'vitest';
import { assemble, principlesFor, resolveLength, resolveNeed, type Placement, type Principles, type RegionSpec, type ScreenSpec } from '../../layout/assembly';
import { packs } from '../../themes/packs';
import { scales } from '../../themes/scales';
import { STAGE_SPEC, STAGE_SPLIT_SPEC } from './Stage.spec';

const SIZES = [
  [1440, 900],
  [1217, 752],
  [900, 700],
] as const;

const forms = (p: Placement) => Object.fromEntries(Object.values(p.regions).filter((r) => r.zone === 'body').map((r) => [r.id, r.form]));

/** Every region spec in a screen spec, header, body and footer. */
function regionsOf(spec: ScreenSpec): RegionSpec[] {
  const out: RegionSpec[] = [...(spec.header ?? []), ...(spec.footer ?? [])];
  const walk = (rows: ScreenSpec['rows']) => rows.forEach((row) => row.forEach((x) => ('rows' in x ? walk(x.rows) : out.push(x))));
  walk(spec.rows);
  return out;
}

/**
 * What a viable placement means: zoom at least the floor (every target ≥ minTarget), no
 * overflow, every body region inside the body and at least its chosen form's least (its plate
 * added), no two regions overlapping, a ratio form never taller than its width asks.
 */
function expectViable(spec: ScreenSpec, p: Placement, pr: Principles, label: string) {
  expect(p.overflow, label).toBe(false);
  expect(p.zoom * pr.scale.control, `${label}: a control on screen`).toBeGreaterThanOrEqual(pr.minTarget - 1e-6);
  const specs = new Map(regionsOf(spec).map((r) => [r.id, r]));
  const body = Object.values(p.regions).filter((r) => r.zone === 'body');
  const { inset, head } = pr.plate;
  for (const r of body) {
    const s = specs.get(r.id)!;
    const form = s.forms[r.step];
    const least = resolveNeed(form.min, pr);
    const chromeW = s.plate === false ? 0 : inset.left + inset.right;
    const chromeH = (s.plate === false ? 0 : inset.top + inset.bottom) + (s.head ? head.top + head.bottom + pr.scale.control : 0);
    expect(r.rect.w, `${label}: ${r.id} width`).toBeGreaterThanOrEqual(least.w + chromeW - 0.5);
    expect(r.rect.h, `${label}: ${r.id} height`).toBeGreaterThanOrEqual(least.h + chromeH - 0.5);
    expect(r.rect.x + r.rect.w, `${label}: ${r.id} inside`).toBeLessThanOrEqual(p.layout.w + 0.5);
    expect(r.rect.y + r.rect.h, `${label}: ${r.id} inside`).toBeLessThanOrEqual(p.layout.h + 0.5);
    if (form.ratio) {
      const fixed = form.ratio.fixed ? resolveNeed(form.ratio.fixed, pr) : { w: 0, h: 0 };
      const follows = chromeH + fixed.h + ((r.rect.w - chromeW - fixed.w) * form.ratio.h) / form.ratio.w;
      expect(r.rect.h, `${label}: ${r.id} follows its width`).toBeLessThanOrEqual(Math.max(follows, least.h + chromeH) + 0.5);
    }
  }
  for (const a of body)
    for (const b of body) {
      if (a.id >= b.id) continue;
      const apart = a.rect.x + a.rect.w <= b.rect.x + 0.5 || b.rect.x + b.rect.w <= a.rect.x + 0.5 || a.rect.y + a.rect.h <= b.rect.y + 0.5 || b.rect.y + b.rect.h <= a.rect.y + 0.5;
      expect(apart, `${label}: ${a.id} and ${b.id} overlap`).toBe(true);
    }
}

/** The hierarchy: what's playing steps down only after the controls have (the log is in order). */
function expectHeroLast(p: Placement, label: string) {
  const down = p.steps.map((s) => s.split(':')[0]);
  const first = down.indexOf('hero');
  if (first < 0) return;
  expect(down.slice(0, first), `${label}: something stepped before the hero`).not.toHaveLength(0);
  expect(down.slice(0, first).some((id) => ['mixer', 'knobs', 'pads', 'transport'].includes(id)), label).toBe(true);
}

describe('the Stage assembles itself', () => {
  /** The forms the solver picks for the three Yahaha packs (the table in the lane's report). */
  const CHOSEN: Record<string, Record<string, Record<string, string>>> = {
    'yahaha-classic': {
      '1440x900': { hero: 'full', transport: 'keys', form: 'strip', mixer: 'short', knobs: 'labelled', pads: 'small' },
      '1217x752': { hero: 'minimal', transport: 'keys', form: 'folded', mixer: 'short', knobs: 'compact', pads: 'small' },
      '900x700': { hero: 'minimal', transport: 'tight', form: 'folded', mixer: 'short', knobs: 'compact', pads: 'small' },
    },
    'yahaha-push': {
      '1440x900': { hero: 'full', transport: 'keys', form: 'strip', mixer: 'tall', knobs: 'labelled', pads: 'two-rows' },
      '1217x752': { hero: 'compact', transport: 'keys', form: 'folded', mixer: 'short', knobs: 'compact', pads: 'small' },
      '900x700': { hero: 'compact', transport: 'tight', form: 'folded', mixer: 'short', knobs: 'compact', pads: 'small' },
    },
    'yahaha-elektron': {
      '1440x900': { hero: 'full', transport: 'keys', form: 'strip', mixer: 'short', knobs: 'labelled', pads: 'two-rows' },
      '1217x752': { hero: 'minimal', transport: 'keys', form: 'folded', mixer: 'short', knobs: 'compact', pads: 'two-rows' },
      '900x700': { hero: 'minimal', transport: 'tight', form: 'strip', mixer: 'short', knobs: 'compact', pads: 'small' },
    },
  };

  for (const [id, bySize] of Object.entries(CHOSEN))
    for (const [w, h] of SIZES)
      it(`${id} at ${w} × ${h}: the forms`, () => {
        const pack = packs.find((p) => p.id === id)!;
        const p = assemble(STAGE_SPEC, { w, h }, principlesFor(pack.facets, pack.principles));
        expect(forms(p)).toEqual(bySize[`${w}x${h}`]);
      });

  /**
   * visual[flow]'s frost materials part regions by 32 px and pad them by 22 (its look: space is
   * the look), which the Stage's six regions can't afford below the board: there it holds the
   * zoom floor and scrolls. Every other pack is viable at every size.
   */
  const SCROLLS = new Set(['visuals 1217x752', 'visuals 900x700']);

  for (const pack of packs)
    for (const [w, h] of SIZES) {
      const label = `${pack.id} ${w}x${h}`;
      it(`${label}: viable (${SCROLLS.has(label) ? 'scrolls at the floor' : 'no overflow, zoom ≥ floor, nothing cut off or overlapping'})`, () => {
        const pr = principlesFor(pack.facets, pack.principles);
        const p = assemble(STAGE_SPEC, { w, h }, pr);
        if (SCROLLS.has(label)) {
          expect(p.overflow).toBe(true);
          expect(p.zoom).toBeCloseTo(pr.minTarget / pr.scale.control, 6);
          return;
        }
        expectViable(STAGE_SPEC, p, pr, label);
        expectHeroLast(p, label);
        // The bar, keys and status line never zoom or step: their own heights, full width.
        expect(p.regions.bar.rect.h).toBeCloseTo(resolveLength({ control: 1, space: [2, 2] }, pr), 6);
        expect(p.regions.bar.rect.w).toBe(w);
      });
    }

  it('at the board the hero is the tallest region of its row and reaches its full form under every Yahaha pack', () => {
    for (const pack of packs.filter((p) => p.id.startsWith('yahaha'))) {
      const p = assemble(STAGE_SPEC, { w: 1440, h: 900 }, principlesFor(pack.facets, pack.principles));
      expect(p.regions.hero.form, pack.id).toBe('full');
      expect(p.zoom, pack.id).toBe(1);
      expect(p.regions.hero.rect.h, pack.id).toBeCloseTo(p.regions.transport.rect.h, 6);
    }
  });

  it('keeps one column seam: the hero and the mixer share a width', () => {
    for (const pack of packs)
      for (const [w, h] of SIZES) {
        const p = assemble(STAGE_SPEC, { w, h }, principlesFor(pack.facets, pack.principles));
        expect(p.regions.hero.rect.w, `${pack.id} ${w}x${h}`).toBeCloseTo(p.regions.mixer.rect.w, 6);
      }
  });

  it('under every scale, the Yahaha packs at the board never overflow', () => {
    for (const pack of packs.filter((p) => p.id.startsWith('yahaha')))
      for (const scale of scales) {
        const pr = principlesFor({ ...pack.facets, scale }, pack.principles);
        expectViable(STAGE_SPEC, assemble(STAGE_SPEC, { w: 1440, h: 900 }, pr), pr, `${pack.id} ${scale.id}`);
      }
  });

  it('the split spec places the song form with its transport beside the hero, its parts named', () => {
    const pack = packs.find((p) => p.id === 'yahaha-classic')!;
    const pr = principlesFor(pack.facets, pack.principles);
    const p = assemble(STAGE_SPLIT_SPEC, { w: 1440, h: 900 }, pr);
    expectViable(STAGE_SPLIT_SPEC, p, pr, 'split 1440x900');
    expect(p.regions.form.parts).toEqual({ form: 'strip', transport: 'keys' });
    expect(p.regions.transport).toBeUndefined();
  });
});
