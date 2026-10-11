import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchField, type SearchFieldProps } from './SearchField';

/** A parent that moves `value`, as the app does. */
function Parent(props: SearchFieldProps) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <SearchField
      {...props}
      value={value}
      onInput={(next) => {
        setValue(next);
        props.onInput?.(next);
      }}
    />
  );
}

describe('SearchField', () => {
  it('is a named searchbox; typing calls onInput and other keys reach onKeyDown', async () => {
    const onInput = vi.fn();
    const onKeyDown = vi.fn();
    render(<Parent label="Search styles" placeholder="Search" tip="library.search" onInput={onInput} onKeyDown={onKeyDown} />);
    const input = screen.getByRole('searchbox', { name: 'Search styles' });
    expect(input).toHaveAttribute('placeholder', 'Search');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('data-tip', 'library.search');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(input, 'pop');
    expect(onInput).toHaveBeenLastCalledWith('pop');
    await userEvent.keyboard('{ArrowDown}');
    expect(onKeyDown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'ArrowDown' }));
  });

  it('clears a filled field on Esc without reaching the page', async () => {
    const onInput = vi.fn();
    const onKeyDown = vi.fn();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      render(<SearchField value="coastal" label="Search styles" onInput={onInput} onKeyDown={onKeyDown} />);
      const input = screen.getByRole('searchbox', { name: 'Search styles' });
      expect(input).toHaveValue('coastal');
      act(() => input.focus());
      await userEvent.keyboard('{Escape}');
      expect(onInput).toHaveBeenLastCalledWith('');
      expect(onKeyDown).not.toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('lets Esc on an empty field bubble to the page', async () => {
    const onInput = vi.fn();
    const onKeyDown = vi.fn();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      render(<SearchField label="Search sounds" placeholder="Search sounds" onInput={onInput} onKeyDown={onKeyDown} />);
      act(() => screen.getByRole('searchbox', { name: 'Search sounds' }).focus());
      await userEvent.keyboard('{Escape}');
      expect(onInput).not.toHaveBeenCalled();
      expect(onKeyDown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'Escape' }));
      expect(spy).toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('clears from the clear button, which stays out of the tab order', async () => {
    const onInput = vi.fn();
    render(<Parent value="coastal" label="Search styles" onInput={onInput} />);
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear).toHaveAttribute('tabindex', '-1');
    await userEvent.click(clear);
    expect(onInput).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('searchbox', { name: 'Search styles' })).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: 'Search styles' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
