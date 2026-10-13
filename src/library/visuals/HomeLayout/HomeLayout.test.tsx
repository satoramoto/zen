import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { assemble, principlesFor, type Placement } from '../../layout/assembly';
import { packs } from '../../themes/packs';
import { modesFor } from '../model/home-model';
import { HomeLayout, homeDocks, homeSpec } from './HomeLayout';

// Home assembled under the visuals pack's own principles (roomy scale, frost materials): which
// regions dock at the original's sizes, from their needs alone (docs/assembly.md).
const pack = packs.find((p) => p.id === 'visuals')!;
const P = principlesFor(pack.facets, pack.principles);

const forms = (p: Placement) => Object.fromEntries(Object.values(p.regions).map((r) => [r.id, r.form]));

/** Every region inside the room, and none overlapping another. */
function fits(p: Placement, room: { w: number; h: number }) {
  expect(p.zoom).toBe(1);
  expect(p.overflow).toBe(false);
  const rects = Object.values(p.regions).map((r) => r.rect);
  for (const r of rects) {
    expect(r.x).toBeGreaterThanOrEqual(-0.5);
    expect(r.y).toBeGreaterThanOrEqual(-0.5);
    expect(r.x + r.w).toBeLessThanOrEqual(room.w + 0.5);
    expect(r.y + r.h).toBeLessThanOrEqual(room.h + 0.5);
  }
  for (const a of rects)
    for (const b of rects) {
      if (a === b || a.w === 0 || b.w === 0) continue;
      const apart = a.x + a.w <= b.x + 0.5 || b.x + b.w <= a.x + 0.5 || a.y + a.h <= b.y + 0.5 || b.y + b.h <= a.y + 0.5;
      expect(apart).toBe(true);
    }
}

describe('Home assembles itself at the original sizes', () => {
  const at = (w: number, h: number) => {
    const room = { w, h };
    const p = assemble(homeSpec(), room, P);
    fits(p, room);
    return p;
  };

  it('1440 × 900: both panels docked, everything at its richest', () => {
    const p = at(1440, 900);
    expect(forms(p)).toEqual({ sidebar: 'docked', header: 'full', hero: 'full', pane: 'wide', bar: 'bar', inspector: 'docked' });
    // The sidebar's panel is 240px with its 8px inset; the inspector's 288 with its own.
    expect(p.regions.sidebar.rect.w).toBe(248);
    expect(p.regions.inspector.rect.w).toBe(296);
    // The hero at the original's cap, the grid taking the rest of the column's height.
    expect(p.regions.hero.rect.h).toBe(440);
    expect(p.regions.pane.rect.h).toBeGreaterThan(p.regions.hero.rect.h / 3);
  });

  it('1100 × 800: the sidebar docked, the inspector laid over, the tiles small (as under the original 1100)', () => {
    const p = at(1100, 800);
    expect(forms(p)).toMatchObject({ sidebar: 'docked', inspector: 'overlaid', header: 'full', hero: 'full', pane: 'small' });
    expect(p.regions.inspector.rect.w).toBe(0);
  });

  it('900 × 700: the sidebar still docks (from 900), the inspector laid over, the hero shorter', () => {
    const p = at(900, 700);
    expect(forms(p)).toMatchObject({ sidebar: 'docked', inspector: 'overlaid', header: 'full', hero: 'compact', pane: 'small' });
  });

  it('560 × 800: both panels laid over, the header narrow', () => {
    const p = at(560, 800);
    expect(forms(p)).toMatchObject({ sidebar: 'overlaid', inspector: 'overlaid', header: 'narrow', hero: 'compact', pane: 'small' });
  });

  it('the docking widths come out of the needs: the sidebar from 900, the inspector from about 1200', () => {
    const docks = (w: number) => homeDocks({ w, h: 900 }, P);
    expect(docks(900).sidebar).toBe(true);
    expect(docks(899).sidebar).toBe(false);
    expect(docks(1100).inspector).toBe(false);
    // 248 + 296 + the hero's 588 + two 32px seams: 1196, four px short of the original's 1200.
    expect(docks(1195).inspector).toBe(false);
    expect(docks(1196).inspector).toBe(true);
    expect(docks(1200).inspector).toBe(true);
  });
});

