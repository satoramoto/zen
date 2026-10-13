import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { PackPrinciples } from '../../contract';
import { useThemeScope } from '../../theme';
import { packs } from '../../themes/packs';
import { Surface } from '../../primitives/Surface';
import { assemble } from './assemble';
import { FormProvider } from './forms';
import type { Placed, Placement, Principles, Rect, ScreenSpec } from './types';
import { principlesFor } from './units';
import './Assembly.css';

/** What the screen draws in a region's place: content, or a function of the chosen form. */
export type RegionContent = ReactNode | ((form: string, placed: Placed) => ReactNode);

export interface AssembledScreenProps {
  /** The screen's accessible name. */
  name: string;
  spec: ScreenSpec;
  /** What goes in each region, by id. The chosen form reaches it through `useForm()` as well. */
  regions: Record<string, RegionContent>;
  /** The room in px. Unset, the screen measures its own box (and uses 1440 × 900 where nothing measures, as in jsdom). */
  room?: { w: number; h: number };
  /** The solver's principles. Unset: the nearest ThemeScope's facets and pack principles. */
  principles?: Principles;
  /** Called with each new placement (the inspector, tests). */
  onPlacement?: (placement: Placement) => void;
  className?: string;
  style?: CSSProperties;
}

/** The board's size, where nothing can measure the room. */
const FALLBACK_ROOM = { w: 1440, h: 900 };

