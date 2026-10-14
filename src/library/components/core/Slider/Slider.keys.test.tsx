/**
 * Slider key presses (zen#62), through the public Slider. Spec:
 *
 * K1. A key calls `onChange` (and `onRelease`) synchronously, before any animation frame runs.
 * K2. Keys pressed before the host re-renders each step from the last value sent: two ArrowUps
 *     from 5 send 6 then 7; ArrowUp then ArrowDown sends 6 then 5. Once the host shows the sent
 *     value, the next key steps from it.
 * K3. When the host shows another value after a key (5 → key 6 → host shows 6 → host sets 5), the
 *     next ArrowUp steps from what is shown and sends 6.
 * K4. A drag value still waiting for its frame never lands after a key: once the key has sent its
 *     value, running the pending frames sends nothing older. (Control: without a key, the frame
 *     does send the drag value, so the setup really has one pending.)
 * K5. A mixed slider writes on its first key, even when the key lands on `value` (Home at min).
 * K6. Every key path steps from the last value sent: PageUp/PageDown ten steps from it (clamped),
 *     Home/End to the ends, and a custom `keyStep` is asked with that value as its `from`
 *     (including on Home/End, and when it steps through detents with `stepDetent`).
 * K7. Escape after a key never writes back a value older than the key's: neither with no drag
 *     (Escape is not a gesture then, so it writes nothing), nor when the key was pressed mid-drag.
 *
 * Fixture: an int parameter 0–100 (one step = 1, a page = 10), horizontal, 100 px of travel
 * (1 px = 1 unit). Animation frames are queued by hand so a test controls when they run.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Slider, type SliderProps } from './Slider';
import { stepDetent, type Param, type ParamKeyStep } from '../Param';

const PARAM: Param = { kind: 'int', min: 0, max: 100, defaultValue: 50, name: 'Level' };

let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;

function runFrames() {
  // Frames queued while these run wait for the next call, as in a browser.
  const now = [...frames.values()];
  frames = new Map();
  act(() => {
    for (const cb of now) cb(performance.now());
  });
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
  // jsdom has no pointer capture.
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  for (const name of ['setPointerCapture', 'releasePointerCapture']) {
    if (typeof proto[name] !== 'function') proto[name] = () => {};
  }
  if (typeof proto.hasPointerCapture !== 'function') proto.hasPointerCapture = () => false;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(props: Partial<SliderProps> = {}) {
  const onChange = vi.fn<(next: number) => void>();
  const onRelease = vi.fn();
  const base: SliderProps = {
    param: PARAM,
    value: 5,
    onChange,
    onRelease,
    orientation: 'horizontal',
    travel: 100,
    length: 100,
    ...props,
  };
  const view = render(<Slider {...base} />);
  const show = (value: number, extra: Partial<SliderProps> = {}) => view.rerender(<Slider {...base} {...extra} value={value} />);
  const slider = screen.getByRole('slider');
  const press = (key: string, init: Partial<KeyboardEventInit> = {}) => fireEvent.keyDown(slider, { key, ...init });
  const sent = () => onChange.mock.calls.map(([v]) => v);
  return { ...view, show, slider, press, sent, onChange, onRelease };
}

/** Starts a drag at x 0 and moves it `dx` px, leaving the move's frame pending. */
function dragBy(slider: HTMLElement, dx: number) {
  fireEvent.pointerDown(slider, { pointerId: 1, button: 0, buttons: 1, clientX: 0, clientY: 0, pointerType: 'mouse' });
  fireEvent.pointerMove(slider, { pointerId: 1, buttons: 1, clientX: dx, clientY: 0, pointerType: 'mouse' });
}

