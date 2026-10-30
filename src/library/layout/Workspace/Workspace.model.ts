// Workspace's model: tabs over an assembled screen, and the tree both renderers draw. No
// framework: `Workspace.tsx` (React) and `Workspace.svelte` (Svelte) both pass `workspaceView`
// and `workspaceHandlers` to their `Tree`. The workspace holds no state: a tab asks for `onTab`,
// an edit for `onSpec(tabId, next, why)`, a binding for `onBinding`. The solver still owns every
// size: an edit rewrites the tab's `ScreenSpec` and nothing else. `Screen` and `Tabs` are drawn by
// name (never re-drawn); the edit frame is the workspace's own chrome.
import { surfaceView } from '../../primitives/Surface.model';
import { textView } from '../../primitives/Text.model';
import { component, each, h, slot, type Child, type Handlers, type Node } from '../../view/Tree.model';
import type { ScreenSpec } from '../assembly/types';
import { addRegion, moveRegion, moveRegionToRow, removeRegion, splitRegion, workspaceFixedIds, workspaceRegionIds } from './Workspace.edit';
import { paletteRegion, type WorkspaceBinding, type WorkspaceEdit, type WorkspaceRegion, type WorkspaceSpec } from './Workspace.types';

/** One bindable track: the Segmented's member and the binding's value. */
export interface WorkspaceTrack {
  id: string;
  label: string;
}

/** Every Workspace prop (region contents reach the binding as slots, never as props). */
export interface WorkspaceModelProps {
  /** The surface's accessible name. */
  name: string;
  /** The tabs and which one opens. */
  workspace: WorkspaceSpec;
  /** The open tab's id; an id no tab has shows the first tab. */
  active: string;
  /** The palette's kinds, in order. Without it the edit mode splits nothing. */
  palette?: readonly WorkspaceRegion[];
  /** What each region is bound to, by region id. */
  bindings?: Record<string, WorkspaceBinding>;
  /** The tracks a region can bind to. Without them there is nothing to bind. */
  tracks?: readonly WorkspaceTrack[];
  /** Edit mode: every region gets its frame, and the palette bar joins the tabs. */
  editing?: boolean;
  /** A tab was chosen. */
  onTab?: (id: string) => void;
  /** A structural edit was made: the tab's next spec and which of the six it was. */
  onSpec?: (tabId: string, spec: ScreenSpec, why: WorkspaceEdit) => void;
  /** A region was bound to a track. */
  onBinding?: (tabId: string, regionId: string, binding: WorkspaceBinding) => void;
  /** Shown, dimmed, deaf: the surface is read, not played. */
  disabled?: boolean;
  /** Classes added to the root, after the workspace's own. */
  className?: string;
}

/** The tab the workspace shows: `active`, else the first. */
export function workspaceTab({ workspace, active }: Pick<WorkspaceModelProps, 'workspace' | 'active'>): WorkspaceSpec['tabs'][number] | undefined {
  return workspace.tabs.find((t) => t.id === active) ?? workspace.tabs[0];
}

/** A region id no tab uses yet: the kind, suffixed past every collision. */
export function newRegionId(spec: ScreenSpec, kind: string): string {
  const taken = new Set([...workspaceRegionIds(spec), ...workspaceFixedIds(spec)]);
  let id = kind;
  for (let i = 2; taken.has(id); i++) id = `${kind}-${i}`;
  return id;
}

/** The content slot a region's app content reaches the binding through. */
export const contentSlot = (id: string): string => `content:${id}`;

/** The Tree's slots for a tab: each region's app content under its content slot, the header's and footer's too. */
export function workspaceSlots<C>(tab: WorkspaceSpec['tabs'][number] | undefined, content: Record<string, C> | undefined): Record<string, C> {
  const slots: Record<string, C> = {};
  if (!tab || !content) return slots;
  for (const id of [...workspaceRegionIds(tab.spec), ...workspaceFixedIds(tab.spec)]) {
    const fill = content[id];
    if (fill !== undefined) slots[contentSlot(id)] = fill;
  }
  return slots;
}

