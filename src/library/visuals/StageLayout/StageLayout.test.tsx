import { describe, expect, it } from 'vitest';
import { assemble, principlesFor, type Placement } from '../../layout/assembly';
import { packs } from '../../themes/packs';
import { crateModeFor } from '../model/stage-model';
import { crateDocks, stageSpec } from './StageLayout';

// Live's Stage assembled under the visuals pack's principles: where the crate docks and which
// forms the header and the dock take, from their needs alone (docs/assembly.md).
const pack = packs.find((p) => p.id === 'visuals')!;
const P = principlesFor(pack.facets, pack.principles);

const forms = (p: Placement) => Object.fromEntries(Object.values(p.regions).map((r) => [r.id, r.form]));

function fits(p: Placement, room: { w: number; h: number }) {
  expect(p.zoom).toBe(1);
  expect(p.overflow).toBe(false);
  for (const { rect: r } of Object.values(p.regions)) {
    expect(r.x + r.w).toBeLessThanOrEqual(room.w + 0.5);
    expect(r.y + r.h).toBeLessThanOrEqual(room.h + 0.5);
  }
}

/** The Stage as Live draws it at a size: the crate's docking decided, then the screen with the crate pinned. */
function stage(w: number, h: number) {
  const room = { w, h };
  const docks = crateDocks(room, P);
  const p = assemble(stageSpec({ crate: docks ? 'docked' : 'none' }), room, P);
  fits(p, room);
  return { docks, p };
}

describe('the Stage assembles itself at the original sizes', () => {
  it('1440 × 900: the crate docked, the header and the dock at full', () => {
    const { docks, p } = stage(1440, 900);
    expect(docks).toBe(true);
    expect(forms(p)).toMatchObject({ crate: 'docked', head: 'full', dock: 'full' });
    expect(p.regions.crate.rect.w).toBe(248);
    // The picture's open middle takes what the panels leave.
    expect(p.regions.centre.rect.h).toBeGreaterThan(600);
  });

  it('1100 × 800: the crate still docks (from 1100); the dock steps to compact beside it', () => {
    const { docks, p } = stage(1100, 800);
    expect(docks).toBe(true);
    expect(forms(p)).toMatchObject({ crate: 'docked', head: 'full', dock: 'compact' });
  });

  it('900 × 700: the crate laid over (it takes no room); the header keeps its words, the dock compact', () => {
    const { docks, p } = stage(900, 700);
    expect(docks).toBe(false);
    expect(p.regions.crate).toBeUndefined();
    expect(forms(p)).toMatchObject({ head: 'full', dock: 'compact' });
    expect(p.regions.dock.rect).toMatchObject({ x: 0, w: 900 });
  });

  it('560 × 800: the crate laid over, the header short, the dock stacked', () => {
    const { docks, p } = stage(560, 800);
    expect(docks).toBe(false);
    expect(forms(p)).toMatchObject({ head: 'short', dock: 'stacked' });
  });

  it('the crate docks from 1100 and the dock is full from 956 (the original 940 plus its insets)', () => {
    expect(crateDocks({ w: 1100, h: 900 }, P)).toBe(true);
    expect(crateDocks({ w: 1099, h: 900 }, P)).toBe(false);
    const dockAt = (w: number) => assemble(stageSpec({ crate: 'none' }), { w, h: 900 }, P).regions.dock.form;
    expect(dockAt(956)).toBe('full');
    expect(dockAt(955)).toBe('compact');
    expect(dockAt(716)).toBe('compact');
    expect(dockAt(715)).toBe('stacked');
  });

  it('panels hidden: the hint’s strip in the dock’s place', () => {
    const p = assemble(stageSpec({ crate: 'none', panels: false }), { w: 1440, h: 900 }, P);
    expect(p.regions.dock).toBeUndefined();
    expect(p.regions.peek.rect.h).toBe(96);
  });
});

describe('the crate: the viewer’s choice over where it docks', () => {
  it('docked where it can, laid over where it can’t only once opened', () => {
    expect(crateModeFor(true, null)).toBe('docked');
    expect(crateModeFor(false, null)).toBe('hidden');
    expect(crateModeFor(false, true)).toBe('overlay');
    expect(crateModeFor(true, false)).toBe('hidden');
  });
});
