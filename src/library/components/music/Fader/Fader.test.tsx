// Fader's input: keys, wheel and drag ask for levels through `onlevel`, and steps in quick
// succession count from the level last asked for until `level` catches up.

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Fader, type FaderProps } from './Fader';

function setup(level = 90, extra: Partial<FaderProps> = {}) {
  const onlevel = vi.fn<(level: number) => void>();
  const props: FaderProps = { name: 'Right 1 90', value: String(level), level, onlevel, ...extra };
  const r = render(<Fader {...props} />);
  const rerender = (next: Partial<FaderProps>) => r.rerender(<Fader {...props} {...next} />);
  return { onlevel, fader: screen.getByRole('slider', { name: 'Right 1 90' }), rerender };
}
const asked = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.map((c) => c[0]);

describe('Fader a11y', () => {
  it('is a vertical slider named by `name`, valued 0–127, with the shown text as its value text', () => {
    const { fader } = setup(40, { value: 'Rev 40', layered: true });
    expect(fader).toHaveAttribute('aria-orientation', 'vertical');
    expect(fader).toHaveAttribute('aria-valuemin', '0');
    expect(fader).toHaveAttribute('aria-valuemax', '127');
    expect(fader).toHaveAttribute('aria-valuenow', '40');
    expect(fader).toHaveAttribute('aria-valuetext', 'Rev 40');
    expect(fader).toHaveAttribute('tabindex', '0');
  });

  it('a parked fader is disabled and shows no value', () => {
    render(<Fader name="Fader 7 unused" kind="parked" value="12" />);
    const fader = screen.getByRole('slider', { name: 'Fader 7 unused' });
    expect(fader).toHaveAttribute('aria-disabled', 'true');
    expect(fader).not.toHaveAttribute('aria-valuetext');
    expect(fader).not.toHaveTextContent('12');
  });

  it('draws one meter, the louder side, and no peak line', () => {
    const { fader } = setup(90, { meter: 0.3, meter2: 0.6, peak: 0.8 });
    const meters = fader.querySelectorAll('.yh-fader__meter');
    expect(meters).toHaveLength(1);
    expect((meters[0] as HTMLElement).style.getPropertyValue('--yh-fader-m')).toBe('0.6');
    expect(fader.querySelector('.yh-fader__peak')).toBeNull();
  });

  it('splits a layer word from its number and marks soft takeover with its direction', () => {
    const { fader, rerender } = setup(72, { value: 'Rev 40', away: 50 });
    expect(fader.querySelector('.yh-fader__word')).toHaveTextContent('Rev');
    expect(fader.querySelector('.yh-fader__value')).toHaveTextContent('40');
    expect(fader).toHaveAttribute('data-away', 'up');
    rerender({ away: 110 });
    expect(fader).toHaveAttribute('data-away', 'down');
    rerender({ away: undefined });
    expect(fader).not.toHaveAttribute('data-away');
  });

  it('renders `tip` as data-tip and hands the node to `tipAction`', () => {
    const tipAction = vi.fn();
    const { fader } = setup(90, { tip: 'mixer.panel.right1', tipAction });
    expect(fader).toHaveAttribute('data-tip', 'mixer.panel.right1');
    expect(tipAction).toHaveBeenCalledWith(fader, 'mixer.panel.right1');
  });

  it("calls the tip handle's `destroy` when `tip` changes and on unmount", () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const onlevel = vi.fn();
    const props: FaderProps = { name: 'Right 1 90', value: '90', level: 90, onlevel, tip: 'a', tipAction };
    const r = render(<Fader {...props} />);
    expect(destroy).not.toHaveBeenCalled();
    r.rerender(<Fader {...props} tip="b" />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'b');
    r.unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });
});

