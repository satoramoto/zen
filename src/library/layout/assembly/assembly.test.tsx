import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { packs } from '../../themes/packs';
import { TEXT_ROLES } from '../../primitives/Text';
import { Screen } from '../Screen';
import { DEMO_SPEC, NOW_FORMS, PAD_FORMS } from './Assembly.fixtures';
import {
  assemble,
  cssBox,
  cssPx,
  needsAcross,
  principlesFor,
  rankNumbers,
  resolveLength,
  ROLE_LEADING,
  useForm,
  combineForms,
  type RegionSpec,
  type Principles,
  type ScreenSpec,
} from '.';

/** Round numbers so the expected placements can be worked by hand (docs/assembly.md). */
const P: Principles = {
  scale: { unit: 4, control: 28, sizes: { caption: 11, body: 14, label: 13, heading: 22, display: 44, numeral: 32, code: 14 } },
  minTarget: 24,
  density: 'dense',
  gaps: { body: 2, group: 2 },
  ranks: rankNumbers(),
  plate: { inset: { top: 12, right: 12, bottom: 12, left: 12 }, head: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 8 },
};

const forms = (p: ReturnType<typeof assemble>) => Object.fromEntries(Object.values(p.regions).map((r) => [r.id, r.form]));

describe('assemble: three regions at three rooms', () => {
  it('1440 × 900: every region at its richest form; spare goes to the growers by priority', () => {
    const p = assemble(DEMO_SPEC, { w: 1440, h: 900 }, P);
    expect(forms(p)).toEqual({ bar: 'bar', now: 'full', side: 'docked', pads: 'two-rows' });
    expect(p.steps).toEqual([]);
    expect(p.zoom).toBe(1);
    expect(p.zones.header).toEqual({ x: 0, y: 0, w: 1440, h: 28 });
    expect(p.zones.body).toEqual({ x: 0, y: 36, w: 1440, h: 864 });
    // The top row reaches its ideal (now at 7 controls + plate); the pads, the one grower on h, take the rest.
    expect(p.regions.now.rect).toEqual({ x: 0, y: 0, w: 1128, h: 220 });
    expect(p.regions.side.rect).toEqual({ x: 1136, y: 0, w: 304, h: 220 });
    expect(p.regions.pads.rect).toEqual({ x: 0, y: 228, w: 1440, h: 636 });
  });

  it('900 × 330: the pads go to one row; the sidebar step that turned out not to help is taken back', () => {
    const p = assemble(DEMO_SPEC, { w: 900, h: 330 }, P);
    expect(forms(p)).toMatchObject({ now: 'full', side: 'docked', pads: 'one-row' });
    expect(p.steps).toEqual(['side: docked → rail', 'pads: two-rows → one-row', 'side: rail → docked']);
    expect(p.zoom).toBe(1);
  });

  it('600 × 240: everything at its last form, what is playing last of all, and still no zoom', () => {
    const p = assemble(DEMO_SPEC, { w: 600, h: 240 }, P);
    expect(forms(p)).toMatchObject({ now: 'compact', side: 'rail', pads: 'one-row' });
    expect(p.steps.map((s) => s.split(':')[0])).toEqual(['side', 'pads', 'now']);
    expect(p.zoom).toBe(1);
    expect(p.overflow).toBe(false);
  });
});

describe('assemble: zoom is the last resort', () => {
  it('zooms the body (never the bar) by the one factor that fits its least', () => {
    const p = assemble(DEMO_SPEC, { w: 600, h: 215 }, P);
    expect(forms(p)).toMatchObject({ now: 'compact', side: 'rail', pads: 'one-row' });
    // least body: max(3·28+24, 2·28+24) + 8 + (2·28+24) = 196 in a 179 room.
    expect(p.zoom).toBeCloseTo(179 / 196, 6);
    expect(p.layout.h).toBeCloseTo(196, 6);
    expect(p.zones.header.h).toBe(28);
    expect(p.overflow).toBe(false);
  });

  it('never zooms a target below minTarget: it overflows instead', () => {
    const p = assemble(DEMO_SPEC, { w: 400, h: 150 }, P);
    expect(p.zoom).toBeCloseTo(24 / 28, 6);
    expect(p.overflow).toBe(true);
  });
});

