// Screen's model: the grid screen's root and its grid's template declarations. No framework:
// `Screen.tsx` (React) and `Screen.svelte` (Svelte) both render `screenView` and `screenGrid`;
// with a `spec`, both hand off to the assembled screen (assembly/AssembledScreen.model.ts).
import type { StyleDecls } from './style';
import type { Principles, ScreenSpec } from './assembly/types';

/** What Screen decides from, in any framework (each renderer adds its header, footer, children, regions and refs). */
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

/** The grid screen's root: `lib-screen` plus the caller's class, its role and name. */
export function screenView(name: string, className?: string): { className: string; attrs: Record<string, string> } {
  return { className: `lib-screen${className ? ` ${className}` : ''}`, attrs: { role: 'group', 'aria-label': name, 'data-part': 'screen' } };
}

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
