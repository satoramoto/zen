import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Layer } from '../../../layout/Layer';
import { Text } from '../../../primitives/Text';
import { ControlContext, CONTROL_FIELD } from '../../../primitives/Stack';
import './Popover.css';

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

export type PopupAnchor = RefObject<HTMLElement | null> | PopupBox;

const isLive = (anchor: PopupAnchor): anchor is RefObject<HTMLElement | null> => 'current' in anchor;

export interface PopoverProps {
  /** What it hangs from: a live control, re-measured on every placement, or a box measured once. */
  anchor: PopupAnchor;
  /** Mounted is open, so this is the one way it asks to go away. */
  onDismiss(how: Dismissal): void;
  /**
   * A shield the caller put under the panel, which counts as part of it: a pointer on it doesn't
   * dismiss (the shield dismisses on its own click, so the press can't reach what it covers).
   */
  within?: RefObject<HTMLElement | null>;
  role?: string;
  /** The panel's accessible name. */
  label?: string;
  id?: string;
  /** On the panel: how wide it is, whether its rows scroll. */
  className?: string;
  children?: ReactNode;
}

/** Room left between the panel and the edge of the window. */
const MARGIN = 4;
/** The shortest panel worth flipping for, so a cramped edge doesn't win. */
const LEAST_ROOM = 64;

/**
 * The placement and dismissal behind `Popover`: returns the ref for the positioned box. Under the
 * anchor, or over it when that's where the room is (flip); clamped inside the window
 * horizontally; `--lib-popover-anchor` is the anchor's width and `--lib-popover-room` the height
 * left on the side it landed on. Both are re-measured on every resize and scroll for a live
 * anchor; a box anchor dismisses as `stale` instead.
 */
export function usePopover({ anchor, onDismiss, within }: Pick<PopoverProps, 'anchor' | 'onDismiss' | 'within'>) {
  const box = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const from = isLive(anchor) ? anchor.current : anchor;
    if (!from) return;
    const at = 'getBoundingClientRect' in from ? from.getBoundingClientRect() : from;
    el.style.setProperty('--lib-popover-anchor', `${at.width ?? 0}px`);
    const under = window.innerHeight - at.bottom - MARGIN;
    const over = at.top - MARGIN;
    const above = under < Math.min(el.scrollHeight, over);
    el.style.setProperty('--lib-popover-room', `${Math.max(LEAST_ROOM, above ? over : under)}px`);
    el.toggleAttribute('data-above', above);
    const size = el.getBoundingClientRect();
    el.style.left = `${Math.max(MARGIN, Math.min(at.left, window.innerWidth - size.width - MARGIN))}px`;
    el.style.top = `${above ? Math.max(MARGIN, at.top - size.height) : at.bottom}px`;
  }, [anchor]);

  useLayoutEffect(() => {
    // A popover has no size until it is shown: show, then place.
    try {
      box.current?.showPopover?.();
    } catch {
      // Already open, or a DOM with no top layer.
    }
    place();
  }, [place]);

  useEffect(() => {
    const el = box.current;
    const inside = (target: EventTarget | null) =>
      target instanceof Node &&
      (box.current?.contains(target) === true ||
        within?.current?.contains(target) === true ||
        (isLive(anchor) && anchor.current?.contains(target) === true));
    const elsewhere = (how: Dismissal) => (e: Event) => {
      if (!inside(e.target)) onDismiss(how);
    };
    const pointer = elsewhere('pointer');
    const wheel = elsewhere('wheel');
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Stopped as well as defaulted: the host under an open panel often means something by escape.
      e.preventDefault();
      e.stopPropagation();
      onDismiss('escape');
    };
    // Native, on the panel: a canvas underneath zooms on a wheel through a listener of its own.
    const keep = (e: WheelEvent) => e.stopPropagation();
    el?.addEventListener('wheel', keep);
    document.addEventListener('pointerdown', pointer, true);
    window.addEventListener('wheel', wheel, true);
    window.addEventListener('keydown', escape, true);
    const shifted = isLive(anchor) ? place : () => onDismiss('stale');
    window.addEventListener('resize', shifted);
    document.addEventListener('scroll', shifted, true);
    return () => {
      el?.removeEventListener('wheel', keep);
      document.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', shifted);
      document.removeEventListener('scroll', shifted, true);
    };
  }, [anchor, onDismiss, place, within]);

  return box;
}

/**
 * A floating panel hung off a control.
 *
 * **Job.** The open half of a menu, a picker or a details card: the surface that has to escape
 * every `transform`, `overflow: hidden` and stacking context between its control and the page,
 * and paint above a `<dialog>`. It is a `popover="manual"` in the browser's top layer, yet stays a
 * DOM child of its control, so the theme's variables still reach it and the tab order still runs
 * control → panel. The panel is a `Layer level="float"`: the theme's float layer decides whether
 * it is a tone step, a bevelled card with a cast shadow, or frosted glass.
 *
 * **Behaviour.** Mounted is open. It sits under its anchor, or over it when the room is there
 * (flip), clamped inside the window; a live anchor is followed through scroll and resize, a box
 * anchor dismisses as `stale`. It dismisses on a pointer or a wheel elsewhere (the anchor and
 * `within` count as inside) and on Escape, which it stops so the host doesn't also act on it;
 * `onDismiss` says which. A wheel over the panel never reaches the page under it. Its own
 * dismissal rather than `popover="auto"`'s light dismiss, which would close on the pointerdown
 * heading for the trigger and let the click behind it reopen the panel.
 *
 * **Parts.** `popover`: the positioned box in the top layer, a body `Text` (its content inherits
 * that type), carrying `--lib-popover-anchor`
 * (the anchor's width), `--lib-popover-room` (the height left) and `data-above` when flipped.
 * `panel`: the float `Layer` inside it, with the caller's `role`, `label`, `id` and `className`;
 * it scrolls when its content is taller than the room.
 */
export function Popover({ anchor, onDismiss, within, role, label, id, className, children }: PopoverProps) {
  const box = usePopover({ anchor, onDismiss, within });
  return (
    <Text as="div" role="body" ref={box} className="lib-popover" popover="manual" data-part="popover">
      <Layer
        level="float"
        className={`lib-popover__panel${className ? ` ${className}` : ''}`}
        data-part="panel"
        role={role}
        aria-label={label}
        id={id}
      >
        {/* A popover is a new surface: controls in it are fields again, even when it opens from a toolbar. */}
        <ControlContext.Provider value={CONTROL_FIELD}>{children}</ControlContext.Provider>
      </Layer>
    </Text>
  );
}

/** visual[flow]'s name for it, so its call sites port unchanged. */
export const Popup = Popover;
export type PopupProps = PopoverProps;

export default Popover;
