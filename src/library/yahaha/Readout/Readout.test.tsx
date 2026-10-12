import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Readout } from './Readout';
import { dragValue, fraction, splitUnit, stepOf } from './adjust';

describe('readout maths', () => {
  it('drags relative to the press: half the bar is half the range', () => {
    expect(dragValue(38, 48, 96, 0, 90)).toBe(83);
    expect(dragValue(38, -200, 96, 0, 90)).toBe(0);
    expect(dragValue(38, 10, 0, 0, 90)).toBe(38);
  });

  it('places the value in its range', () => {
    expect(fraction(2, 0, 7)).toBeCloseTo(2 / 7);
    expect(fraction(-1, 0, 7)).toBe(0);
    expect(fraction(3, 5, 5)).toBe(0);
  });

  it('splits off the unit', () => {
    expect(splitUnit('38%')).toEqual(['38', '%']);
    expect(splitUnit('5.0 kHz')).toEqual(['5.0', 'kHz']);
    expect(splitUnit('0.29 Hz')).toEqual(['0.29', 'Hz']);
    expect(splitUnit('22 ms')).toEqual(['22', 'ms']);
    expect(splitUnit('2.4 s')).toEqual(['2.4', 's']);
    expect(splitUnit('+1 dB')).toEqual(['+1', 'dB']);
    expect(splitUnit('1/8')).toEqual(['1/8', '']);
    expect(splitUnit('3 of 8')).toEqual(['3 of 8', '']);
    expect(splitUnit('Off')).toEqual(['Off', '']);
  });

  it('steps 1 on a 0–127 range, coarser on a wide one', () => {
    expect(stepOf(0, 127)).toBe(1);
    expect(stepOf(10, 2000)).toBe(16);
  });
});

describe('Readout', () => {
  function setup(props: Partial<{ value: number; defaultValue: number; disabled: boolean }> = {}) {
    const onChange = vi.fn();
    render(<Readout label="Feedback" value={38} min={0} max={90} display="38%" code="K6" tip="fx.param.delay_feedback" onChange={onChange} {...props} />);
    const slider = screen.getByRole('slider', { name: 'Feedback' });
    const bar = slider.querySelector<HTMLElement>('[data-part="bar"]')!;
    bar.getBoundingClientRect = () => ({ width: 96, height: 2, x: 0, y: 0, top: 0, left: 0, right: 96, bottom: 2, toJSON: () => ({}) });
    return { slider, onChange };
  }
  const at = (clientX: number) => ({ pointerId: 1, button: 0, clientX, clientY: 0 });

  it('is a named slider that speaks its label and value', () => {
    const { slider } = setup();
    expect(slider.getAttribute('aria-label')).toBe('Feedback');
    expect(slider.getAttribute('aria-valuetext')).toBe('Feedback 38%');
    expect(slider.getAttribute('aria-valuenow')).toBe('38');
    expect(slider.getAttribute('data-tip')).toBe('fx.param.delay_feedback');
  });

  it('shows the unit apart from the number, and the knob code', () => {
    const { slider } = setup();
    expect(slider.querySelector('.yh-readout-number')?.textContent).toBe('38');
    expect(slider.querySelector('.yh-readout-unit')?.textContent).toBe('%');
    expect(slider.querySelector('kbd')?.textContent).toBe('K6');
  });

  it('always draws the unit column, empty without a unit, so digits align; BarReadout\'s type recipe', () => {
    render(<Readout label="Time" value={8} display="1/8" />);
    const slider = screen.getByRole('slider', { name: 'Time' });
    expect(slider.querySelector('.yh-readout-unit')).not.toBeNull();
    expect(slider.querySelector('.yh-readout-unit')?.textContent).toBe('');
    const css = readFileSync(join(process.cwd(), 'src/library/yahaha/Readout/Readout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = (sel: string) => new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css)![1];
    expect(rule('.yh-readout-unit')).toMatch(/width:\s*3\.5ch/);
    expect(rule('.yh-readout-label')).toMatch(/font-size:\s*var\(--size-caption\)/);
    expect(rule('.yh-readout-label')).toMatch(/color:\s*var\(--text-3\)/);
    expect(rule('.yh-readout-number')).toMatch(/font-size:\s*var\(--size-body\)/);
    // The number never wears the accent; key names in the readout face; no faint text.
    expect(css).not.toMatch(/\[data-dragging\] \.yh-readout-number|--font-mono|--text-4/);
  });

  it('drags sideways: half the bar adds half the range, reported once on release', () => {
    const { slider, onChange } = setup();
    fireEvent.pointerDown(slider, at(0));
    fireEvent.pointerMove(slider, at(48));
    fireEvent.pointerUp(slider, at(48));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(83);
  });

  it('sends nothing for a press alone', () => {
    const { slider, onChange } = setup();
    fireEvent.pointerDown(slider, at(10));
    fireEvent.pointerUp(slider, at(10));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('steps on a wheel notch', () => {
    const { slider, onChange } = setup();
    fireEvent.wheel(slider, { deltaY: -100 });
    expect(onChange).toHaveBeenCalledWith(39);
  });

  it('handles its keys and keeps them from the window', () => {
    const { slider, onChange } = setup();
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    slider.dispatchEvent(right);
    expect(right.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(39);
    const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
    slider.dispatchEvent(end);
    expect(end.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(90);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('swallows Space without a change', () => {
    const { slider, onChange } = setup();
    const onWindow = vi.fn();
    window.addEventListener('keydown', onWindow);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    slider.dispatchEvent(space);
    window.removeEventListener('keydown', onWindow);
    expect(space.defaultPrevented).toBe(true);
    expect(onWindow).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('goes back to its default on a double-click', () => {
    const { slider, onChange } = setup({ value: 36, defaultValue: 64 });
    fireEvent.doubleClick(slider);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(64);
  });

  it('sends nothing while disabled', () => {
    const { slider, onChange } = setup({ disabled: true, defaultValue: 64 });
    fireEvent.pointerDown(slider, at(0));
    fireEvent.pointerMove(slider, at(48));
    fireEvent.pointerUp(slider, at(48));
    fireEvent.wheel(slider, { deltaY: -100 });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.doubleClick(slider);
    expect(onChange).not.toHaveBeenCalled();
    expect(slider.getAttribute('aria-disabled')).toBe('true');
  });

  it('reads the latest value after a re-render', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Readout label="Feedback" value={38} min={0} max={90} onChange={onChange} />);
    rerender(<Readout label="Feedback" value={50} min={0} max={90} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Feedback' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(51);
  });
});
