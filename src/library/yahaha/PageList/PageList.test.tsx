import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageList } from './PageList';
import { settingsPages } from './PageList.fixtures';

describe('PageList', () => {
  it('lists the pages as navigation, marks the open one, and a click only calls through', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<PageList pages={settingsPages} chosen="chord" label="Settings pages" onChoose={onChoose} />);
    expect(screen.getByRole('navigation', { name: 'Settings pages' })).toBeInTheDocument();
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(6);
    const chord = screen.getByRole('button', { name: /Chord & Split/ });
    expect(chord).toHaveAttribute('aria-current', 'page');
    expect(chord).toHaveTextContent(/^Chord & Split$/);
    expect(chord).toHaveAttribute('data-tip', 'settings.tab.chord');
    for (const row of rows.filter((r) => r !== chord)) expect(row).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: /System/ })).toHaveTextContent(/^System$/);

    await user.click(screen.getByRole('button', { name: /Pedals/ }));
    expect(onChoose).toHaveBeenLastCalledWith('pedals');
    expect(chord).toHaveAttribute('aria-current', 'page');
  });

  it('moves with ↑ ↓ Home End, wrapping, and calls onChoose for each move', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<PageList pages={settingsPages} chosen="chord" label="Settings pages" onChoose={onChoose} />);
    const row = (name: RegExp) => screen.getByRole('button', { name });
    row(/Chord & Split/).focus();
    await user.keyboard('{ArrowDown}');
    expect(onChoose).toHaveBeenLastCalledWith('style');
    expect(row(/^Style/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(onChoose).toHaveBeenLastCalledWith('launchkey');
    expect(row(/Controller/)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(onChoose).toHaveBeenLastCalledWith('chord');
    await user.keyboard('{ArrowUp}');
    expect(onChoose).toHaveBeenLastCalledWith('launchkey');
    await user.keyboard('{Home}');
    expect(onChoose).toHaveBeenLastCalledWith('chord');
    expect(row(/Chord & Split/)).toHaveFocus();
    expect(onChoose).toHaveBeenCalledTimes(5);
  });

  it('marks only the chosen page current', () => {
    render(<PageList pages={settingsPages} chosen="system" label="Settings pages" />);
    expect(screen.getByRole('button', { name: /System/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Chord & Split/ })).not.toHaveAttribute('aria-current');
  });

  it('defaults its name to "Pages" and marks nothing when no page is open', () => {
    render(<PageList pages={settingsPages} />);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    for (const row of screen.getAllByRole('button')) expect(row).not.toHaveAttribute('aria-current');
  });
});
