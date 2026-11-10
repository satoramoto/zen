import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineSlider, snap, type LineSliderProps } from './LineSlider';

function setup(props: Partial<LineSliderProps> = {}) {
  const onchange = vi.fn();
  const tipAction = vi.fn();
  const utils = render(
    <LineSlider
      value={10}
      min={0}
      max={30}
      step={1}
      name="Chord settle"
      unit="ms"
      tip="settings.chord_settle"
      onchange={onchange}
      tipAction={tipAction}
      {...props}
    />,
  );
  return { ...utils, onchange, tipAction, slider: screen.getByRole('slider') };
}

/** Gives the track a 120px box at x 0, as a browser would. */
function sizeTrack(slider: HTMLElement) {
  const track = slider.firstElementChild as HTMLElement;
  track.getBoundingClientRect = () => ({ left: 0, width: 120, top: 0, height: 2 }) as DOMRect;
}

describe('LineSlider', () => {
  it('is a named slider carrying its range, value and unit', () => {
    const { slider, tipAction, container } = setup();
    expect(screen.getByRole('slider', { name: 'Chord settle' })).toBe(slider);
    expect(slider).toHaveAttribute('aria-valuenow', '10');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '30');
    expect(slider).toHaveAttribute('aria-valuetext', '10 ms');
    expect(slider).toHaveAttribute('data-tip', 'settings.chord_settle');
    expect(tipAction).toHaveBeenCalledWith(slider, 'settings.chord_settle');
    expect(container).toHaveTextContent('10ms');
  });

  it('asks for steps, pages and ends from the keyboard, and stays controlled', async () => {
    const { slider, onchange } = setup();
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onchange).toHaveBeenLastCalledWith(11);
    await userEvent.keyboard('{ArrowUp}');
    expect(onchange).toHaveBeenLastCalledWith(11);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onchange).toHaveBeenLastCalledWith(9);
    await userEvent.keyboard('{ArrowDown}');
    expect(onchange).toHaveBeenLastCalledWith(9);
    await userEvent.keyboard('{End}');
    expect(onchange).toHaveBeenLastCalledWith(30);
    await userEvent.keyboard('{Home}');
    expect(onchange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard('{PageUp}');
    expect(onchange).toHaveBeenLastCalledWith(20);
    await userEvent.keyboard('{PageDown}');
    expect(onchange).toHaveBeenLastCalledWith(0);
    expect(onchange).toHaveBeenCalledTimes(8);
    expect(slider).toHaveAttribute('aria-valuenow', '10');
  });

  it('asks for nothing past the top', async () => {
    const { slider, onchange } = setup({ value: 30 });
    slider.focus();
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{PageUp}');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('shows a word with a fractional step', async () => {
    const { slider, onchange } = setup({ value: 5, max: 10, step: 0.5, name: 'Fade in', valueText: '5.0', unit: 's' });
    expect(screen.getByRole('slider', { name: 'Fade in' })).toHaveAttribute('aria-valuetext', '5.0 s');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onchange).toHaveBeenLastCalledWith(5.5);
  });

  it('leaves the unit out of the value text when there is none', () => {
    const { slider } = setup({ unit: undefined });
    expect(slider).toHaveAttribute('aria-valuetext', '10');
  });

  it('asks for where a press lands and follows a drag until release', () => {
    const { slider, onchange } = setup();
    sizeTrack(slider);
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 });
    expect(onchange).toHaveBeenLastCalledWith(15);
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 116 });
    expect(onchange).toHaveBeenLastCalledWith(29);
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 400 });
    expect(onchange).toHaveBeenLastCalledWith(30);
    fireEvent.pointerUp(slider, { pointerId: 1 });
    onchange.mockClear();
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 0 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('ignores a secondary button', () => {
    const { slider, onchange } = setup();
    sizeTrack(slider);
    fireEvent.pointerDown(slider, { button: 2, pointerId: 1, clientX: 60 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('when disabled stays focusable, is announced, and asks for nothing', async () => {
    const { slider, onchange } = setup({ disabled: true });
    sizeTrack(slider);
    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '0');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{End}');
    fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('snaps to the step from min and clamps', () => {
    expect(snap(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(snap(53.4, 50, 75, 1)).toBe(53);
    expect(snap(-4, 0, 30, 1)).toBe(0);
    expect(snap(99, 0, 30, 1)).toBe(30);
  });
});
