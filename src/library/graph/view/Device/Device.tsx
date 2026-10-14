import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Icon } from '../../../primitives/Icon';
import { focusRing } from '../../../primitives/Ring';
import './Device.css';

export interface DeviceProps {
  /** What the device is called; printed in the head, clipped rather than wrapped. */
  name: string;
  /** The head's tooltip. */
  title?: string;
  /** Which device the host is pointing at. The host owns this, not the device. */
  selected?: boolean;
  /** Asked for on a click on the head, or Enter/Space on its name. Without it, the head has no tab stop. */
  onSelect?(): void;
  /** Host chrome before the name. */
  headerStart?: ReactNode;
  /** Host actions pinned to the far edge of the head (a close ×). */
  headerEnd?: ReactNode;
  /** A picture at the top of the face, inside the frame, above the wiring. The host owns its size. */
  screen?: ReactNode;
  /** Ports on the leading edge, a rail beside the body that describes the whole device. */
  inlets?: ReactNode;
  /** Ports on the trailing edge. */
  outlets?: ReactNode;
  /** Lines where a port governs one thing: each child a `DevicePortRow`. Above the body. */
  portRows?: ReactNode;
  /**
   * Where `outlets` stand. `band` (the default): on the trailing rail beside the body. `screen`:
   * in a column beside the picture, for a face whose picture is what leaves it (the outlet a host
   * previews is the one the picture shows); the rails then hold only the inlets. Only read with a
   * `screen`: without one there is nothing to stand beside, and the outlets keep the rail.
   */
  outletsAt?: 'band' | 'screen';
  /** The faceplate. */
  children?: ReactNode;
  /** A device with something wrong with it: its edge is drawn in `--danger`. */
  problem?: boolean;
  className?: string;
}

/** Interactive things in the head that keep their own clicks: a click on one is not a select. */
const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"], [tabindex]';

/**
 * **Job.** The face of a device as a node in a graph (or anything else that holds devices): a head
 * with its name, an optional picture, its wiring and its body. It replaces `@openflow/widgets`'
 * `Device`'s face, without the fold and the power switch.
 *
 * **Behaviour.** A click anywhere on the head that isn't one of its own controls (`headerStart`,
 * `headerEnd`) asks for `onSelect`; so do Enter and Space on the name. The name, not the head, is
 * the tab stop (`role="button"`, `aria-pressed` from `selected`): a graph moves a node with the
 * arrow keys while its head has focus and drags it from any non-interactive part of the head, so
 * the head can't be a `<button>` wrapping its own buttons (a button inside a button is invalid and
 * would swallow the ×). Without `onSelect` there is no tab stop and no button role. The face is a
 * `raised` `Surface` with a hairline edge; `selected` draws an `--accent` ring outside it, and
 * `problem` draws the edge in `--danger`. With `inlets` or `outlets`, the body sits between two
 * rails; `portRows` are lines above the body, each a grid with the inlet at the start, the child
 * in the middle and the outlet at the end. Every port cell keeps the same `--space-2` inset from
 * the edge, so the ports of the rails and the rows stand on the same two vertical lines. With
 * `outletsAt="screen"` and a `screen`, the outlets stand in a column beside the picture, against
 * its foot, on that same trailing line, and only the inlets keep a rail.
 *
 * **Parts** (`data-part`). `root` the face (`data-selected`, `data-problem`); `head` the title
 * bar; `name` the name, the tab stop; `head-end` the trailing actions; `screen` the picture;
 * `screen-band` (with `outletsAt="screen"`) the picture and its `screen-outlets` side by side;
 * `rows` the port rows, each a `row` (with `row-in`, `row-control`, `row-out`); `rails` the body
 * between its `inlets` and `outlets` (`rail-in`, `rail-out`); `body` the faceplate.
 *
 * **Tuning knobs.** `--lib-device-accent` the head's leading mark and the ink of the port cells
 * (a host sets it per kind; default none, and the ports keep `--text-3`); `--lib-device-width`
 * the width (default `auto`, set at zero specificity so a host class still wins).
 */