describe('Fader keys', () => {
  it('five ↑ before the state answers ask for five steps, not the same level five times', async () => {
    const user = userEvent.setup();
    const { onlevel, fader } = setup(90);
    fader.focus();
    await user.keyboard('{ArrowUp>5/}');
    expect(asked(onlevel)).toEqual([91, 92, 93, 94, 95]);
  });

  it('once the state answers, steps count from the level it sent', () => {
    const { onlevel, fader, rerender } = setup(90);
    fireEvent.keyDown(fader, { key: 'ArrowUp' });
    rerender({ level: 91, value: '91' });
    // Something else (the Launchkey) moves it on: the state's level wins once it matches nothing asked.
    rerender({ level: 40, value: '40' });
    fireEvent.keyDown(fader, { key: 'ArrowDown' });
    expect(asked(onlevel)).toEqual([91, 39]);
  });

  it("after a pause the state's level wins over an ask it never confirmed", () => {
    vi.useFakeTimers();
    try {
      const { onlevel, fader } = setup(90);
      fireEvent.keyDown(fader, { key: 'ArrowUp' });
      vi.advanceTimersByTime(1000);
      fireEvent.keyDown(fader, { key: 'ArrowUp' });
      expect(asked(onlevel)).toEqual([91, 91]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Page Up / Down ±10, Home 0, End 127, → and ←, clamped', async () => {
    const user = userEvent.setup();
    const { onlevel, fader } = setup(120);
    fader.focus();
    await user.keyboard('{PageUp}{Home}{ArrowLeft}{End}{ArrowRight}');
    expect(asked(onlevel)).toEqual([127, 0, 0, 127, 127]);
    fireEvent.keyDown(fader, { key: 'PageDown' });
    expect(asked(onlevel).at(-1)).toBe(117);
  });

  it('other keys pass through untouched', () => {
    const { onlevel, fader } = setup(90);
    expect(fireEvent.keyDown(fader, { key: 'Tab' })).toBe(true);
    expect(onlevel).not.toHaveBeenCalled();
  });
});

describe('Fader wheel', () => {
  it("a notch moves 2; a trackpad's small deltas add up to a notch first", () => {
    const { onlevel, fader } = setup(90);
    expect(fireEvent.wheel(fader, { deltaY: -100 })).toBe(false); // the page doesn't scroll
    expect(asked(onlevel)).toEqual([92]);
    for (let i = 0; i < 4; i++) fireEvent.wheel(fader, { deltaY: 4 });
    expect(onlevel).toHaveBeenCalledTimes(1);
    fireEvent.wheel(fader, { deltaY: 4 });
    expect(asked(onlevel)).toEqual([92, 90]);
  });

  it('a parked fader asks for nothing', () => {
    const onlevel = vi.fn();
    render(<Fader name="Fader 7 unused" kind="parked" onlevel={onlevel} />);
    const fader = screen.getByRole('slider', { name: 'Fader 7 unused' });
    fireEvent.keyDown(fader, { key: 'ArrowUp' });
    fireEvent.wheel(fader, { deltaY: -100 });
    fireEvent.pointerDown(fader, { button: 0, pointerId: 1, clientY: 0 });
    expect(onlevel).not.toHaveBeenCalled();
  });
});

describe('Fader drag', () => {
  it('a press asks for the level under the pointer, a drag sends each new level once', () => {
    const { onlevel, fader } = setup(0);
    const rail = fader.querySelector('.yh-fader__rail') as HTMLElement;
    rail.getBoundingClientRect = () => ({ top: 100, height: 127, bottom: 227, left: 0, right: 10, width: 10, x: 0, y: 100, toJSON() {} });
    fireEvent.pointerDown(fader, { button: 0, pointerId: 1, clientY: 227 - 64 });
    fireEvent.pointerMove(fader, { pointerId: 1, clientY: 227 - 64.2 });
    fireEvent.pointerMove(fader, { pointerId: 1, clientY: 227 - 70 });
    fireEvent.pointerMove(fader, { pointerId: 1, clientY: 0 });
    fireEvent.pointerUp(fader, { pointerId: 1, clientY: 0 });
    fireEvent.pointerMove(fader, { pointerId: 1, clientY: 227 });
    expect(asked(onlevel)).toEqual([64, 70, 127]);
  });

  it('fillHeight marks the fader to fill its container (off by default) and a drag measures the rail', () => {
    const onlevel = vi.fn<(level: number) => void>();
    const { container, rerender } = render(<Fader name="Right 1 0" level={0} onlevel={onlevel} />);
    const fader = within(container).getByRole('slider', { name: 'Right 1 0' });
    expect(fader).not.toHaveAttribute('data-fill-height');
    rerender(<Fader name="Right 1 0" level={0} onlevel={onlevel} fillHeight />);
    expect(fader).toHaveAttribute('data-fill-height', 'true');
    // A tall container: 400px of rail, so a quarter of the way up is a quarter of 127.
    const rail = fader.querySelector('.yh-fader__rail') as HTMLElement;
    rail.getBoundingClientRect = () => ({ top: 50, height: 400, bottom: 450, left: 0, right: 10, width: 10, x: 0, y: 50, toJSON() {} });
    fireEvent.pointerDown(fader, { button: 0, pointerId: 1, clientY: 450 - 100 });
    fireEvent.pointerMove(fader, { pointerId: 1, clientY: 50 });
    fireEvent.pointerUp(fader, { pointerId: 1, clientY: 50 });
    expect(asked(onlevel)).toEqual([32, 127]);
  });

  it('a secondary button does nothing', () => {
    const { onlevel, fader } = setup(0);
    fireEvent.pointerDown(fader, { button: 2, pointerId: 1, clientY: 0 });
    expect(onlevel).not.toHaveBeenCalled();
  });
});