describe('Home: the viewer’s choices over where the panels dock', () => {
  it('a docking pane shows unless hidden; one that can’t dock shows laid over only when opened', () => {
    const wide = homeDocks({ w: 1440, h: 900 }, P);
    const narrow = homeDocks({ w: 800, h: 900 }, P);
    expect(modesFor(wide, { sidebar: null, inspector: null })).toEqual({ sidebar: 'docked', inspector: 'docked' });
    expect(modesFor(wide, { sidebar: false, inspector: false })).toEqual({ sidebar: 'hidden', inspector: null });
    expect(modesFor(narrow, { sidebar: null, inspector: null })).toEqual({ sidebar: 'hidden', inspector: null });
    expect(modesFor(narrow, { sidebar: true, inspector: true })).toEqual({ sidebar: 'overlay', inspector: 'overlay' });
  });

  it('a hidden sidebar gives its room to the column: the richer forms come back', () => {
    const shown = assemble(homeSpec({ sidebar: 'docked', inspector: 'docked' }), { w: 1300, h: 900 }, P);
    const hidden = assemble(homeSpec({ sidebar: 'overlaid', inspector: 'docked' }), { w: 1300, h: 900 }, P);
    expect(shown.regions.pane.form).toBe('small');
    expect(hidden.regions.pane.form).toBe('wide');
  });
});

describe('Home: the title beside the window buttons', () => {
  const header = (w: number) => assemble(homeSpec({ sidebar: 'overlaid', inspector: 'overlaid' }), { w, h: 900 }, P).regions.header.form;

  it('with no sidebar docked the header holds the buttons’ room and the title, which folds before the header narrows', () => {
    expect(header(1440)).toBe('titled');
    expect(header(760)).toBe('full');
    expect(header(560)).toBe('narrow');
  });

  it('free to choose (the docking answer), the header needs neither: the docking widths stay', () => {
    expect(assemble(homeSpec(), { w: 1440, h: 900 }, P).regions.header.form).toBe('full');
  });
});

describe('HomeLayout on screen', () => {
  it('draws the title in the sidebar’s band, which still drags the window, and not in the header', () => {
    const { container } = render(<HomeLayout sidebar={<p>side</p>} header={<p>head</p>} sidebarMode="docked" />);
    const band = container.querySelector('.vs-lay-side-band');
    expect(band).toHaveAttribute('data-tauri-drag-region');
    expect(band?.querySelector('.vs-lay-title')).toHaveTextContent('visual[flow]');
    expect(container.querySelector('.vs-lay-head .vs-lay-title')).toBeNull();
  });

  it('places each part in its slot, in the form the solver chose', () => {
    const { container } = render(
      <HomeLayout sidebar={<p>side</p>} header={<p>head</p>} hero={<p>hero</p>} bar={<p>bar</p>} inspector={<p>insp</p>} sidebarMode="docked" inspectorMode="overlay">
        <p>tiles</p>
      </HomeLayout>,
    );
    const slot = (id: string) => container.querySelector(`[data-region='${id}']`);
    expect(slot('sidebar')).toHaveAttribute('data-form', 'docked');
    expect(slot('inspector')).toHaveAttribute('data-form', 'overlaid');
    expect(slot('header')?.querySelector('.vs-lay-head')).not.toBeNull();
    expect(slot('pane')?.querySelector('main')).toHaveTextContent('tiles');
    // The inspector laid over is drawn from its empty slot, opaque.
    expect(slot('inspector')?.querySelector('.vs-lay-cell--overlay.lib-opaque')).not.toBeNull();
    // No grid of its own: the frame is the assembled screen.
    expect(container.querySelector('.lib-screen__grid')).toBeNull();
  });
});
