import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AccentBlock } from './AccentBlock';

// jsdom gives import.meta.url a non-file scheme and vitest skips CSS; tests run from the repo root.
const css = readFileSync(join(process.cwd(), 'src/library/yahaha/AccentBlock/AccentBlock.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('AccentBlock style hue', () => {
  it("draws the leading bar in the style's role hue, not the accent", () => {
    const rule = /\.yh-accentblock\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/border-left:[^;]*var\(--style\)/);
    expect(rule).not.toContain('--accent');
    expect(rule).toMatch(/border-left:\s*var\(--space-1\)\s+solid/);
  });

  it('sets the name as a label-role Text at body size', () => {
    render(<AccentBlock label="Sunday Drive Pop" as="button" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-role', 'label');
    expect(button).toHaveAttribute('data-text-size', 'body');
  });

  it('drops the chevron between step keys (chevron false), keeps it by default', () => {
    const { container, rerender } = render(<AccentBlock label="Sunday Drive Pop" as="button" />);
    expect(container.querySelector('.yh-accentblock__chevron')).not.toBeNull();
    rerender(<AccentBlock label="Sunday Drive Pop" as="button" chevron={false} />);
    expect(container.querySelector('.yh-accentblock__chevron')).toBeNull();
    expect(screen.getByRole('button')).toHaveTextContent('Sunday Drive Pop');
  });
});

describe('AccentBlock', () => {
  it('is a named button that presses on click, Enter and Space (Board)', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const tipAction = vi.fn();
    render(
      <AccentBlock
        label="Sunday Drive Pop"
        as="button"
        size="line"
        name="Sunday Drive Pop: open the Browser"
        empty="No style"
        tip="browser.open"
        tipAction={tipAction}
        onPress={onPress}
      />,
    );
    const button = screen.getByRole('button', { name: 'Sunday Drive Pop: open the Browser' });
    expect(button).toHaveAttribute('data-face', 'accent');
    expect(button).toHaveAttribute('data-size', 'line');
    expect(button).toHaveAttribute('data-tip', 'browser.open');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(tipAction).toHaveBeenCalledWith(button, 'browser.open');

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenLastCalledWith();
    button.focus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('keeps a long name whole in the text and the accessible name at a fixed width (LongName)', () => {
    const long = 'Bossa Nova Lounge Session With Strings And Brushes Deluxe 2';
    render(<AccentBlock label={long} as="button" width={240} name={`${long}: open the Browser`} />);
    const button = screen.getByRole('button', { name: `${long}: open the Browser` });
    expect(button.textContent).toBe(long);
    expect(button.style.width).toBe('240px');
  });

  it('shows the empty text for an empty or blank label (Empty)', () => {
    const { unmount } = render(<AccentBlock label="" as="button" empty="No style" />);
    expect(screen.getByRole('button', { name: 'No style' })).toHaveAttribute('data-face', 'accent');
    unmount();
    render(<AccentBlock label="   " as="button" empty="No style" />);
    expect(screen.getByRole('button').textContent).toBe('No style');
  });

  it('is a plain, unfocusable label as a span, ignoring the tooltip (KnobPage)', () => {
    const tipAction = vi.fn();
    const { container } = render(<AccentBlock label="Style" size="knob" tip="browser.open" tipAction={tipAction} />);
    expect(screen.queryByRole('button')).toBeNull();
    const block = screen.getByText('Style').closest('[data-size]');
    expect(block).toHaveAttribute('data-size', 'knob');
    expect(container.querySelector('[data-tip]')).toBeNull();
    expect(container.querySelector('[tabindex]')).toBeNull();
    expect(tipAction).not.toHaveBeenCalled();
  });

  it('destroys the tooltip action handle when the tip changes and on unmount', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { rerender, unmount } = render(<AccentBlock label="Pop" as="button" tip="browser.open" tipAction={tipAction} />);
    expect(destroy).not.toHaveBeenCalled();
    rerender(<AccentBlock label="Pop" as="button" tip="browser.close" tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(tipAction).toHaveBeenLastCalledWith(screen.getByRole('button'), 'browser.close');
    unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });
});
