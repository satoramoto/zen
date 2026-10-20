import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { useThemeScope } from '../../theme';
import { Tree } from '../../view/Tree';
import { localState } from '../local';
import {
  assembledPlacement,
  assembledScreenHandlers,
  assembledScreenView,
  regionFills,
  type AssembledScreenModelProps,
} from './AssembledScreen.model';
import { scopePrinciples } from './principles';
import type { RoomSize } from './room';
import type { Placed, Placement, Principles, ScreenSpec } from './types';
// The bands and the glass are Surfaces drawn as plain divs with Surface's class and data
// (`assembledScreenView`; never a shader). Before Assembly.css, so its rules win.
import '../../primitives/Surface.css';
import './Assembly.css';

// What the screen draws is framework-free (AssembledScreen.model.ts); this file and
// `AssembledScreen.svelte` read the screen's state (its measured room, the scope's principles),
// place the spec and hand the tree to their `Tree`, each region's content in its slot.
export { SLOT_VARS } from './AssembledScreen.model';

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
  /** The root's style (a string too, as Screen's tree passes it). */
  style?: CSSProperties | string;
}

/**
 * The nearest ThemeScope's principles resolved (the first pack's outside one), as the assembled
 * screen reads them: so a screen can turn a placed rect into its content's px (less the plate).
 */
export function useScopePrinciples(given?: Principles): Principles {
  const scope = useThemeScope();
  return useMemo(() => scopePrinciples(scope, given), [given, scope]);
}

/** A region's content as its slot draws it: a function of the chosen form called with it. */
const content = (region: RegionContent, placed: Placed): ReactNode => (typeof region === 'function' ? region(placed.form, placed) : region);

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
 *
 * **State.** The measured room is the screen's own (a `localState` the `room` store writes); each
 * new placement reaches `onPlacement` through the `report` store.
 */
export function AssembledScreen({ regions = {}, onPlacement, ...props }: AssembledScreenProps) {
  const [room] = useState(() => localState<RoomSize | null>(null));
  const measured = useSyncExternalStore(room.subscribe, room.get, room.get);
  const principles = useScopePrinciples(props.principles);
  const placement = useMemo(() => assembledPlacement(props, { room: measured, principles }), [props.spec, props.room, measured, principles]);
  return (
    <Tree
      tree={assembledScreenView(props as AssembledScreenModelProps, placement)}
      slots={regionFills(placement, (id, placed) => content(regions[id], placed))}
      handlers={assembledScreenHandlers({ onPlacement }, placement, room)}
    />
  );
}