describe('assemble: principles', () => {
  it('a roomy pack steps the hero down where a dense one keeps it', () => {
    expect(forms(assemble(DEMO_SPEC, { w: 900, h: 330 }, { ...P, density: 'roomy' }))).toMatchObject({ now: 'compact', side: 'docked', pads: 'one-row' });
    expect(forms(assemble(DEMO_SPEC, { w: 900, h: 330 }, P))).toMatchObject({ now: 'full' });
  });

  it('is deterministic', () => {
    const a = assemble(DEMO_SPEC, { w: 777, h: 333 }, P);
    expect(assemble(DEMO_SPEC, { w: 777, h: 333 }, P)).toEqual(a);
  });

  it('a pack can reorder the rank ladder: ranked last, the hero steps first', () => {
    const ranks = rankNumbers(['controls', 'next', 'context', 'chrome', 'now']);
    const p = assemble(DEMO_SPEC, { w: 600, h: 240 }, { ...P, ranks });
    expect(p.steps[0].startsWith('now')).toBe(true);
  });

  it('every pack resolves against its facets (the plates are readable lengths)', () => {
    for (const pack of packs) {
      const p = principlesFor(pack.facets, pack.principles);
      expect(p.plate.gap, pack.id).toBeGreaterThan(0);
      expect(p.scale.control, pack.id).toBe(pack.facets.scale.control);
      expect(p.minTarget, pack.id).toBeGreaterThan(0);
    }
  });

  it('reads the materials’ CSS lengths', () => {
    const scale = packs[0].facets.scale; // compact: unit 4, control 28
    expect(cssPx('var(--space-3)', scale)).toBe(12);
    expect(cssPx('22px', scale)).toBe(22);
    expect(cssPx('calc(var(--control-h) * 2)', scale)).toBe(56);
    expect(cssBox('var(--space-2) 0 0', scale)).toEqual({ top: 8, right: 0, bottom: 0, left: 0 });
    expect(() => cssPx('1rem', scale)).toThrow();
  });

  it('resolves units: controls, targets, steps, lines and characters', () => {
    expect(resolveLength({ control: 2, space: [3, 1] }, P)).toBe(56 + 12 + 4);
    expect(resolveLength({ target: 1 }, { ...P, minTarget: 44 })).toBe(44);
    expect(resolveLength({ lines: { display: 1 } }, P)).toBeCloseTo(44 * 1.1);
    expect(resolveLength(needsAcross(2, { w: { control: 1 }, h: { control: 2 } }, { w: { control: 1 }, h: { control: 1 } }).w, P)).toBe(28 + 8 + 28);
  });

  it('ROLE_LEADING matches Text.css', () => {
    const css = readFileSync(join(__dirname, '../../primitives/Text.css'), 'utf8');
    const base = Number(/--lib-text-leading:\s*([\d.]+)/.exec(css)![1]);
    for (const role of TEXT_ROLES) {
      const block = new RegExp(`data-role='${role}'\\]\\)\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      const own = /--lib-text-leading:\s*([\d.]+)/.exec(block);
      expect(ROLE_LEADING[role], role).toBe(own ? Number(own[1]) : base);
    }
  });
});

describe('assemble: pairs', () => {
  const cell = (id: string, w: number) => ({ id, forms: [{ id: 'one', min: { w: { control: w }, h: { control: 1 } }, ideal: { w: { control: w }, h: { control: 1 } }, grow: { w: true } }] as const });
  it('two paired regions take one width, so the seam beside them runs straight', () => {
    const spec: ScreenSpec = { rows: [[cell('a', 5), cell('b', 5)], [cell('c', 10), cell('d', 5)]], pairs: [['a', 'c']] };
    const p = assemble(spec, { w: 1000, h: 400 }, P);
    expect(p.regions.a.rect.w).toBeCloseTo(p.regions.c.rect.w, 6);
    expect(p.regions.b.rect.x).toBeCloseTo(p.regions.d.rect.x, 6);
    expect(p.regions.a.rect.w).toBeGreaterThanOrEqual(10 * 28 + 24);
  });

  it('refuses a pair that cannot share a seam', () => {
    const spec: ScreenSpec = { rows: [[cell('a', 5), cell('b', 5), cell('e', 5)], [cell('c', 10), cell('d', 5)]], pairs: [['b', 'c']] };
    expect(() => assemble(spec, { w: 1000, h: 400 }, P)).toThrow(/first in both rows or last/);
  });
});

describe('assemble: aspect', () => {
  const WIDE: ScreenSpec = { ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'contain' } };

  it('a wide window: the largest 16:9 room, full height, centred, a band each side', () => {
    const p = assemble(WIDE, { w: 2000, h: 900 }, P);
    expect(p.room).toEqual({ x: 200, y: 0, w: 1600, h: 900 });
    expect(p.bands).toEqual([
      { x: 0, y: 0, w: 200, h: 900 },
      { x: 1800, y: 0, w: 200, h: 900 },
    ]);
  });

  it('a tall window: full width, centred, a band above and below', () => {
    const p = assemble(WIDE, { w: 1600, h: 1200 }, P);
    expect(p.room).toEqual({ x: 0, y: 150, w: 1600, h: 900 });
    expect(p.bands).toEqual([
      { x: 0, y: 0, w: 1600, h: 150 },
      { x: 0, y: 1050, w: 1600, h: 150 },
    ]);
  });

  it('an exact window: the room is the window, no bands', () => {
    const p = assemble(WIDE, { w: 1920, h: 1080 }, P);
    expect(p.room).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
    expect(p.bands).toEqual([]);
  });

  it('a fractional room keeps its exact ratio; its offset is whole px', () => {
    const p = assemble(WIDE, { w: 1217, h: 752 }, P);
    expect(p.room.w / p.room.h).toBeCloseTo(16 / 9, 12);
    expect(p.room).toMatchObject({ x: 0, y: 33, w: 1217 });
    expect(p.bands[1].y + p.bands[1].h).toBeCloseTo(752, 9);
  });

  it('without an aspect the room is the window', () => {
    expect(assemble(DEMO_SPEC, { w: 2000, h: 900 }, P)).toMatchObject({ room: { x: 0, y: 0, w: 2000, h: 900 }, bands: [] });
  });

  it('places everything in the room exactly as a window of that size: forms step, the header spans and the body zooms by the room', () => {
    for (const win of [
      { w: 2000, h: 900 },
      { w: 900, h: 1000 },
      { w: 600, h: 400 },
      { w: 300, h: 600 },
    ]) {
      const p = assemble(WIDE, win, P);
      const q = assemble(DEMO_SPEC, { w: p.room.w, h: p.room.h }, P);
      expect({ ...p, room: q.room, bands: [] }, `${win.w}x${win.h}`).toEqual(q);
      expect(p.regions.bar.rect.w).toBe(p.room.w);
    }
    // 300 × 600 gives a 300 × 168.75 room: the floor holds and it overflows, as a window that size does.
    expect(assemble(WIDE, { w: 300, h: 600 }, P)).toMatchObject({ overflow: true, zoom: expect.closeTo(24 / 28, 6) });
  });

  it('refuses a ratio that is not a positive number', () => {
    expect(() => assemble({ ...DEMO_SPEC, aspect: { ratio: 0 } }, { w: 800, h: 600 }, P)).toThrow(/positive/);
    expect(() => assemble({ ...DEMO_SPEC, aspect: { ratio: Number.NaN } }, { w: 800, h: 600 }, P)).toThrow(/positive/);
  });

  it('on screen: the zones sit in the room, and the bands are ground with nothing in them', () => {
    render(<Screen name="Locked" spec={WIDE} room={{ w: 2000, h: 900 }} principles={P} regions={{ bar: <button type="button">Bar</button>, now: 'Now', side: 'Side', pads: 'Pads' }} />);
    const root = screen.getByRole('group', { name: 'Locked' });
    expect(root).toHaveAttribute('data-aspect', '1.778');
    const room = root.querySelector<HTMLElement>(':scope > [data-part="room"]')!;
    expect(room.style.getPropertyValue('--lib-at-x')).toBe('200');
    expect(room.style.getPropertyValue('--lib-at-w')).toBe('1600');
    expect(Array.from(room.children).map((n) => (n as HTMLElement).dataset.part)).toEqual(['header', 'body']);
    const bands = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-part="band"]'));
    expect(bands).toHaveLength(2);
    for (const band of bands) {
      expect(band).toHaveAttribute('data-layer', 'ground');
      expect(band).toHaveAttribute('aria-hidden', 'true');
      expect(band).toBeEmptyDOMElement();
    }
    expect(bands[1].style.getPropertyValue('--lib-at-x')).toBe('1800');
  });

  const SCALED: ScreenSpec = { ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: { w: 1600, h: 900 } } };
  const DESIGNED = assemble(DEMO_SPEC, { w: 1600, h: 900 }, P);

  it("scale: the placement is the design room's at any frame; only the box and the factor change", () => {
    for (const win of [
      { w: 1000, h: 450 },
      { w: 800, h: 1200 },
      { w: 3200, h: 1800 },
      { w: 32, h: 18 },
      { w: 300, h: 600 },
    ]) {
      const p = assemble(SCALED, win, P);
      expect({ ...p, room: DESIGNED.room, bands: [], scale: 1 }, `${win.w}x${win.h}`).toEqual(DESIGNED);
      expect(p.room.w / p.room.h).toBeCloseTo(16 / 9, 9);
      expect(p.scale).toBeCloseTo(p.room.w / 1600, 12);
    }
  });

  it('scale: the factor and the centring, wide, tall and tiny', () => {
    // Wide: full height, pillarboxed.
    expect(assemble(SCALED, { w: 1000, h: 450 }, P)).toMatchObject({ room: { x: 100, y: 0, w: 800, h: 450 }, scale: 0.5, bands: [{ x: 0, w: 100 }, { x: 900, w: 100 }] });
    // Tall: full width, letterboxed.
    expect(assemble(SCALED, { w: 800, h: 1200 }, P)).toMatchObject({ room: { x: 0, y: 375, w: 800, h: 450 }, scale: 0.5, bands: [{ y: 0, h: 375 }, { y: 825, h: 375 }] });
    // Larger than the design: drawn bigger.
    expect(assemble(SCALED, { w: 3200, h: 1800 }, P)).toMatchObject({ scale: 2, bands: [] });
    // Tiny: still the whole design, at 2 %, never a re-layout (no zoom, no overflow).
    const tiny = assemble(SCALED, { w: 32, h: 18 }, P);
    expect(tiny).toMatchObject({ room: { x: 0, y: 0, w: 32, h: 18 }, zoom: 1, overflow: false });
    expect(tiny.scale).toBeCloseTo(0.02, 12);
    // Contain is drawn at 1.
    expect(assemble({ ...DEMO_SPEC, aspect: { ratio: 16 / 9 } }, { w: 1000, h: 450 }, P).scale).toBe(1);
  });

  it('scale needs a design room of its ratio', () => {
    expect(() => assemble({ ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: { w: 1440, h: 900 } } }, { w: 800, h: 600 }, P)).toThrow(/not of ratio/);
    expect(() => assemble({ ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: { w: 0, h: 0 } } }, { w: 800, h: 600 }, P)).toThrow(/design room/);
  });

  it('on screen, scaled: the room is laid out at the design size and drawn at the factor, centred', () => {
    render(<Screen name="Scaled" spec={SCALED} room={{ w: 1000, h: 450 }} principles={P} regions={{}} />);
    const root = screen.getByRole('group', { name: 'Scaled' });
    const room = root.querySelector<HTMLElement>(':scope > [data-part="room"]')!;
    expect(room).toHaveAttribute('data-scale', '0.500');
    expect(room.style.getPropertyValue('--lib-scale')).toBe('0.5');
    expect(room.style.getPropertyValue('--lib-at-x')).toBe('100');
    expect(room.style.getPropertyValue('--lib-at-w')).toBe('1600');
    expect(room.style.getPropertyValue('--lib-at-h')).toBe('900');
    expect(root.querySelectorAll(':scope > [data-part="band"]')).toHaveLength(2);
    expect(root.querySelector('[data-region="pads"]')).toHaveAttribute('data-form', DESIGNED.regions.pads.form);
  });

  it('on screen without an aspect: no bands, the room is the box', () => {
    render(<Screen name="Free" spec={DEMO_SPEC} room={{ w: 900, h: 330 }} principles={P} regions={{}} />);
    const root = screen.getByRole('group', { name: 'Free' });
    expect(root.querySelectorAll('[data-part="band"]')).toHaveLength(0);
    expect(root).not.toHaveAttribute('data-aspect');
    expect(root.querySelector<HTMLElement>(':scope > [data-part="room"]')!.style.getPropertyValue('--lib-at-w')).toBe('900');
  });
});

describe('Screen with a spec', () => {
  function Pads() {
    const form = useForm(PAD_FORMS);
    return <p data-testid="pads">{form}</p>;
  }

  it('places each region in its slot and hands each its chosen form', () => {
    render(
      <Screen name="Demo" spec={DEMO_SPEC} room={{ w: 900, h: 330 }} principles={P} regions={{ bar: 'Bar', now: (form) => <p>now {form}</p>, side: 'Side', pads: <Pads /> }} />,
    );
    const root = screen.getByRole('group', { name: 'Demo' });
    expect(root).toHaveAttribute('data-zoom', '1.000');
    expect(screen.getByTestId('pads')).toHaveTextContent('one-row');
    expect(screen.getByText('now full')).toBeInTheDocument();
    const slot = root.querySelector('[data-region="pads"]') as HTMLElement;
    expect(slot).toHaveAttribute('data-form', 'one-row');
    expect(slot.style.getPropertyValue('--lib-at-w')).toBe('900');
  });

  it('without principles, reads the first pack', () => {
    render(<Screen name="Plain" spec={DEMO_SPEC} room={{ w: 1440, h: 900 }} regions={{}} />);
    expect(screen.getByRole('group', { name: 'Plain' }).querySelector('[data-region="now"]')).toHaveAttribute('data-form', 'full');
  });

  it('hands each part of a region its own form', () => {
    function Part({ name }: { name: string }) {
      return <p data-testid={name}>{useForm([{ id: 'a', min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } }, { id: 'b', min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } }], undefined, name)}</p>;
    }
    const spec: ScreenSpec = {
      rows: [[{ id: 'both', forms: [{ id: 'mixed', parts: { left: 'a', right: 'b' }, min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } }] }]],
    };
    render(<Screen name="Parts" spec={spec} room={{ w: 400, h: 200 }} principles={P} regions={{ both: <><Part name="left" /><Part name="right" /></> }} />);
    expect(screen.getByTestId('left')).toHaveTextContent('a');
    expect(screen.getByTestId('right')).toHaveTextContent('b');
  });
});

describe('assemble: ratio, parts, edge', () => {
  const pads = (min: number): RegionSpec => ({
    id: 'pads',
    forms: [{ id: 'grid', min: { w: { control: min }, h: { control: min / 4 } }, ideal: { w: { control: min }, h: { control: min / 4 } }, grow: { w: true }, ratio: { w: 4, h: 1 } }],
  });
  const tall: RegionSpec = { id: 'tall', forms: [{ id: 'one', min: { w: { control: 4 }, h: { control: 4 } }, ideal: { w: { control: 4 }, h: { control: 4 } }, grow: { h: true } }] };

  it('a ratio form takes exactly the height its width asks, and the rest goes to the growers', () => {
    // 1000 wide, no plate: the pads are 1000 wide, so 250 tall; the grower below takes the rest.
    const p = assemble({ rows: [[{ ...pads(8), plate: false }], [{ ...tall, plate: false }]] }, { w: 1000, h: 600 }, P);
    expect(p.regions.pads.rect.h).toBeCloseTo(250, 6);
    expect(p.regions.tall.rect.h).toBeCloseTo(600 - 250 - 8, 6);
  });

  it('a ratio counts its fixed part and the plate outside the aspect', () => {
    const spec: ScreenSpec = { rows: [[{ ...pads(8), forms: [{ ...pads(8).forms[0], ratio: { w: 4, h: 1, fixed: { w: { px: 24 }, h: { px: 6 } } } }] }], [tall]] };
    const p = assemble(spec, { w: 1000, h: 600 }, P);
    // (1000 − 24 plate − 24 fixed) / 4 + 6 fixed + 24 plate
    expect(p.regions.pads.rect.h).toBeCloseTo(952 / 4 + 6 + 24, 6);
  });

  it('combineForms adds the parts up and keeps their names', () => {
    const [both] = combineForms('down', 2, { a: NOW_FORMS, b: PAD_FORMS }, [{ id: 'x', parts: { a: 'compact', b: 'one-row' } }]);
    expect(both.parts).toEqual({ a: 'compact', b: 'one-row' });
    expect(resolveLength(both.min.h, P)).toBe(3 * 28 + 8 + 2 * 28);
    expect(resolveLength(both.min.w, P)).toBe(8 * 28);
    expect(both.grow).toEqual({ w: true, h: false });
    expect(() => combineForms('across', 2, { a: NOW_FORMS }, [{ id: 'y', parts: { a: 'nope' } }])).toThrow(/names no form/);
  });

  it('the edge keeps the body and footer off the sides and foot; the header runs edge to edge', () => {
    const spec: ScreenSpec = { ...DEMO_SPEC, footer: [{ id: 'foot', plate: false, forms: [{ id: 'f', min: { w: 0, h: { control: 1 } }, ideal: { w: 0, h: { control: 1 } } }] }], edge: { space: 5 } };
    const p = assemble(spec, { w: 1440, h: 900 }, P);
    expect(p.zones.header).toEqual({ x: 0, y: 0, w: 1440, h: 28 });
    // --space-5 is 24 at a 4 px unit.
    expect(p.zones.body).toMatchObject({ x: 24, w: 1392 });
    expect(p.zones.footer).toEqual({ x: 24, y: 900 - 24 - 28, w: 1392, h: 28 });
    expect(p.regions.foot.rect.w).toBe(1392);
  });

  it('never takes a step that trades an overflow for a worse one on the other axis', () => {
    // The wide form is shorter but too wide for the room: the solver zooms rather than take it.
    const spec: ScreenSpec = {
      rows: [
        [
          {
            id: 'bank',
            forms: [
              { id: 'two', min: { w: { control: 8 }, h: { control: 4 } }, ideal: { w: { control: 8 }, h: { control: 4 } } },
              { id: 'one', min: { w: { control: 16 }, h: { control: 2 } }, ideal: { w: { control: 16 }, h: { control: 2 } } },
            ],
          },
        ],
      ],
    };
    const p = assemble(spec, { w: 300, h: 130 }, P);
    expect(p.regions.bank.form).toBe('two');
    expect(p.zoom).toBeLessThan(1);
  });
});

describe('assemble: a region scrolling under a pinned one', () => {
  const spec: ScreenSpec = {
    rows: [
      [{ id: 'pin', forms: [{ id: 'pin', min: { w: 0, h: { control: 3 } }, ideal: { w: 0, h: { control: 3 } } }] }],
      [{ id: 'list', under: 'pin', forms: [{ id: 'list', min: { w: 0, h: { control: 2 } }, ideal: { w: 0, h: { control: 2 } }, grow: { w: true, h: true } }] }],
    ],
  };

  it('keeps the sizes and reaches up to the pinned region: its height and the gap', () => {
    const p = assemble(spec, { w: 600, h: 400 }, P);
    const plain = assemble({ rows: spec.rows.map((row) => row.map((r) => ({ ...(r as RegionSpec), under: undefined }))) }, { w: 600, h: 400 }, P);
    expect(p.regions.list.rect).toEqual(plain.regions.list.rect);
    expect(p.regions.list.under).toEqual({ id: 'pin', reach: p.regions.pin.rect.h + P.plate.gap });
    expect(p.regions.pin.under).toBeUndefined();
  });

  it('refuses a region that is not above it', () => {
    const bad: ScreenSpec = { rows: [[{ ...(spec.rows[0][0] as RegionSpec), under: 'list' }], spec.rows[1]] };
    expect(() => assemble(bad, { w: 600, h: 400 }, P)).toThrow(/must sit above it/);
    expect(() => assemble({ rows: [[{ ...(spec.rows[1][0] as RegionSpec), under: 'nope' }]] }, { w: 600, h: 400 }, P)).toThrow(/isn't in the body/);
  });

  it('draws the slot reaching up, with --lib-under', () => {
    render(<Screen name="Under" spec={spec} room={{ w: 600, h: 400 }} principles={P} regions={{ pin: 'Pin', list: 'List' }} />);
    const root = screen.getByRole('group', { name: 'Under' });
    const p = assemble(spec, { w: 600, h: 400 }, P);
    const slot = root.querySelector('[data-region="list"]') as HTMLElement;
    expect(slot).toHaveAttribute('data-under', 'pin');
    expect(slot.style.getPropertyValue('--lib-at-y')).toBe(String(p.regions.pin.rect.y));
    expect(slot.style.getPropertyValue('--lib-under')).toBe(String(p.regions.list.under!.reach));
  });
});

describe('assemble: a region scrolling over a pinned one below it', () => {
  const fixed = (id: string, h: number): RegionSpec => ({ id, forms: [{ id, min: { w: 0, h: { control: h } }, ideal: { w: 0, h: { control: h } } }] });
  const spec: ScreenSpec = {
    rows: [
      [fixed('pin', 3)],
      [{ id: 'list', under: 'pin', over: 'foot', forms: [{ id: 'list', min: { w: 0, h: { control: 2 } }, ideal: { w: 0, h: { control: 2 } }, grow: { w: true, h: true } }] }],
      [fixed('foot', 1)],
    ],
  };
  const strip = (s: ScreenSpec): ScreenSpec => ({ rows: s.rows.map((row) => row.map((r) => ({ ...(r as RegionSpec), under: undefined, over: undefined }))) });

  it('keeps the sizes and reaches down to the pinned region: the gap and its height', () => {
    const p = assemble(spec, { w: 600, h: 400 }, P);
    const plain = assemble(strip(spec), { w: 600, h: 400 }, P);
    expect(p.regions.list.rect).toEqual(plain.regions.list.rect);
    expect(p.regions.list.over).toEqual({ id: 'foot', reach: P.plate.gap + p.regions.foot.rect.h });
    expect(p.regions.list.under).toEqual({ id: 'pin', reach: p.regions.pin.rect.h + P.plate.gap });
    expect(p.regions.foot.over).toBeUndefined();
  });

  it('refuses a region that is not below it', () => {
    const rows = spec.rows;
    expect(() => assemble({ rows: [rows[0], [{ ...(rows[1][0] as RegionSpec), over: 'pin' }], rows[2]] }, { w: 600, h: 400 }, P)).toThrow(/must sit below it/);
    expect(() => assemble({ rows: [[{ ...(rows[1][0] as RegionSpec), under: undefined, over: 'nope' }]] }, { w: 600, h: 400 }, P)).toThrow(/isn't in the body/);
    // Beside it, not below: a different column.
    const side: ScreenSpec = { rows: [[{ ...(rows[1][0] as RegionSpec), under: undefined, over: 'foot' }, fixed('foot', 1)]] };
    expect(() => assemble(side, { w: 600, h: 400 }, P)).toThrow(/must sit below it/);
  });

  it('draws the slot reaching up and down, with --lib-under and --lib-over, before the pinned region', () => {
    render(<Screen name="Over" spec={spec} room={{ w: 600, h: 400 }} principles={P} regions={{ pin: 'Pin', list: 'List', foot: 'Foot' }} />);
    const root = screen.getByRole('group', { name: 'Over' });
    const p = assemble(spec, { w: 600, h: 400 }, P);
    const slot = root.querySelector('[data-region="list"]') as HTMLElement;
    const foot = root.querySelector('[data-region="foot"]') as HTMLElement;
    expect(slot).toHaveAttribute('data-over', 'foot');
    expect(slot.style.getPropertyValue('--lib-over')).toBe(String(p.regions.list.over!.reach));
    expect(slot.style.getPropertyValue('--lib-at-y')).toBe(String(p.regions.pin.rect.y));
    const bottom = Number(slot.style.getPropertyValue('--lib-at-y')) + Number(slot.style.getPropertyValue('--lib-at-h'));
    expect(bottom).toBeCloseTo(p.regions.foot.rect.y + p.regions.foot.rect.h);
    // The pinned region comes later, so it is drawn over the slot reaching behind it.
    expect(slot.compareDocumentPosition(foot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
