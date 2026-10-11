import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccentBlock } from './AccentBlock';

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

  it('runs the tooltip hook cleanup on unmount', () => {
    const cleanup = vi.fn();
    const { unmount } = render(<AccentBlock label="Pop" as="button" tip="browser.open" tipAction={() => cleanup} />);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
