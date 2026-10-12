import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, type ButtonProps } from './Button';
import { LONG_PRESS_MS } from './useLongPress';

const INIT = { pointerId: 1, button: 0, clientX: 0, clientY: 0 };
const pointer = (pointerId: number, x = 0) => ({ pointerId, button: 0, clientX: x, clientY: 0 });

function setup(props: ButtonProps = {}) {
  const handlers = { onPress: vi.fn(), onHold: vi.fn(), onLongPress: vi.fn(), onLongRelease: vi.fn() };
  const all = { ...handlers, ...props };
  const view = render(<Button {...all} />);
  return { ...view, ...handlers, props: all, button: screen.getByRole('button') };
}

describe('Button faces and a11y', () => {
  it('the Board caret: popup, expanded, tip and tooltip action', async () => {
    const tipAction = vi.fn();
    const { button, onPress } = setup({
      symbol: 'caret',
      size: 'caret',
      join: 'end',
      popup: 'dialog',
      expanded: false,
      controls: 'metronome-pop',
      name: 'Metronome settings',
      tip: 'metronome.settings',
      tipAction,
    });
    expect(screen.getByRole('button', { name: 'Metronome settings' })).toBe(button);
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'metronome-pop');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).toHaveAttribute('data-face', 'off');
    expect(button).toHaveAttribute('data-tip', 'metronome.settings');
    expect(button).toHaveAttribute('data-join', 'end');
    expect(tipAction).toHaveBeenCalledWith(button, 'metronome.settings');
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expanded with a popup draws the on face', () => {
    const { button } = setup({ symbol: 'caret', size: 'caret', popup: 'dialog', expanded: true });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('data-face', 'on');
  });

  it('no popup: no aria-expanded, and expanded alone changes nothing', () => {
    const { button } = setup({ label: 'Panic', expanded: true });
    expect(button).not.toHaveAttribute('aria-expanded');
    expect(button).toHaveAttribute('data-face', 'off');
  });

  it('faces follow precedence: chosen, then on, then waiting, then off', () => {
    const { button, rerender, props } = setup({ label: '2', size: 'icon', on: true, waiting: true, chosen: true });
    expect(button).toHaveAttribute('data-face', 'chosen');
    rerender(<Button {...props} chosen={false} />);
    expect(button).toHaveAttribute('data-face', 'on');
    rerender(<Button {...props} chosen={false} on={false} />);
    expect(button).toHaveAttribute('data-face', 'waiting');
    rerender(<Button {...props} chosen={false} on={false} waiting={false} />);
    expect(button).toHaveAttribute('data-face', 'off');
  });

  it('lit drives the waiting flash: false marks the off phase, true or other faces carry no mark', () => {
    const { button, rerender, props } = setup({ label: 'Fade', size: 'pair', waiting: true, lit: false });
    expect(button).toHaveAttribute('data-face', 'waiting');
    expect(button).toHaveAttribute('data-lit', 'false');
    rerender(<Button {...props} lit />);
    expect(button).not.toHaveAttribute('data-lit');
    rerender(<Button {...props} lit={undefined} />);
    expect(button).not.toHaveAttribute('data-lit');
    rerender(<Button {...props} on />);
    expect(button).toHaveAttribute('data-face', 'on');
    expect(button).not.toHaveAttribute('data-lit');
    rerender(<Button {...props} disabled />);
    expect(button).not.toHaveAttribute('data-lit');
  });

  it('tall marks the primary key with any size; default is not tall', () => {
    const { button, rerender, props } = setup({ label: 'Start', size: 'band', variant: 'primary', tall: true });
    expect(button).toHaveAttribute('data-tall', '');
    expect(button).toHaveAttribute('data-size', 'band');
    rerender(<Button {...props} tall={undefined} />);
    expect(button).not.toHaveAttribute('data-tall');
  });

  it('pressed sets aria-pressed only when given, and never the look', () => {
    const { button, rerender, props } = setup({ label: '?', size: 'icon', pressed: true, name: 'Help mode' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-face', 'off');
    rerender(<Button {...props} pressed={false} />);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    rerender(<Button {...props} pressed={undefined} />);
    expect(button).not.toHaveAttribute('aria-pressed');
  });

  it('running (band + bar): the on face in ok, marked data-bar', () => {
    const { button, rerender, props } = setup({ label: 'Start / Stop', size: 'band', bar: true, pressed: true, name: 'Start / Stop, running' });
    expect(button).toHaveAttribute('data-bar');
    expect(button).toHaveAttribute('data-face', 'on');
    expect(button).toHaveAttribute('data-hue', 'ok');
    rerender(<Button {...props} bar={false} pressed={false} name="Start / Stop" />);
    expect(button).not.toHaveAttribute('data-bar');
    expect(button).toHaveAttribute('data-face', 'off');
    expect(button).toHaveAttribute('data-hue', 't');
    rerender(<Button {...props} size="md" />);
    expect(button).not.toHaveAttribute('data-bar');
    expect(button).toHaveAttribute('data-face', 'off');
  });

  it('running but chosen keeps its own hue', () => {
    const { button } = setup({ label: 'Go', size: 'band', bar: true, chosen: true, hue: 'r2' });
    expect(button).toHaveAttribute('data-face', 'chosen');
    expect(button).toHaveAttribute('data-hue', 'r2');
  });

  it('transport is its own tone; running Start / Stop still draws ok', () => {
    const { button, rerender, props } = setup({ label: 'Sync Start', hue: 'transport' });
    expect(button).toHaveAttribute('data-hue', 'transport');
    rerender(<Button {...props} label="Start / Stop" size="band" bar />);
    expect(button).toHaveAttribute('data-hue', 'ok');
  });

  it('each solid tone takes its own ink, and a primary transport key fills in --transport', () => {
    const css = readFileSync(join(process.cwd(), 'src/library/yahaha/Button/Button.css'), 'utf8');
    const decls = (hue: string) =>
      [...css.matchAll(new RegExp(`\\.yh-button\\[data-hue='${hue}'\\]\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join(';');
    expect(decls('ok')).toContain('--yh-button-ink: var(--success-text)');
    expect(decls('rec')).toContain('--yh-button-ink: var(--danger-text)');
    expect(decls('transport')).toContain('--yh-button-tone: var(--transport)');
    expect(decls('transport')).toContain('--yh-button-ink: var(--transport-text)');
    expect(decls('transport')).toContain('--yh-button-cta: var(--transport)');
    // The per-tone ink must come after the shared coloured-tone rule, which sets --on-hue.
    expect(css.indexOf("[data-hue='ok'] { --yh-button-ink")).toBeGreaterThan(css.indexOf(".yh-button:not([data-hue='t'])"));
  });

  it('deprecated t2 and m, and lamp, draw as the neutral t', () => {
    for (const hue of ['t2', 'm', 'lamp'] as const) {
      const { button, unmount } = setup({ label: 'X', hue });
      expect(button).toHaveAttribute('data-hue', 't');
      unmount();
    }
    const { button } = setup({ label: 'Fill', hue: 'fill' });
    expect(button).toHaveAttribute('data-hue', 'fill');
  });

  it('variant ranks the rest face (default secondary)', () => {
    const { button, rerender, props } = setup({ label: 'Start' });
    expect(button).toHaveAttribute('data-variant', 'secondary');
    rerender(<Button {...props} variant="primary" />);
    expect(button).toHaveAttribute('data-variant', 'primary');
  });

  it('accessible name: name, else the label and the symbol word; the glyph is hidden', () => {
    const { button, unmount } = setup({ label: 'Fill', symbol: 'up', size: 'pair' });
    expect(button).toHaveAccessibleName('Fill up');
    const glyph = button.querySelector('[data-glyph="up"]');
    expect(glyph).toHaveTextContent('▲');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    unmount();
    setup({ symbol: 'caret', size: 'caret' });
    expect(screen.getByRole('button')).toHaveAccessibleName('options');
    expect(screen.getByRole('button')).toHaveAttribute('data-alone');
  });

  it('every glyph draws its character', () => {
    const chars = { prev: '◀', next: '▶', up: '▲', down: '▼', plus: '+', minus: '−', caret: '▾' } as const;
    for (const [symbol, char] of Object.entries(chars)) {
      const { button, unmount } = setup({ symbol: symbol as keyof typeof chars });
      expect(button).toHaveTextContent(char);
      unmount();
    }
  });

  it('is a type=button so it never submits a form', () => {
    expect(setup({ label: 'Stop' }).button).toHaveAttribute('type', 'button');
  });
});

describe('Button press', () => {
  it('presses on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const { button, onPress } = setup({ label: 'Panic' });
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('is reachable by Tab', async () => {
    const user = userEvent.setup();
    const { button } = setup({ label: 'Panic' });
    await user.tab();
    expect(button).toHaveFocus();
  });

  it('disabled: focusable, aria-disabled and dim, but no press, hold or long press', async () => {
    vi.useFakeTimers();
    try {
      const { button, onPress, onHold, onLongPress } = setup({
        label: 'Audition',
        compact: true,
        disabled: true,
        hold: false,
        name: 'Audition (stop the band first)',
      });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('data-face', 'disabled');
      expect(button).toHaveAttribute('data-contrast', 'dim');
      button.focus();
      expect(button).toHaveFocus();
      fireEvent.click(button);
      fireEvent.click(button, { detail: 0 });
      expect(onPress).not.toHaveBeenCalled();
      fireEvent.pointerDown(button, INIT);
      act(() => vi.advanceTimersByTime(LONG_PRESS_MS * 2));
      fireEvent.pointerUp(window, INIT);
      fireEvent.contextMenu(button);
      expect(onLongPress).not.toHaveBeenCalled();
      expect(onHold).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a disabled hued button keeps its hue', () => {
    const { button } = setup({ label: 'Fill', symbol: 'up', size: 'pair', hue: 'fill', disabled: true, on: true });
    expect(button).toHaveAttribute('data-face', 'disabled');
    expect(button).toHaveAttribute('data-hue', 'fill');
  });
});

describe('Button hold', () => {
  function held(extra: ButtonProps = {}) {
    const view = setup({ label: 'Tempo', symbol: 'plus', size: 'band', hold: true, ...extra });
    fireEvent.pointerDown(view.button, INIT);
    expect(view.onHold).toHaveBeenLastCalledWith(true);
    return view;
  }

  it('follows only the pointer that started the hold', () => {
    const { button, onHold } = held();
    expect(onHold).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(button, pointer(2));
    fireEvent.pointerUp(button, pointer(2));
    expect(onHold).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(button, INIT);
    expect(onHold).toHaveBeenCalledTimes(2);
    expect(onHold).toHaveBeenLastCalledWith(false);
    fireEvent.pointerUp(button, INIT);
    expect(onHold).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(button, pointer(3));
    fireEvent.pointerCancel(button, pointer(3));
    expect(onHold).toHaveBeenCalledTimes(4);
    expect(onHold).toHaveBeenLastCalledWith(false);
  });

  it('ignores a non-primary button', () => {
    const { button, onHold } = setup({ label: 'Tempo', hold: true });
    fireEvent.pointerDown(button, { ...INIT, button: 2 });
    expect(onHold).not.toHaveBeenCalled();
  });

  it('a pointer click does not press; a keyboard click does', async () => {
    const { button, onPress } = held();
    fireEvent.pointerUp(button, INIT);
    fireEvent.click(button, { detail: 1 });
    expect(onPress).not.toHaveBeenCalled();
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('never long-presses', () => {
    vi.useFakeTimers();
    try {
      const { button, onLongPress, onLongRelease } = held();
      act(() => vi.advanceTimersByTime(LONG_PRESS_MS * 2));
      fireEvent.pointerUp(button, INIT);
      expect(onLongPress).not.toHaveBeenCalled();
      expect(onLongRelease).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('1: ends when disabled turns true', () => {
    const { button, onHold, props, rerender } = held();
    rerender(<Button {...props} disabled />);
    expect(onHold).toHaveBeenCalledTimes(2);
    expect(onHold).toHaveBeenLastCalledWith(false);
    fireEvent.pointerUp(button, INIT);
    expect(onHold).toHaveBeenCalledTimes(2);
  });

  it('2: ends when hold turns false', () => {
    const { button, onHold, props, rerender } = held();
    rerender(<Button {...props} hold={false} />);
    expect(onHold).toHaveBeenCalledTimes(2);
    expect(onHold).toHaveBeenLastCalledWith(false);
    fireEvent.pointerUp(button, INIT);
    expect(onHold).toHaveBeenCalledTimes(2);
  });

  it('3: ends on lostpointercapture', () => {
    const { button, onHold } = held();
    fireEvent.lostPointerCapture(button, { pointerId: 1 });
    expect(onHold).toHaveBeenCalledTimes(2);
    expect(onHold).toHaveBeenLastCalledWith(false);
    fireEvent.pointerUp(button, INIT);
    expect(onHold).toHaveBeenCalledTimes(2);
  });

  it('4: ends on unmount', () => {
    const { onHold, unmount } = held();
    unmount();
    expect(onHold).toHaveBeenCalledTimes(2);
    expect(onHold).toHaveBeenLastCalledWith(false);
  });
});

describe('Button long press', () => {
  afterEach(() => vi.useRealTimers());

  it('fires while held, releases on pointer up, and swallows the click that ends it', () => {
    vi.useFakeTimers();
    const { button, onPress, onLongPress, onLongRelease } = setup({ label: 'Stop', size: 'band' });
    fireEvent.pointerDown(button, INIT);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS - 1));
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, INIT);
    expect(onLongRelease).toHaveBeenCalledTimes(1);
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a short press is a plain press', () => {
    vi.useFakeTimers();
    const { button, onPress, onLongPress } = setup({ label: 'Stop' });
    fireEvent.pointerDown(button, INIT);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(window, INIT);
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('moving away cancels it', () => {
    vi.useFakeTimers();
    const { button, onLongPress } = setup({ label: 'Stop' });
    fireEvent.pointerDown(button, INIT);
    fireEvent.pointerMove(window, pointer(1, 10));
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS * 2));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('a right-click long-presses and releases at once when the button is already up', () => {
    const { button, onLongPress, onLongRelease } = setup({ label: 'Stop' });
    const event = fireEvent.contextMenu(button);
    expect(event).toBe(false); // default prevented: no browser menu
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).toHaveBeenCalledTimes(1);
  });

  it('a held right-click releases when the right button comes up', () => {
    const { button, onLongPress, onLongRelease } = setup({ label: 'Stop' });
    fireEvent.contextMenu(button, { buttons: 2 });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongRelease).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { pointerId: 1, button: 2 });
    expect(onLongRelease).toHaveBeenCalledTimes(1);
  });

  it('turned off mid-press cancels a press that has not fired', () => {
    vi.useFakeTimers();
    const { button, onLongPress, props, rerender } = setup({ label: 'Stop' });
    fireEvent.pointerDown(button, INIT);
    rerender(<Button {...props} disabled />);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS * 2));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('a fired press still releases on unmount', () => {
    vi.useFakeTimers();
    const { button, onLongRelease, unmount } = setup({ label: 'Stop' });
    fireEvent.pointerDown(button, INIT);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    unmount();
    expect(onLongRelease).toHaveBeenCalledTimes(1);
  });

  it('without onLongPress there is no long press and the click still presses', () => {
    vi.useFakeTimers();
    const onPress = vi.fn();
    render(<Button label="Stop" onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, INIT);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS * 2));
    fireEvent.pointerUp(window, INIT);
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