describe('Slider keys', () => {
  it('K1: a key calls onChange and onRelease at once, with no frame run', () => {
    const { press, sent, onRelease } = setup();
    press('ArrowUp');
    expect(sent()).toEqual([6]);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('K1: ArrowRight and ArrowDown also send at once', () => {
    const { press, sent } = setup();
    press('ArrowRight');
    expect(sent()).toEqual([6]);
    press('ArrowDown');
    expect(sent()).toEqual([6, 5]);
  });

  it('K2: two ArrowUps before the host re-renders send 6 then 7', () => {
    const { press, sent } = setup();
    press('ArrowUp');
    press('ArrowUp');
    expect(sent()).toEqual([6, 7]);
  });

  it('K2: ArrowUp then ArrowDown before a re-render sends 6 then 5', () => {
    const { press, sent } = setup();
    press('ArrowUp');
    press('ArrowDown');
    expect(sent()).toEqual([6, 5]);
  });

  it('K2: once the host shows the sent value, the next key steps from it', () => {
    const { press, show, sent } = setup();
    press('ArrowUp');
    show(6);
    press('ArrowUp');
    expect(sent()).toEqual([6, 7]);
  });

  it('K3: after the host shows 6 then sets 5 from outside, ArrowUp sends 6', () => {
    const { press, show, sent } = setup();
    press('ArrowUp');
    show(6);
    show(5);
    press('ArrowUp');
    expect(sent()).toEqual([6, 6]);
  });

  it('K3: an outside change to an unrelated value is where the next key steps from', () => {
    const { press, show, sent } = setup();
    press('ArrowUp');
    show(40);
    press('ArrowUp');
    expect(sent()).toEqual([6, 41]);
  });

  it('K4 control: without a key, the pending drag frame sends the drag value', () => {
    const { slider, sent } = setup();
    dragBy(slider, 20);
    runFrames();
    expect(sent()).toContain(25);
  });

  it('K4: a pending drag frame never lands after a key', () => {
    const { slider, press, sent } = setup();
    dragBy(slider, 20);
    press('ArrowUp');
    const atKey = sent().length;
    expect(sent()[atKey - 1]).toBe(6);
    runFrames();
    runFrames();
    expect(sent().slice(atKey)).toEqual([]);
  });

  it('K5: a mixed slider writes on its first key', () => {
    const { press, sent } = setup({ mixed: true });
    press('ArrowUp');
    expect(sent()).toEqual([6]);
  });

  it('K5: a mixed slider writes on its first key even onto value (Home at min)', () => {
    const { press, sent } = setup({ mixed: true, value: 0 });
    press('Home');
    expect(sent()).toEqual([0]);
  });

  it('K6: PageUp after a key steps ten from the sent value', () => {
    const { press, sent } = setup();
    press('ArrowUp');
    press('PageUp');
    expect(sent()).toEqual([6, 16]);
  });

  it('K6: PageDown after a key steps ten from the sent value, clamped at min', () => {
    const { press, sent } = setup({ value: 15 });
    press('PageUp');
    press('PageDown');
    press('PageDown');
    press('PageDown');
    expect(sent()).toEqual([25, 15, 5, 0]);
  });

  it('K6: Home and End go to the ends, and a key after them steps from there', () => {
    const { press, sent } = setup();
    press('End');
    press('ArrowDown');
    press('Home');
    press('ArrowUp');
    expect(sent()).toEqual([100, 99, 0, 1]);
  });

  it('K6: keyStep is asked with the last sent value as from', () => {
    const keyStep = vi.fn<ParamKeyStep>((k, v) => (k.key === 'ArrowUp' ? v + 3 : undefined));
    const { press, sent } = setup({ keyStep });
    press('ArrowUp');
    press('ArrowUp');
    expect(keyStep.mock.calls.map(([, v]) => v)).toEqual([5, 8]);
    expect(sent()).toEqual([8, 11]);
  });

  it('K6: keyStep is asked about Home/End with the last sent value, and undefined leaves the default', () => {
    const keyStep = vi.fn<ParamKeyStep>(() => undefined);
    const { press, sent } = setup({ keyStep });
    press('ArrowUp');
    press('End');
    press('Home');
    expect(keyStep.mock.calls.map(([k, v]) => [k.key, v])).toEqual([
      ['ArrowUp', 5],
      ['End', 6],
      ['Home', 100],
    ]);
    expect(sent()).toEqual([6, 100, 0]);
  });

  it('K6: a keyStep through detents steps from each sent detent', () => {
    const detents = [0, 10, 20, 50, 100];
    const keyStep: ParamKeyStep = (k, v) =>
      k.key === 'ArrowUp' ? stepDetent(detents, v, 1) : k.key === 'ArrowDown' ? stepDetent(detents, v, -1) : undefined;
    const { press, sent } = setup({ detents, keyStep });
    press('ArrowUp');
    press('ArrowUp');
    press('ArrowUp');
    press('ArrowDown');
    expect(sent()).toEqual([10, 20, 50, 20]);
  });

  it('K7: Escape after a key, with no drag, writes nothing', () => {
    const { press, sent } = setup();
    press('ArrowUp');
    press('Escape');
    runFrames();
    expect(sent()).toEqual([6]);
  });

  it('K7: Escape after a key and the host catching up writes nothing', () => {
    const { press, show, sent } = setup();
    press('ArrowUp');
    show(6);
    press('Escape');
    runFrames();
    expect(sent()).toEqual([6]);
  });

  it('K7: Escape after a key pressed mid-drag writes back nothing older than the key', () => {
    const { slider, press, show, sent } = setup();
    dragBy(slider, 20);
    press('ArrowUp');
    const key = sent()[sent().length - 1];
    expect(key).toBe(6);
    show(6);
    const atKey = sent().length;
    press('Escape');
    runFrames();
    for (const v of sent().slice(atKey)) expect(v).toBe(6);
  });
});
