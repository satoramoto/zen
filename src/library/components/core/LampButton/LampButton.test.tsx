import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LampButton } from './LampButton';
import { parseDuration } from './useLongPress';

const down = { pointerId: 1, button: 0, clientX: 10, clientY: 10 };

describe('LampButton', () => {
  it('names itself from label and code, and reports on through aria-pressed', () => {
    const { rerender } = render(<LampButton label="Accomp" code="ACMP" on />);
    const button = screen.getByRole('button', { name: 'Accomp ACMP' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-face', 'on');
    rerender(<LampButton label="Accomp" code="ACMP" />);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-face', 'off');
  });

  it('uses the name override', () => {
    render(<LampButton label="On" hue={1} name="Channel 1 on" />);
    expect(screen.getByRole('button', { name: 'Channel 1 on' })).toBeInTheDocument();
  });

  it('is controlled: click, Space and Enter ask for !on and change nothing', async () => {
    const onToggle = vi.fn();
    const onLongPress = vi.fn();
    const user = userEvent.setup();
    render(<LampButton label="Unison" onToggle={onToggle} onLongPress={onLongPress} />);
    const button = screen.getByRole('button', { name: 'Unison' });
    await user.click(button);
    expect(onToggle).toHaveBeenLastCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    button.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(3);
    for (const n of [1, 2, 3]) expect(onToggle).toHaveBeenNthCalledWith(n, true);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('asks for off when on', async () => {
    const onToggle = vi.fn();
    render(<LampButton label="Sound" on onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sound' }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('a hue slot draws its --hue-n', () => {
    render(<LampButton label="On" hue={3} on />);
    expect(screen.getByRole('button')).toHaveAttribute('data-hue', '3');
    const css = readFileSync(join(process.cwd(), 'src/library/components/core/LampButton/LampButton.css'), 'utf8');
    for (const slot of [1, 2, 3, 4]) expect(css).toContain(`.yh-lampbutton[data-hue='${slot}'] { --lamp-hue: var(--hue-${slot});`);
  });

  it('role-2 is its own hue, and each lit fill takes its own ink', () => {
    render(<LampButton label="Metronome" hue="role-2" on />);
    expect(screen.getByRole('button')).toHaveAttribute('data-hue', 'role-2');
    const css = readFileSync(join(process.cwd(), 'src/library/components/core/LampButton/LampButton.css'), 'utf8');
    const decls = (hue: string) => css.match(new RegExp(`\\[data-hue='${hue}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(decls('lamp')).toContain('--lamp-ink: var(--success-text)');
    expect(decls('rec')).toContain('--lamp-ink: var(--danger-text)');
    expect(decls('role-2')).toContain('--lamp-hue: var(--role-2)');
    expect(decls('role-2')).toContain('--lamp-ink: var(--role-2-text)');
  });

  it('on is an outline and a lit LED; only running, looping and record fill; role-2 is neutral off', () => {
    const css = readFileSync(join(process.cwd(), 'src/library/components/core/LampButton/LampButton.css'), 'utf8');
    const rule = (selector: string) => {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} has a rule`).toBeGreaterThan(-1);
      return css.slice(at, css.indexOf('}', at));
    };
    const on = rule(".yh-lampbutton:is([data-face='on'], [data-face='armed'])");
    expect(on).toContain('border-color: var(--lamp-hue)');
    expect(on).not.toContain('background');
    const solid = rule(".yh-lampbutton:is([data-hue='ok'], [data-hue='lamp'])[data-face='on'],\n.yh-lampbutton[data-face='record']");
    expect(solid).toContain('background: var(--lamp-hue)');
    // No other rule fills a face with the hue.
    expect(css.match(/background: var\(--lamp-hue\)/g)?.length).toBe(1);
    expect(rule(".yh-lampbutton[data-hue='role-2']:is([data-face='off'], [data-face='disabled'])")).toContain('--lamp-hue: var(--text-1)');
    expect(rule(".yh-lampbutton[data-face='disabled'] .yh-lampbutton__code")).toContain('var(--text-3)');
    expect(css).not.toContain('--text-4');
    expect(css).not.toContain('ellipsis');
    expect(css).not.toContain('--font-mono');
    expect(css).toMatch(/--yh-wait-ring:\s*calc\(var\(--border-width\) \* 2\)/);
  });

  it('draws the faces and hues: record, waiting, rec waiting, m as t', () => {
    const { rerender } = render(<LampButton label="Looper" on rec />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-face', 'record');
    expect(button).toHaveAttribute('data-hue', 'rec');
    rerender(<LampButton label="Looper" waiting rec />);
    expect(button).toHaveAttribute('data-face', 'waiting');
    expect(button).toHaveAttribute('data-hue', 'rec');
    rerender(<LampButton label="Looper" rec hue="lamp" />);
    expect(button).toHaveAttribute('data-face', 'off');
    expect(button).toHaveAttribute('data-hue', 'lamp');
    rerender(<LampButton label="Looper" waiting hue="lamp" />);
    expect(button).toHaveAttribute('data-face', 'waiting');
    rerender(<LampButton label="Metronome" hue="m" />);
    expect(button).toHaveAttribute('data-hue', 't');
  });

  it('renders the tip and applies the tip action', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { unmount } = render(<LampButton label="Accomp" code="ACMP" on tip="transport.acmp" tipAction={tipAction} />);
    const button = screen.getByRole('button', { name: 'Accomp ACMP' });
    expect(button).toHaveAttribute('data-tip', 'transport.acmp');
    expect(tipAction).toHaveBeenCalledWith(button, 'transport.acmp');
    unmount();
    expect(destroy).toHaveBeenCalled();
  });

  it('armed with on: the armed face, still pressed, and a press asks for off', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<LampButton label="Sync Start" on armed onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: 'Sync Start' });
    expect(button).toHaveAttribute('data-face', 'armed');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith(false);
    rerender(<LampButton label="Sync Start" on armed rec />);
    expect(button).toHaveAttribute('data-face', 'armed');
    expect(button).toHaveAttribute('data-hue', 'rec');
    rerender(<LampButton label="Sync Start" armed />);
    expect(button).toHaveAttribute('data-face', 'off');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    rerender(<LampButton label="Sync Start" on />);
    expect(button).toHaveAttribute('data-face', 'on');
  });

  it('joins, and width is a minimum so the label never clips', () => {
    render(<LampButton label="Off" size="sm" width={64} join="start" />);
    const button = screen.getByRole('button');
    expect(button.style.minWidth).toBe('64px');
    expect(button.style.width).toBe('');
    expect(button.className).toContain('yh-lampbutton--join-start');
    expect(button.className).toContain('yh-lampbutton--sm');
  });
});

describe('LampButton disabled', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is shown, focusable, and never toggles or long-presses', () => {
    const onToggle = vi.fn();
    const onLongPress = vi.fn();
    const onLongRelease = vi.fn();
    render(
      <LampButton
        label="Off"
        size="sm"
        width={64}
        disabled
        name="Manual Bass, works with Upper on"
        onToggle={onToggle}
        onLongPress={onLongPress}
        onLongRelease={onLongRelease}
      />,
    );
    const button = screen.getByRole('button', { name: 'Manual Bass, works with Upper on' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-face', 'disabled');
    expect(button).toHaveAttribute('data-contrast', 'dim');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.pointerDown(button, down);
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(window, down);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onLongRelease).not.toHaveBeenCalled();
  });
});

