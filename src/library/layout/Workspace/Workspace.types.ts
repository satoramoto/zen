// The surface's contract (docs/live-workspace.md): the document the app owns and the surface draws,
// the pane kinds the app defines, the intents every edit leaves as, and the visual state the surface
// keeps for itself. Plain data, no framework: the same values feed React, Svelte and an app's store.
// The document is mix[flow]'s rig document (`src/rig/contract.ts`, version 1) field for field, so
// mix's values are assignable as they are.
import type { Forms } from '../assembly/types';
import type { Rank } from '../../contract';

/** What a region follows: whatever the app has selected, or one target the app names. */
export type SurfaceBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };

/** One region instance: its own id, the pane kind it is (never read from the id), its title, its binding. */
export interface SurfaceRegion {
  id: string;
  kind: string;
  title: string;
  binding: SurfaceBinding;
}

/** One tab: rows of instance ids, top to bottom, and the instances they name. */
export interface SurfaceTab {
  id: string;
  title: string;
  rows: readonly (readonly string[])[];
  regions: readonly SurfaceRegion[];
}

/** The whole surface, as the app stores it: its tabs and the open one. */
export interface SurfaceDocument {
  version: 1;
  active: string;
  tabs: readonly SurfaceTab[];
}

/** One kind of pane the app can place: plain data, so the definitions import no renderer. */
export interface PaneDefinition {
  /** The name the document uses for it: `'session'`, `'mixer'`. */
  kind: string;
  /** The palette's word for it. */
  label: string;
  /** One line under the label in the palette. */
  description?: string;
  /** The pane's own forms, most room first, so the solver still decides its size. */
  forms: Forms;
  /** How much it matters when room runs out. Default `controls`. */
  priority?: Rank;
  /** Drawn on the surface's plate. Default false: a pane brings its own face. */
  plate?: boolean;
  /** Has a header strip the plate makes room for. */
  head?: boolean;
  /** What a fixed binding can point at, in the app's words (`'track'`): the targets of that kind. None: it can't be bound. */
  targets?: string;
}

/** Something a region can be bound to: a track, a song, a deck, in the app's words. */
export interface SurfaceTarget {
  id: string;
  label: string;
  /** Matched against a definition's `targets`. */
  kind: string;
}

/** The ways a region moves: within its row, or into the row above or below. */
export const SURFACE_DIRECTIONS = ['left', 'right', 'up', 'down'] as const;
export type SurfaceDirection = (typeof SURFACE_DIRECTIONS)[number];

/**
 * Every edit a person makes through the surface, as one value. Named after mix's `SurfaceStore`
 * methods, so an app with a store maps each to one call; `applySurfaceIntent` applies them for
 * an app without one. `setEditing`, `undo` and `redo` are not document edits.
 */
export type SurfaceIntent =
  | { type: 'selectTab'; tab: string }
  | { type: 'addTab'; title?: string }
  | { type: 'renameTab'; tab: string; title: string }
  | { type: 'duplicateTab'; tab: string }
  | { type: 'removeTab'; tab: string }
  /** `row` past the last row starts a new one; `index` defaults to the row's end. */
  | { type: 'addRegion'; tab: string; kind: string; row: number; index?: number }
  | { type: 'removeRegion'; tab: string; region: string }
  | { type: 'moveRegion'; tab: string; region: string; direction: SurfaceDirection }
  | { type: 'retitleRegion'; tab: string; region: string; title: string }
  | { type: 'bindRegion'; tab: string; region: string; binding: SurfaceBinding }
  | { type: 'setEditing'; editing: boolean }
  | { type: 'undo' }
  | { type: 'redo' };

export type SurfaceIntentType = SurfaceIntent['type'];

/** Every intent's name, in the order the surface offers them. */
export const SURFACE_INTENTS = [
  'selectTab',
  'addTab',
  'renameTab',
  'duplicateTab',
  'removeTab',
  'addRegion',
  'removeRegion',
  'moveRegion',
  'retitleRegion',
  'bindRegion',
  'setEditing',
  'undo',
  'redo',
] as const satisfies readonly SurfaceIntentType[];

/**
 * What the surface keeps for itself, unless the app passes it: whether it is editing, the region
 * whose tools are open, the palette's state and a tab or region title being typed. Never written
 * into the document.
 */
export interface SurfaceUi {
  editing: boolean;
  /** The region whose tools are open, while editing. */
  region?: string;
  /** The palette is open. */
  palette: boolean;
  /** A title being typed: the tab's (`tab`) or a region's, and the text so far. */
  naming?: { target: 'tab' | 'region'; id: string; text: string };
}

export const SURFACE_UI_REST: SurfaceUi = { editing: false, palette: false };
