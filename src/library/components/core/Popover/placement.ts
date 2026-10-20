// Popover's placement and dismissal, framework-free. `src/library/view/stores.ts` registers
// `bindPopover` as `popover` (Popover's tree binds it on its box); `usePopover` is the thin React
// wrapper `components/core/index.ts` exports. Neither renderer holds any of this logic.
//
// Not the `dismiss` store (`yahaha/AppBar/popover.ts`): that one calls `onClose()` with no reason,
// leaves only `[aria-controls=<id>]` to the opener, and closes on any Esc. A Popover says how it was
// dismissed (`Dismissal`), counts its anchor and `within` as inside, dismisses on a wheel elsewhere,
// and lets Esc clear a filled field first.
import { focusables, pushTrap, removeTrap, wrapFocus } from '../Modal/dialog';

/** How an open panel was asked to go away. Only `escape` has somewhere obvious to put focus back. */
export type Dismissal = 'pointer' | 'wheel' | 'escape' | 'stale';

/**
 * A box the panel hangs from, in viewport coordinates, measured when it opened. For an anchor that
 * may be unmounted by the time the panel is drawn (a chip in a scrolling grid): a remembered box
 * can't be followed, so anything that would move it dismisses (`stale`) instead.
 */
export interface PopupBox {
  left: number;
  top: number;
  bottom: number;
  /** Only for a panel that wants to be at least as wide as what it hangs from. */
  width?: number;
}

/** An element held by a ref (React's `RefObject`, or any `{ current }`). */
export interface ElementRef {
  current: Element | null;
}

/** What a panel hangs from, in any framework: a ref to a live control, the control itself, or a box. */
export type PopoverAnchor = ElementRef | Element | PopupBox;

/** A live anchor's element, or a box; null while a ref is still empty. */
export type ResolvedAnchor = Element | PopupBox | null;

/** The element or box `anchor` stands for now. */
export function resolveAnchor(anchor: PopoverAnchor | null | undefined): ResolvedAnchor {
  if (!anchor) return null;
  if (typeof Element !== 'undefined' && anchor instanceof Element) return anchor;
  if ('current' in anchor) return anchor.current;
  return anchor;
}

/** The element `ref` (a ref or an element) holds, if any. */
export function resolveElement(ref: ElementRef | Element | null | undefined): Element | null {
  if (!ref) return null;
  return typeof Element !== 'undefined' && ref instanceof Element ? ref : (ref as ElementRef).current;
}

const isElement = (at: ResolvedAnchor): at is Element => at !== null && 'getBoundingClientRect' in at;

/** The theme scope around a live anchor (its nearest `.lib-scope`), else `document.body`: where a
 *  `portal`led panel goes. */
export function portalTarget(anchor: PopoverAnchor | null | undefined): Element {
  const at = resolveAnchor(anchor);
  return (isElement(at) ? at.closest('.lib-scope') : null) ?? document.body;
}

/** Input types Esc clears before it closes anything: the ones you type a value into. */
const TYPED = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);

/**
 * The text field `target` is, if it has text Esc should clear first: a typed `input` or a
 * `textarea`, editable and not empty.
 */
function filledField(target: EventTarget | null): HTMLInputElement | HTMLTextAreaElement | null {
  const field =
    target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && TYPED.has(target.type)) ? target : null;
  return field && !field.readOnly && !field.disabled && field.value !== '' ? field : null;
}

/**
 * Empties `field` the way typing would, so a controlled field's `onChange` hears it: through the
 * element's own value setter (React's tracker would swallow a plain assignment), then an `input`.
 */
function clearField(field: HTMLInputElement | HTMLTextAreaElement) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, '');
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Room left between the panel and the edge of the window. */
const MARGIN = 4;
/** The shortest panel worth flipping for, so a cramped edge doesn't win. */
const LEAST_ROOM = 64;

export interface PopoverParams {
  /** What it hangs from now: a live control (re-measured on every placement) or a box measured once. */
  anchor?: () => ResolvedAnchor | undefined;
  /** A shield under the panel that counts as part of it (a pointer on it doesn't dismiss). */
  within?: () => Element | null | undefined;
  /** How it asks to go away. */
  onDismiss?: (how: Dismissal) => void;
}

export interface PopoverBinding {
  update(params: PopoverParams): void;
  destroy(): void;
}

const sameAnchor = (a: ResolvedAnchor, b: ResolvedAnchor) =>
  a === b || (a !== null && b !== null && !isElement(a) && !isElement(b) && a.left === b.left && a.top === b.top && a.bottom === b.bottom && a.width === b.width);

