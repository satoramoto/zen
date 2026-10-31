// The live workspace's shared vocabulary (docs/workspace.md, docs/live-workspace.md): what a
// tabbed performance surface is, as plain data. No framework: the same values feed a React story,
// a Svelte story and the app's own store.
import type { Forms, RegionSpec, ScreenSpec } from '../assembly/types';
import type { Rank } from '../../contract';

/** One tab: a title and the screen it holds. Editing a tab rewrites this value, never a grid. */
export interface WorkspaceTab {
  id: string;
  title: string;
  /** A tab is a screen. */
  spec: ScreenSpec;
}

/** The whole surface: its tabs, and which one it opens on. */
export interface WorkspaceSpec {
  tabs: readonly WorkspaceTab[];
  start?: string;
}

/** One kind of region the palette can place. The app supplies these. */
export interface WorkspaceRegion {
  /** The name the app knows it by: `'loopGrid'`, `'arp'`, `'sends'`. */
  kind: string;
  /** The palette's word for it: `'Loop grid'`. */
  label: string;
  /** The widget's own forms, so the solver still decides. */
  forms: Forms;
  /** The region's `priority` and plate defaults when it is first placed. */
  priority?: Rank;
  plate?: boolean;
  head?: boolean;
}

/**
 * The region instance an `add` or `split` placed: its new id and the palette kind it is. The app
 * records the kind from this, never from the id (an id names an instance, not a component type).
 */
export interface WorkspacePlacement {
  id: string;
  kind: string;
}

/** Which track or param a region is bound to. Plain data; the app reads it. */
export type WorkspaceBinding = Readonly<Record<string, string>>;

/** Every structural edit the surface offers: the `why` of an `onSpec`. */
export const WORKSPACE_EDITS = ['move', 'moveRow', 'split', 'remove', 'add', 'bind'] as const;
export type WorkspaceEdit = (typeof WORKSPACE_EDITS)[number];

/** Make a region from a palette kind: the solver's defaults, the app's id. */
export function paletteRegion(kind: WorkspaceRegion, id: string): RegionSpec {
  return {
    id,
    forms: kind.forms,
    priority: kind.priority ?? 'controls',
    plate: kind.plate ?? true,
    head: kind.head,
  };
}
