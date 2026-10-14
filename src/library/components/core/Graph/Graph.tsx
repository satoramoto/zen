import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { GraphContext, opposite, portKey, type GraphSurface, type PortSide } from './graphContext';
import './Graph.css';

export type { PortSide } from './graphContext';

export interface GraphCord {
  /** An outlet's `Port` id. */
  from: string;
  /** An inlet's `Port` id. */
  to: string;
  /** Surfaced as `data-kind`, and stroked with `--lib-cord-<kind>` where a host sets it. */
  kind?: string;
  /** The host's id for this cord. With `onDisconnect`, a cord with an id can be selected and deleted. */
  id?: string;
}

export interface GraphView {
  /** The current zoom, read at the moment it is needed. */
  scale(): number;
  /**
   * Pan and zoom so every node's box fits the viewport with a small margin, top-left aligned. The
   * zoom is clamped to `[minZoom, max ?? 1]`, so a small patch is never blown up past life size.
   */
  fit(max?: number): void;
}

export interface GraphProps {
  /** `GraphNode`s. */
  children?: ReactNode;
  /** Every cord to draw. One naming a port that isn't mounted is skipped, not dropped. */
  cords?: readonly GraphCord[];
  /** A node was dragged, or arrow-keyed, to a new position (graph units). */
  onMove?(id: string, x: number, y: number): void;
  /** A cord was made between two ports: always outlet first, whichever end the gesture started at. */
  onConnect?(from: string, to: string): void;
  /** The empty canvas was pressed, for a host that clears a selection on it. */
  onClearSelection?(): void;
  /**
   * A selected cord (one with an `id`) was deleted with Delete or Backspace. Without it, cords
   * aren't selectable and behave exactly as before.
   */
  onDisconnect?(cordId: string): void;
  /** A read-only view of the canvas, plus `fit`. Pan and zoom stay the graph's. */
  viewRef?: Ref<GraphView>;
  minZoom?: number;
  maxZoom?: number;
  /** Re-fit when the viewport's size changes notably (debounced). */
  fitOnResize?: boolean;
  /** The canvas's accessible name. */
  label?: string;
  className?: string;
}

interface Spot {
  x: number;
  y: number;
}

interface Held {
  id: string;
  side: PortSide;
  el: HTMLElement;
}

interface Drawing {
  /** Its `portKey`. */
  at: string;
  id: string;
  side: PortSide;
  /** The free end, in graph units. */
  x: number;
  y: number;
}

interface View {
  x: number;
  y: number;
  k: number;
}

const NUDGE: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * A pointer landing inside one of these means a control has taken it, not "drag the node". A list
 * of interactive HTML, never of anything this module defines, so the graph never learns what a
 * node's face is.
 */
const INTERACTIVE =
  'button, input, select, textarea, a[href], [contenteditable=""], [contenteditable="true"], [role="slider"], [role="radio"], [role="spinbutton"], [role="switch"], [role="checkbox"]';

/** Where an arrow key means something else than "move the node". */
const IGNORES_ARROWS =
  'input, select, textarea, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="radio"], [role="spinbutton"], [role="listbox"], [role="menu"], .lib-graph__port';

/** Screen pixels of landing room around a port's dot when a drag is let go. */
const LANDING = 7;
/** Screen pixels left around the patch by `fit`. */
const FIT_MARGIN = 16;
/** How long the viewport's size must hold still before `fitOnResize` re-fits. */
const FIT_DEBOUNCE_MS = 120;
/** A size change smaller than this (screen pixels, either axis) isn't worth a re-fit. */
const FIT_NOTABLE = 4;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * One cord's path, outlet end `a` to inlet end `b`: a cubic whose control points leave `a` to the
 * right and arrive at `b` from the left, reaching at least 30 graph units.
 */
