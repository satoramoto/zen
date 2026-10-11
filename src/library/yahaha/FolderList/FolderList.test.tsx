import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderList } from './FolderList';
import { soundCategories, styleFolders } from './FolderList.fixtures';

describe('FolderList', () => {
  it('marks the chosen row, holds one tab stop and calls through on a click', async () => {
    const onChoose = vi.fn();
    render(<FolderList items={styleFolders} chosen="pop" label="Style folders" onChoose={onChoose} />);
    const nav = screen.getByRole('navigation', { name: 'Style folders' });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons).toHaveLength(styleFolders.length);
    const pop = screen.getByRole('button', { name: 'Pop & Rock 86' });
    expect(pop).toHaveAttribute('aria-current', 'true');
    expect(pop).toHaveAttribute('tabindex', '0');
    expect(pop).toHaveAttribute('data-tip', 'library.folder');
    for (const button of buttons.filter((b) => b !== pop)) {
      expect(button).not.toHaveAttribute('aria-current');
      expect(button).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.getByRole('button', { name: /Imported/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Latin 52' }));
    expect(onChoose).toHaveBeenLastCalledWith('latin');
    // Controlled: the click alone does not move the chosen row.
    expect(pop).toHaveAttribute('aria-current', 'true');
  });

  it('moves and chooses with ↑ ↓ Home End, stopping at the ends and skipping disabled rows', async () => {
    const onChoose = vi.fn();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      render(<FolderList items={styleFolders} chosen="pop" label="Style folders" onChoose={onChoose} />);
      const button = (name: RegExp) => screen.getByRole('button', { name });
      act(() => button(/^Pop & Rock/).focus());
      await userEvent.keyboard('{ArrowDown}');
      expect(onChoose).toHaveBeenLastCalledWith('ballad');
      expect(button(/^Ballad/)).toHaveFocus();
      expect(button(/^Ballad/)).toHaveAttribute('tabindex', '0');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(onChoose).toHaveBeenLastCalledWith('favourites');
      await userEvent.keyboard('{Home}');
      expect(onChoose).toHaveBeenLastCalledWith('all');
      await userEvent.keyboard('{ArrowUp}');
      expect(button(/^All styles/)).toHaveFocus();
      await userEvent.keyboard('{End}');
      expect(onChoose).toHaveBeenLastCalledWith('user');
      await userEvent.keyboard('{ArrowDown}');
      expect(onChoose).toHaveBeenCalledTimes(5);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('returns the tab stop to the chosen row when focus leaves', async () => {
    render(
      <>
        <FolderList items={styleFolders} chosen="pop" label="Style folders" />
        <button type="button">After</button>
      </>,
    );
    act(() => screen.getByRole('button', { name: /^Pop & Rock/ }).focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /^Ballad/ })).toHaveAttribute('tabindex', '0');
    act(() => screen.getByRole('button', { name: 'After' }).focus());
    expect(screen.getByRole('button', { name: /^Pop & Rock/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: /^Ballad/ })).toHaveAttribute('tabindex', '-1');
  });

  it('gives the first row the tab stop when none is chosen', () => {
    const { container } = render(<FolderList items={soundCategories} chosen={null} label="Sound categories" />);
    expect(screen.getByRole('button', { name: 'Piano 24' })).toHaveAttribute('tabindex', '0');
    expect(container.querySelector('[aria-current]')).toBeNull();
  });

  it('keeps a long name whole for assistive tech while splitting off its last word', () => {
    render(<FolderList items={styleFolders} chosen="pop" label="Style folders" />);
    const user = screen.getByRole('button', { name: 'User styles on the external drive with a long name 11' });
    expect(user.querySelector('.yh-folder-list__tail')).toHaveTextContent('name');
  });
});