/** The room's px from the screen's own box, kept current. */
function useRoom(given?: { w: number; h: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (given || !node || typeof ResizeObserver === 'undefined') return;
    const read = () => {
      const w = node.clientWidth;
      const h = node.clientHeight;
      if (w > 0 && h > 0) setRoom((r) => (r && r.w === w && r.h === h ? r : { w, h }));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [given]);
  return [ref, given ?? room ?? FALLBACK_ROOM] as const;
}

/**
 * The nearest ThemeScope's principles resolved (the first pack's outside one), as the assembled
 * screen reads them: so a screen can turn a placed rect into its content's px (less the plate).
 */
export function useScopePrinciples(given?: Principles): Principles {
  const scope = useThemeScope();
  return useMemo(() => {
    if (given) return given;
    const facets = scope?.facets ?? packs[0].facets;
    const pack: PackPrinciples = scope?.principles ?? packs.find((p) => p.facets === facets)?.principles ?? packs[0].principles;
    return principlesFor(facets, pack);
  }, [given, scope]);
}

/** A rectangle as the unitless custom properties Assembly.css turns into px. */
const at = (r: Rect): CSSProperties =>
  ({ '--lib-at-x': r.x, '--lib-at-y': r.y, '--lib-at-w': r.w, '--lib-at-h': r.h }) as CSSProperties;

/**
 * **Job.** A screen that assembles itself: the regions' declared forms, the screen's intent (`spec`)
 * and the system's principles go to `assemble()`, and each region is drawn where the placement puts
 * it, in its chosen form. The header and footer are fixed; only the body zooms, and only as the last
 * resort. No grid, no ratios, no screen CSS.
 *
 * Each region's slot is absolutely placed; its content fills it (a `Region` stretches to it). The
 * slot carries `data-region` and `data-form`; the root carries `data-zoom` and `data-overflow`.
 *
 * The zones sit in the room (`data-part="room"`): the whole box, or with `spec.aspect` the largest
 * room of that ratio, centred. The leftover strips are `ground` bands (`data-part="band"`): no
 * plate, nothing in them, hidden from assistive tech.
 *
 * A region placed `under` another (`RegionSpec.under`) has its slot drawn reaching up to that
 * region's top and after it, so above it: `data-under` names the pinned region and `--lib-under`
 * (unitless px) is how much of the slot's top it covers, for the content's scroll padding. Its
 * mirror, a region placed `over` one below it (`RegionSpec.over`), has its slot drawn reaching
 * down to that region's bottom and before it (reading order), so beneath it: `data-over` and
 * `--lib-over` (how much of the slot's bottom it covers).
 *
 * The scroll-behind look is the screen's, not the content's: such a slot is clipped at the pinned
 * region's drawn edge (`--lib-under-pin` / `--lib-over-pin`, unitless px from the slot's top or
 * bottom), so nothing paints or takes presses behind it, and masked by a fade band beside that
 * edge (transparent at the edge, opaque a gap and `--space-2` further in), each end on its own.
 * The mask sits on the slot, which never scrolls, so every scroller nested in it fades alike. One
 * knob: set `--lib-under-edge` (or `--lib-over-edge`) on the slot to narrow the edge to what the
 * pinned region really draws (Home's picture, shorter than its slot).
 *
 * A floating panel (`RegionSpec.panel`) meeting the room's edge carries `data-panel` and is padded
 * by `--lib-inset-t|r|b|l` (unitless px, the panel inset on the sides it meets).
 *
 * With `aspect.fit: 'scale'` the room is laid out at its design size and drawn smaller by a CSS
 * `transform: scale()` (Assembly.css), carried in `data-scale` on the room.
 */
export function AssembledScreen({ name, spec, regions, room: given, principles, onPlacement, className, style }: AssembledScreenProps) {
  const [ref, room] = useRoom(given);
  const p = useScopePrinciples(principles);
  const placement = useMemo(() => assemble(spec, room, p), [spec, room, p]);
  useLayoutEffect(() => {
    onPlacement?.(placement);
  }, [placement, onPlacement]);

  const slot = (id: string) => {
    const placed = placement.regions[id];
    const content = regions[id];
    // Scrolling behind a pinned region: the slot reaches up to the top of the one above (`--lib-under`, unitless px: how much of the slot's top it covers) and down to the bottom of the one below (`--lib-over`: how much of its bottom).
    const up = placed.under?.reach ?? 0;
    const down = placed.over?.reach ?? 0;
    const rect = up || down ? { ...placed.rect, y: placed.rect.y - up, h: placed.rect.h + up + down } : placed.rect;
    // What scrolls behind is clipped at the pinned region's drawn edge (`--lib-under-pin`, `--lib-over-pin`: px from the slot's top or bottom) and fades in beside it (Assembly.css).
    const inset = placed.inset;
    const style = {
      ...at(rect),
      ...(up ? { '--lib-under': up, '--lib-under-pin': placed.under!.edge } : {}),
      ...(down ? { '--lib-over': down, '--lib-over-pin': placed.over!.edge } : {}),
      ...(inset ? { '--lib-inset-t': inset.top, '--lib-inset-r': inset.right, '--lib-inset-b': inset.bottom, '--lib-inset-l': inset.left } : {}),
    } as CSSProperties;
    return (
      <div key={id} className="lib-assembled__slot" data-region={id} data-form={placed.form} data-under={placed.under?.id} data-over={placed.over?.id} data-panel={inset ? '' : undefined} style={style}>
        <FormProvider form={placed.form} parts={placed.parts}>{typeof content === 'function' ? content(placed.form, placed) : content}</FormProvider>
      </div>
    );
  };
  const zone = (part: 'header' | 'body' | 'footer') => placement.order.filter((id) => placement.regions[id].zone === part);
  const { zones } = placement;
  // The room's box in layout px (the design room when scaled); `--lib-scale` draws it at `room`.
  const laidOut = { ...placement.room, w: placement.room.w / placement.scale, h: placement.room.h / placement.scale };

  return (
    <div
      ref={ref}
      className={`lib-assembled${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={name}
      data-part="screen"
      data-zoom={placement.zoom.toFixed(3)}
      data-overflow={placement.overflow || undefined}
      data-aspect={spec.aspect ? spec.aspect.ratio.toFixed(3) : undefined}
      style={style}
    >
      {placement.bands.map((band, i) => (
        <Surface key={i} layer="ground" radius="none" className="lib-assembled__band" data-part="band" aria-hidden="true" style={at(band)} />
      ))}
      <div
        className="lib-assembled__room"
        data-part="room"
        data-scale={placement.scale === 1 ? undefined : placement.scale.toFixed(3)}
        style={{ ...at(laidOut), '--lib-scale': placement.scale } as CSSProperties}
      >
        {spec.header?.length ? (
          <div className="lib-assembled__zone" data-part="header" style={at(zones.header)}>
            {zone('header').map(slot)}
          </div>
        ) : null}
        <div className="lib-assembled__zone" data-part="body" style={at(zones.body)}>
          <div
            className="lib-assembled__body"
            data-part="grid"
            style={{ ...at({ x: 0, y: 0, w: placement.layout.w, h: placement.layout.h }), '--lib-zoom': placement.zoom } as CSSProperties}
          >
            {zone('body').map(slot)}
          </div>
        </div>
        {spec.footer?.length ? (
          <div className="lib-assembled__zone" data-part="footer" style={at(zones.footer)}>
            {zone('footer').map(slot)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
