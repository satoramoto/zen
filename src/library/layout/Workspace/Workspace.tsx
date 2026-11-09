import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { contentSlot, surfaceUi, workspaceContent, workspaceHandlers, workspaceView, type WorkspaceModelProps } from './Workspace.model';
import { SURFACE_UI_REST, type SurfaceRegion, type SurfaceUi } from './Workspace.types';
// The tabs and the edit tools read as Text; the frame is a plate. Before Workspace.css.
import '../../primitives/Text.css';
import './Workspace.css';

// The contract, the helpers and the tree are framework-free (Workspace.types.ts, surface.ts,
// Workspace.model.ts); `Workspace.svelte` draws the same tree.
export {
  SURFACE_DIRECTIONS,
  SURFACE_INTENTS,
  SURFACE_UI_REST,
  type PaneDefinition,
  type SurfaceBinding,
  type SurfaceDirection,
  type SurfaceDocument,
  type SurfaceIntent,
  type SurfaceIntentType,
  type SurfaceRegion,
  type SurfaceTab,
  type SurfaceTarget,
  type SurfaceUi,
} from './Workspace.types';
export {
  PLACEHOLDER_FORMS,
  applySurfaceIntent,
  freshId,
  openTab,
  regionSpec,
  resolveTarget,
  surfaceScreen,
  tabRegions,
  tabRows,
  targetsFor,
  type ApplyOptions,
} from './surface';
export { contentSlot, surfaceUi, workspaceContent, type WorkspaceModelProps } from './Workspace.model';

/** What the app draws in a region: the instance and the target it resolves to (its fixed one, else the selection). */
export type WorkspacePane = (region: SurfaceRegion, target: string | undefined) => ReactNode;

export interface WorkspaceProps extends WorkspaceModelProps {
  /** Draws each region of a kind the app defined. */
  pane?: WorkspacePane;
}

/**
 * **Job.** The surface an app composes its DAW on: a tab strip over the open tab's self-assembling
 * screen, and edit mode, where every region wears a frame whose tag opens its tools (move, rename,
 * remove, bind) and the palette adds the app's own pane kinds. Docs: `docs/live-workspace.md`.
 *
 * **The line.** The app owns the document (`SurfaceDocument`), its history and its saving: every
 * edit leaves as one `SurfaceIntent` through `onIntent`, and the surface shows it only when the
 * app passes the next document. The surface keeps only what the app doesn't track (`SurfaceUi`:
 * edit mode, the open frame, the palette, a title being typed), and each can be the app's
 * (`editing`, `editingRegion`, `paletteOpen`, with `onUi`). Undo and redo are offered only when
 * the app says (`canUndo`, `canRedo`).
 *
 * **Panes.** The app's `panes` are plain data (kind, label, forms…); `pane(region, target)` draws
 * each instance. A kind the app never defined draws a placeholder naming it, still movable and
 * removable. Kinds are read from `region.kind`, never from ids.
 *
 * **Built from.** `Tabs` and `Screen` by name, `Button` for the tools, `Segmented` for the
 * binding, `Surface` for the frame's plate, `Text` for words. This tier lays the chrome out,
 * never paints it.
 *
 * **Tuning knobs.**
 * - `--yh-workspace-gap`: between the head, the palette and the screen.
 * - `--yh-workspace-frame-gap`: the frame's inset round its region.
 */
export function Workspace({ pane, ...props }: WorkspaceProps) {
  const [own] = useState(() => viewState<SurfaceUi>(SURFACE_UI_REST));
  const value = useSyncExternalStore(own.subscribe, own.get);
  const ui = surfaceUi(props, value);
  const slots: Record<string, (region: SurfaceRegion, target: string | undefined) => ReactNode> = {};
  if (pane) for (const { region } of workspaceContent(props)) slots[contentSlot(region.id)] = pane;
  return <Tree tree={workspaceView(props, ui)} slots={slots} handlers={workspaceHandlers(props, ui, value, own.set)} />;
}

export default Workspace;
