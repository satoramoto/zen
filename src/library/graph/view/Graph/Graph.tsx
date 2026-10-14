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
import { Text } from '../../../primitives/Text';
import { GraphContext, opposite, portKey, type GraphSurface, type PortSide } from './graphContext';
import { NORMAL, curveRoute, faceToward, route, traceRoute, type GraphFace, type Route } from './route';
import './Graph.css';

export type { PortSide } from './graphContext';
export type { GraphFace } from './route';

export interface GraphCord {
  /** An outlet's `Port` id. */
  from: string;
  /** An inlet's `Port` id. */
  to: string;
  /** Surfaced as `data-kind`, and stroked with `--lib-cord-<kind>` where a host sets it. */
  kind?: string;
  /** The host's id for this cord. With `onDisconnect`, a cord with an id can be selected and deleted. */
  id?: string;
  /** Words printed at the middle of the cord (an event name, `pass`, `feeds`). */
  label?: string;
  /** `modulation` draws the cord dashed (`data-role`), with its `amount` near the inlet. Default `signal`. */
  role?: 'signal' | 'modulation';
  /** A modulation's depth, -1..1, printed as a signed percentage near the inlet. */
  amount?: number;
  /**
   * The id of a `GraphBus` this cord taps: it is drawn as a short stub from that bus's rail to the
   * inlet, and `from` is not drawn to. Unknown, it is drawn from `from` as usual.
   */
  bus?: string;
  /** Drawn quiet (`data-dim`): a cord the host wants read as background. */
  dim?: boolean;
}

/**
 * A named rail one outlet feeds and many inlets tap: drawn as a thick labelled line with the source
 * running into it and each tapping cord (`GraphCord.bus`) a short stub off it, a dot at each joint.
 */
export interface GraphBus {
  id: string;
  /** Printed at the rail's start. */
  label?: string;
  /** Inks the rail like a cord of that kind. */
  kind?: string;
  /** The outlet `Port` id that feeds it; without one the rail is drawn from its taps alone. */
  from?: string;
  /**
   * The rail's line in graph units: horizontal (`h`) at y = `at`, or vertical (`v`) at x = `at`.
   * Default `h`; `at` unset, a horizontal rail runs under every node and a vertical one left of its taps.
   */
  axis?: 'h' | 'v';
  at?: number;
}

/** A labelled frame drawn behind a group of nodes (`GraphNode` ids), padded round their boxes. */
export interface GraphZone {
  id: string;
  label?: string;
  nodes: readonly string[];
}

