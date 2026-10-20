// The assembled screen's model: from the spec and the solver's placement, every element the
// screen draws (the root, the ground bands, the room, the zones and each region's slot) with its
// class, attributes and inline declarations, as a view tree (`assembledScreenView`), and the
// handlers it names. No framework: `AssembledScreen.tsx` (React) and `AssembledScreen.svelte`
// (Svelte) each read the screen's state (the measured room, the scope's principles), compute the
// placement with `assembledPlacement` and hand the tree to their `Tree`, each region's content in
// its own slot (`regionSlot(id)`), inside a `FormScope` that hands it the chosen form.
import { surfaceView, type SurfaceModelProps } from '../../primitives/Surface.model';
import { component, each, h, slot, styleText, when, wire, type Bind, type Handlers, type Node } from '../../view/Tree.model';
import type { StyleDecls } from '../style';
import { assemble } from './assemble';
import { FALLBACK_ROOM, type RoomSize } from './room';
import type { Placed, Placement, Principles, Rect, ScreenSpec } from './types';

/** The slot variables an assembled screen sets for app CSS to read: `under` and `over` (unitless px of the slot a pinned region covers at its top or bottom, set inline), `underEdge` (the knob an app sets on the slot to narrow the clip and fade to what the pinned region above really draws, unitless px; the pinned region's edge by default, Assembly.css) and `panelInset` (a floating panel's inset from the room's edges, Assembly.css). */
export const SLOT_VARS = { under: '--lib-under', over: '--lib-over', underEdge: '--lib-under-edge', panelInset: '--lib-panel-inset' } as const;

type Attrs = Record<string, string | undefined>;

/** A rectangle as the unitless custom properties Assembly.css turns into px. */
export const atDecls = (r: Rect): StyleDecls => ({ '--lib-at-x': String(r.x), '--lib-at-y': String(r.y), '--lib-at-w': String(r.w), '--lib-at-h': String(r.h) });

/** One region's slot (`lib-assembled__slot`): its attributes and declarations; `glass` draws a float Surface first. */
export interface SlotView {
  id: string;
  placed: Placed;
  attrs: Attrs;
  style: StyleDecls;
  glass: boolean;
}

/** A zone (`lib-assembled__zone`, `data-part` header or footer) and its slots. */
export interface ZoneView {
  style: StyleDecls;
  slots: SlotView[];
}

export interface AssembledView {
  /** The root: `lib-assembled` plus the caller's class, its role, name and `data-*`. */
  className: string;
  attrs: Attrs;
  /** Each ground band's declarations (a `Surface layer="ground"`, `lib-assembled__band`). */
  bands: StyleDecls[];
  /** The room (`lib-assembled__room`). */
  room: { attrs: Attrs; style: StyleDecls };
  /** The header zone, or null when the spec has none. */
  header: ZoneView | null;
  /** The body zone and its zooming grid (`lib-assembled__body`). */
  body: { style: StyleDecls; gridStyle: StyleDecls; slots: SlotView[] };
  footer: ZoneView | null;
}

/** A region's slot: reaching behind a pinned region above or below, padded as a panel, marked as glass. */
export function slotView(placed: Placed): SlotView {
  // Scrolling behind a pinned region: the slot reaches up to the top of the one above (`--lib-under`, unitless px: how much of the slot's top it covers) and down to the bottom of the one below (`--lib-over`: how much of its bottom).
  const up = placed.under?.reach ?? 0;
  const down = placed.over?.reach ?? 0;
  const rect = up || down ? { ...placed.rect, y: placed.rect.y - up, h: placed.rect.h + up + down } : placed.rect;
  // What scrolls behind is clipped at the pinned region's drawn edge (`--lib-under-pin`, `--lib-over-pin`: px from the slot's top or bottom) and fades in beside it (Assembly.css).
  const inset = placed.inset;
  const style: StyleDecls = {
    ...atDecls(rect),
    ...(up ? { [SLOT_VARS.under]: String(up), '--lib-under-pin': String(placed.under!.edge) } : {}),
    ...(down ? { [SLOT_VARS.over]: String(down), '--lib-over-pin': String(placed.over!.edge) } : {}),
    ...(inset
      ? { '--lib-inset-t': String(inset.top), '--lib-inset-r': String(inset.right), '--lib-inset-b': String(inset.bottom), '--lib-inset-l': String(inset.left) }
      : {}),
  };
  return {
    id: placed.id,
    placed,
    glass: !!placed.glass,
    style,
    attrs: {
      'data-region': placed.id,
      'data-form': placed.form,
      'data-under': placed.under?.id,
      'data-over': placed.over?.id,
      'data-panel': inset ? '' : undefined,
      'data-glass': placed.glass ? '' : undefined,
      'data-under-glass': placed.under?.glass ? '' : undefined,
      'data-over-glass': placed.over?.glass ? '' : undefined,
    },
  };
}

