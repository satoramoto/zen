import { describe, expect, it } from 'vitest';
import { BODY, CONTROLS, REPEAT_INTERVALS, centre, control, controlsIn, controlsOf, displayArea, encoderId, indexOf, isControl, lowerId, padAt, padId, regionBox, upperId } from './layout';

const count = (test: (c: (typeof CONTROLS)[number]) => boolean) => CONTROLS.filter(test).length;
const LABELLED = ['top-left', 'edit', 'track', 'timing', 'length', 'record', 'play', 'top-right', 'browse', 'main', 'pad-mode', 'repeat', 'clip-edit', 'page', 'modifiers'];

describe('the layout table', () => {
  it('has every control of the unit and nothing else', () => {
    expect(count((c) => c.kind === 'pad')).toBe(64);
    expect(count((c) => c.kind === 'encoder' || c.kind === 'wheel')).toBe(11);
    expect(count((c) => c.kind === 'strip')).toBe(1);
    expect(count((c) => c.cluster === 'upper' || c.cluster === 'lower')).toBe(16);
    expect(count((c) => c.cluster === 'scenes')).toBe(8);
    expect(count((c) => c.cluster === 'dpad')).toBe(5);
    expect(count((c) => c.kind === 'display')).toBe(1);
    expect(count((c) => c.kind === 'button' && LABELLED.includes(c.cluster))).toBe(42);
    expect(CONTROLS).toHaveLength(64 + 11 + 1 + 16 + 8 + 5 + 1 + 42);
  });

  it('gives each control one id and a spoken name', () => {
    expect(new Set(CONTROLS.map((c) => c.id)).size).toBe(CONTROLS.length);
    for (const c of CONTROLS) expect(c.name).not.toBe('');
    expect(control(padId(3, 5))?.name).toBe('Pad row 3 column 5');
    expect(control('encoder-4')?.kind).toBe('encoder');
    expect(control('capture')?.name).toBe('Capture');
    expect(control('add')).toMatchObject({ legend: '+', name: 'Add' });
    expect(isControl('nope')).toBe(false);
    expect(padAt('pad-8-1')).toEqual({ row: 8, col: 1 });
    expect(padAt('scene-1')).toBeUndefined();
    expect(indexOf('lower-7', 'lower')).toBe(7);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('lines column %i up from the encoder to the pads', (c) => {
    const area = displayArea();
    const displayColumn = area.x + (area.w / 8) * (c - 0.5);
    const xs = [control(encoderId(c))!, control(upperId(c))!, control(lowerId(c))!, control(padId(1, c))!, control(padId(8, c))!].map((p) => centre(p).x);
    for (const x of [...xs, displayColumn]) expect(Math.abs(x - xs[0])).toBeLessThan(0.3);
  });

  it('stacks the display block: encoders, upper buttons, display, lower buttons, pads', () => {
    const ys = ['encoder-1', 'upper-1', 'display', 'lower-1', 'pad-1-1', 'pad-8-1'].map((id) => centre(control(id)!).y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('keeps every control on the face and apart from the others', () => {
    for (const c of CONTROLS) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(BODY.width);
      expect(c.y + c.h).toBeLessThanOrEqual(BODY.height);
    }
    const overlap = (a: (typeof CONTROLS)[number], b: (typeof CONTROLS)[number]) => a.x < b.x + b.w - 0.11 && b.x < a.x + a.w - 0.11 && a.y < b.y + b.h - 0.11 && b.y < a.y + a.h - 0.11;
    const clashes = CONTROLS.flatMap((a, i) => CONTROLS.slice(i + 1).filter((b) => overlap(a, b)).map((b) => `${a.id} over ${b.id}`));
    expect(clashes).toEqual([]);
  });

  it('reads the left and right columns in the manual’s order', () => {
    const order = (ids: string[]) => ids.map((id) => centre(control(id)!).y);
    const sorted = (ys: number[]) => ys.every((y, i) => i === 0 || y >= ys[i - 1]);
    expect(sorted(order(['tempo', 'tap-tempo', 'metronome', 'quantize', 'fixed-length', 'automate', 'new', 'capture', 'record', 'play']))).toBe(true);
    expect(sorted(order(['dpad-centre', 'session', 'scale', 'repeat', 'double-loop', 'convert', 'octave-up', 'page-left', 'octave-down', 'shift']))).toBe(true);
    expect(controlsOf('top-left').map((c) => c.id)).toEqual(['sets', 'setup', 'learn', 'user']);
    expect(controlsOf('top-right').map((c) => c.id)).toEqual(['device', 'mix', 'clip', 'session-screen']);
    expect(controlsOf('track').map((c) => c.id)).toEqual(['lock', 'stop-clip', 'mute', 'solo']);
    expect(controlsOf('scenes').map((c) => c.legend)).toEqual([...REPEAT_INTERVALS]);
  });

  it('has four regions that together hold every control', () => {
    const regions = (['display', 'pads', 'left', 'right'] as const).map((r) => controlsIn(r));
    expect(regions.flat()).toHaveLength(CONTROLS.length);
    expect(regions[0].map((c) => c.cluster)).toEqual(expect.arrayContaining(['encoders', 'upper', 'display', 'lower']));
    expect(regionBox('display').w).toBeGreaterThan(200);
  });

  it('draws the display 960 by 160 inside its glass', () => {
    const area = displayArea();
    expect(area.w / area.h).toBeCloseTo(6, 1);
    const glass = control('display')!;
    expect(area.y).toBeGreaterThanOrEqual(glass.y);
    expect(area.y + area.h).toBeLessThanOrEqual(glass.y + glass.h + 0.1);
  });
});
