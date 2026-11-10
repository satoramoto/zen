// The Workspace's two edit gestures as framework-free stores (registered in `foundation/view/stores.ts` as
// `splitHandle` and `dockDrag`): both renderers bind them by name and neither holds any of this logic.
// Each reports a preview through a handler (visual state the surface keeps) and, when the gesture
// ends, the one edit it makes (an intent the surface sends). Pointer capture makes touch and mouse
// one path.

/** Capture a pointer for the gesture; a pointer the browser doesn't know (a synthetic one) is followed without it. */
function capture(node: HTMLElement, pointer: number): void {
  try {
    node.setPointerCapture(pointer);
  } catch {
    // Not an active pointer: the gesture still follows events dispatched to the node.
  }
}

/** Pointer travel before a press on a tag becomes a drag. */
export const DRAG_THRESHOLD_PX = 6;
/** One arrow press moves a handle this share of its pair. */
export const KEY_STEP = 0.05;

export interface SplitHandleParams {
  /** The split runs side by side (`row`: the handle moves on x) or stacked (`column`: on y). */
  axis: 'row' | 'column';
  /** The handle sits after the child at `index`. */
  index: number;
  /** The split's shares now. */
  shares: readonly number[];
  /** Each child's least room on the axis, px: a drag never gives a child less. */
  mins: readonly number[];
  /** The previewed shares while dragging, null when it ends. */
  onPreview?: (shares: readonly number[] | null) => void;
  /** The shares a drag or a key press ends with. */
  onCommit?: (shares: readonly number[]) => void;
  disabled?: boolean;
}

/** The two children either side of a handle: their elements along the split's axis. */
function neighbours(node: HTMLElement, axis: 'row' | 'column'): { a: number; b: number } | null {
  const prev = node.previousElementSibling as HTMLElement | null;
  const next = node.nextElementSibling as HTMLElement | null;
  if (!prev || !next) return null;
  const size = (el: HTMLElement) => (axis === 'row' ? el.getBoundingClientRect().width : el.getBoundingClientRect().height);
  return { a: size(prev), b: size(next) };
}

/** The shares with the pair at `index` split as `a : b` px, keeping the pair's total share. */
function reshare(shares: readonly number[], index: number, a: number, b: number): number[] {
  const pair = shares[index] + shares[index + 1];
  const next = [...shares];
  next[index] = (pair * a) / (a + b);
  next[index + 1] = pair - next[index];
  return next;
}

export function bindSplitHandle(node: HTMLElement, initial: SplitHandleParams) {
  let params = initial;
  let drag: { pointer: number; start: number; a: number; b: number; last: readonly number[] | null } | null = null;
  const at = (e: PointerEvent) => (params.axis === 'row' ? e.clientX : e.clientY);
  const clampPair = (a: number, total: number) => {
    const lo = params.mins[params.index] ?? 0;
    const hi = total - (params.mins[params.index + 1] ?? 0);
    return hi < lo ? total / 2 : Math.min(hi, Math.max(lo, a));
  };

  const down = (e: PointerEvent) => {
    if (params.disabled || e.button !== 0) return;
    const sizes = neighbours(node, params.axis);
    if (!sizes) return;
    e.preventDefault();
    capture(node, e.pointerId);
    drag = { pointer: e.pointerId, start: at(e), a: sizes.a, b: sizes.b, last: null };
  };
  const move = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const total = drag.a + drag.b;
    const a = clampPair(drag.a + at(e) - drag.start, total);
    drag.last = reshare(params.shares, params.index, a, total - a);
    params.onPreview?.(drag.last);
  };
  const up = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const last = drag.last;
    drag = null;
    params.onPreview?.(null);
    if (last) params.onCommit?.(last);
  };
  const key = (e: KeyboardEvent) => {
    if (params.disabled) return;
    const back = params.axis === 'row' ? 'ArrowLeft' : 'ArrowUp';
    const forth = params.axis === 'row' ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== back && e.key !== forth) return;
    const sizes = neighbours(node, params.axis);
    if (!sizes) return;
    e.preventDefault();
    const total = sizes.a + sizes.b;
    const a = clampPair(sizes.a + (e.key === forth ? 1 : -1) * KEY_STEP * total, total);
    if (Math.abs(a - sizes.a) < 0.5) return;
    params.onCommit?.(reshare(params.shares, params.index, a, total - a));
  };

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
  node.addEventListener('keydown', key);
  return {
    update(next: SplitHandleParams) {
      params = next;
    },
    destroy() {
      if (drag) params.onPreview?.(null);
      drag = null;
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      node.removeEventListener('keydown', key);
    },
  };
}