/** Everything the assembled screen draws for `placement` of `spec` (see AssembledScreen.tsx for the job). */
export function assembledView(name: string, spec: ScreenSpec, placement: Placement, className?: string): AssembledView {
  const slots = (part: 'header' | 'body' | 'footer') =>
    placement.order.filter((id) => placement.regions[id].zone === part).map((id) => slotView(placement.regions[id]));
  const { zones } = placement;
  // The room's box in layout px (the design room when scaled); `--lib-scale` draws it at `room`.
  const laidOut = { ...placement.room, w: placement.room.w / placement.scale, h: placement.room.h / placement.scale };
  return {
    className: `lib-assembled${className ? ` ${className}` : ''}`,
    attrs: {
      role: 'group',
      'aria-label': name,
      'data-part': 'screen',
      'data-zoom': placement.zoom.toFixed(3),
      'data-overflow': placement.overflow ? 'true' : undefined,
      'data-aspect': spec.aspect ? spec.aspect.ratio.toFixed(3) : undefined,
    },
    bands: placement.bands.map(atDecls),
    room: {
      attrs: { 'data-part': 'room', 'data-scale': placement.scale === 1 ? undefined : placement.scale.toFixed(3) },
      style: { ...atDecls(laidOut), '--lib-scale': String(placement.scale) },
    },
    header: spec.header?.length ? { style: atDecls(zones.header), slots: slots('header') } : null,
    body: {
      style: atDecls(zones.body),
      gridStyle: { ...atDecls({ x: 0, y: 0, w: placement.layout.w, h: placement.layout.h }), '--lib-zoom': String(placement.zoom) },
      slots: slots('body'),
    },
    footer: spec.footer?.length ? { style: atDecls(zones.footer), slots: slots('footer') } : null,
  };
}

/* ---------- the view tree ---------- */

/** An inline style as a binding gets it: a `style` string (Svelte), or a style object (React's
 *  `CSSProperties`: camel-cased names, numbers in px where React adds them). */
export type StyleInput = string | Readonly<Record<string, string | number | null | undefined>>;

/** Properties React draws a bare number for (no `px`). */
const UNITLESS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'columnCount',
  'columns',
  'fillOpacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'strokeOpacity',
  'strokeWidth',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
]);

/** A style as the tree's `style` attribute: a string as is (trimmed), an object's declarations by
 *  their CSS names; undefined when there is nothing to set. */
export function styleAttr(style: StyleInput | undefined): string | undefined {
  if (style === undefined || typeof style === 'string') return style?.trim() || undefined;
  const decls: StyleDecls = {};
  for (const [name, value] of Object.entries(style)) {
    if (value === null || value === undefined || value === '') continue;
    const css = name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^ms-/, '-ms-');
    decls[css] = typeof value === 'number' && value !== 0 && !name.startsWith('--') && !UNITLESS.has(name) ? `${value}px` : String(value);
  }
  return styleText(decls);
}

/** What the assembled screen decides from, in any framework (each binding adds the regions' content). */
export interface AssembledScreenModelProps {
  /** The screen's accessible name. */
  name: string;
  spec: ScreenSpec;
  /** The room in px. Unset, the screen measures its own box (the `room` store). */
  room?: RoomSize;
  /** The solver's principles. Unset: the nearest ThemeScope's (read by the binding). */
  principles?: Principles;
  className?: string;
  style?: StyleInput;
}

/** The screen's own state, read by each binding: the room its box measured (null until it has) and
 *  the principles it places by (`principles`, else the nearest ThemeScope's). */
export interface AssembledState {
  room: RoomSize | null;
  principles: Principles;
}