describe('LampButton long press', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const onToggle = vi.fn();
    const onLongPress = vi.fn();
    const onLongRelease = vi.fn();
    render(<LampButton label="Looper" onToggle={onToggle} onLongPress={onLongPress} onLongRelease={onLongRelease} />);
    return { button: screen.getByRole('button', { name: 'Looper' }), onToggle, onLongPress, onLongRelease };
  }

  it('fires after the hold time, releases on pointer up, and swallows the click', () => {
    const { button, onToggle, onLongPress, onLongRelease } = setup();
    fireEvent.pointerDown(button, down);
    act(() => vi.advanceTimersByTime(349));
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, down);
    expect(onLongRelease).toHaveBeenCalledTimes(1);
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('a short press toggles and never long-presses', () => {
    const { button, onToggle, onLongPress } = setup();
    fireEvent.pointerDown(button, down);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(window, down);
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(1000));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('a press that moves more than 4px is cancelled', () => {
    const { button, onLongPress } = setup();
    fireEvent.pointerDown(button, down);
    fireEvent.pointerMove(window, { ...down, clientX: 20 });
    act(() => vi.advanceTimersByTime(1000));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('a keypress after a long press is not swallowed', () => {
    const { button, onToggle } = setup();
    fireEvent.pointerDown(button, down);
    act(() => vi.advanceTimersByTime(400));
    fireEvent.pointerUp(window, down);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('right-click long-presses and releases at once when the button is already up, without the menu', () => {
    const { button, onToggle, onLongPress, onLongRelease } = setup();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, buttons: 0 });
    act(() => {
      button.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('a held right-click releases when the right button comes up', () => {
    const { button, onLongPress, onLongRelease } = setup();
    fireEvent.contextMenu(button, { buttons: 2 });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { button: 2 });
    expect(onLongRelease).toHaveBeenCalledTimes(1);
  });

  it('without onLongPress nothing fires and the click toggles', () => {
    const onToggle = vi.fn();
    render(<LampButton label="Sound" onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: 'Sound' });
    fireEvent.pointerDown(button, down);
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.pointerUp(window, down);
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('parseDuration', () => {
  it('reads ms and s, rejects anything else', () => {
    expect(parseDuration('350ms')).toBe(350);
    expect(parseDuration(' 0.5s ')).toBe(500);
    expect(parseDuration('fast')).toBeNull();
  });
});
