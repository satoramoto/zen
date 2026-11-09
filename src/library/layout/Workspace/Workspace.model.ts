// Workspace's model: the surface an app composes its DAW on. It draws the app's document (tabs of
// rows of region instances) with the app's pane definitions, and every edit leaves it as one
// `SurfaceIntent` through `onIntent`. It never writes the document: the app applies the intent (its
// own store, or `applySurfaceIntent`) and passes the next one back. What it keeps is visual only
// (`SurfaceUi`: edit mode, the region whose tools are open, the palette, a title being typed), each
// controllable by its prop. No framework: `Workspace.tsx` and `Workspace.svelte` hand this tree to
// their `Tree`, with the surface's own visual state.
import { surfaceView } from '../../primitives/Surface.model';
import { textView } from '../../primitives/Text.model';
import { component, h, slot, wire, type Child, type Handlers, type Node } from '../../view/Tree.model';
import { openTab, paneIndex, resolveTarget, surfaceScreen, tabRegions, targetsFor } from './surface';
import {
  SURFACE_DIRECTIONS,
  type PaneDefinition,
  type SurfaceDocument,
  type SurfaceIntent,
  type SurfaceRegion,
  type SurfaceTab,
  type SurfaceTarget,
  type SurfaceUi,
} from './Workspace.types';

/** Every Workspace prop (each region's content reaches the binding as a slot, never as a prop). */
export interface WorkspaceModelProps {
  /** The surface's accessible name. */
  name: string;
  /** The app's document: its tabs and the open one. Never written by the surface. */
  document: SurfaceDocument;
  /** The pane kinds the app defines, in palette order. Without them there is nothing to add. */
  panes?: readonly PaneDefinition[];
  /** What a region can be bound to. A region is offered the targets of its kind's `targets`. */
  targets?: readonly SurfaceTarget[];
  /** The app's selection: what a region bound to `selected` shows. */
  selected?: string;
  /** Undo is possible. Left out: no undo is offered. */
  canUndo?: boolean;
  /** Redo is possible. Left out: no redo is offered. */
  canRedo?: boolean;
  /** Every edit, as one intent. The app applies it. */
  onIntent?: (intent: SurfaceIntent) => void;
  /** Edit mode, when the app keeps it. Left out: the surface keeps its own. */
  editing?: boolean;
  /** The region whose tools are open (`null`: none), when the app keeps it. */
  editingRegion?: string | null;
  /** The palette's state, when the app keeps it. */
  paletteOpen?: boolean;
  /** The surface's visual state changed (whoever keeps it). */
  onUi?: (ui: SurfaceUi) => void;
  /** Shown, dimmed, deaf: the surface is read, not played. */
  disabled?: boolean;
  /** Classes added to the root, after the workspace's own. */
  className?: string;
}

/** The visual state the surface draws: each prop the app passes wins over the surface's own. */
export function surfaceUi(props: Pick<WorkspaceModelProps, 'editing' | 'editingRegion' | 'paletteOpen'>, own: SurfaceUi): SurfaceUi {
  const editing = props.editing ?? own.editing;
  const region = props.editingRegion !== undefined ? (props.editingRegion ?? undefined) : own.region;
  return {
    editing,
    region: editing ? region : undefined,
    palette: editing && (props.paletteOpen ?? own.palette),
    naming: editing ? own.naming : undefined,
  };
}

/** The content slot a region's app content reaches the binding through; its args are the instance and its resolved target. */
export const contentSlot = (id: string): string => `content:${id}`;

/** The regions whose content the app fills on the open tab: every known kind's instance, with its target. */
export function workspaceContent(props: Pick<WorkspaceModelProps, 'document' | 'panes' | 'selected'>): { region: SurfaceRegion; target: string | undefined }[] {
  const tab = openTab(props.document);
  if (!tab) return [];
  const known = paneIndex(props.panes);
  return tabRegions(tab)
    .filter((r) => known.has(r.kind))
    .map((region) => ({ region, target: resolveTarget(region.binding, props.selected) }));
}

const tool = (label: string, key: string, name: string, inert: boolean, extra: Record<string, unknown> = {}): Child =>
  component('Button', { label, name, size: 'sm', variant: 'quiet', disabled: inert, ...extra }, { on: { onPress: key }, key });

