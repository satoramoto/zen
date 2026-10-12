import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { Dismissal } from '../Popover/Popover';

/** How long a type-ahead keeps collecting before the next key starts a new word. */
export const TYPING_WINDOW = 700;

export interface UseSelectOptions {
  items: readonly string[];
  index: number;
  onChange(next: number): void;
  disabled?: boolean;
}

/**
 * The behaviour of a select-only combobox: open state, the highlighted row, commit-on-change, the
 * keyboard and type-ahead. Focus never leaves the trigger; the active row is named through
 * `aria-activedescendant`. Every key it handles is stopped as well as defaulted, so a surface
 * listening underneath (a canvas moving nodes on the arrows) never hears it; Tab closes but is
 * never swallowed, and Escape on a closed field goes on to the host.
 */
export function useSelect({ items, index, onChange, disabled = false }: UseSelectOptions) {
  const at = Math.max(0, Math.min(items.length - 1, index));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(at);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const highlighted = useRef<HTMLDivElement | null>(null);
  const typed = useRef({ text: '', at: 0 });
  const id = useId();
  const menuId = `${id}-menu`;
  const optionId = (which: number) => `${id}-option-${which}`;

  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }, []);

  const commit = useCallback(
    (next: number) => {
      close();
      // Only on a change, which is what the native element promised a host.
      if (next !== at && next >= 0 && next < items.length) onChange(next);
    },
    [at, close, items.length, onChange],
  );

  // On the open as well as the move: a menu whose chosen member is fortieth arrives scrolled to it.
  useLayoutEffect(() => {
    highlighted.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  // Only escape has somewhere obvious to put focus back.
  const dismiss = useCallback((how: Dismissal) => close(how === 'escape'), [close]);

  const show = () => {
    setActive(at);
    setOpen(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || items.length === 0) return;
    const last = items.length - 1;
    const from = open ? active : at;
    const stop = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    // Closed, a key that moves picks straight away; open, it moves the highlight.
    const go = (to: number) => {
      stop();
      const next = Math.max(0, Math.min(last, to));
      if (open) setActive(next);
      else commit(next);
    };

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        return go(from + 1);
      case 'ArrowUp':
      case 'ArrowLeft':
        return go(from - 1);
      case 'Home':
        return go(0);
      case 'End':
        return go(last);
      case 'Enter':
      case ' ':
        stop();
        if (open) commit(active);
        else show();
        return;
      case 'Tab':
        if (open) setOpen(false);
        return;
      default:
        break;
    }

    if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
    const now = Date.now();
    const text = (now - typed.current.at > TYPING_WINDOW ? '' : typed.current.text) + e.key.toLowerCase();
    typed.current = { text, at: now };
    // One letter repeated walks the members starting with it; anything else searches for the word.
    const repeat = text.length > 1 && [...text].every((letter) => letter === text[0]);
    const needle = repeat ? (text[0] ?? '') : text;
    const start = needle.length === 1 ? from + 1 : 0;
    const order = items.map((_, i) => (start + i) % items.length);
    const found = order.find((i) => items[i]?.toLowerCase().startsWith(needle));
    if (found === undefined) return;
    stop();
    if (open) setActive(found);
    else commit(found);
  };

  const onClick = () => {
    if (disabled) return;
    if (open) close();
    else show();
  };

  // Focus stays on the trigger, and a canvas underneath doesn't take a press for a drag.
  const onOptionDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerProps = {
    ref: trigger,
    type: 'button' as const,
    role: 'combobox',
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': open,
    'aria-controls': menuId,
    'aria-activedescendant': open ? optionId(active) : undefined,
    disabled,
    onClick,
    onKeyDown,
  };

  const optionProps = (which: number) => ({
    ref: which === active ? highlighted : undefined,
    id: optionId(which),
    role: 'option',
    'aria-selected': which === at,
    ...(which === active ? { 'data-active': '' } : {}),
    ...(which === at ? { 'data-chosen': '' } : {}),
    onPointerDown: onOptionDown,
    onPointerEnter: () => setActive(which),
    onClick: () => commit(which),
  });

  return { at, open, active, setActive, trigger, menuId, optionId, close, commit, dismiss, triggerProps, optionProps };
}