/**
 * The placement and dismissal behind `Popover`, on its positioned box. Shows it (`showPopover`),
 * then places it: under the anchor, or over it when that's where the room is (flip); clamped inside
 * the window horizontally; `--lib-popover-anchor` is the anchor's width and `--lib-popover-room` the
 * height left on the side it landed on. A live anchor is re-measured on every resize and scroll; a
 * box anchor dismisses as `stale` instead. Placed again when `update` brings another anchor.
 *
 * Dismisses on a pointer or a wheel elsewhere (the anchor and `within` count as inside) and on
 * Escape, which it stops so the host doesn't also act on it; Esc in a filled text field in the
 * panel clears it instead. While focus is in the panel, Tab and ⇧Tab go round its controls and it is
 * the topmost focus trap. A wheel over the panel never reaches the page under it.
 */
export function bindPopover(node: HTMLElement, initial: PopoverParams): PopoverBinding {
  let params = initial;
  const anchor = (): ResolvedAnchor => params.anchor?.() ?? null;
  let placedFor = anchor();

  const place = () => {
    const at = anchor();
    if (!at) return;
    const from = isElement(at) ? at.getBoundingClientRect() : at;
    node.style.setProperty('--lib-popover-anchor', `${from.width ?? 0}px`);
    const under = window.innerHeight - from.bottom - MARGIN;
    const over = from.top - MARGIN;
    const above = under < Math.min(node.scrollHeight, over);
    node.style.setProperty('--lib-popover-room', `${Math.max(LEAST_ROOM, above ? over : under)}px`);
    node.toggleAttribute('data-above', above);
    const size = node.getBoundingClientRect();
    node.style.left = `${Math.max(MARGIN, Math.min(from.left, window.innerWidth - size.width - MARGIN))}px`;
    node.style.top = `${above ? Math.max(MARGIN, from.top - size.height) : from.bottom}px`;
  };

  // A popover has no size until it is shown: show, then place.
  try {
    node.showPopover?.();
  } catch {
    // Already open, or a DOM with no top layer.
  }
  place();

  const dismiss = (how: Dismissal) => params.onDismiss?.(how);
  const inside = (target: EventTarget | null) => {
    if (!(target instanceof Node)) return false;
    const at = anchor();
    return node.contains(target) || params.within?.()?.contains(target) === true || (isElement(at) && at.contains(target));
  };
  const pointer = (e: Event) => {
    if (!inside(e.target)) dismiss('pointer');
  };
  const wheel = (e: Event) => {
    if (!inside(e.target)) dismiss('wheel');
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      // While focus is in the panel, Tab and ⇧Tab go round its controls, the way a dialog's do.
      if (e.defaultPrevented || !node.contains(document.activeElement)) return;
      const active = document.activeElement instanceof HTMLElement && document.activeElement !== node ? document.activeElement : null;
      const to = wrapFocus(focusables(node), active, e.shiftKey, node);
      if (!to) return;
      e.preventDefault();
      to.focus();
      return;
    }
    if (e.key !== 'Escape') return;
    // Stopped as well as defaulted: the host under an open panel often means something by escape.
    e.preventDefault();
    e.stopPropagation();
    // In a field with text in it, Esc clears the text first; the next one closes the panel.
    const field = node.contains(e.target as Node | null) ? filledField(e.target) : null;
    if (field) clearField(field);
    else dismiss('escape');
  };
  // Focus in the panel makes it the topmost trap (dialog.ts), so a dialog it opened from leaves Tab
  // to it until focus leaves.
  const focusIn = () => pushTrap(node);
  const focusOut = (e: FocusEvent) => {
    if (!(e.relatedTarget instanceof Node && node.contains(e.relatedTarget))) removeTrap(node);
  };
  // A canvas underneath zooms on a wheel through a listener of its own.
  const keep = (e: WheelEvent) => e.stopPropagation();
  const shifted = () => (isElement(anchor()) ? place() : dismiss('stale'));

  node.addEventListener('wheel', keep);
  node.addEventListener('focusin', focusIn);
  node.addEventListener('focusout', focusOut);
  if (node.contains(document.activeElement)) focusIn();
  document.addEventListener('pointerdown', pointer, true);
  window.addEventListener('wheel', wheel, true);
  window.addEventListener('keydown', keys, true);
  window.addEventListener('resize', shifted);
  document.addEventListener('scroll', shifted, true);

  return {
    update(next) {
      params = next;
      const at = anchor();
      if (sameAnchor(at, placedFor)) return;
      placedFor = at;
      place();
    },
    destroy() {
      node.removeEventListener('wheel', keep);
      node.removeEventListener('focusin', focusIn);
      node.removeEventListener('focusout', focusOut);
      removeTrap(node);
      document.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', keys, true);
      window.removeEventListener('resize', shifted);
      document.removeEventListener('scroll', shifted, true);
    },
  };
}