export type DockSide = 'left' | 'right' | 'above' | 'below' | 'swap';

/** Where in a region's box a point falls: an outer quarter of an edge (the nearest), else the centre. */
export function dockZoneAt(rect: { left: number; top: number; width: number; height: number }, x: number, y: number): DockSide {
  const fx = (x - rect.left) / rect.width;
  const fy = (y - rect.top) / rect.height;
  const edges: [DockSide, number][] = [
    ['left', fx],
    ['right', 1 - fx],
    ['above', fy],
    ['below', 1 - fy],
  ];
  const [side, d] = edges.reduce((best, e) => (e[1] < best[1] ? e : best));
  return d < 0.25 ? side : 'swap';
}

export interface DockDragParams {
  /** The region this tag drags. */
  region: string;
  /** The region and zone under the pointer while dragging (target undefined: over none), null when it ends. */
  onDrag?: (state: { region: string; target?: string; zone?: DockSide } | null) => void;
  /** The drop: one dock onto a region's zone. Not called for a drop outside every region. */
  onDock?: (drop: { target: string; zone: DockSide }) => void;
  disabled?: boolean;
}

export function bindDockDrag(node: HTMLElement, initial: DockDragParams) {
  let params = initial;
  let press: { pointer: number; x: number; y: number; dragging: boolean; target?: string; zone?: DockSide } | null = null;
  const root = () => node.closest('[data-dock-root]') ?? node.ownerDocument;

  const over = (x: number, y: number): { target?: string; zone?: DockSide } => {
    const regions = [...root().querySelectorAll<HTMLElement>('[data-dock-region]')];
    for (const el of regions) {
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const id = el.dataset.dockRegion!;
      return id === params.region ? {} : { target: id, zone: dockZoneAt(r, x, y) };
    }
    return {};
  };
  const swallowClick = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const down = (e: PointerEvent) => {
    if (params.disabled || e.button !== 0) return;
    press = { pointer: e.pointerId, x: e.clientX, y: e.clientY, dragging: false };
  };
  const move = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.pointer) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG_THRESHOLD_PX) return;
      press.dragging = true;
      capture(node, e.pointerId);
    }
    e.preventDefault();
    const hit = over(e.clientX, e.clientY);
    if (hit.target === press.target && hit.zone === press.zone) return;
    press.target = hit.target;
    press.zone = hit.zone;
    params.onDrag?.({ region: params.region, ...hit });
  };
  const end = (drop: boolean) => (e: PointerEvent) => {
    if (!press || e.pointerId !== press.pointer) return;
    const { dragging, target, zone } = press;
    press = null;
    if (!dragging) return;
    params.onDrag?.(null);
    // The click a drag ends with is not a press of the tag.
    node.addEventListener('click', swallowClick, { capture: true, once: true });
    setTimeout(() => node.removeEventListener('click', swallowClick, { capture: true }), 0);
    if (drop && target && zone) params.onDock?.({ target, zone });
  };
  const up = end(true);
  const cancel = end(false);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && press?.dragging) {
      press = null;
      params.onDrag?.(null);
    }
  };

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', cancel);
  node.ownerDocument.addEventListener('keydown', key);
  return {
    update(next: DockDragParams) {
      params = next;
    },
    destroy() {
      if (press?.dragging) params.onDrag?.(null);
      press = null;
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
      node.ownerDocument.removeEventListener('keydown', key);
    },
  };
}
