import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keys, type KeysProps } from './Keys';
import { boardKeys, range49, range61 } from './Keys.fixtures';
import { BLACK_HEIGHT_RATIO, BLACK_WIDTH_RATIO, keysLabel, layout, noteAt, noteName } from './keyLayout';

const WIDTH = 1392;
const HEIGHT = 60;

/** Renders the keys with jsdom given a real strip box (jsdom lays nothing out). */
function setup(props: Partial<KeysProps> = {}) {
  const onSplit = vi.fn();
  const onPick = vi.fn();
  const tipAction = vi.fn();
  const view = render(<Keys {...boardKeys} onSplit={onSplit} onPick={onPick} tipAction={tipAction} {...props} />);
  const strip = screen.getByRole('img', { name: /^Keys:/ });
  strip.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: WIDTH, bottom: HEIGHT, width: WIDTH, height: HEIGHT, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return { ...view, strip, onSplit, onPick, tipAction };
}

const point = (x: number, y: number) => ({ clientX: x, clientY: y, button: 0, pointerId: 1 });

describe('keys helpers', () => {
  it('names notes with Yamaha octaves, C3 = 60', () => {
    expect(noteName(60)).toBe('C3');
    expect(noteName(54)).toBe('F#2');
    expect(noteName(36)).toBe('C1');
    expect(noteName(96)).toBe('C6');
  });

  it('lays out 61 keys as 36 white and 25 black, a name on every C', () => {
    const keys = layout(range61, 1080, 54, [], []);
    expect(keys.whites).toHaveLength(36);
    expect(keys.blacks).toHaveLength(25);
    expect(keys.whiteWidth).toBe(30);
    expect(keys.whites.filter((k) => k.label).map((k) => k.label)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    // A black key sits on the boundary of the white keys around it: C#1 between C1 and D1.
    expect(keys.blacks[0]).toMatchObject({ note: 37, x: 30, left: true });
  });

  it('places the split line and steps it round black keys', () => {
    expect(layout(range61, 1080, 54, [], [])).toMatchObject({ splitX: 330, splitStep: 1 }); // F#2: a black key
    expect(layout(range61, 1080, 53, [], [])).toMatchObject({ splitX: 330, splitStep: -1 }); // F2, F#2 above
    expect(layout(range61, 1080, 52, [], [])).toMatchObject({ splitX: 300, splitStep: 0 }); // E|F
    expect(layout(range61, 1080, null, [], []).splitX).toBeNull();
    expect(layout(range61, 1080, 96, [], []).splitX).toBeNull();
  });

  it('marks the left zone and held keys, right drawing over left', () => {
    const keys = layout(range61, 1080, 54, [48, 60], [60, 61]);
    expect(keys.whites.find((k) => k.note === 48)).toMatchObject({ left: true, held: 'left' });
    expect(keys.whites.find((k) => k.note === 60)).toMatchObject({ left: false, held: 'right' });
    expect(keys.blacks.find((k) => k.note === 61)?.held).toBe('right');
  });

  it('finds the key under a point: black up top, white below', () => {
    const keys = layout(range61, 1080, 54, [], []);
    expect(noteAt(keys, 30, 10)).toBe(37);
    expect(noteAt(keys, 30, 40)).toBe(38);
    expect(noteAt(keys, 20, 10)).toBe(37);
    expect(noteAt(keys, 5, 10)).toBe(36);
    expect(noteAt(keys, -50, 40)).toBe(36);
    expect(noteAt(keys, 5000, 40)).toBe(96);
    expect(noteAt(layout({ low: 37, high: 36 }, 100, null, [], []), 0, 0)).toBeNull();
  });

  it('says the split and held notes in words', () => {
    expect(keysLabel(range61, 54, boardKeys.heldLeft, boardKeys.heldRight)).toBe(
      'Keys: split F#2, left hand G A C E, right hand E4 A4, 61 keys',
    );
    expect(keysLabel(range61, null, [], [67, 60, 63])).toBe('Keys: no split, held C3 D#3 G3, 61 keys');
    expect(keysLabel(range49, 59, [], [])).toBe('Keys: split B2, left hand none, right hand none, 49 keys');
  });
});

describe('Keys', () => {
  it('names the picture and shows each zone with what it holds', () => {
    const { container } = setup();
    expect(screen.getByRole('img', { name: 'Keys: split F#2, left hand G A C E, right hand E4 A4, 61 keys' })).toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('G A C E')).toBeInTheDocument();
    expect(screen.getByText('Right 1')).toBeInTheDocument();
    expect(screen.getByText('E4 A4')).toBeInTheDocument();
    // Held keys fill in their zone's hue slot (left 4, right 1 by default); their names live once,
    // in the ruler, not on the keys.
    const held = [...container.querySelectorAll<HTMLElement>('.yh-keys .yh-keys__white[data-held]')];
    const pairs = held.map((el) => `${el.getAttribute('data-held')} ${el.getAttribute('data-hue')}`);
    expect(pairs).toContain('right 1');
    expect(pairs).toContain('left 4');
    expect(screen.queryByText('E4', { selector: '.yh-keys__white' })).toBeNull();
    expect(screen.queryByText('G1', { selector: '.yh-keys__white' })).toBeNull();
  });

  it("draws each zone's lamp as its underline on the ruler, lit while the zone sounds", () => {
    const { container, unmount } = render(<Keys {...boardKeys} heldLeft={[43]} heldRight={[]} />);
    const zone = (side: string) => container.querySelector(`.yh-keys .yh-keys__ruler .yh-keys__zone[data-side='${side}']`);
    expect(zone('left')).toHaveAttribute('data-on', 'true');
    expect(zone('left')).toHaveAttribute('data-hue', '4');
    expect(zone('right')).toHaveAttribute('data-on', 'false');
    expect(zone('right')).toHaveAttribute('data-hue', '1');
    expect(container.querySelector('.yh-keys .yh-keys__lamp')).toBeNull();
    unmount();
  });

  it('gives the split handle slider semantics and the tooltip', () => {
    const { tipAction } = setup();
    const handle = screen.getByRole('slider', { name: 'Split point: drag, or click then click a key' });
    expect(handle).toHaveAttribute('aria-valuetext', 'F#2');
    expect(handle).toHaveAttribute('aria-valuenow', '54');
    expect(handle).toHaveAttribute('aria-valuemin', '24');
    expect(handle).toHaveAttribute('aria-valuemax', '96');
    expect(handle).toHaveAttribute('data-tip', 'settings.split_strip');
    expect(handle).toHaveTextContent('F#2');
    expect(tipAction).toHaveBeenCalledWith(handle, 'settings.split_strip');
  });

  it('steps the split from the keyboard: semitones, octaves, the limits', async () => {
    const user = userEvent.setup();
    const { onSplit } = setup();
    await user.tab();
    expect(screen.getByRole('slider')).toHaveFocus();
    const steps: [string, number][] = [
      ['{ArrowRight}', 55],
      ['{ArrowUp}', 55],
      ['{ArrowLeft}', 53],
      ['{ArrowDown}', 53],
      ['{PageUp}', 66],
      ['{PageDown}', 42],
      ['{Home}', 24],
      ['{End}', 96],
    ];
    for (const [key, note] of steps) {
      await user.keyboard(key);
      expect(onSplit).toHaveBeenLastCalledWith(note);
    }
  });

  it('clamps to the limits and asks nothing when already there', async () => {
    const user = userEvent.setup();
    const { onSplit } = setup({ split: 72, splitMax: 72 });
    await user.tab();
    expect(screen.getByRole('slider')).toHaveFocus();
    await user.keyboard('{ArrowRight}{End}{PageUp}');
    expect(onSplit).not.toHaveBeenCalled();
    await user.keyboard('{PageDown}');
    expect(onSplit).toHaveBeenLastCalledWith(60);
  });

  it('arms and disarms the pick with Enter and Esc', async () => {
    const user = userEvent.setup();
    const { onPick, rerender } = setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenLastCalledWith(true);
    rerender(<Keys {...boardKeys} picking onSplit={vi.fn()} onPick={onPick} />);
    expect(screen.getByRole('slider', { name: 'Split point: click a key to set it, Esc cancels' })).toBeInTheDocument();
    expect(screen.getByText(/Press a key to set the split/)).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenLastCalledWith(false);
  });

  it('drags the split: past the slop the key under the pointer, black keys by position', () => {
    const { onSplit, onPick } = setup({ split: 60, heldLeft: [], heldRight: [] });
    const handle = screen.getByRole('slider');
    const keys = layout(range61, WIDTH, 60, [], []);
    const fs2 = keys.blacks.find((k) => k.note === 54)!.x;
    const c3 = keys.splitX!;
    fireEvent.pointerDown(handle, point(c3, 50));
    fireEvent.pointerMove(handle, point(c3 + 1, 50));
    expect(onSplit).not.toHaveBeenCalled();
    fireEvent.pointerMove(handle, point(fs2, 50));
    fireEvent.pointerUp(handle, point(fs2, 50));
    expect(onSplit).toHaveBeenLastCalledWith(54);
    expect(onPick).not.toHaveBeenCalled();
    // A click (no movement) arms the pick.
    fireEvent.pointerDown(handle, point(c3, 50));
    fireEvent.pointerUp(handle, point(c3, 50));
    expect(onPick).toHaveBeenLastCalledWith(true);
  });

  it('while armed, the key pressed becomes the split and lifting disarms', () => {
    const { container, onSplit, onPick } = setup({ split: 60, picking: true, heldLeft: [], heldRight: [] });
    const pick = container.querySelector('.yh-keys__pick') as HTMLElement;
    expect(pick).not.toBeNull();
    const keys = layout(range61, WIDTH, 60, [], []);
    const fs2 = keys.blacks.find((k) => k.note === 54)!.x;
    const blackBottom = HEIGHT * BLACK_HEIGHT_RATIO;
    fireEvent.pointerDown(pick, point(fs2, blackBottom - 5));
    expect(onSplit).toHaveBeenLastCalledWith(54);
    fireEvent.pointerUp(pick, point(fs2, blackBottom - 5));
    expect(onPick).toHaveBeenLastCalledWith(false);
    // Below the black keys, the white key under them.
    fireEvent.pointerDown(pick, point(fs2 + (keys.whiteWidth * BLACK_WIDTH_RATIO) / 4, blackBottom + 5));
    expect(onSplit).toHaveBeenLastCalledWith(55);
  });

  it('Esc while armed disarms before the app hears it', () => {
    const { onPick } = setup({ picking: true });
    const appKey = vi.fn();
    document.addEventListener('keydown', appKey);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    document.removeEventListener('keydown', appKey);
    expect(onPick).toHaveBeenLastCalledWith(false);
    expect(appKey).not.toHaveBeenCalled();
  });

  it('unarmed, there is no pick surface and Esc is the app\'s', () => {
    const { container, onPick } = setup();
    expect(container.querySelector('.yh-keys__pick')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('locked: nothing moves the split and the pick will not arm', async () => {
    const user = userEvent.setup();
    const { container, onSplit, onPick } = setup({ splitLocked: true, picking: true });
    const handle = screen.getByRole('slider', { name: 'Split point (locked)' });
    expect(handle).toHaveAttribute('aria-disabled', 'true');
    expect(container.querySelector('.yh-keys__pick')).toBeNull();
    await user.tab();
    await user.keyboard('{ArrowRight}{Enter}');
    fireEvent.pointerDown(handle, point(400, 50));
    fireEvent.pointerMove(handle, point(900, 50));
    fireEvent.pointerUp(handle, point(900, 50));
    expect(onSplit).not.toHaveBeenCalled();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('without onSplit it is a picture: no handle, the split named on the ruler', () => {
    render(<Keys {...boardKeys} />);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByText('F#2', { selector: '.yh-keys__marker' })).toBeInTheDocument();
  });

  it('takes zone names and hues from leftName/leftHue and rightName/rightHue, defaulting to Left 4 and Right 1', () => {
    const { container, rerender } = render(<Keys split={54} heldLeft={[43]} heldRight={[76]} />);
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    rerender(<Keys split={54} heldLeft={[43]} heldRight={[76]} leftName="Bass" leftHue={3} rightName="Lead" rightHue={2} />);
    expect(screen.getByText('Bass')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(container.querySelector(".yh-keys__zone[data-side='left']")).toHaveAttribute('data-hue', '3');
    expect(container.querySelector(".yh-keys__white[data-held='left']")).toHaveAttribute('data-hue', '3');
    expect(container.querySelector(".yh-keys__white[data-held='right']")).toHaveAttribute('data-hue', '2');
  });

  it('without a split: one zone on the right, every held key in its hue', () => {
    const { container } = setup({ split: null, heldLeft: [], heldRight: [60, 63, 67], rightHue: 2, rightName: 'Right 2' });
    expect(screen.getByRole('img', { name: 'Keys: no split, held C3 D#3 G3, 61 keys' })).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.queryByText('Left')).toBeNull();
    expect(screen.getByText('Right 2')).toBeInTheDocument();
    expect(screen.getByText('C3 D#3 G3')).toBeInTheDocument();
    const held = [...container.querySelectorAll('[data-held]')].map((el) => `${el.getAttribute('data-held')} ${el.getAttribute('data-hue')}`);
    expect(held).toEqual(['right 2', 'right 2', 'right 2']);
  });

  it('draws every key: whites side by side, sharps on their boundaries at the black-key width', () => {
    const { container } = setup({ split: 54, heldLeft: [], heldRight: [] });
    const whites = [...container.querySelectorAll<HTMLElement>('.yh-keys__white')];
    const blacks = [...container.querySelectorAll<HTMLElement>('.yh-keys__black')];
    expect(whites).toHaveLength(36);
    expect(blacks).toHaveLength(25);
    const keys = layout(range61, WIDTH, 54, [], []);
    whites.forEach((el, i) => {
      expect(parseFloat(el.style.left)).toBeCloseTo(i * keys.whiteWidth);
      expect(parseFloat(el.style.width)).toBeCloseTo(keys.whiteWidth);
    });
    blacks.forEach((el, i) => expect(parseFloat(el.style.left)).toBeCloseTo(keys.blacks[i].x));
    const root = container.querySelector<HTMLElement>('.yh-keys')!;
    expect(parseFloat(root.style.getPropertyValue('--yh-keys-black-w'))).toBeCloseTo(keys.whiteWidth * BLACK_WIDTH_RATIO);
  });

  it('takes the key faces from the contract, with no color-scheme, so the build keeps them', () => {
    // The build polyfills light-dark() with variables only a literal `color-scheme: light|dark`
    // sets; the library scope sets `color-scheme: var(--scheme)`, so light-dark() faces vanished.
    const css = readFileSync(join(process.cwd(), 'src/library/components/music/Keys/Keys.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/light-dark\(/);
    expect(css).not.toMatch(/from var\(--surface-0\)/);
    expect(css).toMatch(/--yh-keys-white:\s*var\(--key-white\);/);
    expect(css).toMatch(/--yh-keys-black:\s*var\(--key-black\);/);
    for (const step of ['gap', 'sharp-edge', 'label']) {
      expect(css, `--yh-keys-${step}`).toMatch(
        new RegExp(`--yh-keys-${step}:\\s*color-mix\\(in oklab, var\\(--key-white\\) [^,]+, var\\(--key-black\\)\\)`),
      );
    }
  });

  it('maps a pointer to the right key when an ancestor zooms or scales the strip', () => {
    // A zoomed or transformed strip reports a scaled box; points inside it map back to its own px.
    for (const { scale, left, top } of [
      { scale: 0.845, left: 0, top: 0 }, // the Stage at 1217 x 752
      { scale: 0.5, left: 120, top: 40 },
      { scale: 1.5, left: -30, top: 10 },
    ]) {
      const onSplit = vi.fn();
      const { container, unmount } = render(<Keys {...boardKeys} split={60} heldLeft={[]} heldRight={[]} picking onSplit={onSplit} onPick={vi.fn()} />);
      const strip = screen.getByRole('img', { name: /^Keys:/ });
      const w = WIDTH * scale;
      const h = HEIGHT * scale;
      strip.getBoundingClientRect = () =>
        ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
      const pick = container.querySelector('.yh-keys__pick') as HTMLElement;
      const keys = layout(range61, WIDTH, 60, [], []);
      const press = (x: number, yShare: number) => {
        fireEvent.pointerDown(pick, point(left + x * scale, top + yShare * h));
        fireEvent.pointerUp(pick, point(left + x * scale, top + yShare * h));
      };
      for (const black of keys.blacks) {
        press(black.x, BLACK_HEIGHT_RATIO / 2);
        expect(onSplit, `scale ${scale}, black ${noteName(black.note)}`).toHaveBeenLastCalledWith(black.note);
      }
      for (const white of keys.whites) {
        if (white.note === 60) continue; // already the split: nothing to ask
        press(white.x + keys.whiteWidth / 2, 0.9);
        expect(onSplit, `scale ${scale}, white ${noteName(white.note)}`).toHaveBeenLastCalledWith(white.note);
      }
      unmount();
    }
  });
});
