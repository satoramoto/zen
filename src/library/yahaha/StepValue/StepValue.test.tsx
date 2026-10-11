import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepValue } from './StepValue';
import type { StepValueProps } from './StepValue';
import { dragValue, stepOf } from './adjust';

const base: StepValueProps = { value: 16, min: 0, max: 127, defaultValue: 0, tag: 'R2', hue: 'r2', name: 'Right 2 delay send', tip: 'fx.send_param' };

function setup(props: Partial<StepValueProps> = {}) {
  const onchange = vi.fn();
  render(<StepValue {...base} onchange={onchange} {...props} />);
  return { onchange, step: screen.getByRole('slider', { name: props.name ?? base.name }) };
}

describe('StepValue', () => {
  it('is a named slider with its range, value and spoken value', () => {
    const { step } = setup();
    expect(step).toHaveAttribute('aria-valuemin', '0');
    expect(step).toHaveAttribute('aria-valuemax', '127');
    expect(step).toHaveAttribute('aria-valuenow', '16');
    expect(step).toHaveAttribute('aria-valuetext', '16');
    expect(step).toHaveAttribute('data-tip', 'fx.send_param');
    expect(step).toHaveAttribute('tabindex', '0');
    expect(step).toHaveTextContent('R2');
    expect(step).toHaveAttribute('data-hue', '2');
  });

  it('shows display and speaks valuetext', () => {
    const { step } = setup({ tag: undefined, hue: 't', value: 4, min: -12, max: 12, display: '+4', ink: 't', name: 'Band 1 gain', valuetext: '+4 dB' });
    expect(step).toHaveTextContent('+4');
    expect(step).toHaveAttribute('aria-valuetext', '+4 dB');
    expect(step).not.toHaveAttribute('data-hue');
  });

  it('steps with arrows, Page Up/Down by ten, Home and End to the ends', async () => {
    const user = userEvent.setup();
    const { step, onchange } = setup();
    step.focus();
    await user.keyboard('{ArrowUp}');
    expect(onchange).toHaveBeenLastCalledWith(17);
    await user.keyboard('{ArrowRight}');
    expect(onchange).toHaveBeenLastCalledWith(17);
    await user.keyboard('{ArrowDown}');
    expect(onchange).toHaveBeenLastCalledWith(15);
    await user.keyboard('{ArrowLeft}');
    expect(onchange).toHaveBeenLastCalledWith(15);
    await user.keyboard('{PageUp}');
    expect(onchange).toHaveBeenLastCalledWith(26);
    await user.keyboard('{PageDown}');
    expect(onchange).toHaveBeenLastCalledWith(6);
    await user.keyboard('{Home}');
    expect(onchange).toHaveBeenLastCalledWith(0);
    await user.keyboard('{End}');
    expect(onchange).toHaveBeenLastCalledWith(127);
  });

  it('keeps its keys from the window and clamps at the ends', () => {
    const outer = vi.fn();
    window.addEventListener('keydown', outer);
    const { step, onchange } = setup({ value: 127 });
    fireEvent.keyDown(step, { key: 'ArrowUp' });
    expect(onchange).not.toHaveBeenCalled();
    expect(outer).not.toHaveBeenCalled();
    window.removeEventListener('keydown', outer);
  });

  it('steps by a wheel notch', () => {
    const { step, onchange } = setup();
    fireEvent.wheel(step, { deltaY: -100 });
    expect(onchange).toHaveBeenLastCalledWith(17);
    fireEvent.wheel(step, { deltaY: 100 });
    expect(onchange).toHaveBeenLastCalledWith(15);
  });

  it('goes back to its default on a double-click', () => {
    const { step, onchange } = setup();
    fireEvent.doubleClick(step);
    expect(onchange).toHaveBeenLastCalledWith(0);
  });

  it('ignores a double-click with no default', () => {
    const { step, onchange } = setup({ defaultValue: undefined });
    fireEvent.doubleClick(step);
    expect(onchange).not.toHaveBeenCalled();
  });

  it('drags sideways: the span stands for the whole range, the last value lands on release', () => {
    const { step, onchange } = setup({ span: 127 });
    fireEvent.pointerDown(step, { pointerId: 1, button: 0, clientX: 100 });
    expect(step).toHaveAttribute('data-dragging');
    fireEvent.pointerMove(step, { pointerId: 1, clientX: 110 });
    fireEvent.pointerUp(step, { pointerId: 1, clientX: 110 });
    expect(onchange).toHaveBeenLastCalledWith(26);
    expect(step).not.toHaveAttribute('data-dragging');
  });

  it('sends nothing for a press without movement', () => {
    const { step, onchange } = setup();
    fireEvent.pointerDown(step, { pointerId: 1, button: 0, clientX: 100 });
    fireEvent.pointerUp(step, { pointerId: 1, clientX: 100 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('when disabled: stays focusable, says so, and sends nothing', async () => {
    const user = userEvent.setup();
    const { step, onchange } = setup({ disabled: true });
    expect(step).toHaveAttribute('aria-disabled', 'true');
    step.focus();
    expect(step).toHaveFocus();
    await user.keyboard('{ArrowUp}{End}');
    fireEvent.wheel(step, { deltaY: -100 });
    fireEvent.doubleClick(step);
    fireEvent.pointerDown(step, { pointerId: 1, button: 0, clientX: 0 });
    fireEvent.pointerMove(step, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(step, { pointerId: 1, clientX: 50 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('dim is still settable', async () => {
    const user = userEvent.setup();
    const { step, onchange } = setup({ dim: true, value: 0, tag: 'R3', hue: 'r3', name: 'Right 3 delay send' });
    expect(step).toHaveAttribute('data-dim', 'true');
    step.focus();
    await user.keyboard('{ArrowUp}');
    expect(onchange).toHaveBeenLastCalledWith(1);
  });

  it('applies the tip action with the tip key and cleans it up', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { unmount } = render(<StepValue {...base} tipAction={tipAction} />);
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('slider'), 'fx.send_param');
    act(() => unmount());
    expect(destroy).toHaveBeenCalled();
  });

  it('steps coarser on a wide range', () => {
    expect(stepOf(0, 127)).toBe(1);
    expect(stepOf(10, 2000)).toBe(16);
    expect(dragValue(0, 64, 128, 0, 127)).toBe(64);
    expect(dragValue(100, 500, 128, 0, 127)).toBe(127);
  });
});
