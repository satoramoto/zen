import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { useScopePrinciples } from '../assembly/AssembledScreen';
import { contentSlot, surfaceUi, workspaceContent, workspaceHandlers, workspaceView, type WorkspaceModelProps } from './Workspace.model';
import { SURFACE_UI_REST, type ResolvedSettings, type SurfaceRegion, type SurfaceUi } from './Workspace.types';
// The tabs and the edit tools read as Text; the frame is a plate. Before Workspace.css.
import '../../primitives/Text.css';
import './Workspace.css';

// The contract, the helpers and the tree are framework-free (Workspace.types.ts, surface.ts,
// Workspace.model.ts); `Workspace.svelte` draws the same tree.
export {
  DOCK_ZONES,
  SURFACE_DIRECTIONS,
  SURFACE_INTENTS,
  SURFACE_UI_REST,
  type DockZone,
  type JsonValue,
  type LayoutNode,
  type PaneDefinition,
  type ResolvedSettings,
  type SettingOption,
  type SettingSpec,
  type SettingValue,
  type SplitChild,
  type SplitNode,
  type SurfaceBinding,
  type SurfaceDirection,
  type SurfaceDocument,
  type SurfaceDocumentV1,
  type SurfaceDocumentV2,
  type SurfaceIntent,
  type SurfaceIntentType,
  type SurfaceRegion,
  type SurfaceTab,
  type SurfaceTabV1,
  type SurfaceTarget,
  type SurfaceUi,
} from './Workspace.types';
export {
  PLACEHOLDER_FORMS,
  applySurfaceIntent,
  cleanLayout,
  formForRoom,
  freshId,
  isSplit,
  leastRoom,
  leaves,
  openTab,
  readDocument,
  readTab,
  resolveSettings,
  resolveTarget,
  splits,
  tabRegions,
  targetsFor,
  type ApplyOptions,
} from './surface';
export { contentSlot, surfaceUi, workspaceContent, type WorkspaceModelProps } from './Workspace.model';

/** What the app draws in a region: the instance, the target it resolves to (its fixed one, else the selection) and its settings with defaults filled. */
export type WorkspacePane = (region: SurfaceRegion, target: string | undefined, settings: ResolvedSettings) => ReactNode;

export interface WorkspaceProps extends WorkspaceModelProps {
  /** Draws each region of a kind the app defined. */
  pane?: WorkspacePane;
}

/**
 * **Job.** The surface an app composes its DAW on: a tab strip over the open tab's layout (a split
 * tree, each region its share of the room, in the largest of its forms that fits), and edit mode,
 * where a handle between every two regions resizes them, a region's tag drags it onto another
 * (left, right, above, below, swap) or opens its tools (move, rename, settings, remove, bind), the
 * palette adds the app's own pane kinds, and Lock puts the tab beyond a stray touch. Docs:
 * `docs/workspace.md`.
 *
 * **The line.** The app owns the document (`SurfaceDocument`), its history and its saving: every
 * edit leaves as one `SurfaceIntent` through `onIntent`, and the surface shows it only when the
 * app passes the next document. The surface keeps only what the app doesn't track (`SurfaceUi`:
 * edit mode, the open tools and settings, the palette, a title being typed, a drag), and the first three can be the app's
 * (`editing`, `editingRegion`, `paletteOpen`, with `onUi`). Undo and redo are offered only when
 * the app says (`canUndo`, `canRedo`).
 *
 * **Panes.** The app's `panes` are plain data (kind, label, forms…); `pane(region, target)` draws
 * each instance, with its settings (`pane(region, target, settings)`). A kind the app never defined
 * draws a placeholder naming it, still movable and removable. Kinds are read from `region.kind`,
 * never from ids. A version 1 document (mix's) is drawn through its version 2 reading.
 *
 * **Built from.** `Tabs` and `FormScope` by name, `Button` for the tools, `Segmented`,
 * `Checkbox` and `NumberField` for the binding and the settings, `Surface` for the frame's and
 * the sheet's plates, `Text` for words; the `room`, `splitHandle` and `dockDrag` stores. This tier lays the chrome out,
 * never paints it.
 *
 * **Tuning knobs.**
 * - `--yh-workspace-gap`: between the head, the palette and the screen.
 * - `--yh-workspace-frame-gap`: the frame's inset round its region.
 * - `--yh-workspace-handle`: a split handle's thickness (at least the minimum target while editing).
 */
export function Workspace({ pane, ...props }: WorkspaceProps) {
  const [own] = useState(() => viewState<SurfaceUi>(SURFACE_UI_REST));
  const value = useSyncExternalStore(own.subscribe, own.get);
  const principles = useScopePrinciples();
  const ui = surfaceUi(props, value);
  const slots: Record<string, WorkspacePane> = {};
  if (pane) for (const { region } of workspaceContent(props)) slots[contentSlot(region.id)] = pane;
  return <Tree tree={workspaceView(props, ui, { principles })} slots={slots} handlers={workspaceHandlers(props, ui, own)} />;
}

export default Workspace;
