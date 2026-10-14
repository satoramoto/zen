import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Icon } from '../../../primitives/Icon';
import { ButtonFace } from '../../../components/core/ActionButton/ActionButton';
import './NodeSheet.css';

/** Where a parked sheet stands, in viewport px. */
export interface NodeSheetPlace {
  left: number;
  top: number;
}

export interface NodeSheetProps {
  /** The node's name, printed in the head the way the node prints it. */
  name: string;
  /** A word after the name in the caption ink: the mode, or what kind it is. */
  about?: string;
  /** The node the sheet belongs to, re-measured on every frame while the sheet is up. */
  anchor: RefObject<HTMLElement | null>;
  /** Where it has been parked, or nothing to hang beside the node. The host holds it, so a sheet
   *  parked for one node stays parked for the next. */
  parked?: NodeSheetPlace | null;
  /** Dragging the head parks it; the head's hang-back button hands back `null`. */
  onPark?(at: NodeSheetPlace | null): void;
  /** Escape was pressed while the sheet was up. */
  onDismiss?(how: 'escape'): void;
  /** Host actions pinned to the far edge of the head (a close ×). */
  headerEnd?: ReactNode;
  /** The accessible name. Defaults to `name`. */
  label?: string;
  className?: string;
  children?: ReactNode;
}

/** What a press on these starts is theirs, not a drag of the head. */
const OWN_PRESS = 'button, a[href], input, select, textarea, [role="slider"], [role="button"]';

/** A length knob on the sheet in px (the theme resolves it), or the fallback before it has one. */
function knobPx(el: HTMLElement, name: string, fallback: number) {
  const px = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(px) ? px : fallback;
}

/**
 * **Job.** A node's whole face, hung beside the node: where the rows a `Device` doesn't show
 * (`DeviceMore`) go. It is drawn at screen scale while the node is drawn at the canvas's, so a
 * node can be read at any zoom by selecting it. Ported from `@openflow/widgets`' `Sheet` (zen's
 * own `Sheet` is the modal one, hence the name).
 *
 * **Behaviour.** Mounted is up. It is a `popover="manual"` box in the top layer, so it escapes a
 * canvas's transform and overflow; it stays a DOM child of its host, so the theme still reaches
 * it. It follows `anchor` on a frame clock (a canvas pans and zooms under a transform, which fires
 * neither scroll nor resize): one measurement a frame, and a move only when the place changed.
 * It stands beside the node on whichever side has the room: right first, then left, then under
 * it; always clamped inside the window. With `onPark`, dragging the head (from anywhere that isn't
 * a control in it) parks it where it is dropped and reports the place; parked, it stays at
 * `parked` (clamped) whatever node it shows, and a hang-back button in the head hands `onPark`
 * `null`. Escape, while it is up, calls `onDismiss('escape')` and is stopped there; every other
 * dismissal is the host's (the sheet is up while a node is selected). In a DOM with no top layer
 * (jsdom) it still renders and places itself.
 *
 * **Parts** (`data-part`). `root` the top-layer box (`data-parkable`, `data-parked`,
 * `data-dragging`); `plate` the float `Surface` inside it; `head` the drag handle; `name`;
 * `about`; `head-end` the trailing actions; `hang` the hang-back button; `body` the scrolling
 * rows. `NodeSheetSection` and `NodeSheetRow` name their own.
 *
 * **Tuning knobs.** `--lib-node-sheet-width` (default twelve control heights);
 * `--lib-node-sheet-caption` the rows' caption column (default three and a half control heights);
 * `--lib-node-sheet-gap` the room between the node and the sheet (default `--space-2`);
 * `--lib-node-sheet-margin` the room kept from the window's edge (default `--space-1`).
 */