/** A title being typed: the field, Save and Cancel. Enter saves, Escape cancels. */
function namingNode(what: string, text: string, inert: boolean): Node {
  const field = textView({ role: 'body', className: 'yh-workspace__field' });
  // The field's well is a Surface; the input inside it is bare.
  const well = surfaceView({ layer: 'ground', border: true, radius: 'control', className: 'yh-workspace__well' });
  return wire(
    h(
      'form',
      { class: 'yh-workspace__naming', 'data-part': 'naming', 'aria-label': `Rename ${what}` },
      h(
        'span',
        { class: well.className, ...well.attrs, 'data-part': 'well' },
        wire(h('input', { class: field.className, ...field.attrs, 'data-part': 'field', value: text, 'aria-label': `Name for ${what}`, disabled: inert ? '' : undefined }), {
          on: { input: 'naming:input', keydown: 'naming:key' },
          bind: [['ref', { onRef: 'naming:ref' }]],
        }),
      ),
      component('Button', { label: 'Save', name: `Save name for ${what}`, size: 'sm', disabled: inert || text.trim() === '' }, { on: { onPress: 'naming:save' } }),
      component('Button', { label: 'Cancel', name: `Cancel renaming ${what}`, size: 'sm', variant: 'quiet', disabled: inert }, { on: { onPress: 'naming:cancel' } }),
    ),
    { on: { submit: 'naming:submit' } },
  );
}

/** A region drawn for a kind the app never defined: it names the kind and keeps its place. */
function placeholderNode(region: SurfaceRegion): Node {
  const plate = surfaceView({ border: true, radius: 'card', className: 'yh-workspace__placeholder' });
  const word = textView({ role: 'caption', tone: 'muted' });
  return h(
    'div',
    { class: plate.className, ...plate.attrs, 'data-part': 'placeholder', role: 'note', 'aria-label': `${region.title}: unknown pane ${region.kind}` },
    h('span', { class: word.className, ...word.attrs }, `Unknown pane “${region.kind}”`),
  );
}

/** A region's content: the app's slot for a known kind, the placeholder otherwise. */
function contentNode(region: SurfaceRegion, known: boolean, target: string | undefined): Child {
  return known ? slot(contentSlot(region.id), [region, target]) : placeholderNode(region);
}

/** A region's frame while editing: its tag (which opens its tools), its tools when open, its content. */
function frameNode(region: SurfaceRegion, pane: PaneDefinition | undefined, targets: SurfaceTarget[], ui: SurfaceUi, selected: string | undefined, inert: boolean): Node {
  const open = ui.region === region.id;
  const plate = surfaceView({ border: true, radius: 'card', className: 'yh-workspace__frame' });
  const id = region.id;
  const bar: Child[] = [
    component(
      'Button',
      { label: region.title, name: `${region.title} tools`, size: 'sm', variant: open ? 'secondary' : 'quiet', expanded: open, disabled: inert },
      { on: { onPress: `pick:${id}` }, key: 'tag' },
    ),
  ];
  if (open && ui.naming?.target === 'region' && ui.naming.id === id) {
    bar.push(namingNode(region.title, ui.naming.text, inert));
  } else if (open) {
    for (const d of SURFACE_DIRECTIONS) bar.push(tool({ left: '←', right: '→', up: '↑', down: '↓' }[d], `move:${d}:${id}`, `move ${region.title} ${d}`, inert));
    bar.push(tool('Rename', `retitle:${id}`, `rename ${region.title}`, inert));
    bar.push(tool('✕', `remove:${id}`, `remove ${region.title}`, inert));
    if (targets.length > 0) {
      const index = region.binding.mode === 'fixed' ? targets.findIndex((t) => t.id === (region.binding as { target: string }).target) + 1 : 0;
      bar.push(
        component(
          'Segmented',
          { items: ['Selected', ...targets.map((t) => t.label)], index: Math.max(0, index), label: `Bind ${region.title}`, disabled: inert },
          { on: { onChange: `bind:${id}` }, key: 'bind' },
        ),
      );
    }
  }
  return h(
    'div',
    { class: plate.className, ...plate.attrs, 'data-part': 'frame', 'data-region': id, 'data-kind': region.kind, 'data-open': open ? 'true' : undefined },
    h('div', { class: 'yh-workspace__bar', 'data-part': 'framebar' }, ...bar),
    h('div', { class: 'yh-workspace__body', 'data-part': 'framebody' }, contentNode(region, pane !== undefined, resolveTarget(region.binding, selected))),
  );
}

