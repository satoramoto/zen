import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TempoReadout } from './TempoReadout';

// jsdom gives import.meta.url a non-file scheme and vitest skips CSS; tests run from the repo root.
const css = readFileSync(join(process.cwd(), 'src/library/components/music/TempoReadout/TempoReadout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ruleOf = (selector: string) =>
  new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('TempoReadout role hue', () => {
  it('+ and − are neutral at rest; the role-2 hue, with its paired ink, only while pressed', () => {
    expect(ruleOf('.yh-tempo-readout__steps')).toMatch(/border:[^;]*var\(--border-strong\)/);
    expect(ruleOf('.yh-tempo-readout__step')).toMatch(/color:\s*var\(--text-2\)/);
    expect(ruleOf('.yh-tempo-readout__step + .yh-tempo-readout__step')).toMatch(/border-top:[^;]*var\(--border-strong\)/);
    expect(ruleOf('.yh-tempo-readout__step:hover:not(:disabled)')).not.toMatch(/--role-2/);
    const pressed = ruleOf('.yh-tempo-readout__step:active:not(:disabled)');
    expect(pressed).toMatch(/background:\s*var\(--role-2\)/);
    expect(pressed).toMatch(/color:\s*var\(--role-2-text\)/);
    // --role-2 appears in the pressed rule and nowhere else.
    expect(css.split('var(--role-2)').length - 1).toBe(1);
  });

  it('+ and − are real keys: a control height square each, glyphs at heading size', () => {
    const steps = ruleOf('.yh-tempo-readout__steps');
    expect(steps).toMatch(/width:\s*var\(--control-h\)/);
    expect(steps).toMatch(/height:\s*calc\(var\(--control-h\) \* 2\)/);
    // Each key is a numeral Text at the heading size.
    render(<TempoReadout bpm={104} />);
    for (const key of [screen.getByRole('button', { name: /Tempo up/ }), screen.getByRole('button', { name: /Tempo down/ })]) {
      expect(key).toHaveAttribute('data-role', 'numeral');
      expect(key).toHaveAttribute('data-text-size', 'heading');
    }
  });

  it('sets the unit as the one caption recipe, at body weight', () => {
    const { container } = render(<TempoReadout bpm={104} />);
    const unit = container.querySelector('[data-part="unit"]');
    expect(unit).toHaveAttribute('data-role', 'label');
    expect(unit).toHaveAttribute('data-text-size', 'caption');
    expect(unit).toHaveAttribute('data-text-weight', 'body');
  });
});

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

describe('TempoReadout options', () => {
  const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>('.yh-tempo-readout')!;

  it('applies the tooltip action to the number and both buttons with their keys', () => {
    const tipAction = vi.fn();
    const { container } = setup({ tipAction });
    const root = rootOf(container);
    expect(tipAction).toHaveBeenCalledTimes(3);
    expect(tipAction).toHaveBeenCalledWith(root.querySelector('.yh-tempo-readout__bpm'), 'display.tempo');
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Tempo up (Scene Launch)' }), 'tempo.up');
    expect(tipAction).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Tempo down (Function)' }), 'tempo.down');
  });

  it('takes the number tooltip key from `tip`, re-applying on change and destroying on unmount', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { container, rerender, unmount, number } = setup({ tip: 'tempo.a', tipAction });
    expect(number).toHaveAttribute('data-tip', 'tempo.a');
    expect(tipAction).toHaveBeenCalledWith(number, 'tempo.a');
    rerender(<TempoReadout bpm={104} tip="tempo.b" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(number, 'tempo.b');
    expect(rootOf(container).querySelector('.yh-tempo-readout__bpm')).toHaveAttribute('data-tip', 'tempo.b');
    unmount();
    expect(destroy).toHaveBeenCalledTimes(4);
  });

  it('keeps the default number key without `tip`', () => {
    const { number } = setup();
    expect(number).toHaveAttribute('data-tip', 'display.tempo');
  });

  it('sets the numeral size as its custom property, and none by default', () => {
    const { container, rerender } = setup();
    expect(rootOf(container).style.getPropertyValue('--yh-tempo-readout-size')).toBe('');
    rerender(<TempoReadout bpm={104} size="96px" />);
    expect(rootOf(container).style.getPropertyValue('--yh-tempo-readout-size')).toBe('96px');
    expect(rootOf(container).style.getPropertyValue('--yh-tempo-readout-digits')).toBe('3');
  });
});
