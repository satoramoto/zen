import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusLine } from './StatusLine';

const ERROR = "Can't delete Sunday drive: it's the loaded rack.";
const NOTICE = 'Added SlowWalker.T552 to the library and loaded it.';

describe('StatusLine', () => {
  it('is an empty polite status region with no message', () => {
    render(<StatusLine text={null} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status.textContent).toBe('');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('names an error button "Error: …" and marks it; a notice has no mark', () => {
    const { rerender } = render(<StatusLine text={ERROR} error seq={4} />);
    const button = screen.getByRole('button', { name: `Error: ${ERROR}` });
    expect(button).toHaveAttribute('data-tip', 'display.status');
    expect(document.querySelector('svg[data-hue="warn"]')).toBeInTheDocument();
    rerender(<StatusLine text={NOTICE} seq={5} />);
    expect(screen.getByRole('button', { name: NOTICE })).toBeInTheDocument();
    expect(document.querySelector('[data-hue="warn"]')).toBeNull();
  });

  it('calls onClear on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<StatusLine text="One Touch 3 applied · Recovered: Sunday drive" seq={6} onClear={onClear} />);
    const button = screen.getByRole('button', { name: 'One Touch 3 applied · Recovered: Sunday drive' });
    await user.click(button);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenLastCalledWith();
    button.focus();
    await user.keyboard('{Enter}');
    expect(onClear).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(onClear).toHaveBeenCalledTimes(3);
  });

  it('keeps the focused button across new messages and clears to an empty line', () => {
    const { rerender } = render(<StatusLine text={ERROR} error seq={4} />);
    const button = screen.getByRole('button', { name: `Error: ${ERROR}` });
    button.focus();

    rerender(<StatusLine text={ERROR} error seq={5} />);
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole('button', { name: `Error: ${ERROR}` })).toBe(button);

    rerender(<StatusLine text={NOTICE} error={false} seq={6} />);
    expect(document.activeElement).toBe(button);
    expect(screen.getByRole('button', { name: NOTICE })).toBe(button);
    expect(document.querySelector('[data-hue="warn"]')).toBeNull();

    rerender(<StatusLine text={null} seq={6} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('re-creates the contents on a new seq', () => {
    const { rerender } = render(<StatusLine text={ERROR} error seq={4} />);
    const before = document.querySelector('.yh-status-line-text');
    rerender(<StatusLine text={ERROR} error seq={5} />);
    expect(document.querySelector('.yh-status-line-text')).not.toBe(before);
  });

  it('a hint replaces the drawn message and gives it back when it goes', () => {
    const { rerender } = render(<StatusLine text={ERROR} error seq={4} />);
    const button = screen.getByRole('button', { name: `Error: ${ERROR}` });
    expect(button).not.toHaveClass('yh-status-line-under');

    rerender(<StatusLine text={ERROR} error seq={4} hint={{ title: 'Accomp', body: 'Turns the accompaniment on or off.', keys: 'A' }} />);
    const hint = document.querySelector('.yh-status-line-hint')!;
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(hint.textContent).toContain('Accomp');
    expect(hint.textContent).toContain('Key A');
    expect(hint.textContent).not.toContain('Launchkey');
    expect(screen.getByRole('button', { name: `Error: ${ERROR}` })).toBe(button);
    expect(button).toHaveClass('yh-status-line-under');

    rerender(<StatusLine text={ERROR} error seq={4} hint={null} />);
    expect(document.querySelector('.yh-status-line-hint')).toBeNull();
    expect(button).not.toHaveClass('yh-status-line-under');
  });

  it('shows the key and Launchkey place of a hint with no button', () => {
    render(<StatusLine hint={{ title: 'Sync Start', body: 'Arms the band.', keys: 'Y', launchkey: 'Shift + Play' }} />);
    const hint = document.querySelector('.yh-status-line-hint')!;
    expect(hint.textContent).toContain('Key Y');
    expect(hint.textContent).toContain('Launchkey: Shift + Play');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('drops data-tip when tip is null', () => {
    render(<StatusLine text={NOTICE} tip={null} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-tip');
  });

  it('sets an inline width only when given', () => {
    const { unmount } = render(<StatusLine text={NOTICE} />);
    expect(screen.getByRole('status').style.width).toBe('');
    unmount();
    render(<StatusLine text={NOTICE} width={600} />);
    expect(screen.getByRole('status').style.width).toBe('600px');
  });
});
