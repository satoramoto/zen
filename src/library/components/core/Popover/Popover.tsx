import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { ControlContext, CONTROL_FIELD } from '../../../primitives/Stack';
import { Tree } from '../../../view/Tree';
import { createHoverIntent, type HoverIntentOptions, type HoverPanel } from './hoverIntent';
import { popoverHandlers, popoverView } from './Popover.model';
import { bindPopover, resolveAnchor, type Dismissal, type PopoverBinding, type PopoverParams, type PopupBox } from './placement';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './Popover.css';

// The tree, the placement, the dismissal, the portal and the hover timing are framework-free, in the
// model and its stores (`placement.ts`, `portal.ts`, `hoverIntent.ts`); this file and `Popover.svelte`
// only hand the model's tree to their `Tree`. `usePopover` and `useHoverIntent` are thin wrappers
// over the stores, for callers that draw their own box or trigger.
export type { Dismissal, PopupBox } from './placement';
export type { HoverPanel, HoverIntentOptions } from './hoverIntent';
export { popoverView, popoverHandlers, type PopoverModelProps } from './Popover.model';

export type PopupAnchor = RefObject<HTMLElement | null> | PopupBox;

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
  /**
   * Render the box and the panel as `span`s, so the popover may sit inside running text (a `<p>`
   * can't hold a `div`). It draws the same: the box is `display: flex` either way. Content inside
   * must be phrasing content too, unless it is also `portal`led.
   */
  inline?: boolean;
  /**
   * Render it into the theme scope around a live anchor (its nearest `.lib-scope`, else
   * `document.body`) instead of where it is mounted: for an anchor whose parent can't hold the
   * panel's content (a paragraph). The theme's variables still reach it; the tab order no longer
   * runs control → panel, so use it for a preview, not a menu. A box anchor renders into `body`.
   * (An empty `display: contents` span stays where it is mounted.)
   */
  portal?: boolean;
  /** The panel's half of a hover intent (`useHoverIntent(...).panel`): resting on the panel keeps
   *  it open, leaving it starts the close delay. */
  hover?: HoverPanel;
  children?: ReactNode;
}

export interface HoverIntent {
  open: boolean;
  /** Open or close now, cancelling any pending delay (a click toggles with `setOpen(o => !o)`). */
  setOpen(open: boolean | ((open: boolean) => boolean)): void;
  /** Spread on the trigger. */
  trigger: HoverPanel;
  /** Pass to the Popover's `hover`. */
  panel: HoverPanel;
}

/**
 * Hover intent for a popover opened by resting on its trigger (a link preview, a peek): a mouse
 * that rests `openDelay` on the trigger opens it; leaving both trigger and panel for `closeDelay`
 * closes it, and coming back to either within the delay keeps it. Only a mouse hovers: touch and
 * pen events are ignored, so a tap goes to the trigger's own click. `setOpen` cancels any pending
 * delay, so a click or Escape wins over a hover in flight. The `createHoverIntent` store
 * (`hoverIntent.ts`), held for the component's life.
 */
export function useHoverIntent(options: HoverIntentOptions = {}): HoverIntent {
  const [store] = useState(() => createHoverIntent(options));
  store.configure(options);
  const open = useSyncExternalStore(store.subscribe, () => store.open);
  useEffect(() => () => store.destroy(), [store]);
  return useMemo(() => ({ open, setOpen: store.setOpen, trigger: store.trigger, panel: store.panel }), [open, store]);
}

/**
 * The placement and dismissal behind `Popover`, for a box of the caller's own: returns the ref for
 * the positioned box, and binds the `popover` store (`placement.ts`) on it from mount to unmount.
 */
export function usePopover({ anchor, onDismiss, within }: Pick<PopoverProps, 'anchor' | 'onDismiss' | 'within'>) {
  const box = useRef<HTMLElement>(null);
  const latest = useRef({ anchor, onDismiss, within });
  latest.current = { anchor, onDismiss, within };
  const binding = useRef<PopoverBinding | null>(null);
  const [params] = useState<PopoverParams>(() => ({
    anchor: () => resolveAnchor(latest.current.anchor),
    within: () => latest.current.within?.current,
    onDismiss: (how) => latest.current.onDismiss(how),
  }));
  useLayoutEffect(() => {
    if (!box.current) return;
    const bound = bindPopover(box.current, params);
    binding.current = bound;
    return () => {
      bound.destroy();
      binding.current = null;
    };
  }, [params]);
  useLayoutEffect(() => {
    binding.current?.update(params);
  }, [anchor, params]);
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
 * Escape in a text field in the panel that has text clears the text instead (its `onChange`
 * hears it); only the next one closes. While focus is in the panel, Tab and ⇧Tab go round its
 * controls and never leave it, the way a dialog's do (`focusTrap`), and a dialog it opened from
 * leaves Tab to it. Focus on the control it hangs from (a select's trigger, which keeps focus) is
 * left alone, so Tab there moves on as usual.
 *
 * **In running text.** `inline` renders the box and panel as `span`s, `portal` renders them into
 * the theme scope around the anchor instead of inside a paragraph, and `hover` takes the panel's
 * half of `useHoverIntent`, which opens and closes it on a resting mouse with delays. A word with
 * a preview needs those three and a button, nothing more.
 *
 * **Parts.** `popover`: the positioned box in the top layer, a body `Text` (its content inherits
 * that type), carrying `--lib-popover-anchor`
 * (the anchor's width), `--lib-popover-room` (the height left) and `data-above` when flipped.
 * `panel`: the float `Layer` inside it, with the caller's `role`, `label`, `id` and `className`;
 * it scrolls when its content is taller than the room.
 */
export function Popover({ children, hover, ...props }: PopoverProps) {
  const binding = { ...props, hover };
  return (
    <Tree
      tree={popoverView({ ...props, hover: hover !== undefined })}
      // A popover is a new surface: controls in it are fields again, even when it opens from a toolbar.
      slots={{ children: <ControlContext.Provider value={CONTROL_FIELD}>{children}</ControlContext.Provider> }}
      handlers={popoverHandlers(binding)}
    />
  );
}

/** visual[flow]'s name for it, so its call sites port unchanged. */
export const Popup = Popover;
export type PopupProps = PopoverProps;

export default Popover;
