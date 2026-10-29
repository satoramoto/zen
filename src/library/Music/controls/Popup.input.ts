/** The source popup's top-layer placement and dismissal, shared by both renderers. */
export type Dismissal = 'pointer' | 'wheel' | 'escape' | 'stale';
export interface PopupBox { left: number; top: number; bottom: number; width?: number }
export type PopupAnchor = { current: HTMLElement | null } | PopupBox | (() => HTMLElement | PopupBox | null);
export type PopupWithin = { current: HTMLElement | null } | (() => HTMLElement | null);
export interface PopupParams {
  /** Undefined means the previous sibling (Select/ContextControls' trigger). */
  anchor?(): HTMLElement | PopupBox | null;
  within?(): HTMLElement | null;
  remembered?: boolean;
  onDismiss?(how: Dismissal): void;
}

export function bindPopup(node: HTMLElement, initial: PopupParams) {
  let params = initial;
  let alive = true;
  const from = () => params.anchor ? params.anchor() : node.previousElementSibling as HTMLElement | null;
  const place = () => {
    if (!alive) return;
    const anchor = from();
    if (!anchor) return;
    const at = 'getBoundingClientRect' in anchor ? anchor.getBoundingClientRect() : anchor;
    node.style.setProperty('--wdg-popup-anchor', `${at.width ?? 0}px`);
    const under = window.innerHeight - at.bottom - 4;
    const over = at.top - 4;
    const above = under < Math.min(node.scrollHeight, over);
    node.style.setProperty('--wdg-popup-room', `${Math.max(64, above ? over : under)}px`);
    const size = node.getBoundingClientRect();
    node.style.left = `${Math.max(4, Math.min(at.left, window.innerWidth - size.width - 4))}px`;
    node.style.top = `${above ? Math.max(4, at.top - size.height) : at.bottom}px`;
  };
  const inside = (target: EventTarget | null) => {
    if (!(target instanceof Node)) return false;
    const anchor = from();
    return node.contains(target) || params.within?.()?.contains(target) === true || (anchor instanceof Node && anchor.contains(target));
  };
  const pointer = (e: Event) => { if (!inside(e.target)) params.onDismiss?.('pointer'); };
  const wheel = (e: Event) => { if (!inside(e.target)) params.onDismiss?.('wheel'); };
  const escape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    params.onDismiss?.('escape');
  };
  const keep = (e: WheelEvent) => e.stopPropagation();
  const shifted = () => {
    if (params.remembered) params.onDismiss?.('stale');
    else place();
  };
  try { node.showPopover?.(); } catch { /* Already shown, or a DOM without the top layer. */ }
  place();
  queueMicrotask(place);
  node.addEventListener('wheel', keep);
  document.addEventListener('pointerdown', pointer, true);
  window.addEventListener('wheel', wheel, true);
  window.addEventListener('keydown', escape, true);
  window.addEventListener('resize', shifted);
  document.addEventListener('scroll', shifted, true);
  return {
    update(next: PopupParams) { params = next; place(); },
    destroy() {
      alive = false;
      node.removeEventListener('wheel', keep);
      document.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', shifted);
      document.removeEventListener('scroll', shifted, true);
      try { node.hidePopover?.(); } catch { /* It may already have left the document. */ }
    },
  };
}