export interface GraphView {
  /** The current zoom, read at the moment it is needed. */
  scale(): number;
  /**
   * Pan and zoom so every node's box fits the viewport with a small margin, top-left aligned. The
   * zoom is clamped to `[minZoom, max ?? 1]`, so a small patch is never blown up past life size.
   */
  fit(max?: number): void;
  /** Zoom by a factor about the viewport's centre, clamped to `[minZoom, maxZoom]`. */
  zoom?(factor: number): void;
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
  /**
   * Keep the patch fitted (debounced): when the viewport's size changes notably, and when the
   * nodes' faces settle after the first fit (fonts, faces measuring). Stops once the user pans,
   * zooms or drags a node, until the next `fit()`.
   */
  fitOnResize?: boolean;
  /** The canvas's accessible name. */
  label?: string;
  className?: string;
  /**
   * How cords run. `curve` (default): smooth curves. `trace`: circuit-board traces, straight runs
   * with 45° bends. Either way a cord leaves each port along its `face`.
   */
  routing?: 'curve' | 'trace';
  /** Rails that cords tap (`GraphCord.bus`). */
  buses?: readonly GraphBus[];
  /** Labelled frames behind groups of nodes. */
  zones?: readonly GraphZone[];
  /** Where `fit` leaves the patch: `start` (default) top-left, `center` centred in the viewport. */
  fitAlign?: 'start' | 'center';
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Spot {
  x: number;
  y: number;
}

interface Held {
  id: string;
  side: PortSide;
  el: HTMLElement;
  /** The face the port sits on; unset, an outlet faces `e` and an inlet `w`. */
  face?: GraphFace;
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
/** Screen pixels a press must travel before it is a node drag rather than a click. */
const DRAG_SLOP = 3;
/** Graph units a bus tap or source runs square off its port before bending. */
const STUB = 16;
/** Graph units between the lowest node and a horizontal rail placed for itself. */
const RAIL_GAP = 40;

/** A port's face: its own, else the side's edge. */
const faceOf = (held: { side: PortSide; face?: GraphFace } | undefined, side: PortSide): GraphFace =>
  held?.face ?? (side === 'out' ? 'e' : 'w');

/** A modulation amount as a signed whole percentage: `+40%`, `−25%`. */
export function amountText(amount: number): string {
  const pct = Math.round(amount * 100);
  return pct > 0 ? `+${pct}%` : pct < 0 ? `−${-pct}%` : '0%';
}

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
 * `[minZoom, max ?? 1]`; `fitOnResize` re-fits when the viewport's size changes notably or the
 * nodes settle after loading (timer debounced, not frame-driven, so a window behind others still
 * re-fits), until the user pans, zooms or drags a node; the next `fit()` resumes it. A cord drags from either
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
 * - `--lib-graph-ground`: the canvas fill (default transparent). `--lib-graph-rule`: a ruled line every fourth dot (default transparent).
 * - `--lib-graph-rail-width`: a bus rail's stroke on screen (default 2.5 cords). `--lib-graph-joint`: a rail joint's radius; set by the graph.
 * - `--lib-graph-word-fill`: the fill a cord's label knocks out of the line (default `--surface-1`; set it to the canvas's own fill).
 * - `--lib-graph-zone-fill`, `--lib-graph-zone-edge`: a zone frame's tint and dashed edge.
 *
 * **Layers** (all optional). `routing="trace"` draws circuit-board traces (straight runs, 45°
 * bends) instead of curves; either way a cord leaves each port along the port's `face`. A cord's
 * `label` is printed mid-cord (`cord-label`), a modulation (`role: 'modulation'`) is dashed
 * (`data-role`) with its `amount` near the inlet (`cord-amount`), and a `dim` cord recedes. `buses`
 * draws each rail (`bus`: `bus-source`, `rail`, `joint`, `rail-label`) and a cord with `bus` as a
 * stub from the rail to its inlet (`data-bus`). `zones` frames groups of nodes (`zones`: `zone`,
 * `zone-label`), measured from the nodes' boxes (`GraphNode` carries `data-node-id`). Words and
 * frames take no pointer. A node is captured for dragging only once the press has moved a few
 * pixels, so a click on its face stays a click.
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
  routing = 'curve',
  buses,
  zones,
  fitAlign = 'start',
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
  /** Each node's box in graph units, by its id, for zones and rails. Measured only when either is drawn. */
  const boxes = useRef(new Map<string, Box>());
  const sizes = useRef<ResizeObserver | null>(null);
  const [, redraw] = useState(0);

