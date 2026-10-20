/**
 * Select's behaviour, framework-free: two stores, registered in `src/library/view/stores.ts`.
 *
 * `select` (on the trigger): Click, Enter or Space opens; closed, the arrows, Home, End and
 * type-ahead pick straight away; open, they move the highlight and Enter takes it. A letter
 * repeated walks the members starting with it; a word searches. Every key it handles is stopped
 * as well as defaulted, so a surface underneath never hears it; Tab closes but is never
 * swallowed, and Escape on a closed field goes on to the host.
 *
 * `selectMenu` (on the open menu's top-layer box): shows it as a popover and places it under the
 * trigger, or over it when that's where the room is, clamped inside the window, re-placed on
 * resize and scroll; scrolls the highlighted row into view; a pointer on a row highlights it and a
 * click takes it (the press is defaulted, so focus never leaves the trigger). A pointer or a wheel
 * elsewhere closes it; Escape closes it and puts focus back on the trigger.
 *
 * Both report through `onState` (open, highlighted row: the binding's view state) and `onChange`,
 * which fires only on a change.
 */
import { TYPING_WINDOW, type SelectState } from './Select.model';

export interface SelectParams {
  items: readonly string[];
  /** The held member, clamped. */
  index: number;
  open: boolean;
  /** The highlighted row while open. */
  active: number;
  disabled?: boolean;
  onState?: (state: SelectState) => void;
  onChange?: (next: number) => void;
}

export type SelectMenuParams = Pick<SelectParams, 'items' | 'index' | 'active' | 'onState' | 'onChange'>;

/** Closes, puts focus back on `trigger` if asked, then asks for `next` if it is a change. */
function commit(params: SelectMenuParams, trigger: HTMLElement | null | undefined, next: number) {
  params.onState?.({ open: false, active: params.active });
  trigger?.focus();
  if (next !== params.index && next >= 0 && next < params.items.length) params.onChange?.(next);
}

/** The trigger's keys, type-ahead and click. */
export function bindSelect(node: HTMLElement, initial: SelectParams) {
  let params = initial;
  let typed = { text: '', at: 0 };

  const close = (restore: boolean) => {
    params.onState?.({ open: false, active: params.active });
    if (restore) node.focus();
  };
  const show = () => params.onState?.({ open: true, active: params.index });

  const onKeyDown = (e: KeyboardEvent) => {
    const { items, open, active, index } = params;
    if (params.disabled || items.length === 0) return;
    const last = items.length - 1;
    const from = open ? active : index;
    const stop = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    // Closed, a key that moves picks straight away; open, it moves the highlight.
    const go = (to: number) => {
      stop();
      const next = Math.max(0, Math.min(last, to));
      if (open) params.onState?.({ open: true, active: next });
      else commit(params, node, next);
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
        if (open) commit(params, node, active);
        else show();
        return;
      case 'Tab':
        if (open) close(false);
        return;
      default:
        break;
    }

    if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
    const now = Date.now();
    const text = (now - typed.at > TYPING_WINDOW ? '' : typed.text) + e.key.toLowerCase();
    typed = { text, at: now };
    // One letter repeated walks the members starting with it; anything else searches for the word.
    const repeat = text.length > 1 && [...text].every((letter) => letter === text[0]);
    const needle = repeat ? (text[0] ?? '') : text;
    const start = needle.length === 1 ? from + 1 : 0;
    const order = items.map((_, i) => (start + i) % items.length);
    const found = order.find((i) => items[i]?.toLowerCase().startsWith(needle));
    if (found === undefined) return;
    stop();
    if (open) params.onState?.({ open: true, active: found });
    else commit(params, node, found);
  };

  const onClick = () => {
    if (params.disabled) return;
    if (params.open) close(true);
    else show();
  };

  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('click', onClick);
  return {
    update(next: SelectParams) {
      params = next;
    },
    destroy() {
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('click', onClick);
    },
  };
}

/** Room left between the menu and the edge of the window. */
const MARGIN = 4;
/** The shortest menu worth flipping for, so a cramped edge doesn't win. */
const LEAST_ROOM = 64;

