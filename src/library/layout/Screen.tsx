import type { CSSProperties, ReactNode, Ref } from 'react';
import { Tree } from '../view/Tree';
import type { RegionContent } from './assembly/AssembledScreen';
import type { Placement, Principles, ScreenSpec } from './assembly/types';
import { REGIONS_SLOT, screenHandlers, screenView } from './Screen.model';
import './Screen.css';

// The tree and its handlers are framework-free (Screen.model.ts); this file and `Screen.svelte`
// only hand them to their `Tree`, with the header, footer, children and the regions' contents as
// slots.
export { screenGrid, screenView, type ScreenModelProps } from './Screen.model';

export interface ScreenProps {
  /** The screen's accessible name ("Stage"). */
  name: string;
  /** Fixed at the top: never scrolls or zooms with the grid (the app bar). */
  header?: ReactNode;
  /** Fixed at the bottom: never scrolls or zooms with the grid (the keys, the status line). */
  footer?: ReactNode;
  /** `grid-template-areas` naming where each region goes, one string per row. */
  areas?: string[];
  /** `grid-template-columns`; default one equal column per name in the first row. */
  columns?: string;
  /** `grid-template-rows`; default `auto` for each row. */
  rows?: string;
  /** The grid between header and footer, for a screen that measures or zooms it. */
  gridRef?: Ref<HTMLDivElement>;
  /** Style on the grid (a zoom, a fit's custom properties). */
  gridStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /**
   * An assembled screen (docs/assembly.md): what it holds and what matters. With a `spec` the
   * screen places itself: `regions` fills it, and `areas`, `columns`, `rows`, `header`, `footer`
   * and `children` are not used.
   */
  spec?: ScreenSpec;
  /** With `spec`: what goes in each region, by id (content, or a function of the chosen form). */
  regions?: Record<string, RegionContent>;
  /** With `spec`: the room in px; unset, the screen measures its own box. */
  room?: { w: number; h: number };
  /** With `spec`: the solver's principles; unset, the nearest ThemeScope's. */
  principles?: Principles;
  /** With `spec`: called with each new placement. */
  onPlacement?: (placement: Placement) => void;
}

/**
 * **Job.** A whole screen: a fixed header, a named grid of regions, and a fixed footer. The app
 * decides what goes where; the theme decides how far apart regions sit (`--mat-plate-gap`).
 * Regions place themselves with `area`. Only the grid fills the room left between header and
 * footer, so a screen that fits or zooms itself does it to the grid alone.
 *
 * **Assembled.** Given a `spec` instead, the screen assembles itself (`AssembledScreen`,
 * docs/assembly.md): no grid, no ratios, each region in the form the solver chose. The regions'
 * contents pass through the tree to it as its `regions`.
 */
export function Screen({ header, footer, gridRef, children, regions, onPlacement, ...props }: ScreenProps) {
  // The regions are no React node: their slot passes them through, untouched, as AssembledScreen's `regions`.
  return (
    <Tree
      tree={screenView(props as Parameters<typeof screenView>[0], { header, footer })}
      slots={{ header, footer, children, [REGIONS_SLOT]: (regions ?? {}) as unknown as ReactNode }}
      handlers={screenHandlers({ gridRef, onPlacement })}
    />
  );
}
