import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OneTouchPicker } from './OneTouchPicker';

describe('OneTouchPicker', () => {
  it('names the group after the applied setting and marks it pressed', () => {
    render(<OneTouchPicker applied={2} />);
    const group = screen.getByRole('group', { name: /One Touch Setting \(OTS\): 2 applied/ });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'chosen', 'off', 'off']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);
    expect(screen.getByRole('button', { name: 'One Touch 2, applied (Shift + pad 10)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply One Touch 4 (Shift + pad 12)' })).toHaveAttribute('data-tip', 'ots.4');
  });

  it('says none applied when nothing is, and takes a given name', () => {
    const { unmount } = render(<OneTouchPicker />);
    expect(screen.getByRole('group', { name: /none applied/ })).toBeInTheDocument();
    unmount();
    render(<OneTouchPicker name="OTS" />);
    expect(screen.getByRole('group', { name: 'OTS' })).toBeInTheDocument();
  });

  it('applies by press and by keyboard without changing itself', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<OneTouchPicker applied={1} onApply={onApply} />);
    await user.click(screen.getByRole('button', { name: /Apply One Touch 3/ }));
    expect(onApply).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('button', { name: /Apply One Touch 3/ })).toHaveAttribute('aria-pressed', 'false');
    (document.activeElement as HTMLElement).blur();
    await user.tab();
    expect(screen.getByRole('button', { name: /One Touch 1, applied/ })).toHaveFocus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onApply).toHaveBeenLastCalledWith(2);
    await user.keyboard(' ');
    expect(onApply).toHaveBeenCalledTimes(3);
  });

  it('disables numbers past the style count', async () => {
    const onApply = vi.fn();
    render(<OneTouchPicker applied={1} count={2} onApply={onApply} />);
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons.map((b) => b.disabled)).toEqual([false, false, true, true]);
    await userEvent.click(buttons[3]);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('draws as many numbers as asked', () => {
    render(<OneTouchPicker numbers={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('lays out vertically', () => {
    const { container } = render(<OneTouchPicker orientation="vertical" />);
    expect(container.querySelector('.yh-onetouchpicker')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('runs the tip action on each number with its own key, destroying on unmount and when a number goes', () => {
    const destroy = vi.fn();
    const tipAction = vi.fn(() => ({ destroy }));
    const { container, rerender, unmount } = render(<OneTouchPicker tipAction={tipAction} />);
    const numbers = [...container.querySelectorAll('.yh-onetouchpicker .yh-onetouchpicker__number')];
    expect(tipAction).toHaveBeenCalledTimes(4);
    numbers.forEach((b, i) => expect(tipAction).toHaveBeenCalledWith(b, `ots.${i + 1}`));
    rerender(<OneTouchPicker numbers={3} tipAction={tipAction} />);
    expect(destroy).toHaveBeenCalledTimes(1);
    unmount();
    expect(destroy).toHaveBeenCalledTimes(4);
  });

  it('renders cells with no wrapper for the parent grid', () => {
    const { container } = render(
      <div role="group" aria-label="One Touch Setting (OTS)">
        <OneTouchPicker applied={2} count={3} cells hue="a" />
      </div>,
    );
    const group = screen.getByRole('group', { name: 'One Touch Setting (OTS)' });
    expect(group.children).toHaveLength(5);
    expect(group.children[0]).toHaveTextContent('One Touch');
    expect(group.children[0]).not.toHaveAttribute('aria-hidden');
    const numbers = within(group).getAllByRole('button');
    expect(numbers.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'on', 'off', 'disabled']);
    expect(numbers.every((b) => b.getAttribute('data-ink') === 'a')).toBe(true);
    expect(container.querySelector('.yh-onetouchpicker')).toBeNull();
  });
});