/** The open menu: placement, the rows' pointer, and dismissal. `node` is the top-layer box. */
export function bindSelectMenu(node: HTMLElement, initial: SelectMenuParams) {
  let params = initial;
  let shownActive = initial.active;
  const trigger = () => node.parentElement?.querySelector<HTMLElement>('[data-part="trigger"]');
  const rows = () => [...node.querySelectorAll<HTMLElement>('[data-part="option"]')];
  const rowOf = (target: EventTarget | null) => {
    const row = target instanceof Element ? target.closest<HTMLElement>('[data-part="option"]') : null;
    return row && node.contains(row) ? rows().indexOf(row) : -1;
  };

  const place = () => {
    const from = trigger();
    if (!from) return;
    const at = from.getBoundingClientRect();
    node.style.setProperty('--lib-popover-anchor', `${at.width ?? 0}px`);
    const under = window.innerHeight - at.bottom - MARGIN;
    const over = at.top - MARGIN;
    const above = under < Math.min(node.scrollHeight, over);
    node.style.setProperty('--lib-popover-room', `${Math.max(LEAST_ROOM, above ? over : under)}px`);
    node.toggleAttribute('data-above', above);
    const size = node.getBoundingClientRect();
    node.style.left = `${Math.max(MARGIN, Math.min(at.left, window.innerWidth - size.width - MARGIN))}px`;
    node.style.top = `${above ? Math.max(MARGIN, at.top - size.height) : at.bottom}px`;
  };
  // On the open as well as the move: a menu whose chosen member is fortieth arrives scrolled to it.
  const reveal = () => node.querySelector<HTMLElement>('[data-active]')?.scrollIntoView?.({ block: 'nearest' });

  const dismiss = (restore: boolean) => {
    params.onState?.({ open: false, active: params.active });
    if (restore) trigger()?.focus();
  };
  const inside = (target: EventTarget | null) => target instanceof Node && (node.contains(target) || trigger()?.contains(target) === true);
  const pointer = (e: Event) => {
    if (!inside(e.target)) dismiss(false);
  };
  const wheel = (e: Event) => {
    if (!inside(e.target)) dismiss(false);
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    // Stopped as well as defaulted: the host under an open menu often means something by escape.
    e.preventDefault();
    e.stopPropagation();
    dismiss(true);
  };
  // A canvas underneath zooms on a wheel through a listener of its own.
  const keep = (e: WheelEvent) => e.stopPropagation();
  // Focus stays on the trigger, and a canvas underneath doesn't take a press for a drag.
  const rowDown = (e: PointerEvent) => {
    if (rowOf(e.target) < 0) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const rowOver = (e: PointerEvent) => {
    const which = rowOf(e.target);
    if (which >= 0 && which !== params.active) params.onState?.({ open: true, active: which });
  };
  const rowClick = (e: MouseEvent) => {
    const which = rowOf(e.target);
    if (which >= 0) commit(params, trigger(), which);
  };

  // A popover has no size until it is shown: show, then place (again once the rows are drawn).
  try {
    node.showPopover?.();
  } catch {
    // Already open, or a DOM with no top layer.
  }
  place();
  reveal();
  queueMicrotask(() => {
    if (!node.isConnected) return;
    place();
    reveal();
  });

  node.addEventListener('wheel', keep);
  node.addEventListener('pointerdown', rowDown);
  node.addEventListener('pointerover', rowOver);
  node.addEventListener('click', rowClick);
  document.addEventListener('pointerdown', pointer, true);
  window.addEventListener('wheel', wheel, true);
  window.addEventListener('keydown', keys, true);
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);

  return {
    update(next: SelectMenuParams) {
      params = next;
      if (params.active === shownActive) return;
      shownActive = params.active;
      queueMicrotask(reveal);
    },
    destroy() {
      node.removeEventListener('wheel', keep);
      node.removeEventListener('pointerdown', rowDown);
      node.removeEventListener('pointerover', rowOver);
      node.removeEventListener('click', rowClick);
      document.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', keys, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    },
  };
}
