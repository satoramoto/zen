// The assembled screen's model: from the spec and the solver's placement, every element the
// screen draws (the root, the ground bands, the room, the zones and each region's slot) with its
// class, attributes and inline declarations. No framework: `AssembledScreen.tsx` (React) and
// `AssembledScreen.svelte` (Svelte) both render `assembledView`, adding each slot's content.
import type { StyleDecls } from '../style';
import type { Placed, Placement, Rect, ScreenSpec } from './types';

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