export function Device({
  name,
  title,
  selected = false,
  onSelect,
  headerStart,
  headerEnd,
  screen,
  inlets,
  outlets,
  portRows,
  outletsAt = 'band',
  children,
  problem = false,
  className,
}: DeviceProps) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const beside = outletsAt === 'screen' && screen !== undefined;
  const railOutlets = beside ? undefined : outlets;
  const railed = inlets !== undefined || railOutlets !== undefined;

  const onHeadClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    const hit = (e.target as Element).closest(INTERACTIVE);
    if (hit && hit !== nameRef.current && e.currentTarget.contains(hit)) return;
    onSelect();
  };
  const onNameKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!onSelect || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    onSelect();
  };

  return (
    <Surface
      layer="raised"
      border
      className={`lib-device${className ? ` ${className}` : ''}`}
      data-part="root"
      data-selected={selected ? '' : undefined}
      data-problem={problem ? '' : undefined}
    >
      <div className="lib-device__head" data-part="head" title={title} onClick={onHeadClick}>
        {headerStart}
        <span
          ref={nameRef}
          className={`lib-device__name ${focusRing}`}
          data-part="name"
          {...(onSelect ? { role: 'button', tabIndex: 0, 'aria-pressed': selected, onKeyDown: onNameKey } : {})}
        >
          <Text role="label" truncate>
            {name}
          </Text>
        </span>
        {headerEnd !== undefined && (
          <span className="lib-device__head-end" data-part="head-end">
            {headerEnd}
          </span>
        )}
      </div>
      {beside ? (
        <div className="lib-device__screen-band" data-part="screen-band">
          <div className="lib-device__screen" data-part="screen">
            {screen}
          </div>
          {outlets !== undefined && (
            <div className="lib-device__port lib-device__screen-outlets" data-part="screen-outlets" data-side="out">
              {outlets}
            </div>
          )}
        </div>
      ) : (
        screen !== undefined && (
          <div className="lib-device__screen" data-part="screen">
            {screen}
          </div>
        )
      )}
      {portRows !== undefined && (
        <div className="lib-device__rows" data-part="rows">
          {portRows}
        </div>
      )}
      {railed ? (
        <div className="lib-device__rails" data-part="rails">
          <div className="lib-device__port" data-part="rail-in" data-side="in">
            {inlets}
          </div>
          <div className="lib-device__body" data-part="body">
            {children}
          </div>
          <div className="lib-device__port" data-part="rail-out" data-side="out">
            {railOutlets}
          </div>
        </div>
      ) : (
        children !== undefined && (
          <div className="lib-device__body" data-part="body">
            {children}
          </div>
        )
      )}
    </Surface>
  );
}

export interface DevicePortRowProps {
  /** A port on the leading edge. */
  inlet?: ReactNode;
  /** A port on the trailing edge. */
  outlet?: ReactNode;
  /** The control or caption the ports on this line govern. */
  children?: ReactNode;
  className?: string;
}

/**
 * **Job.** One line of a `Device`'s `portRows`: the inlet at the start, the child in the middle,
 * the outlet at the end. The rows share their columns (a subgrid of `rows`), so every port of
 * the face is on the same vertical lines and a dot and its control share a centre by
 * construction. A string child is set as a `caption`.
 *
 * **Parts** (`data-part`). `row`; `row-in`, `row-control`, `row-out` its three cells.
 */
export function DevicePortRow({ inlet, outlet, children, className }: DevicePortRowProps) {
  return (
    <div className={`lib-device__row${className ? ` ${className}` : ''}`} data-part="row">
      <div className="lib-device__port" data-part="row-in" data-side="in">
        {inlet}
      </div>
      <div className="lib-device__row-control" data-part="row-control">
        {typeof children === 'string' ? (
          <Text role="caption" tone="secondary" truncate>
            {children}
          </Text>
        ) : (
          children
        )}
      </div>
      <div className="lib-device__port" data-part="row-out" data-side="out">
        {outlet}
      </div>
    </div>
  );
}

export interface DeviceMoreProps {
  /** Whether the rows this line stands for are showing. */
  open: boolean;
  onToggle(next: boolean): void;
  /** The accessible name, for a line whose printed text is a count. */
  label?: string;
  /** What is folded away, said as a count or a list: `7 at default`. */
  children?: ReactNode;
  className?: string;
}

/**
 * **Job.** The one line on a `Device`'s face that stands for the rows it isn't showing. A face
 * that draws only the rows that matter (the mode's own, anything wired or turned) says what it
 * left out, or the folded rows read as rows the node doesn't have. It says how many (`7 at
 * default`), never "advanced": a count is a fact about the node.
 *
 * **Behaviour.** A button with `aria-expanded` from `open`; a click (or Enter/Space) asks
 * `onToggle(!open)`. What opening does is the host's (grow in place, or open a `NodeSheet`); the
 * line only reports the state. It is a row's height, with its text at the indent of a row's
 * control, so it reads as the last line of the list rather than a button under it; in `portRows`
 * it spans the row's columns. The triangle points right while closed and down while open.
 *
 * **Parts** (`data-part`). `more` the button (`aria-expanded`); `more-mark` the triangle;
 * `more-text` the children, clipped rather than wrapped.
 *
 * **Tuning knobs.** `--lib-device-more-indent` where the line starts (default the port column
 * plus a row control's inset: `--space-2` twice and a `--space-3` port).
 */
export function DeviceMore({ open, onToggle, label, children, className }: DeviceMoreProps) {
  return (
    <button
      type="button"
      className={`lib-device__more ${focusRing}${className ? ` ${className}` : ''}`}
      data-part="more"
      aria-expanded={open}
      aria-label={label}
      onClick={() => onToggle(!open)}
    >
      <Icon viewBox="0 0 8 8" size="caption" className="lib-device__more-mark" data-part="more-mark">
        <path d="M1.5 2.75H6.5L4 6.25Z" fill="currentColor" stroke="none" />
      </Icon>
      <Text role="caption" truncate className="lib-device__more-text" data-part="more-text">
        {children}
      </Text>
    </button>
  );
}