export function cordPath(a: Spot, b: Spot): string {
  const reach = Math.max(30, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + reach} ${a.y}, ${b.x - reach} ${b.y}, ${b.x} ${b.y}`;
}

/**
 * A cord's ink by kind: `--lib-cord-<kind>` where a host set it, else `--lib-cord`. Characters a
 * custom property name can't hold become `-`; an empty kind is no kind. The per-kind property is
 * the host's own vocabulary, so the library never declares one.
 */
export function cordInk(kind: string | undefined): string {
  if (!kind) return 'var(--lib-cord)';
  const own = `--lib-cord-${kind.replace(/[^\w-]/g, '-')}`;
  return `var(${own}, var(--lib-cord))`;
}

/**
 * The content box's style for a view. CSS `zoom` lays nodes out again at the new size (crisp,
 * where `scale()` magnifies a bitmap); a translate on a zoomed box is in its zoomed pixels, so the
 * pan is divided by the zoom.
 */
function contentStyle(view: View): CSSProperties {
  return { zoom: view.k, transform: `translate(${view.x / view.k}px, ${view.y / view.k}px)` };
}

/**
 * A node-graph canvas: nodes the host places, ports on them, cords between ports.
 *
 * **Job.** The layout a chain becomes when the order stops being a line. It takes children (any
 * face in a `GraphNode`), never a list of things, so it never learns what they are. It marks and
 * reports; it does not perform: a dragged node emits `onMove` and stays put until the host passes
 * new `x`/`y`, and a cord made between two ports emits `onConnect` and is drawn only once the host
 * passes it back in `cords`. That makes refusing a move or a connection free. **The one rule it
 * enforces is sides**: an outlet connects to an inlet. Whether this outlet may reach that inlet
 * is about what they carry, which is the host's.
 *
 * **Behaviour.** Pan by dragging the empty canvas; zoom with the wheel about the pointer (a
 * native, non-passive listener, so the page behind doesn't scroll), clamped to
 * `[minZoom, maxZoom]`. Pan and zoom are the graph's own: `viewRef` reads the zoom (`scale()`)
 * and asks for `fit(max?)`, which frames every node top-left with a small margin, zoom clamped to
 * `[minZoom, max ?? 1]`; `fitOnResize` re-fits when the viewport's size changes notably (timer
 * debounced, not frame-driven, so a window behind others still re-fits). A cord drags from either
 * end and is normalised outlet → inlet on its way out; the release resolves against the measured
 * ports with a little landing room, so a quick drag isn't lost to a hover race. Keyboard: Enter
 * (or Space) on a port arms it, Enter on a port of the other side lands the cord, Escape drops it;
 * a same-side landing is refused. Arrow keys move a node from its own focusable head (8 units,
 * Shift 1); the node adds no tab stop of its own. A node drags from anywhere a control hasn't
 * claimed: a `preventDefault`ed pointerdown or one inside interactive HTML. With `onDisconnect`,
 * a cord with an `id` is a tab stop (`role="button"`): a click or focus selects it
 * (`data-selected`), Delete or Backspace hands its id to `onDisconnect`, Escape or a press on the
 * empty canvas clears the selection. The cord stays drawn until the host drops it from `cords`.
 *
 * Coordinates: the viewport holds a 0×0 content origin carrying `zoom: k` and the pan, so its
 * `getBoundingClientRect()` is graph (0, 0) on screen and every conversion is a subtraction and a
 * divide by `k` (true under standardised CSS `zoom`: Chromium 128+, Firefox 126+, WebKit). Port
 * geometry is measured into a ref, re-measured after each commit and by a `ResizeObserver` on the
 * ports, and a redraw happens only when a measurement changed.
 *
 * **Parts.** `viewport` (the root, `.lib-graph`, `data-panning` while panning): the clip and the
 * dotted grid. `content`: the zoomed, panned origin. `cords`: the SVG layer (no pointer events);
 * each `cord` carries `data-kind`, the one in flight `data-pending`; a selectable cord also
 * carries `data-cord-id` and `data-selectable`, and a wider invisible `cord-hit` path under it. `node`: one `GraphNode`.
 * Ports are `Port` buttons inside nodes.
 *
 * **Tuning knobs**
 * - `--lib-cord`: the ink of a cord with no kind, and of the cord in flight. Default `--text-3`. Set it on the graph (`className`).
 * - `--lib-cord-*`: `--lib-cord-<kind>` strokes every cord of that kind; set it on the graph or above. Unset, the cord uses `--lib-cord`.
 * - `--lib-cord-ink`: set inline per cord from its kind (`cordInk`); not for hosts.
 * - `--lib-graph-cord-width`: a cord's stroke on screen, divided by the zoom so it stays that width.
 * - `--lib-graph-grid`: the dot spacing in graph units. `--lib-graph-dot`: the dot ink (default `--border`).
 * - `--lib-graph-port-*` (`-size`, `-ink`): a port's dot size, and the fill of a connected port; `-ink` may be set around a node.
 * - `--lib-graph-zoom`, `--lib-graph-x`, `--lib-graph-y`: published inline by the graph (zoom, pan); read them, don't set them.
 */
export function Graph({
  children,
  cords,
  onMove,
  onConnect,
  onClearSelection,
  onDisconnect,
  viewRef,
  minZoom = 0.25,
  maxZoom = 3,
  fitOnResize = false,
  label,
  className,
}: GraphProps) {
  const viewport = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);

  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  /** The selected cord's id, when cords are selectable. */
  const [chosen, setChosen] = useState<string | null>(null);

  /** Registered port elements and where they last measured, by `portKey`. Refs, not state. */
  const elements = useRef(new Map<string, Held>());
  const spots = useRef(new Map<string, Spot>());
  const sizes = useRef<ResizeObserver | null>(null);
  const [, redraw] = useState(0);

  /** Current values for handlers that outlive a render. */
  const now = useRef({ view, drawing, over, onMove, onConnect, minZoom });

  const measure = useCallback(() => {
    const origin = content.current?.getBoundingClientRect();
    if (!origin) return;
    const k = now.current.view.k;
    const next = new Map<string, Spot>();
    let changed = elements.current.size !== spots.current.size;
    for (const [at, { el }] of elements.current) {
      const box = el.getBoundingClientRect();
      const spot = { x: (box.left + box.width / 2 - origin.left) / k, y: (box.top + box.height / 2 - origin.top) / k };
      next.set(at, spot);
      const was = spots.current.get(at);
      if (!was || Math.abs(was.x - spot.x) > 0.01 || Math.abs(was.y - spot.y) > 0.01) changed = true;
    }
    spots.current = next;
    if (changed) redraw((n) => n + 1);
  }, []);

  useLayoutEffect(() => {
    now.current = { view, drawing, over, onMove, onConnect, minZoom };
    measure();
  });

  useEffect(() => () => sizes.current?.disconnect(), []);

  const register = useCallback(
    (id: string, side: PortSide, el: HTMLElement | null) => {
      const at = portKey(id, side);
      const held = elements.current.get(at);
      if (held) {
        sizes.current?.unobserve(held.el);
        elements.current.delete(at);
      }
      if (el) {
        // A port moves when its face resizes, a font lands, or a host swaps a face; none of
        // those re-render the graph, so the elements themselves are watched.
        if (!sizes.current && typeof ResizeObserver !== 'undefined') sizes.current = new ResizeObserver(() => measure());
        elements.current.set(at, { id, side, el });
        sizes.current?.observe(el);
      }
      measure();
    },
    [measure],
  );

  /** A screen point as a graph point. */
  const toGraph = useCallback((clientX: number, clientY: number): Spot => {
    const origin = content.current?.getBoundingClientRect();
    if (!origin) return { x: 0, y: 0 };
    const k = now.current.view.k;
    return { x: (clientX - origin.left) / k, y: (clientY - origin.top) / k };
  }, []);

  /**
   * Frame every node. Boxes are read from the DOM against the rendered zoom, so the result is
   * absolute: calling it twice lands in the same place.
   */
  const fit = useCallback((max?: number) => {
    const root = viewport.current;
    const origin = content.current?.getBoundingClientRect();
    if (!root || !origin) return;
    const k = now.current.view.k;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const node of root.querySelectorAll<HTMLElement>('[data-part="node"]')) {
      if (node.closest('.lib-graph') !== root) continue;
      const box = node.getBoundingClientRect();
      left = Math.min(left, (box.left - origin.left) / k);
      top = Math.min(top, (box.top - origin.top) / k);
      right = Math.max(right, (box.right - origin.left) / k);
      bottom = Math.max(bottom, (box.bottom - origin.top) / k);
    }
    if (!Number.isFinite(left)) return;
    const frame = root.getBoundingClientRect();
    const w = frame.width - FIT_MARGIN * 2;
    const h = frame.height - FIT_MARGIN * 2;
    if (w <= 0 || h <= 0) return;
    const lo = now.current.minZoom;
    const hi = Math.max(lo, max ?? 1);
    const fitted = Math.min(w / Math.max(right - left, 1), h / Math.max(bottom - top, 1));
    const next = clamp(fitted, lo, hi);
    setView({ k: next, x: FIT_MARGIN - left * next, y: FIT_MARGIN - top * next });
  }, []);

  useImperativeHandle(viewRef, () => ({ scale: () => now.current.view.k, fit }), [fit]);

  /** Re-fit on a notable, settled size change. A timer, not a frame: a hidden window gets no frames. */
  useEffect(() => {
    const root = viewport.current;
    if (!fitOnResize || !root || typeof ResizeObserver === 'undefined') return;
    let last: { w: number; h: number } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const watch = new ResizeObserver(() => {
      const box = root.getBoundingClientRect();
      if (last && Math.abs(box.width - last.w) < FIT_NOTABLE && Math.abs(box.height - last.h) < FIT_NOTABLE) return;
      last = { w: box.width, h: box.height };
      clearTimeout(timer);
      timer = setTimeout(() => fit(), FIT_DEBOUNCE_MS);
    });
    watch.observe(root);
    return () => {
      clearTimeout(timer);
      watch.disconnect();
    };
  }, [fitOnResize, fit]);

  /**
   * Land a cord if the target is the end it's missing. The pair is sorted before the host sees it:
   * `from` is the outlet, `to` the inlet, whichever end the hand started at. Same side is refused.
   */
  const land = useCallback((target: string | null) => {
    const held = now.current.drawing;
    now.current.drawing = null;
    setDrawing(null);
    if (!held || !target || target === held.at) return;
    const other = elements.current.get(target);
    if (!other || other.side !== opposite(held.side)) return;
    const [from, to] = held.side === 'out' ? [held.id, other.id] : [other.id, held.id];
    now.current.onConnect?.(from, to);
  }, []);

  const startCord = useCallback(
    (id: string, side: PortSide, e: ReactPointerEvent<HTMLElement>) => {
      const next = { at: portKey(id, side), id, side, ...toGraph(e.clientX, e.clientY) };
      now.current.drawing = next;
      setDrawing(next);
    },
    [toGraph],
  );

  const armCord = useCallback(
    (id: string, side: PortSide) => {
      const at = portKey(id, side);
      if (now.current.drawing) {
        land(at);
        return;
      }
      const spot = spots.current.get(at);
      const next = { at, id, side, x: spot?.x ?? 0, y: spot?.y ?? 0 };
      now.current.drawing = next;
      setDrawing(next);
    },
    [land],
  );

  const hoverPort = useCallback((id: string | null, side?: PortSide) => {
    setOver(id !== null && side ? portKey(id, side) : null);
  }, []);

  /** The nearest port of the wanted side under a released pointer, with landing room. */
  const targetAt = useCallback((clientX: number, clientY: number, from: PortSide) => {
    const wanted = opposite(from);
    let nearest: { at: string; distance: number } | null = null;
    for (const [at, held] of elements.current) {
      if (held.side !== wanted || held.el.matches(':disabled')) continue;
      const box = held.el.getBoundingClientRect();
      if (
        clientX < box.left - LANDING ||
        clientX > box.right + LANDING ||
        clientY < box.top - LANDING ||
        clientY > box.bottom + LANDING
      )
        continue;
      const distance = Math.hypot(clientX - (box.left + box.width / 2), clientY - (box.top + box.height / 2));
      if (!nearest || distance < nearest.distance) nearest = { at, distance };
    }
    return nearest?.at ?? null;
  }, []);

  /** While a cord is out, the whole document is somewhere it can be let go, and Escape drops it. */
  const drawingOut = drawing !== null;
  useEffect(() => {
    if (!drawingOut) return;
    const move = (e: PointerEvent) => {
      setDrawing((held) => (held ? { ...held, ...toGraph(e.clientX, e.clientY) } : held));
    };
    const up = (e: PointerEvent) => {
      const held = now.current.drawing;
      land(held ? (targetAt(e.clientX, e.clientY, held.side) ?? now.current.over) : null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      now.current.drawing = null;
      setDrawing(null);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('keydown', key);
    };
  }, [drawingOut, toGraph, land, targetAt]);

  /** Zoom about the pointer, natively: React's wheel listener is passive and can't stop the page. */
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      setView((v) => {
        const k = clamp(v.k * Math.exp(-e.deltaY * 0.0015), minZoom, maxZoom);
        if (k === v.k) return v;
        // Hold the graph point under the cursor where it is.
        return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [minZoom, maxZoom]);

  const pan = useRef<{ id: number; fromX: number; fromY: number; atX: number; atY: number } | null>(null);

  /** Which side the cord in flight is short of, so ports can mark whether they could take it. */
  const wants = drawing ? opposite(drawing.side) : null;

  const surface = useMemo<GraphSurface>(
    () => ({
      register,
      startCord,
      armCord,
      hoverPort,
      cordFrom: drawing?.at ?? null,
      cordWants: wants,
      cordOver: over,
      scale: () => now.current.view.k,
      moveNode: (id, x, y) => now.current.onMove?.(id, x, y),
    }),
    [register, startCord, armCord, hoverPort, drawing?.at, wants, over],
  );

  const selectable = onDisconnect !== undefined;
  const drawn = (cords ?? []).flatMap((cord) => {
    const a = spots.current.get(portKey(cord.from, 'out'));
    const b = spots.current.get(portKey(cord.to, 'in'));
    return a && b ? [{ cord, d: cordPath(a, b) }] : [];
  });

  // The cord in flight is drawn outlet end first either way, so it has a landed cord's shape and
  // doesn't flip the moment it connects.
  const anchor = drawing ? spots.current.get(drawing.at) : undefined;
  const loose =
    drawing && anchor
      ? drawing.side === 'out'
        ? cordPath(anchor, drawing)
        : cordPath(drawing, anchor)
      : null;

  return (
    <div
      ref={viewport}
      className={`lib-graph${className ? ` ${className}` : ''}`}
      data-part="viewport"
      role="group"
      aria-label={label}
      {...(panning ? { 'data-panning': '' } : {})}
      style={
        {
          '--lib-graph-x': `${view.x}px`,
          '--lib-graph-y': `${view.y}px`,
          '--lib-graph-zoom': view.k,
        } as CSSProperties
      }
      onPointerDown={(e) => {
        // Only the empty canvas pans: nodes are real boxes and are their own targets.
        if (e.target !== e.currentTarget || e.button > 1) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        pan.current = { id: e.pointerId, fromX: e.clientX, fromY: e.clientY, atX: view.x, atY: view.y };
        setPanning(true);
        setChosen(null);
        onClearSelection?.();
      }}
      onPointerMove={(e) => {
        const held = pan.current;
        if (!held || held.id !== e.pointerId) return;
        setView((v) => ({ ...v, x: held.atX + (e.clientX - held.fromX), y: held.atY + (e.clientY - held.fromY) }));
      }}
      onPointerUp={(e) => {
        if (pan.current?.id !== e.pointerId) return;
        pan.current = null;
        setPanning(false);
      }}
      onPointerCancel={() => {
        pan.current = null;
        setPanning(false);
      }}
    >
      <div ref={content} className="lib-graph__content" data-part="content" style={contentStyle(view)}>
        <svg className="lib-graph__cords" data-part="cords" {...(selectable ? {} : { 'aria-hidden': true })}>
          {drawn.map(({ cord, d }) => {
            const inked = cord.kind ? { 'data-kind': cord.kind, style: { '--lib-cord-ink': cordInk(cord.kind) } as CSSProperties } : {};
            const id = cord.id;
            if (!selectable || id === undefined)
              return (
                <path
                  key={id ?? `${cord.from} ${cord.to}`}
                  className="lib-graph__cord"
                  data-part="cord"
                  d={d}
                  {...(selectable ? { 'aria-hidden': true } : {})}
                  {...inked}
                />
              );
            const pick = (e: ReactPointerEvent<SVGPathElement>) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              setChosen(id);
              e.currentTarget.parentElement?.querySelector<SVGPathElement>(`[data-cord-id="${CSS.escape(id)}"]`)?.focus();
            };
            const selected = chosen === id;
            return (
              <g key={id}>
                <path className="lib-graph__cord-hit" data-part="cord-hit" d={d} aria-hidden="true" onPointerDown={pick} />
                <path
                  className="lib-graph__cord"
                  data-part="cord"
                  data-cord-id={id}
                  data-selectable=""
                  {...(selected ? { 'data-selected': '' } : {})}
                  d={d}
                  role="button"
                  tabIndex={0}
                  aria-label={`Cord ${cord.from} to ${cord.to}`}
                  aria-pressed={selected}
                  onPointerDown={pick}
                  onFocus={() => setChosen(id)}
                  onBlur={() => setChosen((was) => (was === id ? null : was))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setChosen(null);
                    } else if ((e.key === 'Delete' || e.key === 'Backspace') && chosen === id) {
                      e.preventDefault();
                      setChosen(null);
                      onDisconnect?.(id);
                    } else if ((e.key === 'Enter' || e.key === ' ') && chosen !== id) {
                      e.preventDefault();
                      setChosen(id);
                    }
                  }}
                  {...inked}
                />
              </g>
            );
          })}
          {loose && <path className="lib-graph__cord" data-part="cord" data-pending="" d={loose} />}
        </svg>
        <GraphContext.Provider value={surface}>{children}</GraphContext.Provider>
      </div>
    </div>
  );
}

export interface GraphNodeProps {
  /** The host's own id for this node; only ever handed back to it. */
  id: string;
  /** Position in graph units, before zoom. */
  x: number;
  y: number;
  /** The node's face. Whatever it is, it is the size it wants to be. */
  children?: ReactNode;
  className?: string;
}

/**
 * One node's place on the canvas, absolutely placed at (`x`, `y`) in graph units. A drag reports
 * `onMove` through the graph and the node moves only when the host passes new `x`/`y`. It drags
 * from anywhere a control hasn't claimed (no handle); arrow keys from a focusable element inside
 * it (its head) move it by 8 units, Shift by 1.
 */
export function GraphNode({ id, x, y, children, className }: GraphNodeProps) {
  const graph = useContext(GraphContext);
  const drag = useRef<{ id: number; fromX: number; fromY: number; atX: number; atY: number } | null>(null);

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!graph || e.button !== 0 || e.defaultPrevented) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, fromX: e.clientX, fromY: e.clientY, atX: x, atY: y };
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || held.id !== e.pointerId || !graph) return;
    const k = graph.scale();
    graph.moveNode(id, held.atX + (e.clientX - held.fromX) / k, held.atY + (e.clientY - held.fromY) / k);
  };

  // Also on lost capture: a drag left open would resume the next time the pointer crossed it.
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = NUDGE[e.key];
    if (!step || !graph || e.defaultPrevented) return;
    if ((e.target as HTMLElement).closest(IGNORES_ARROWS)) return;
    e.preventDefault();
    const by = e.shiftKey ? 1 : 8;
    graph.moveNode(id, x + step[0] * by, y + step[1] * by);
  };

  return (
    <div
      className={`lib-graph__node${className ? ` ${className}` : ''}`}
      data-part="node"
      style={{ left: `${x}px`, top: `${y}px` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onKeyDown={key}
    >
      {children}
    </div>
  );
}

export default Graph;