/** The bar over the tabs: edit mode's switch, the open tab's tools while editing, undo and redo when the app offers them. */
function toolbarNode(props: WorkspaceModelProps, tab: SurfaceTab | undefined, ui: SurfaceUi, inert: boolean): Node {
  const { canUndo, canRedo, document } = props;
  const items: Child[] = [];
  if (ui.editing && tab && ui.naming?.target === 'tab' && ui.naming.id === tab.id) {
    items.push(namingNode(tab.title, ui.naming.text, inert));
  } else if (ui.editing) {
    items.push(tool('+ View', 'tab:add', 'add a view', inert));
    if (tab) {
      items.push(tool('Rename', 'tab:rename', `rename ${tab.title}`, inert));
      items.push(tool('Duplicate', 'tab:duplicate', `duplicate ${tab.title}`, inert));
      items.push(tool('Remove', 'tab:remove', `remove ${tab.title}`, inert || document.tabs.length <= 1));
    }
    if ((props.panes ?? []).length > 0 && tab)
      items.push(tool('+ Pane', 'palette', ui.palette ? 'close the palette' : 'open the palette', inert, { expanded: ui.palette, popup: 'menu' }));
  }
  if (canUndo !== undefined) items.push(tool('Undo', 'undo', 'undo', inert || !canUndo));
  if (canRedo !== undefined) items.push(tool('Redo', 'redo', 'redo', inert || !canRedo));
  items.push(tool(ui.editing ? 'Done' : 'Edit', 'edit', ui.editing ? 'finish editing' : 'edit the views', inert, { pressed: ui.editing }));
  return h('div', { class: 'yh-workspace__tools', 'data-part': 'tools', role: 'toolbar', 'aria-label': `${props.name} tools` }, ...items);
}

/** The open palette: every definition by its label and description, in the app's order. */
function paletteNode(panes: readonly PaneDefinition[], region: SurfaceRegion | undefined, inert: boolean): Node {
  const where = region ? `beside ${region.title}` : 'to this tab';
  const hint = textView({ role: 'caption', tone: 'muted' });
  return h(
    'div',
    { class: 'yh-workspace__palette', 'data-part': 'palette', role: 'group', 'aria-label': 'Palette' },
    ...panes.map((p) =>
      h(
        'div',
        { class: 'yh-workspace__kind', 'data-part': 'kind' },
        component('Button', { label: `+ ${p.label}`, name: `add ${p.label} ${where}`, size: 'sm', variant: 'quiet', disabled: inert }, { on: { onPress: `add:${p.kind}` } }),
        p.description ? h('span', { class: hint.className, ...hint.attrs }, p.description) : null,
      ),
    ),
  );
}

/**
 * The tree Workspace draws: the tools and the tab strip, while editing the palette when open, then
 * the open tab's Screen, each region framed while editing and bare otherwise. A known kind's
 * content is the app's `content:<id>` slot (its args: the instance and its target); an unknown
 * kind is a placeholder that names it.
 */