/** The placement the screen draws: the spec placed in the given room, else the measured one, else
 *  1440 × 900 (where nothing measures, as in jsdom). */
export function assembledPlacement({ spec, room }: Pick<AssembledScreenModelProps, 'spec' | 'room'>, state: AssembledState): Placement {
  return assemble(spec, room ?? state.room ?? FALLBACK_ROOM, state.principles);
}

/** The slot a region's content fills, by the region's id. */
export const regionSlot = (id: string): string => `region:${id}`;

/** Each placed region's slot fill, by slot name: `fill(id, placed)` (the binding's content for it). */
export function regionFills<T>(placement: Placement, fill: (id: string, placed: Placed) => T): Record<string, T> {
  return Object.fromEntries(placement.order.map((id) => [regionSlot(id), fill(id, placement.regions[id])]));
}

/** A short, stable signature of a placement: the `report` store calls `onPlacement` when it changes. */
export function placementKey(placement: Placement): string {
  const text = JSON.stringify(placement);
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/** A Surface drawn as its element: `surfaceView`'s class and `data-*`, plus `attrs`. */
const surface = (props: SurfaceModelProps, attrs: Record<string, string | undefined>): Node => {
  const view = surfaceView(props);
  return h('div', { class: view.className, ...view.attrs, ...attrs });
};

/** A region's slot: the glass first when it has one, then its content (`regionSlot(id)`) in a
 *  `FormScope` handing it the chosen form and its parts' forms. */
const slotNode = ({ id, placed, attrs, style, glass }: SlotView): Node =>
  h(
    'div',
    { class: 'lib-assembled__slot', ...attrs, style: styleText(style) },
    when(glass, () => surface({ layer: 'float', radius: 'none', className: 'lib-assembled__glass' }, { 'aria-hidden': 'true' })),
    component('FormScope', { form: placed.form, parts: placed.parts }, { slots: { children: [slot(regionSlot(id))] } }),
  );

const zone = (part: 'header' | 'footer', view: ZoneView): Node =>
  h('div', { class: 'lib-assembled__zone', 'data-part': part, style: styleText(view.style) }, each(view.slots, (s) => s.id, slotNode));

/**
 * The tree the assembled screen draws for `placement` (`assembledPlacement`): the root (measuring
 * its own box with the `room` store unless `room` is given, and reporting each new placement with
 * the `report` store), the ground bands, the room, and the header, body and footer zones with a
 * slot per region. See AssembledScreen.tsx for the job.
 */
export function assembledScreenView(props: AssembledScreenModelProps, placement: Placement): Node {
  const view = assembledView(props.name, props.spec, placement, props.className);
  const bind: Bind[] = [...(props.room ? [] : [['room', { onRoom: 'room' }] as Bind]), ['report', { key: placementKey(placement), onReport: 'placement' }]];
  return wire(
    h(
      'div',
      { class: view.className, ...view.attrs, style: styleAttr(props.style) },
      each(view.bands, (_, i) => `band-${i}`, (band) =>
        surface({ layer: 'ground', radius: 'none', className: 'lib-assembled__band' }, { 'data-part': 'band', 'aria-hidden': 'true', style: styleText(band) }),
      ),
      {
        ...h(
          'div',
          { class: 'lib-assembled__room', ...view.room.attrs, style: styleText(view.room.style) },
          view.header ? zone('header', view.header) : null,
          h(
            'div',
            { class: 'lib-assembled__zone', 'data-part': 'body', style: styleText(view.body.style) },
            h('div', { class: 'lib-assembled__body', 'data-part': 'grid', style: styleText(view.body.gridStyle) }, each(view.body.slots, (s) => s.id, slotNode)),
          ),
          view.footer ? zone('footer', view.footer) : null,
        ),
        key: 'room',
      },
    ),
    { bind },
  );
}

/** The handlers the tree names: `room` writes the measured room into the screen's room state,
 *  `placement` hands `placement` to `onPlacement`. */
export function assembledScreenHandlers(
  { onPlacement }: { onPlacement?: (placement: Placement) => void },
  placement: Placement,
  room: { set(room: RoomSize | null): void },
): Handlers {
  return { room: (size: RoomSize) => room.set(size), placement: () => onPlacement?.(placement) };
}
