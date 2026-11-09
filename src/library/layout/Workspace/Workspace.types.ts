// The surface's contract (docs/workspace.md): the document the app owns and the surface draws,
// the pane kinds the app defines, the intents every edit leaves as, and the visual state the surface
// keeps for itself. Plain data, no framework: the same values feed React, Svelte and an app's store.
// Version 1 is mix[flow]'s rig document (`src/rig/contract.ts`) field for field, so mix's values are
// assignable as they are; version 2 makes a tab a split tree with shares, lockable, and gives a
// region its settings. The surface draws a v1 document through its v2 reading (`readDocument`).
import type { Forms } from '../assembly/types';
import type { Rank } from '../../contract';

/** What a region follows: whatever the app has selected, or one target the app names. */
export type SurfaceBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };

/** Plain JSON: what a document can hold. */
export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/** A setting's value as a region stores it: plain data (a `data` setting's is any plain JSON). */
export type SettingValue = JsonValue;

/** One region instance: its own id, the pane kind it is (never read from the id), its title, its binding, its settings. */
export interface SurfaceRegion {
  id: string;
  kind: string;
  title: string;
  binding: SurfaceBinding;
  /** Its values for its kind's settings, by key. Left out: every default. */
  settings?: Readonly<Record<string, SettingValue>>;
}

/** A layout leaf (a region instance id) or a split. */
export type LayoutNode = string | SplitNode;

/** One child of a split and its share of the split's room (relative to its siblings'). */
export interface SplitChild {
  node: LayoutNode;
  share: number;
}

/** A split: children side by side (`row`) or stacked (`column`). Its id is what a resize names. */
export interface SplitNode {
  id: string;
  split: 'row' | 'column';
  children: readonly SplitChild[];
}

/** One tab, version 2: a layout tree of the instances, the instances, and whether it is locked. */
export interface SurfaceTab {
  id: string;
  title: string;
  /** Null: an empty tab. */
  layout: LayoutNode | null;
  regions: readonly SurfaceRegion[];
  /** Locked for the gig: no edit tools until it is unlocked. */
  locked?: boolean;
}

/** One tab, version 1 (mix's today): rows of instance ids, top to bottom. */
export interface SurfaceTabV1 {
  id: string;
  title: string;
  rows: readonly (readonly string[])[];
  regions: readonly SurfaceRegion[];
}

/** The whole surface, version 2. */
export interface SurfaceDocumentV2 {
  version: 2;
  active: string;
  tabs: readonly SurfaceTab[];
}

/** The whole surface, version 1: mix[flow]'s rig document as it stores it today. */
export interface SurfaceDocumentV1 {
  version: 1;
  active: string;
  tabs: readonly SurfaceTabV1[];
}

/** The whole surface, as the app stores it: either version. The surface draws a v1 document through its v2 reading. */
export type SurfaceDocument = SurfaceDocumentV1 | SurfaceDocumentV2;

/** A choice's option. */
export interface SettingOption {
  value: string;
  label: string;
}

/** One setting a pane kind declares, with its default. Plain data. */
export type SettingSpec = { key: string; label: string } & (
  | { type: 'choice'; options: readonly SettingOption[]; default: string }
  | { type: 'choices'; options: readonly SettingOption[]; default: readonly string[] }
  | { type: 'toggle'; default: boolean }
  | { type: 'number'; min: number; max: number; step?: number; default: number }
  /** A pick of the app's targets of kind `of`; `'all'` picks every one. */
  | { type: 'targets'; of: string; default: 'all' | readonly string[] }
  /** Plain data the pane edits itself (a control panel's cells): it reaches the pane, never the settings sheet. */
  | { type: 'data'; default: JsonValue }
);

/** A region's settings with every default filled in, by key. */
export type ResolvedSettings = Readonly<Record<string, SettingValue>>;

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
  /** The settings a region of this kind carries, in the order the settings sheet lists them. */
  settings?: readonly SettingSpec[];
}

/** Something a region can be bound to: a track, a song, a deck, in the app's words. */
export interface SurfaceTarget {
  id: string;
  label: string;
  /** Matched against a definition's `targets`. */
  kind: string;
}

/** Where a dragged region lands on another: beside it, above or below it, or in its place (the two trade). */
export const DOCK_ZONES = ['left', 'right', 'above', 'below', 'swap'] as const;
export type DockZone = (typeof DOCK_ZONES)[number];

/** The ways a region steps: within the nearest row split (left, right) or column split (up, down). */
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
  | { type: 'lockTab'; tab: string; locked: boolean }
  /** Beside `beside` on its `zone` side (default right); without `beside`, at the end of the tab. */
  | { type: 'addRegion'; tab: string; kind: string; beside?: string; zone?: Exclude<DockZone, 'swap'> }
  | { type: 'removeRegion'; tab: string; region: string }
  | { type: 'moveRegion'; tab: string; region: string; direction: SurfaceDirection }
  | { type: 'dockRegion'; tab: string; region: string; target: string; zone: DockZone }
  | { type: 'resizeSplit'; tab: string; split: string; shares: readonly number[] }
  | { type: 'retitleRegion'; tab: string; region: string; title: string }
  | { type: 'bindRegion'; tab: string; region: string; binding: SurfaceBinding }
  | { type: 'configureRegion'; tab: string; region: string; settings: Readonly<Record<string, SettingValue>> }
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
  'lockTab',
  'addRegion',
  'removeRegion',
  'moveRegion',
  'dockRegion',
  'resizeSplit',
  'retitleRegion',
  'bindRegion',
  'configureRegion',
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
  /** The open region's settings sheet is showing. */
  sheet?: boolean;
  /** A handle being dragged: the split and its previewed shares. */
  resizing?: { split: string; shares: readonly number[] };
  /** A tag being dragged: the region, and the region and zone under the pointer. */
  docking?: { region: string; target?: string; zone?: DockZone };
  /** Each region's measured room, by id: what its form is picked from. */
  rooms?: Readonly<Record<string, { w: number; h: number }>>;
}

export const SURFACE_UI_REST: SurfaceUi = { editing: false, palette: false };
