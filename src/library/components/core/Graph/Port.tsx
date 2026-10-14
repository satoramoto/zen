import { useContext, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import type { HueSlot } from '../hue';
import { GraphContext, portKey, type PortSide } from './graphContext';
import './Graph.css';

export interface PortProps {
  /** Unique **for this side** across the graph: a cord names an outlet id and an inlet id. */
  id: string;
  side: PortSide;
  /** Printed beside the dot, and its accessible name and tooltip. Defaults to the id for the name. */
  label?: string;
  /** Keep the accessible name and tooltip without printing the caption (a control beside it names it). */
  showLabel?: boolean;
  /** The host's own vocabulary, surfaced as `data-kind`. */
  kind?: string;
  /**
   * The hue slot the host gives this port's kind (`--hue-1` … `--hue-4`, as `data-hue`): the ring
   * in that hue, and the fill once connected. Unset, the port keeps the graph's neutral ink.
   */
  hue?: HueSlot;
  /** Whether a cord lands here. The host knows; the port doesn't. */
  connected?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * One connection point on a node: where a cord ends.
 *
 * **Job.** A real `<button>` that registers itself with the enclosing `Graph` through context, so
 * the graph can measure it and draw cords to it. It knows nothing about what flows through it:
 * `kind` is an opaque host string on `data-kind`, with no list of kinds here.
 *
 * **Behaviour.** A pointerdown starts a cord (it is defaulted and stopped, so the node doesn't drag
 * and no text selection starts); Enter or Space arms the port, and the same on a port of the other
 * side lands the cord (see `Graph`). While a cord is out, every other port says whether it could
 * take it: `data-reach="open"` on the wanted side, `"shut"` on the other; the port it left carries
 * `data-pending` instead. `data-over` marks the port under the pointer, `data-connected` one the
 * host says is wired. Outside a `Graph` it is an inert dot.
 *
 * **Parts.** `port` (the root slot, `data-side`): the dot and its caption, the caption leading on
 * an outlet. `dot`: the button. `label`: the caption, a `caption` `Text`.
 */
export function Port({ id, side, label, showLabel = true, kind, hue, connected, disabled, className }: PortProps) {
  const graph = useContext(GraphContext);
  const ref = useRef<HTMLButtonElement | null>(null);
  const register = graph?.register;
  const at = portKey(id, side);

  useEffect(() => {
    if (!register) return;
    register(id, side, ref.current);
    return () => register(id, side, null);
  }, [register, id, side]);

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || !graph || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    graph.startCord(id, side, e);
  };

  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || !graph) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    graph.armCord(id, side);
  };

  const reach =
    !disabled && graph?.cordWants && at !== graph.cordFrom ? (graph.cordWants === side ? 'open' : 'shut') : undefined;

  return (
    <span className={`lib-graph__port-slot${className ? ` ${className}` : ''}`} data-part="port" data-side={side}>
      <button
        ref={ref}
        type="button"
        className={`lib-graph__port ${focusRing}`}
        data-part="dot"
        data-side={side}
        {...(kind === undefined ? {} : { 'data-kind': kind })}
        {...(hue === undefined ? {} : { 'data-hue': hue })}
        {...(connected ? { 'data-connected': '' } : {})}
        {...(graph?.cordFrom === at ? { 'data-pending': '' } : {})}
        {...(graph?.cordOver === at ? { 'data-over': '' } : {})}
        {...(reach === undefined ? {} : { 'data-reach': reach })}
        disabled={disabled}
        aria-label={label ?? id}
        title={label}
        onPointerDown={down}
        onPointerEnter={() => graph?.hoverPort(id, side)}
        onPointerLeave={() => graph?.hoverPort(null)}
        onKeyDown={key}
      />
      {showLabel && label !== undefined && (
        <Text role="caption" tone="secondary" className="lib-graph__port-label" data-part="label">
          {label}
        </Text>
      )}
    </span>
  );
}

export default Port;
