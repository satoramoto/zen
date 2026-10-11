import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TempoReadout } from './TempoReadout';

function setup(props: Partial<Parameters<typeof TempoReadout>[0]> = {}) {
  const handlers = { onTempo: vi.fn(), onPlus: vi.fn(), onMinus: vi.fn(), onReset: vi.fn() };
  const view = render(<TempoReadout bpm={104} {...handlers} {...props} />);
  return { ...handlers, ...view, number: screen.getByRole('spinbutton') };
}

describe('TempoReadout', () => {
  it('is a spinbutton that speaks its value and range', () => {
    const { number } = setup();
    expect(number).toHaveTextContent('104');
    expect(number).toHaveAttribute('aria-valuenow', '104');
    expect(number).toHaveAttribute('aria-valuemin', '5');
    expect(number).toHaveAttribute('aria-valuemax', '500');
    expect(number).toHaveAttribute('aria-valuetext', '104 BPM');
    expect(number).toHaveAccessibleName("Tempo, BPM. Drag, scroll or use the arrow keys; double-click for the style's tempo");
    expect(number).toHaveAttribute('tabindex', '0');
    expect(number).toHaveAttribute('data-tip', 'display.tempo');
    expect(screen.getByRole('group', { name: 'Tempo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tempo up (Scene Launch)' })).toHaveAttribute('data-tip', 'tempo.up');
    expect(screen.getByRole('button', { name: 'Tempo down (Function)' })).toHaveAttribute('data-tip', 'tempo.down');
  });

  it('a drag up 8px asks for two BPM more, once per new value', () => {
    const { number, onTempo } = setup();
    fireEvent.pointerDown(number, { pointerId: 1, button: 0, clientY: 300 });
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 296 });
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 295 });
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 292 });
    fireEvent.pointerUp(number, { pointerId: 1 });
    expect(onTempo.mock.calls).toEqual([[105], [106]]);
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 200 });
    expect(onTempo).toHaveBeenCalledTimes(2);
  });

  it('a drag is clamped to the range and ignores other buttons', () => {
    const { number, onTempo } = setup({ bpm: 498 });
    fireEvent.pointerDown(number, { pointerId: 1, button: 2, clientY: 300 });
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 200 });
    expect(onTempo).not.toHaveBeenCalled();
    fireEvent.pointerDown(number, { pointerId: 1, button: 0, clientY: 300 });
    fireEvent.pointerMove(number, { pointerId: 1, clientY: 200 });
    expect(onTempo).toHaveBeenLastCalledWith(500);
  });

  it('arrow keys step 1 and Page keys 10', () => {
    const { number, onTempo } = setup();
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'PageUp', 'PageDown', 'Enter']) fireEvent.keyDown(number, { key });
    expect(onTempo.mock.calls).toEqual([[105], [105], [103], [103], [114], [94]]);
  });

  it('at the top of its range ↑ asks for nothing', () => {
    const { number, onTempo } = setup({ bpm: 500 });
    fireEvent.keyDown(number, { key: 'ArrowUp' });
    expect(onTempo).not.toHaveBeenCalled();
  });

  it('a wheel step changes the tempo by one', () => {
    const { number, onTempo } = setup();
    fireEvent.wheel(number, { deltaY: -40 });
    fireEvent.wheel(number, { deltaY: 40 });
    fireEvent.wheel(number, { deltaY: 0 });
    expect(onTempo.mock.calls).toEqual([[105], [103]]);
  });

  it('a double-click resets', () => {
    const { number, onReset } = setup();
    fireEvent.doubleClick(number);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('+ and − report a hold; a keyboard press is one step', () => {
    const { onPlus, onMinus } = setup();
    const plus = screen.getByRole('button', { name: 'Tempo up (Scene Launch)' });
    const minus = screen.getByRole('button', { name: 'Tempo down (Function)' });
    fireEvent.pointerDown(minus, { button: 0 });
    fireEvent.pointerUp(minus);
    fireEvent.pointerLeave(minus);
    expect(onMinus.mock.calls).toEqual([[true], [false]]);
    fireEvent.pointerDown(plus, { button: 0 });
    fireEvent.pointerLeave(plus);
    fireEvent.click(plus, { detail: 1 });
    expect(onPlus.mock.calls).toEqual([[true], [false]]);
    fireEvent.click(plus, { detail: 0 });
    expect(onPlus.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it('cells marks the block and keeps the same controls', () => {
    const { container } = setup({ cells: true, unitLarge: true });
    const root = container.querySelector('[data-cells]');
    expect(root).toHaveClass('yh-tempo-readout--cells', 'yh-tempo-readout--unit-large');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('sizes the number for the widest value', () => {
    const { container } = setup({ bpm: 68, max: 500 });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--yh-tempo-readout-digits')).toBe('3');
  });
});