export function NodeSheet({
  name,
  about,
  anchor,
  parked = null,
  onPark,
  onDismiss,
  headerEnd,
  label,
  className,
  children,
}: NodeSheetProps) {
  const box = useRef<HTMLDivElement>(null);
  const was = useRef('');
  const room = useRef({ gap: 8, margin: 4 });
  const drag = useRef<{ dx: number; dy: number; left: number; top: number } | null>(null);

  const place = useCallback(() => {
    const el = box.current;
    if (!el || drag.current) return;
    const { gap, margin } = room.current;
    const size = el.getBoundingClientRect();
    let left: number;
    let top: number;
    if (parked) {
      left = parked.left;
      top = parked.top;
    } else {
      const at = anchor.current?.getBoundingClientRect();
      if (!at) return;
      const right = at.right + gap;
      const leftOf = at.left - gap - size.width;
      const fitsRight = right + size.width <= window.innerWidth - margin;
      if (fitsRight) left = right;
      else if (leftOf >= margin) left = leftOf;
      else left = at.left;
      top = !fitsRight && leftOf < margin ? at.bottom + gap : at.top;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - size.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - size.height - margin));
    const key = `${left},${top}`;
    if (key === was.current) return;
    was.current = key;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [anchor, parked]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    try {
      el.showPopover?.();
    } catch {
      // Already open, or a DOM with no top layer: neither is worth a throw.
    }
    room.current = { gap: knobPx(el, '--lib-node-sheet-gap', 8), margin: knobPx(el, '--lib-node-sheet-margin', 4) };
    was.current = '';
    place();
  }, [place]);

  useEffect(() => {
    let frame = requestAnimationFrame(function follow() {
      place();
      frame = requestAnimationFrame(follow);
    });
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !onDismiss) return;
      e.preventDefault();
      e.stopPropagation();
      onDismiss('escape');
    };
    window.addEventListener('keydown', escape, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', escape, true);
    };
  }, [place, onDismiss]);

  const grab = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onPark || e.button !== 0) return;
    if ((e.target as Element).closest(OWN_PRESS)) return;
    const el = box.current;
    if (!el) return;
    const at = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - at.left, dy: e.clientY - at.top, left: at.left, top: at.top };
    el.setAttribute('data-dragging', '');
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    const el = box.current;
    if (!held || !el) return;
    const { margin } = room.current;
    const size = el.getBoundingClientRect();
    held.left = Math.max(margin, Math.min(e.clientX - held.dx, window.innerWidth - size.width - margin));
    held.top = Math.max(margin, Math.min(e.clientY - held.dy, window.innerHeight - size.height - margin));
    el.style.left = `${held.left}px`;
    el.style.top = `${held.top}px`;
  };

  const drop = (e: ReactPointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    const el = box.current;
    if (!held || !el) return;
    drag.current = null;
    el.removeAttribute('data-dragging');
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    was.current = `${held.left},${held.top}`;
    onPark?.({ left: held.left, top: held.top });
  };

  return (
    <Text
      as="div"
      role="body"
      ref={box}
      className={`lib-node-sheet${className ? ` ${className}` : ''}`}
      popover="manual"
      ariaRole="region"
      aria-label={label ?? name}
      data-part="root"
      data-parkable={onPark ? '' : undefined}
      data-parked={parked ? '' : undefined}
    >
      <Surface layer="float" border className="lib-node-sheet__plate" data-part="plate">
        <div
          className="lib-node-sheet__head"
          data-part="head"
          onPointerDown={grab}
          onPointerMove={move}
          onPointerUp={drop}
          onPointerCancel={drop}
        >
          <Text role="label" weight="strong" truncate className="lib-node-sheet__name" data-part="name">
            {name}
          </Text>
          {about && (
            <Text role="caption" tone="muted" truncate className="lib-node-sheet__about" data-part="about">
              {about}
            </Text>
          )}
          <span className="lib-node-sheet__head-end" data-part="head-end">
            {parked && onPark && (
              <ButtonFace
                tone="quiet"
                size="small"
                className="lib-node-sheet__hang"
                data-part="hang"
                title="Hang it beside the node again"
                aria-label="Hang beside the node"
                onClick={() => onPark(null)}
              >
                <Icon>
                  <circle cx="12" cy="12" r="6" />
                  <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
                </Icon>
              </ButtonFace>
            )}
            {headerEnd}
          </span>
        </div>
        <div className="lib-node-sheet__body" data-part="body">
          {children}
        </div>
      </Surface>
    </Text>
  );
}

export interface NodeSheetSectionProps {
  /** The heading over the group. */
  heading: string;
  children?: ReactNode;
  className?: string;
}

/**
 * **Job.** A group of a `NodeSheet`'s rows under one heading: the mode's own, the picture's, the
 * colours.
 *
 * **Parts** (`data-part`). `section`; `heading` its heading.
 */
export function NodeSheetSection({ heading, children, className }: NodeSheetSectionProps) {
  return (
    <section className={`lib-node-sheet__section${className ? ` ${className}` : ''}`} data-part="section">
      <Text role="caption" case="label" tone="muted" truncate className="lib-node-sheet__heading" data-part="heading">
        {heading}
      </Text>
      {children}
    </section>
  );
}

export interface NodeSheetRowProps {
  /** The caption, in its own column. */
  name: string;
  /** What is moving this row, printed after the name as `← {driver}` in the accent ink. */
  driver?: string;
  /** Something small before the name: the port's dot, in the kind's colour. */
  mark?: ReactNode;
  /** The control. */
  children?: ReactNode;
  /** What spells the value: a field to type into, a reading, a unit. */
  end?: ReactNode;
  title?: string;
  className?: string;
}

/**
 * **Job.** One line of a `NodeSheet`: the caption in its own column, the control in the middle
 * (stretched to it), and what spells the value at the end. Here there is room to print the
 * caption beside the control rather than over it, which is what the sheet buys over the face.
 *
 * **Behaviour.** With `driver`, the caption reads `name ← driver`, the driver in the accent ink, so
 * a row says who is carrying it without the cord being traced. An empty `end` takes no room.
 *
 * **Parts** (`data-part`). `row`; `caption` (holding `mark`, `name`, `driver`); `control`; `end`.
 */
export function NodeSheetRow({ name, driver, mark, children, end, title, className }: NodeSheetRowProps) {
  return (
    <div className={`lib-node-sheet__row${className ? ` ${className}` : ''}`} data-part="row" title={title}>
      <span className="lib-node-sheet__caption" data-part="caption">
        {mark !== undefined && (
          <span className="lib-node-sheet__mark" data-part="mark">
            {mark}
          </span>
        )}
        <Text role="label" truncate className="lib-node-sheet__row-name" data-part="name">
          {name}
        </Text>
        {driver && (
          <Text role="label" tone="accent" truncate className="lib-node-sheet__driver" data-part="driver">
            ← {driver}
          </Text>
        )}
      </span>
      <div className="lib-node-sheet__control" data-part="control">
        {children}
      </div>
      <div className="lib-node-sheet__end" data-part="end">
        {end}
      </div>
    </div>
  );
}