function frameNode(
  tabId: string,
  regionId: string,
  bound: string | undefined,
  tracks: readonly WorkspaceTrack[] | undefined,
  palette: readonly WorkspaceRegion[] | undefined,
  inert: boolean,
): Node {
  const tag = textView({ role: 'caption', tone: 'muted', className: 'yh-workspace__tag' });
  const plate = surfaceView({ border: true, radius: 'card', className: 'yh-workspace__frame' });
  const tool = (label: string, key: string, name: string) =>
    component('Button', { label, name, size: 'sm', variant: 'quiet', disabled: inert }, { on: { onPress: key } });
  const index = tracks === undefined ? -1 : tracks.findIndex((t) => t.id === bound);
  const bar: Child[] = [
    h('span', { class: tag.className, ...tag.attrs, 'data-part': 'tag' }, regionId),
    tool('←', `left:${regionId}`, `move ${regionId} left`),
    tool('→', `right:${regionId}`, `move ${regionId} right`),
    tool('↑', `up:${regionId}`, `move ${regionId} up`),
    tool('↓', `down:${regionId}`, `move ${regionId} down`),
    tool('✕', `drop:${regionId}`, `remove ${regionId}`),
    ...(palette ?? []).map((kind) =>
      component(
        'Button',
        { label: `+ ${kind.label}`, name: `split ${regionId} with ${kind.label}`, size: 'sm', variant: 'quiet', disabled: inert },
        { on: { onPress: `add:${regionId}:${kind.kind}` }, key: kind.kind },
      ),
    ),
  ];
  if (tracks !== undefined && tracks.length > 0) {
    bar.push(
      component(
        'Segmented',
        { items: tracks.map((t) => t.label), index: Math.max(0, index), label: `Bind ${regionId}`, disabled: inert },
        { on: { onChange: `bind:${regionId}` } },
      ),
    );
  }
  return h(
    'div',
    {
      class: plate.className,
      ...plate.attrs,
      'data-part': 'frame',
      'data-region': regionId,
    },
    h('div', { class: 'yh-workspace__bar', 'data-part': 'framebar' }, ...bar),
    h('div', { class: 'yh-workspace__body', 'data-part': 'framebody' }, slot(contentSlot(regionId))),
  );
}

/**
 * The tree Workspace draws: the tab strip (and, while editing, the palette bar), then the open
 * tab's Screen — each region framed while editing, bare otherwise. Region contents travel as
 * `content:<id>` slots, filled by the binding; the Screen's own `region:<id>` slots are the
 * model's, so a frame wraps the app's content without the app knowing.
 */
export function workspaceView(
  { name, workspace, active, palette, bindings, tracks, editing, disabled, className }: WorkspaceModelProps,
  tab: WorkspaceSpec['tabs'][number] | undefined,
): Node {
  const inert = disabled === true;
  const ids = tab ? workspaceRegionIds(tab.spec) : [];
  const screenSlots: Record<string, Child[]> = {};
  for (const id of ids) {
    screenSlots[`region:${id}`] = editing
      ? [frameNode(tab!.id, id, bindings?.[id]?.['track'], tracks, palette, inert)]
      : [slot(contentSlot(id))];
  }
  // The header and footer are fixed: their content, never a frame (nothing there moves or splits).
  for (const id of tab ? workspaceFixedIds(tab.spec) : []) screenSlots[`region:${id}`] = [slot(contentSlot(id))];
  return h(
    'div',
    {
      class: `yh-workspace${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-editing': editing ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    component(
      'Tabs',
      { name: `${name} tabs`, items: workspace.tabs.map((t) => ({ id: t.id, label: t.title })), value: active },
      { on: { onChange: 'tab' } },
    ),
    editing && (palette ?? []).length > 0
      ? h(
          'div',
          { class: 'yh-workspace__palette', 'data-part': 'palette' },
          ...(palette ?? []).map((kind) =>
            component(
              'Button',
              { label: `+ ${kind.label}`, name: `add ${kind.label} to this tab`, size: 'sm', variant: 'quiet', disabled: inert },
              { on: { onPress: `palette:${kind.kind}` }, key: kind.kind },
            ),
          ),
        )
      : null,
    tab ? component('Screen', { name: tab.title, spec: tab.spec }, { slots: screenSlots }) : null,
  );
}

/** The callbacks `workspaceView`'s tree names: the tab, the frame's tools and the binding. */
export function workspaceHandlers({ workspace, active, palette, tracks, onTab, onSpec, onBinding }: WorkspaceModelProps): Handlers {
  const handlers: Handlers = {};
  handlers['tab'] = (id: string) => onTab?.(id);
  const tab = workspaceTab({ workspace, active });
  if (!tab) return handlers;
  const ids = workspaceRegionIds(tab.spec);
  for (const id of ids) {
    handlers[`left:${id}`] = () => onSpec?.(tab.id, moveRegion(tab.spec, id, 'left'), 'move');
    handlers[`right:${id}`] = () => onSpec?.(tab.id, moveRegion(tab.spec, id, 'right'), 'move');
    handlers[`up:${id}`] = () => onSpec?.(tab.id, moveRegionToRow(tab.spec, id, 'up'), 'moveRow');
    handlers[`down:${id}`] = () => onSpec?.(tab.id, moveRegionToRow(tab.spec, id, 'down'), 'moveRow');
    handlers[`drop:${id}`] = () => onSpec?.(tab.id, removeRegion(tab.spec, id), 'remove');
    for (const kind of palette ?? []) {
      handlers[`add:${id}:${kind.kind}`] = () =>
        onSpec?.(tab.id, splitRegion(tab.spec, id, paletteRegion(kind, newRegionId(tab.spec, kind.kind))), 'split');
    }
    if (tracks !== undefined) {
      handlers[`bind:${id}`] = (index: number) => {
        const track = tracks[index];
        if (track) onBinding?.(tab.id, id, { track: track.id });
      };
    }
  }
  for (const kind of palette ?? []) {
    handlers[`palette:${kind.kind}`] = () =>
      onSpec?.(tab.id, addRegion(tab.spec, tab.spec.rows.length - 1, paletteRegion(kind, newRegionId(tab.spec, kind.kind))), 'add');
  }
  return handlers;
}