  /** Current values for handlers that outlive a render. */
  const now = useRef({ view, drawing, over, onMove, onConnect, minZoom, maxZoom, fitAlign, boxed: false, fitOnResize });
  const boxed = (zones?.length ?? 0) > 0 || (buses?.length ?? 0) > 0;
  /** The user has panned, zoomed or dragged a node since the last `fit()`: no automatic re-fit. */
  const handled = useRef(false);
  /** The pending automatic re-fit, shared by resizes and settling nodes. */
  const refit = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fitRef = useRef<(max?: number) => void>(() => {});
  const fitLater = useCallback(() => {
    if (!now.current.fitOnResize || handled.current) return;
    clearTimeout(refit.current);
    refit.current = setTimeout(() => {
      if (!handled.current) fitRef.current();
    }, FIT_DEBOUNCE_MS);
  }, []);
  useEffect(() => () => clearTimeout(refit.current), []);

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
    if (now.current.boxed && content.current) {
      const found = new Map<string, Box>();
      for (const node of content.current.querySelectorAll<HTMLElement>(':scope > [data-part="node"][data-node-id]')) {
        const b = node.getBoundingClientRect();
        const box = { x: (b.left - origin.left) / k, y: (b.top - origin.top) / k, w: b.width / k, h: b.height / k };
        const id = node.dataset.nodeId!;
        found.set(id, box);
        const was = boxes.current.get(id);
        if (!was || Math.abs(was.x - box.x) + Math.abs(was.y - box.y) + Math.abs(was.w - box.w) + Math.abs(was.h - box.h) > 0.04) changed = true;
      }
      if (found.size !== boxes.current.size) changed = true;
      boxes.current = found;
    }
    if (changed) {
      redraw((n) => n + 1);
      // Faces that settle after the first fit (a font landing, a face measuring) re-frame it.
      fitLater();
    }
  }, [fitLater]);

  useLayoutEffect(() => {
    now.current = { view, drawing, over, onMove, onConnect, minZoom, maxZoom, fitAlign, boxed, fitOnResize };
    measure();
  });

  useEffect(() => () => sizes.current?.disconnect(), []);

  const register = useCallback(
    (id: string, side: PortSide, el: HTMLElement | null, face?: GraphFace) => {
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
        elements.current.set(at, { id, side, el, ...(face ? { face } : {}) });
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
    // Nodes, and the zone frames and rails drawn round them, so a fitted view never clips a frame.
    for (const node of root.querySelectorAll<Element>('[data-part="node"], [data-part="zone"], [data-part="rail"], [data-part="rail-label"]')) {
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
    // Centred: the slack the zoom leaves split either side instead of all on the far edges.
    const slackX = now.current.fitAlign === 'center' ? (w - (right - left) * next) / 2 : 0;
    const slackY = now.current.fitAlign === 'center' ? (h - (bottom - top) * next) / 2 : 0;
    const x = FIT_MARGIN + Math.max(0, slackX) - left * next;
    const y = FIT_MARGIN + Math.max(0, slackY) - top * next;
    handled.current = false;
    // Already there: no new view, so a re-fit triggered by measuring can't feed itself.
    const v = now.current.view;
    if (Math.abs(v.k - next) < 1e-4 && Math.abs(v.x - x) < 0.5 && Math.abs(v.y - y) < 0.5) return;
    setView({ k: next, x, y });
  }, []);
  fitRef.current = fit;

  /** Zoom about the viewport's centre. */
  const zoom = useCallback((factor: number) => {
    const root = viewport.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const px = box.width / 2;
    const py = box.height / 2;
    handled.current = true;
    setView((v) => {
      const k = clamp(v.k * factor, now.current.minZoom, now.current.maxZoom);
      if (k === v.k) return v;
      return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
    });
  }, []);

  useImperativeHandle(viewRef, () => ({ scale: () => now.current.view.k, fit, zoom }), [fit, zoom]);

  /** Re-fit on a notable, settled size change. A timer, not a frame: a hidden window gets no frames. */
  useEffect(() => {
    const root = viewport.current;
    if (!fitOnResize || !root || typeof ResizeObserver === 'undefined') return;
    let last: { w: number; h: number } | null = null;
    const watch = new ResizeObserver(() => {
      const box = root.getBoundingClientRect();
      if (last && Math.abs(box.width - last.w) < FIT_NOTABLE && Math.abs(box.height - last.h) < FIT_NOTABLE) return;
      last = { w: box.width, h: box.height };
      fitLater();
    });
    watch.observe(root);
    return () => watch.disconnect();
  }, [fitOnResize, fitLater]);

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
      handled.current = true;
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

  /** The selected cord's two ends, so its ports light with it. */
  const lit = useMemo(() => {
    const cord = chosen === null ? undefined : cords?.find((c) => c.id === chosen);
    return cord ? new Set([portKey(cord.from, 'out'), portKey(cord.to, 'in')]) : undefined;
  }, [chosen, cords]);

  const surface = useMemo<GraphSurface>(
    () => ({
      lit,
      register,
      startCord,
      armCord,
      hoverPort,
      cordFrom: drawing?.at ?? null,
      cordWants: wants,
      cordOver: over,
      scale: () => now.current.view.k,
      moveNode: (id, x, y) => {
        handled.current = true;
        now.current.onMove?.(id, x, y);
      },
    }),
    [register, startCord, armCord, hoverPort, drawing?.at, wants, over, lit],
  );

  const selectable = onDisconnect !== undefined;
  const spotOf = (id: string, side: PortSide) => spots.current.get(portKey(id, side));
  const faceAt = (id: string, side: PortSide) => faceOf(elements.current.get(portKey(id, side)), side);

  /** A cord between two ports: the plain `cordPath` for an unfaced curve (today's shape), else routed. */
  const routeOf = (a: Spot, fa: GraphFace, b: Spot, fb: GraphFace): Route => {
    if (routing === 'curve' && fa === 'e' && fb === 'w') return { ...curveRoute(a, fa, b, fb), d: cordPath(a, b) };
    return route(routing, a, fa, b, fb);
  };

  // Rails: each bus's line, its source run and the joints where its taps leave it.
  const nodeBoxes = [...boxes.current.values()];
  const railOf = new Map<string, { at: number; axis: 'h' | 'v' }>();
  const rails = (buses ?? []).flatMap((bus) => {
    const taps = (cords ?? []).filter((c) => c.bus === bus.id);
    const ends = taps.flatMap((c) => {
      const b = spotOf(c.to, 'in');
      return b ? [{ b, fb: faceAt(c.to, 'in') }] : [];
    });
    const src = bus.from ? spotOf(bus.from, 'out') : undefined;
    if (ends.length === 0 && !src) return [];
    const fs = bus.from ? faceAt(bus.from, 'out') : 'e';
    const axis = bus.axis ?? 'h';
    const steps = ends.map(({ b, fb }) => ({ x: b.x + NORMAL[fb].x * STUB, y: b.y + NORMAL[fb].y * STUB }));
    const lead = src ? { x: src.x + NORMAL[fs].x * STUB, y: src.y + NORMAL[fs].y * STUB } : undefined;
    const pts = [...steps, ...(lead ? [lead] : [])];
    const at =
      bus.at ??
      (axis === 'h'
        ? Math.max(...pts.map((p) => p.y), ...nodeBoxes.map((n) => n.y + n.h)) + RAIL_GAP
        : Math.min(...steps.map((p) => p.x), ...(lead ? [lead.x + STUB * 2] : [])) - STUB * 2);
    railOf.set(bus.id, { at, axis });
    const onRail = (p: Spot): Spot => (axis === 'h' ? { x: p.x, y: at } : { x: at, y: p.y });
    const joints = pts.map(onRail);
    const along = joints.map((j) => (axis === 'h' ? j.x : j.y));
    const lo = Math.min(...along) - STUB / 2;
    const hi = Math.max(...along) + STUB / 2;
    const line = axis === 'h' ? `M ${lo} ${at} L ${hi} ${at}` : `M ${at} ${lo} L ${at} ${hi}`;
    const source =
      src && lead ? traceRoute(src, fs, onRail(lead), faceToward(lead.x - onRail(lead).x, lead.y - onRail(lead).y), STUB) : null;
    return [{ bus, line, joints, source, start: axis === 'h' ? { x: lo, y: at } : { x: at, y: lo } }];
  });

  const drawn = (cords ?? []).flatMap((cord) => {
    const b = spotOf(cord.to, 'in');
    if (!b) return [];
    const fb = faceAt(cord.to, 'in');
    const rail = cord.bus ? railOf.get(cord.bus) : undefined;
    if (rail) {
      // A tap: square off the inlet, then straight to the rail.
      const step = { x: b.x + NORMAL[fb].x * STUB, y: b.y + NORMAL[fb].y * STUB };
      const joint = rail.axis === 'h' ? { x: step.x, y: rail.at } : { x: rail.at, y: step.y };
      return [{ cord, path: traceRoute(joint, faceToward(step.x - joint.x, step.y - joint.y), b, fb, STUB) }];
    }
    const a = spotOf(cord.from, 'out');
    return a ? [{ cord, path: routeOf(a, faceAt(cord.from, 'out'), b, fb) }] : [];
  });

  // The cord in flight is drawn outlet end first either way, so it has a landed cord's shape and
  // doesn't flip the moment it connects.
  const anchor = drawing ? spots.current.get(drawing.at) : undefined;
  const anchorFace = drawing ? faceOf(elements.current.get(drawing.at), drawing.side) : 'e';
  const loose =
    drawing && anchor
      ? routing === 'curve' && anchorFace === (drawing.side === 'out' ? 'e' : 'w')
        ? drawing.side === 'out'
          ? cordPath(anchor, drawing)
          : cordPath(drawing, anchor)
        : drawing.side === 'out'
          ? route(routing, anchor, anchorFace, drawing, faceToward(anchor.x - drawing.x, anchor.y - drawing.y)).d
          : route(routing, drawing, faceToward(anchor.x - drawing.x, anchor.y - drawing.y), anchor, anchorFace).d
      : null;

  // Zone frames: the union of their nodes' boxes; the padding is the stylesheet's.
  const frames = (zones ?? []).flatMap((zone) => {
    const members = zone.nodes.flatMap((id) => {
      const box = boxes.current.get(id);
      return box ? [box] : [];
    });
    if (members.length === 0) return [];
    const x = Math.min(...members.map((m) => m.x));
    const y = Math.min(...members.map((m) => m.y));
    const w = Math.max(...members.map((m) => m.x + m.w)) - x;
    const h = Math.max(...members.map((m) => m.y + m.h)) - y;
    return [{ zone, x, y, w, h }];
  });

  /** Words on the canvas: cord labels at their middles, amounts near their inlets, rail names at their starts. */
  const words = [
    ...drawn.flatMap(({ cord, path }) => {
      const key = cord.id ?? `${cord.from} ${cord.to}`;
      const kind = cord.kind ? { 'data-kind': cord.kind, style: { '--lib-cord-ink': cordInk(cord.kind) } as CSSProperties } : {};
      const out: ReactNode[] = [];
      const on = cord.id !== undefined && chosen === cord.id ? { 'data-selected': '' } : {};
      if (cord.label)
        out.push(
          <span
            key={`label ${key}`}
            className="lib-graph__word"
            data-part="cord-label"
            {...kind}
            {...on}
            {...(cord.dim ? { 'data-dim': '' } : {})}
            style={{ ...(kind.style ?? {}), left: `${path.mid.x}px`, top: `${path.mid.y}px` }}
          >
            <Text role="caption" truncate>
              {cord.label}
            </Text>
          </span>,
        );
      if (cord.role === 'modulation' && cord.amount !== undefined)
        out.push(
          <span
            key={`amount ${key}`}
            className="lib-graph__word"
            data-part="cord-amount"
            {...kind}
            {...on}
            style={{ ...(kind.style ?? {}), left: `${path.near.x}px`, top: `${path.near.y}px` }}
          >
            <Text role="caption">{amountText(cord.amount)}</Text>
          </span>,
        );
      return out;
    }),
    ...rails.flatMap(({ bus, start }) =>
      bus.label
        ? [
            <span
              key={`rail ${bus.id}`}
              className="lib-graph__word"
              data-part="rail-label"
              data-axis={railOf.get(bus.id)?.axis}
              {...(bus.kind ? { 'data-kind': bus.kind } : {})}
              style={{ ...(bus.kind ? { '--lib-cord-ink': cordInk(bus.kind) } : {}), left: `${start.x}px`, top: `${start.y}px` } as CSSProperties}
            >
              <Text role="caption" case="label" truncate>
                {bus.label}
              </Text>
            </span>,
          ]
        : [],
    ),
  ];

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
        handled.current = true;
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
        {frames.length > 0 && (
          <div className="lib-graph__zones" data-part="zones" aria-hidden="true">
            {frames.map(({ zone, x, y, w, h }) => (
              <div key={zone.id} className="lib-graph__zone-at" style={{ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }}>
                <div className="lib-graph__zone" data-part="zone" data-zone-id={zone.id}>
                  {zone.label && (
                    <Text role="caption" case="label" tone="muted" truncate className="lib-graph__zone-label" data-part="zone-label">
                      {zone.label}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <svg className="lib-graph__cords" data-part="cords" {...(selectable ? {} : { 'aria-hidden': true })}>
          {rails.map(({ bus, line, joints, source }) => (
            <g
              key={`rail ${bus.id}`}
              className="lib-graph__bus"
              data-part="bus"
              data-bus-id={bus.id}
              aria-hidden="true"
              {...(bus.kind ? { 'data-kind': bus.kind } : {})}
              style={bus.kind ? ({ '--lib-cord-ink': cordInk(bus.kind) } as CSSProperties) : undefined}
            >
              {source && <path className="lib-graph__cord" data-part="bus-source" d={source.d} />}
              <path className="lib-graph__rail" data-part="rail" d={line} />
              {joints.map((j, i) => (
                <circle key={i} className="lib-graph__joint" data-part="joint" cx={j.x} cy={j.y} />
              ))}
            </g>
          ))}
          {drawn.map(({ cord, path }) => {
            const d = path.d;
            const inked = {
              ...(cord.kind ? { 'data-kind': cord.kind, style: { '--lib-cord-ink': cordInk(cord.kind) } as CSSProperties } : {}),
              ...(cord.role === 'modulation' ? { 'data-role': 'modulation' } : {}),
              ...(cord.bus && railOf.has(cord.bus) ? { 'data-bus': cord.bus } : {}),
              ...(cord.dim ? { 'data-dim': '' } : {}),
            };
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
                  aria-label={`Cord ${cord.from} to ${cord.to}${cord.label ? `, ${cord.label}` : ''}`}
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
        {words.length > 0 && (
          <div className="lib-graph__words" data-part="words" aria-hidden="true">
            {words}
          </div>
        )}
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
  const drag = useRef<{ id: number; fromX: number; fromY: number; atX: number; atY: number; held: boolean } | null>(null);

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!graph || e.button !== 0 || e.defaultPrevented) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    // The pointer is captured only once it has moved: capturing on the press would retarget the
    // click that follows to the node, and a click on the face (its name, to select it) is lost.
    drag.current = { id: e.pointerId, fromX: e.clientX, fromY: e.clientY, atX: x, atY: y, held: false };
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || held.id !== e.pointerId || !graph) return;
    if (!held.held) {
      if (Math.hypot(e.clientX - held.fromX, e.clientY - held.fromY) < DRAG_SLOP) return;
      held.held = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
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
      data-node-id={id}
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