export function workspaceView(props: WorkspaceModelProps, ui: SurfaceUi): Node {
  const { name, document, panes, targets, selected, disabled, className } = props;
  const inert = disabled === true;
  const tab = openTab(document);
  const index = paneIndex(panes);
  const regions = tab ? tabRegions(tab) : [];
  const screenSlots: Record<string, Child[]> = {};
  for (const region of regions) {
    const pane = index.get(region.kind);
    screenSlots[`region:${region.id}`] = [
      ui.editing ? frameNode(region, pane, targetsFor(pane, targets), ui, selected, inert) : contentNode(region, pane !== undefined, resolveTarget(region.binding, selected)),
    ];
  }
  const empty = textView({ role: 'body', tone: 'muted', className: 'yh-workspace__empty' });
  return h(
    'div',
    {
      class: `yh-workspace${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-editing': ui.editing ? 'true' : undefined,
      'data-palette': ui.palette ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    h(
      'div',
      { class: 'yh-workspace__head', 'data-part': 'head' },
      component('Tabs', { name: `${name} tabs`, items: document.tabs.map((t) => ({ id: t.id, label: t.title, disabled: inert })), value: tab?.id ?? null }, { on: { onChange: 'tab' } }),
      toolbarNode(props, tab, ui, inert),
    ),
    ui.palette && tab ? paletteNode(panes ?? [], regions.find((r) => r.id === ui.region), inert) : null,
    tab && regions.length > 0
      ? component('Screen', { name: tab.title, spec: surfaceScreen(tab, panes) }, { slots: screenSlots })
      : tab
        ? h('p', { class: empty.className, ...empty.attrs, 'data-part': 'empty' }, ui.editing ? 'This view is empty: add a pane from the palette.' : 'This view is empty.')
        : null,
  );
}

/** The visual state's writer: the surface's own value and, when it changes, `onUi`. */
export type SetUi = (ui: SurfaceUi) => void;

/** The callbacks `workspaceView`'s tree names. Every edit is one intent; visual changes go through `setOwn`. */
export function workspaceHandlers(props: WorkspaceModelProps, ui: SurfaceUi, own: SurfaceUi, setOwn: SetUi): Handlers {
  const { document, panes, targets, onIntent, onUi, disabled } = props;
  const handlers: Handlers = {};
  if (disabled) return handlers;
  const send = (intent: SurfaceIntent) => onIntent?.(intent);
  const visual = (change: Partial<SurfaceUi>) => {
    const next = { ...own, ...change };
    setOwn(next);
    onUi?.(surfaceUi(props, next));
  };
  const tab = openTab(document);
  const index = paneIndex(panes);

  handlers['tab'] = (id: string) => {
    if (id !== tab?.id) send({ type: 'selectTab', tab: id });
    if (ui.region !== undefined || ui.naming) visual({ region: undefined, naming: undefined });
  };
  handlers['edit'] = () => {
    const editing = !ui.editing;
    send({ type: 'setEditing', editing });
    visual(editing ? { editing } : { editing, region: undefined, palette: false, naming: undefined });
  };
  handlers['undo'] = () => send({ type: 'undo' });
  handlers['redo'] = () => send({ type: 'redo' });
  handlers['palette'] = () => visual({ palette: !ui.palette });
  handlers['tab:add'] = () => send({ type: 'addTab' });
  if (tab) {
    handlers['tab:rename'] = () => visual({ naming: { target: 'tab', id: tab.id, text: tab.title } });
    handlers['tab:duplicate'] = () => send({ type: 'duplicateTab', tab: tab.id });
    handlers['tab:remove'] = () => {
      if (document.tabs.length > 1) send({ type: 'removeTab', tab: tab.id });
    };

    const regions = tabRegions(tab);
    const picked = regions.find((r) => r.id === ui.region);
    for (const p of panes ?? []) {
      handlers[`add:${p.kind}`] = () => {
        if (picked) {
          const at = tab.rows.findIndex((row) => row.includes(picked.id));
          send({ type: 'addRegion', tab: tab.id, kind: p.kind, row: at, index: tab.rows[at].indexOf(picked.id) + 1 });
        } else {
          send({ type: 'addRegion', tab: tab.id, kind: p.kind, row: Math.max(0, tab.rows.length - 1) });
        }
      };
    }
    for (const r of regions) {
      handlers[`pick:${r.id}`] = () => visual({ region: ui.region === r.id ? undefined : r.id, naming: undefined });
      for (const d of SURFACE_DIRECTIONS) handlers[`move:${d}:${r.id}`] = () => send({ type: 'moveRegion', tab: tab.id, region: r.id, direction: d });
      handlers[`remove:${r.id}`] = () => {
        send({ type: 'removeRegion', tab: tab.id, region: r.id });
        visual({ region: undefined });
      };
      handlers[`retitle:${r.id}`] = () => visual({ naming: { target: 'region', id: r.id, text: r.title } });
      const offered = targetsFor(index.get(r.kind), targets);
      if (offered.length > 0) {
        handlers[`bind:${r.id}`] = (i: number) => {
          const t = offered[i - 1];
          send({ type: 'bindRegion', tab: tab.id, region: r.id, binding: t ? { mode: 'fixed', target: t.id } : { mode: 'selected' } });
        };
      }
    }
  }

  // A title being typed: the text is visual state; only Save sends the rename.
  const naming = ui.naming;
  const save = () => {
    if (!naming || naming.text.trim() === '') return;
    if (naming.target === 'tab') send({ type: 'renameTab', tab: naming.id, title: naming.text.trim() });
    else if (tab) send({ type: 'retitleRegion', tab: tab.id, region: naming.id, title: naming.text.trim() });
    visual({ naming: undefined });
  };
  handlers['naming:input'] = (event: Event) => {
    if (naming) visual({ naming: { ...naming, text: (event.target as HTMLInputElement).value } });
  };
  handlers['naming:key'] = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      visual({ naming: undefined });
    }
  };
  handlers['naming:submit'] = (event: Event) => {
    event.preventDefault();
    save();
  };
  handlers['naming:save'] = save;
  handlers['naming:cancel'] = () => visual({ naming: undefined });
  handlers['naming:ref'] = (el: HTMLInputElement | null) => {
    if (el && el.ownerDocument.activeElement !== el) {
      el.focus();
      el.select();
    }
  };
  return handlers;
}
