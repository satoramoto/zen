import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { workspaceHandlers, workspaceSlots, workspaceTab, workspaceView, type WorkspaceModelProps } from './Workspace.model';
// The tabs and the edit tools read as Text; the frame is a plate. Before Workspace.css.
import '../../primitives/Text.css';
import './Workspace.css';

// The props, the edits and the tree are framework-free (Workspace.model.ts, Workspace.edit.ts,
// Workspace.types.ts); `Workspace.svelte` draws the same tree.
export { addRegion, moveRegion, moveRegionToRow, removeRegion, splitRegion, workspaceRegionIds } from './Workspace.edit';
export { WORKSPACE_EDITS, paletteRegion, type WorkspaceBinding, type WorkspaceEdit, type WorkspaceRegion, type WorkspaceSpec, type WorkspaceTab } from './Workspace.types';
export { contentSlot, newRegionId, workspaceSlots, workspaceTab, type WorkspaceModelProps, type WorkspaceTrack } from './Workspace.model';

/** What goes in each region, by region id: the app's content for the tab's `content:<id>` slots. */
export type WorkspaceContent = ReactNode;

export interface WorkspaceProps extends WorkspaceModelProps {
  /** What goes in each region, by region id. */
  content?: Record<string, WorkspaceContent>;
}

/** A region's content: `content[regionId]`. */
function contentFor(props: WorkspaceProps, id: string): WorkspaceContent {
  return props.content?.[id];
}

/**
 * **Job.** A tabbed surface over self-assembling screens: a persistent tab strip, the open tab's
 * `<Screen spec>` beneath it, and — while `editing` — a frame round every region offering the six
 * structural edits (move within its row, move to a neighbouring row, split its slot with a new
 * region, remove it, add a palette kind to the tab, bind it to a track). Docs: `docs/workspace.md`.
 *
 * **Changed.** *Tabs are screens*: a tab **is** a `ScreenSpec`, and an edit returns a new one
 * through `onSpec(tabId, next, why)` — never a grid, never a pixel. The solver still owns sizes,
 * so an edited tab re-themes and steps its forms down like any other screen.
 *
 * **Kept.** The workspace holds no state: the open tab, the specs and the bindings stay the app's.
 * Region contents travel as `content:<id>` slots, so a frame wraps the app's content without the
 * app knowing.
 *
 * **Built from.** `Tabs` (the strip) and `Screen` (the tab) by name, `Button` for the edit
 * tools, `Segmented` for the binding, Texts for frame tags. The frame's plate is a `Surface`;
 * this tier only lays the chrome out, never paints it.
 *
 * **Tuning knobs.**
 * - `--yh-workspace-gap`: between the strip, the palette bar and the screen.
 * - `--yh-workspace-frame-gap`: the frame's inset round its region.
 */
export function Workspace({ content, ...props }: WorkspaceProps) {
  const tab = workspaceTab(props);
  const slots = workspaceSlots(tab, content);
  return <Tree tree={workspaceView(props, tab)} slots={slots} handlers={workspaceHandlers(props)} />;
}

export default Workspace;
