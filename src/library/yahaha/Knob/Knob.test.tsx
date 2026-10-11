// Knob's input: a drag turns it relative to where it is (never to the pointer), keys and the
// wheel step it, and a click that turned it isn't also a press.

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Knob, type KnobProps } from './Knob';

afterEach(() => cleanup());

function setup(props: Partial<KnobProps> = {}) {
  const onstep = vi.fn<(delta: number) => void>();
  const onpress = vi.fn();
  render(<Knob label="Swing" code="Swing" value="0" fraction={0} name="Swing knob" onstep={onstep} onpress={onpress} {...props} />);
  return { onstep, onpress, knob: screen.getByRole('button', { name: 'Swing knob' }) };
}

const steps = (f: ReturnType<typeof vi.fn>) => f.mock.calls.reduce((n, c) => n + (c[0] as number), 0);

describe('Knob drag', () => {
  it('a step every 4px up, from where the pointer went down, wherever on the knob that was', () => {
    const { onstep, knob } = setup();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 300 });
    expect(onstep).not.toHaveBeenCalled();
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 298 });
    expect(onstep).not.toHaveBeenCalled();
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 290 });
    expect(steps(onstep)).toBe(2);
    // Net 6px down from where it went down: one step back past the start, the rest carried.
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 306 });
    expect(steps(onstep)).toBe(-1);
    fireEvent.pointerUp(knob, { pointerId: 1 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 200 });
    expect(steps(onstep)).toBe(-1);
  });

  it('right is clockwise too', () => {
    const { onstep, knob } = setup();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 8, clientY: 0 });
    expect(steps(onstep)).toBe(2);
  });

  it('Shift turns it fine: a step every 16px', () => {
    const { onstep, knob } = setup();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 68, shiftKey: true });
    expect(steps(onstep)).toBe(2);
  });

  it('only the main button drags', () => {
    const { onstep, knob } = setup();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 2, clientX: 0, clientY: 100 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 0 });
    expect(onstep).not.toHaveBeenCalled();
  });

  it('a click after a drag is not a press; a plain click is', () => {
    const { onpress, knob } = setup();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 90 });
    fireEvent.pointerUp(knob, { pointerId: 1 });
    fireEvent.click(knob, { detail: 1 });
    expect(onpress).not.toHaveBeenCalled();
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 });
    fireEvent.pointerUp(knob, { pointerId: 1 });
    fireEvent.click(knob, { detail: 1 });
    expect(onpress).toHaveBeenCalledTimes(1);
  });

  it("an unused knob doesn't turn", () => {
    const { onstep, knob } = setup({ unused: true });
    fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 });
    fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.keyDown(knob, { key: 'ArrowUp' });
    fireEvent.wheel(knob, { deltaY: -100 });
    expect(onstep).not.toHaveBeenCalled();
  });
});

describe('Knob keys and wheel', () => {
  it('↑ → +1, ↓ ← −1', () => {
    const { onstep, knob } = setup();
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) fireEvent.keyDown(knob, { key });
    expect(onstep.mock.calls.map((c) => c[0])).toEqual([1, 1, -1, -1, 1]);
  });

  it('Enter and Space press it from the keyboard', async () => {
    const user = userEvent.setup();
    const { onpress, onstep, knob } = setup();
    knob.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onpress).toHaveBeenCalledTimes(2);
    expect(onstep).not.toHaveBeenCalled();
  });

  it('a wheel notch is one step; a trackpad swipe of many small deltas is a few, not one per event', () => {
    const { onstep, knob } = setup();
    fireEvent.wheel(knob, { deltaY: -100 });
    expect(onstep.mock.calls.map((c) => c[0])).toEqual([1]);
    onstep.mockClear();
    for (let i = 0; i < 30; i++) fireEvent.wheel(knob, { deltaY: 2 });
    expect(steps(onstep)).toBe(-3);
  });

  it('the wheel keeps the page from scrolling', () => {
    const { knob } = setup();
    const event = new WheelEvent('wheel', { deltaY: -100, cancelable: true, bubbles: true });
    knob.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('Knob names and display', () => {
  it('speaks "{label} ({code}) {value}{unit}" by default, as a knob', () => {
    render(<Knob label="Swing" code="Swing" value="0" unit="%" />);
    const knob = screen.getByRole('button', { name: 'Swing (Swing) 0%' });
    expect(knob).toHaveAttribute('aria-roledescription', 'knob');
  });

  it('leaves out an empty code', () => {
    render(<Knob label="Dynamics" value="127" />);
    expect(screen.getByRole('button', { name: 'Dynamics 127' })).toBeInTheDocument();
  });

  it('an unused knob is spoken as "unused" and shows no value', () => {
    render(<Knob label="---" value="99" unused />);
    const knob = screen.getByRole('button', { name: 'unused' });
    expect(knob).toHaveTextContent('---');
    expect(knob).not.toHaveTextContent('99');
  });

  it('shows the value, unit, name and code', () => {
    render(<Knob label="Retrig rate" code="RtgRate" value="1/8" unit="x" fraction={0.4} />);
    const knob = screen.getByRole('button');
    expect(knob).toHaveTextContent('Retrig rate');
    expect(knob).toHaveTextContent('1/8x');
    expect(knob).toHaveTextContent('RtgRate');
  });

  it('draws the lit arc only when it has turned; the track always', () => {
    const { container, rerender } = render(<Knob label="Swing" fraction={0} />);
    expect(container.querySelector('.yh-knob__track')).not.toBeNull();
    expect(container.querySelector('.yh-knob__lit')).toBeNull();
    rerender(<Knob label="Swing" fraction={0.5} />);
    expect(container.querySelector('.yh-knob__lit')?.getAttribute('d')).toMatch(/^M /);
  });

  it('wears a part hue only when given one', () => {
    const { rerender } = render(<Knob label="Swing" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-hue');
    rerender(<Knob label="Swing" hue={3} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-hue', '3');
  });

  it('renders the tip key and applies the tooltip hook', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { unmount } = render(<Knob label="Swing" tip="knobs.knob" tipAction={tipAction} />);
    const knob = screen.getByRole('button');
    expect(knob).toHaveAttribute('data-tip', 'knobs.knob');
    expect(tipAction).toHaveBeenCalledWith(knob, 'knobs.knob');
    unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
