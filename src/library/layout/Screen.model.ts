// Screen's model: the tree the screen draws and the handlers it names. No framework: `Screen.tsx`
// (React) and `Screen.svelte` (Svelte) both hand `screenView` to their `Tree`. A grid screen is its
// root, the header and footer (text, or the `header` / `footer` slots) and the grid holding the
// `children` slot, its element handed out through the `ref` store (`bindRef`). With a `spec` it is
// an `AssembledScreen` component node instead, the regions' contents passed through as its
// `regions` (assembly/AssembledScreen.model.ts).
import { component, h, slot, styleText, wire, type ComponentNode, type Handlers, type Node } from '../view/Tree.model';
import { styleAttr, type StyleInput } from './assembly/AssembledScreen.model';
import type { StyleDecls } from './style';
import type { Placement, Principles, ScreenSpec } from './assembly/types';

/** What Screen decides from, in any framework (each binding adds its header, footer, children, regions and refs). */
export interface ScreenModelProps {
  /** The screen's accessible name ("Stage"). */
  name: string;
  /** `grid-template-areas` naming where each region goes, one string per row. */
  areas?: string[];
  /** `grid-template-columns`; default one equal column per name in the first row. */
  columns?: string;
  /** `grid-template-rows`; default `auto` for each row. */
  rows?: string;
  className?: string;
  /** An assembled screen (docs/assembly.md): with it, the screen places itself. */
  spec?: ScreenSpec;
  /** With `spec`: the room in px; unset, the screen measures its own box. */
  room?: { w: number; h: number };
  /** With `spec`: the solver's principles; unset, the nearest ThemeScope's. */
  principles?: Principles;
}

/** The style inputs a binding passes as it gets them (a string in Svelte, an object in React). */
export interface ScreenStyles {
  style?: StyleInput;
  /** Style on the grid (a zoom, a fit's custom properties), after the template. */
  gridStyle?: StyleInput;
}

/** The header and footer as a binding has them: a string draws as text, any other value fills
 *  the `header` / `footer` slot (a React node, a Svelte snippet), and nothing (or `''`) draws no bar. */
export interface ScreenFills {
  header?: unknown;
  footer?: unknown;
}

/** The slot an assembled screen's region contents pass through, as its `regions` prop. */
export const REGIONS_SLOT = 'regions';

/** The grid's template: from `areas` (columns and rows defaulting to even columns and `auto` rows), or `columns` and `rows` alone. */
export function screenGrid({ areas, columns, rows }: Pick<ScreenModelProps, 'areas' | 'columns' | 'rows'>): StyleDecls {
  if (areas)
    return {
      'grid-template-areas': areas.map((row) => `"${row}"`).join(' '),
      'grid-template-columns': columns ?? `repeat(${areas[0].trim().split(/\s+/).length}, minmax(0, 1fr))`,
      'grid-template-rows': rows ?? `repeat(${areas.length}, auto)`,
    };
  return { 'grid-template-columns': columns || undefined, 'grid-template-rows': rows || undefined };
}

/** A fixed bar (`header` or `footer`): its text, or its slot; null when there is none. */
const bar = (part: 'header' | 'footer', fill: unknown): Node | null =>
  fill ? h('div', { class: `lib-screen__${part}`, 'data-part': part }, typeof fill === 'string' ? fill : slot(part)) : null;

/**
 * The tree Screen draws. A grid screen: its root (`lib-screen` plus the caller's class, a group
 * named `name`), the header, the grid (its template from `screenGrid`, then `gridStyle`; the
 * `children` slot; the `ref` store handing its element to `gridRef`) and the footer. With a
 * `spec`: the `AssembledScreen` component, its `onPlacement` the `placement` handler and its
 * `regions` this tree's `regions` slot passed through.
 */
export function screenView(props: ScreenModelProps & ScreenStyles, fills: ScreenFills = {}): Node | ComponentNode {
  const { name, className, spec, room, principles } = props;
  const style = styleAttr(props.style);
  if (spec) {
    // The tree's root is the component itself, so the DOM is exactly AssembledScreen's.
    return component(
      'AssembledScreen',
      { name, spec, room, principles, className, style },
      { on: { onPlacement: 'placement' }, slots: { regions: slot(REGIONS_SLOT) } },
    );
  }
  const grid = [styleText(screenGrid(props)), styleAttr(props.gridStyle)].filter(Boolean).join('; ') || undefined;
  return h(
    'div',
    { class: `lib-screen${className ? ` ${className}` : ''}`, role: 'group', 'aria-label': name, 'data-part': 'screen', style },
    bar('header', fills.header),
    wire(h('div', { class: 'lib-screen__grid', 'data-part': 'grid', style: grid }, slot('children')), { bind: [['ref', { onRef: 'gridRef' }]] }),
    bar('footer', fills.footer),
  );
}

/** A ref as a binding has one: a callback, or an object whose `current` is set (React's `Ref<E>`
 *  for any element type `E`, hence `any`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ElementRef = ((element: any) => unknown) | { current: any } | null | undefined;

/** The handlers Screen's tree names: `gridRef` hands the grid's element to `gridRef` (null when it
 *  goes), `placement` is `onPlacement`. */
export function screenHandlers({ gridRef, onPlacement }: { gridRef?: ElementRef; onPlacement?: (placement: Placement) => void }): Handlers {
  return {
    gridRef: (element: HTMLElement | null) => {
      if (typeof gridRef === 'function') gridRef(element);
      else if (gridRef) gridRef.current = element;
    },
    placement: onPlacement,
  };
}

export interface RefParams {
  /** Called with the element when it mounts, and with null when it goes. */
  onRef?: (element: HTMLElement | null) => void;
}

/** An element ref as a store (registered as `ref`): hands the element to `onRef` on mount and null
 *  on unmount. */
export function bindRef(node: HTMLElement, params: RefParams): { destroy(): void } {
  params.onRef?.(node);
  return { destroy: () => params.onRef?.(null) };
}
