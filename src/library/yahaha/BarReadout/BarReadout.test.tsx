/**
 * BarReadout as a control, ported from yahaha/src/ui/BarReadout/BarReadout.test.ts: drags over fake
 * animation frames, the wheel, keys, the reset and the local value.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarReadout, type BarReadoutProps } from './BarReadout';
import { LOW_STEPS } from './bar';

let frames: FrameRequestCallback[] = [];

/** Runs the animation frames requested so far. */
function runFrames() {
  const now = frames;
  frames = [];
  act(() => {
    for (const cb of now) cb(0);
  });
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const LEVEL: BarReadoutProps = { label: 'Level', value: 90, min: 0, max: 127, default: 100 };

function level(extra: Partial<BarReadoutProps> = {}) {
  const onChange = vi.fn();
  const props = { ...LEVEL, onChange, ...extra };
  const view = render(<BarReadout {...props} />);
  const rerender = (next: Partial<BarReadoutProps>) => view.rerender(<BarReadout {...props} {...next} />);
  return { ...view, rerender, onChange, slider: screen.getByRole('slider') };
}

const P = { pointerId: 1, button: 0 };
const valueOf = (c: HTMLElement) => c.querySelector('.yh-bar-readout__value');

describe('BarReadout', () => {
  it('reads as a slider', () => {
    const { slider } = level({ tip: 'mixer.channel.level' });
    expect(slider).toHaveAttribute('aria-valuenow', '90');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '127');
    expect(slider).toHaveAttribute('aria-valuetext', 'Level 90');
    expect(slider).toHaveAttribute('aria-label', 'Level');
    expect(slider).toHaveAttribute('data-face', 'off');
    expect(slider).toHaveAttribute('data-tip', 'mixer.channel.level');
    expect(slider).toHaveAttribute('tabindex', '0');
  });

  it('a 20px drag sends 100 once, and nothing more on pointerup', () => {
    const { slider, onChange } = level();
    fireEvent.pointerDown(slider, { ...P, clientX: 50 });
    fireEvent.pointerMove(slider, { ...P, clientX: 60 });
    fireEvent.pointerMove(slider, { ...P, clientX: 70 });
    expect(onChange).not.toHaveBeenCalled();
    runFrames();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(100);
    fireEvent.pointerUp(slider, { ...P, clientX: 70 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('pointerup sends a value the frame has not sent yet', () => {
    const { slider, onChange } = level();
    fireEvent.pointerDown(slider, { ...P, clientX: 50 });
    fireEvent.pointerMove(slider, { ...P, clientX: 54 });
    fireEvent.pointerUp(slider, { ...P, clientX: 54 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(92);
  });

  it('a press without movement sends nothing', () => {
    const { slider, onChange } = level();
    fireEvent.pointerDown(slider, { ...P, clientX: 50 });
    fireEvent.pointerUp(slider, { ...P, clientX: 50 });
    runFrames();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Shift drags one unit per 8px', () => {
    const { slider, onChange } = level();
    fireEvent.pointerDown(slider, { ...P, clientX: 50, shiftKey: true });
    fireEvent.pointerMove(slider, { ...P, clientX: 70, shiftKey: true });
    runFrames();
    fireEvent.pointerUp(slider, { ...P, clientX: 70, shiftKey: true });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(92);
  });

  it('the wheel steps one unit, up positive, and keeps the page from scrolling', () => {
    const { slider, onChange } = level();
    const notCancelled = fireEvent.wheel(slider, { deltaY: -100 });
    expect(onChange).toHaveBeenLastCalledWith(91);
    expect(notCancelled).toBe(false);
  });

  for (const [key, sent] of [
    ['ArrowRight', 91],
    ['ArrowUp', 91],
    ['ArrowDown', 89],
    ['ArrowLeft', 89],
    ['PageUp', 100],
    ['PageDown', 80],
    ['End', 127],
    ['Home', 0],
  ] as const) {
    it(`${key} sends ${sent}`, () => {
      const { slider, onChange } = level();
      fireEvent.keyDown(slider, { key });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(sent);
    });
  }

  it('a double-click sends the default, even when already there', () => {
    const { slider, onChange } = level({ value: 100 });
    fireEvent.doubleClick(slider);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('waiting reads the fader away', () => {
    const { slider, container } = level({ waiting: true });
    expect(slider).toHaveAttribute('aria-valuetext', 'Level 90, hardware fader away');
    expect(slider).toHaveAttribute('aria-label', 'Level');
    expect(container).toHaveTextContent('↕');
  });

  it('a stepped row moves by steps of its table', () => {
    const props = { label: 'Low freq', min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz' as const, default: 80 };
    const { slider, onChange, unmount } = level({ ...props, value: 120 });
    expect(slider).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz');
    expect(slider).toHaveAttribute('aria-valuemin', '32');
    expect(slider).toHaveAttribute('aria-valuemax', '2000');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(140);
    unmount();
    const again = level({ ...props, value: 120 });
    fireEvent.keyDown(again.slider, { key: 'ArrowLeft' });
    expect(again.onChange).toHaveBeenLastCalledWith(110);
  });

  it('a pan row reads C', () => {
    const { slider } = level({ label: 'Pan', value: 64, kind: 'pan', bipolar: true, default: 64 });
    expect(slider).toHaveAttribute('aria-valuetext', 'Pan C');
  });

  it('a ratio joins its unit', () => {
    const { slider } = level({ label: 'Ratio', value: 30, min: 10, max: 200, kind: 'ratio', default: 30, suffix: ', off' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Ratio 3:1, off');
  });

  it('disabled reads its absence and sends nothing', () => {
    const { slider, container, onChange } = level({ label: 'Send 5', value: 0, default: 0, disabled: true, absent: 'not added' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Send 5, not added');
    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '0');
    expect(slider).toHaveAttribute('data-face', 'disabled');
    expect(slider).not.toHaveAttribute('aria-valuenow');
    expect(container).toHaveTextContent('—');
    fireEvent.pointerDown(slider, { ...P, clientX: 50 });
    fireEvent.pointerMove(slider, { ...P, clientX: 90 });
    runFrames();
    fireEvent.pointerUp(slider, { ...P, clientX: 90 });
    fireEvent.wheel(slider, { deltaY: -100 });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'End' });
    fireEvent.doubleClick(slider);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the local value during a drag, and lets go when the state catches up', () => {
    const { slider, container, rerender, onChange } = level();
    fireEvent.pointerDown(slider, { ...P, clientX: 50 });
    fireEvent.pointerMove(slider, { ...P, clientX: 70 });
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    expect(valueOf(container)).toHaveTextContent('100');
    runFrames();
    // A state frame from before the send doesn't snap it back.
    rerender({ value: 95 });
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    fireEvent.pointerUp(slider, { ...P, clientX: 70 });
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    rerender({ value: 100 });
    rerender({ value: 97 });
    expect(slider).toHaveAttribute('aria-valuenow', '97');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('lets go of the local value 500 ms after the last send', async () => {
    vi.useFakeTimers();
    try {
      const { slider } = level();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(slider).toHaveAttribute('aria-valuenow', '91');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(slider).toHaveAttribute('aria-valuenow', '90');
    } finally {
      vi.useRealTimers();
    }
  });

  it('a display row shows the local number bare', () => {
    const { container, slider } = level({ label: 'Speed', value: 64, kind: 'display', display: '0.50 Hz', default: 64 });
    expect(valueOf(container)).toHaveTextContent('0.50');
    expect(container.querySelector('.yh-bar-readout__unit')).toHaveTextContent('Hz');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(valueOf(container)).toHaveTextContent('65');
    // The unit column stays, empty, so the last digits keep their place.
    expect(container.querySelector('.yh-bar-readout__unit')).toHaveTextContent('');
  });

  it('always draws the unit column, so rows with and without a unit align on their last digit', () => {
    const { container } = level();
    expect(container.querySelector('.yh-bar-readout__unit')).not.toBeNull();
    expect(container.querySelector('.yh-bar-readout__unit')).toHaveTextContent('');
    const css = readFileSync(join(process.cwd(), 'src/library/yahaha/BarReadout/BarReadout.css'), 'utf8');
    expect(/\.yh-bar-readout__unit \{([^}]*)\}/.exec(css)![1]).toMatch(/width:\s*3\.5ch/);
    // The one caption recipe, and muted (never faint) text when disabled.
    expect(/\.yh-bar-readout__label \{([^}]*)\}/.exec(css)![1]).toMatch(/color:\s*var\(--text-3\)/);
    expect(css).not.toMatch(/--text-4/);
  });

  it('marks the centre of a bipolar row', () => {
    const { container } = level({ label: 'Pan', value: 70, kind: 'pan', bipolar: true, default: 64 });
    expect(container.querySelector('.yh-bar-readout__centre')).not.toBeNull();
    expect(container.querySelector('.yh-bar-readout__fill')).toHaveStyle({ left: '50%', width: '5%' });
  });
});
