// Workspace's model: the surface an app composes its DAW on. It draws the app's document (a tab is a
// split tree of region instances, each split's children taking their shares) with the app's pane
// definitions, and every edit leaves it as one `SurfaceIntent` through `onIntent`. It never writes
// the document: the app applies the intent (its own store, or `applySurfaceIntent`) and passes the
// next one back. What it keeps is visual only (`SurfaceUi`: edit mode, the open region's tools and
// settings, the palette, a title being typed, a resize or a drag in progress, each region's measured
// room), the first three controllable by their props. No framework: `Workspace.tsx` and
// `Workspace.svelte` hand this tree to their `Tree`, with the surface's own visual state and the
// scope's principles (what a region's form is picked by).
import type { Principles } from '../assembly/types';
import { surfaceView } from '../../primitives/Surface.model';
import { textView } from '../../primitives/Text.model';
import { component, h, slot, styleText, wire, type Child, type ChildArg, type Handlers, type Node } from '../../view/Tree.model';
import { formForRoom, isSplit, leastRoom, leaves, openTab, paneIndex, resolveSettings, resolveTarget, tabRegions, targetsFor, PLACEHOLDER_FORMS } from './surface';
import {
  SURFACE_DIRECTIONS,
  type DockZone,
  type LayoutNode,
  type PaneDefinition,
  type ResolvedSettings,
  type SettingSpec,
  type SettingValue,
  type SplitNode,
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
  /** The app's document (either version): its tabs and the open one. Never written by the surface. */
  document: SurfaceDocument;
  /** The pane kinds the app defines, in palette order. Without them there is nothing to add. */
  panes?: readonly PaneDefinition[];
  /** What a region can be bound to, and what a `targets` setting picks from. */
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

/** What the bindings hand the model besides the props: the scope's principles. */
export interface WorkspaceEnv {
  principles: Principles;
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
    sheet: editing && region !== undefined ? own.sheet : undefined,
    resizing: editing ? own.resizing : undefined,
    docking: editing ? own.docking : undefined,
    rooms: own.rooms,
  };
}

/** The content slot a region's app content reaches the binding through; its args are the instance, its target and its settings. */
export const contentSlot = (id: string): string => `content:${id}`;

/** The regions whose content the app fills on the open tab: every known kind's instance, with its target and settings. */
export function workspaceContent(
  props: Pick<WorkspaceModelProps, 'document' | 'panes' | 'selected' | 'targets'>,
): { region: SurfaceRegion; target: string | undefined; settings: ResolvedSettings }[] {
  const tab = openTab(props.document);
  if (!tab) return [];
  const known = paneIndex(props.panes);
  return tabRegions(tab)
    .filter((r) => known.has(r.kind))
    .map((region) => ({ region, target: resolveTarget(region.binding, props.selected), settings: resolveSettings(known.get(region.kind), region, props.targets) }));
}

const tool = (label: string, key: string, name: string, inert: boolean, extra: Record<string, unknown> = {}): Child =>
  component('Button', { label, name, size: 'sm', variant: 'quiet', disabled: inert, ...extra }, { on: { onPress: key }, key });

/** A title being typed: the field in its well, Save and Cancel. Enter saves, Escape cancels (the field's own keys). */
function namingNode(what: string, text: string, inert: boolean): Node {
  const field = textView({ role: 'body', className: 'yh-workspace__field' });
  // The field's well is a Surface; the input inside it is bare.
  const well = surfaceView({ layer: 'ground', border: true, radius: 'control', className: 'yh-workspace__well' });
  return h(
    'div',
    { class: 'yh-workspace__naming', 'data-part': 'naming', role: 'group', 'aria-label': `Rename ${what}` },
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

/** What every part of the tree reads. */
interface Cx {
  props: WorkspaceModelProps;
  env: WorkspaceEnv;
  ui: SurfaceUi;
  /** Edit mode on an unlocked tab. */
  editing: boolean;
  inert: boolean;
  index: Map<string, PaneDefinition>;
  byId: Map<string, SurfaceRegion>;
}

/** One region's place in the tree: its measured box, its content in the form its room fits, and (editing) its frame and drop zone. */
function leafNode(region: SurfaceRegion, cx: Cx): Node {
  const pane = cx.index.get(region.kind);
  const room = cx.ui.rooms?.[region.id];
  const { form, cramped } = formForRoom(pane?.forms ?? PLACEHOLDER_FORMS, room, cx.env.principles);
  const target = resolveTarget(region.binding, cx.props.selected);
  const content: Child = pane
    ? component('FormScope', { form }, { slots: { children: [slot(contentSlot(region.id), [region, target, resolveSettings(pane, region, cx.props.targets)])] } })
    : placeholderNode(region);
  const docking = cx.ui.docking;
  const zone = docking?.target === region.id ? docking.zone : undefined;
  const open = cx.ui.region === region.id;
  const plate = surfaceView({ border: true, radius: 'card', className: 'yh-workspace__frame' });
  const body: Child = cx.editing
    ? h(
        'div',
        { class: plate.className, ...plate.attrs, 'data-part': 'frame', 'data-region': region.id, 'data-kind': region.kind, 'data-open': open ? 'true' : undefined },
        h(
          'div',
          { class: 'yh-workspace__bar', 'data-part': 'framebar' },
          wire(
            h(
              'span',
              { class: 'yh-workspace__grip', 'data-part': 'grip' },
              component(
                'Button',
                { label: region.title, name: `${region.title} tools`, size: 'sm', variant: open ? 'secondary' : 'quiet', expanded: open, controls: 'yh-workspace-region-tools', disabled: cx.inert },
                { on: { onPress: `pick:${region.id}` } },
              ),
            ),
            { bind: [['dockDrag', { region: region.id, disabled: cx.inert, onDrag: 'drag', onDock: `dock:${region.id}` }]] },
          ),
        ),
        h('div', { class: 'yh-workspace__body', 'data-part': 'framebody' }, content),
      )
    : content;
  return wire(
    h(
      'div',
      {
        class: 'yh-workspace__leaf',
        'data-part': 'leaf',
        'data-leaf': region.id,
        'data-dock-region': cx.editing ? region.id : undefined,
        'data-form': form,
        'data-cramped': cramped ? 'true' : undefined,
        'data-dragging': docking?.region === region.id ? 'true' : undefined,
      },
      body,
      zone ? h('div', { class: 'yh-workspace__drop', 'data-part': 'drop', 'data-zone': zone, 'aria-hidden': 'true' }) : null,
    ),
    { bind: [['room', { onRoom: `room:${region.id}` }]] },
  );
}

/** The least room a branch takes along `axis`, px: a leaf's smallest form; a split's children added up its way, the widest across. */
function leastAlong(node: LayoutNode, axis: 'row' | 'column', cx: Cx): number {
  if (!isSplit(node)) {
    const pane = cx.index.get(cx.byId.get(node)?.kind ?? '');
    const least = leastRoom(pane?.forms ?? PLACEHOLDER_FORMS, cx.env.principles);
    return axis === 'row' ? least.w : least.h;
  }
  const each = node.children.map((c) => leastAlong(c.node, axis, cx));
  return node.split === axis ? each.reduce((a, b) => a + b, 0) : Math.max(0, ...each);
}

/** A split: its children in grid tracks of their shares (the previewed ones while a handle drags), a handle between each two while editing. */
function splitNode(split: SplitNode, cx: Cx): Node {
  const shares = cx.ui.resizing?.split === split.id ? cx.ui.resizing.shares : split.children.map((c) => c.share);
  const handles = cx.editing;
  const tracks = shares.flatMap((s, i) => (handles && i > 0 ? ['var(--yh-workspace-handle)', `minmax(0, ${s}fr)`] : [`minmax(0, ${s}fr)`])).join(' ');
  const mins = split.children.map((c) => leastAlong(c.node, split.split, cx));
  const title = (id: string | undefined) => (id === undefined ? '' : (cx.byId.get(id)?.title ?? id));
  const total = shares.reduce((a, b) => a + b, 0) || 1;
  const parts: ChildArg[] = [];
  split.children.forEach((c, i) => {
    if (handles && i > 0) {
      const before = title(leaves(split.children[i - 1].node).at(-1));
      const after = title(leaves(c.node)[0]);
      const nub = surfaceView({ layer: 'raised', border: true, radius: 'control', className: 'yh-workspace__nub' });
      parts.push(
        wire(
          h('div', {
            class: 'yh-workspace__handle',
            'data-part': 'handle',
            'data-handle': `${split.id}:${i - 1}`,
            role: 'separator',
            tabindex: cx.inert ? undefined : '0',
            'aria-orientation': split.split === 'row' ? 'vertical' : 'horizontal',
            'aria-label': `Resize ${before} and ${after}`,
            'aria-valuemin': '0',
            'aria-valuemax': '100',
            'aria-valuenow': String(Math.round((shares.slice(0, i).reduce((a, b) => a + b, 0) / total) * 100)),
          }, h('span', { class: nub.className, ...nub.attrs, 'data-part': 'nub', 'aria-hidden': 'true' })),
          { bind: [['splitHandle', { axis: split.split, index: i - 1, shares, mins, disabled: cx.inert, onPreview: `preview:${split.id}`, onCommit: `commit:${split.id}` }]] },
        ),
      );
    }
    parts.push(layoutNode(c.node, cx));
  });
  return h(
    'div',
    {
      class: 'yh-workspace__split',
      'data-part': 'split',
      'data-split': split.split,
      'data-split-id': split.id,
      style: styleText({ [split.split === 'row' ? 'grid-template-columns' : 'grid-template-rows']: tracks }),
    },
    ...parts,
  );
}

function layoutNode(node: LayoutNode, cx: Cx): ChildArg {
  if (isSplit(node)) return splitNode(node, cx);
  const region = cx.byId.get(node);
  return region ? leafNode(region, cx) : null;
}

/** The open region's tools, in a row of their own under the head so a narrow pane never cuts them off. */
function regionToolsNode(region: SurfaceRegion, pane: PaneDefinition | undefined, targets: SurfaceTarget[], ui: SurfaceUi, inert: boolean): Node {
  const id = region.id;
  const items: Child[] = [];
  const name = textView({ role: 'label', className: 'yh-workspace__which' });
  items.push(h('span', { class: name.className, ...name.attrs, 'data-part': 'which' }, region.title));
  if (ui.naming?.target === 'region' && ui.naming.id === id) {
    items.push(namingNode(region.title, ui.naming.text, inert));
  } else {
    for (const d of SURFACE_DIRECTIONS) items.push(tool({ left: '←', right: '→', up: '↑', down: '↓' }[d], `move:${d}:${id}`, `move ${region.title} ${d}`, inert));
    items.push(tool('Rename', `retitle:${id}`, `rename ${region.title}`, inert));
    if ((pane?.settings ?? []).length > 0) items.push(tool('Settings', 'sheet', `${region.title} settings`, inert, { expanded: ui.sheet === true }));
    items.push(tool('✕', `remove:${id}`, `remove ${region.title}`, inert));
    if (targets.length > 0) {
      const binding = region.binding;
      const index = binding.mode === 'fixed' ? targets.findIndex((t) => t.id === binding.target) + 1 : 0;
      items.push(
        component(
          'Segmented',
          { items: ['Selected', ...targets.map((t) => t.label)], index: Math.max(0, index), label: `Bind ${region.title}`, disabled: inert },
          { on: { onChange: `bind:${id}` }, key: 'bind' },
        ),
      );
    }
  }
  return h('div', { class: 'yh-workspace__region', id: 'yh-workspace-region-tools', 'data-part': 'regiontools', role: 'toolbar', 'aria-label': `${region.title} tools` }, ...items);
}

/** The options a `choice`, `choices` or `targets` setting picks from. */
function optionsOf(spec: SettingSpec, targets: readonly SurfaceTarget[] | undefined): { value: string; label: string }[] {
  if (spec.type === 'targets') return (targets ?? []).filter((t) => t.kind === spec.of).map((t) => ({ value: t.id, label: t.label }));
  if (spec.type === 'choices' || spec.type === 'choice') return [...spec.options];
  return [];
}

/** One field of the settings sheet. */
function fieldNode(spec: SettingSpec, value: SettingValue | undefined, targets: readonly SurfaceTarget[] | undefined, inert: boolean): Node {
  const caption = textView({ role: 'label', className: 'yh-workspace__label' });
  const label = h('span', { class: caption.className, ...caption.attrs, 'data-part': 'label' }, spec.label);
  let control: Child;
  if (spec.type === 'choice') {
    const index = spec.options.findIndex((o) => o.value === value);
    control = component('Segmented', { items: spec.options.map((o) => o.label), index: Math.max(0, index), label: spec.label, disabled: inert }, { on: { onChange: `set:${spec.key}` } });
  } else if (spec.type === 'toggle') {
    control = component('Checkbox', { checked: value === true, disabled: inert, 'aria-label': spec.label }, { on: { onChange: `flip:${spec.key}` } });
  } else if (spec.type === 'number') {
    const param = { kind: spec.step !== undefined && spec.step >= 1 ? 'int' : 'float', min: spec.min, max: spec.max, defaultValue: spec.default, name: spec.label };
    control = component('NumberField', { param, value: typeof value === 'number' ? value : spec.default, label: spec.label, disabled: inert }, { on: { onChange: `num:${spec.key}` } });
  } else {
    const picked = new Set(Array.isArray(value) ? (value as readonly string[]) : []);
    control = h(
      'div',
      { class: 'yh-workspace__picks', 'data-part': 'picks', role: 'group', 'aria-label': spec.label },
      ...optionsOf(spec, targets).map((o) =>
        component('Checkbox', { checked: picked.has(o.value), disabled: inert, name: spec.key, value: o.value }, { on: { onChange: `pick:${spec.key}:${o.value}` }, slots: { children: [o.label] }, key: o.value }),
      ),
    );
  }
  return h('div', { class: 'yh-workspace__setting', 'data-part': 'setting', 'data-setting': spec.key }, label, control);
}

/** The open region's settings: one field per setting its kind declares, each change one configure. */
function sheetNode(region: SurfaceRegion, pane: PaneDefinition, targets: readonly SurfaceTarget[] | undefined, inert: boolean): Node {
  const values = resolveSettings(pane, region, targets);
  const plate = surfaceView({ layer: 'raised', border: true, radius: 'card', className: 'yh-workspace__sheet' });
  return h(
    'div',
    { class: plate.className, ...plate.attrs, 'data-part': 'sheet', role: 'group', 'aria-label': `${region.title} settings` },
    ...(pane.settings ?? []).map((spec) => fieldNode(spec, values[spec.key], targets, inert)),
    tool('Done', 'sheet', `close ${region.title} settings`, inert),
  );
}

/** The bar beside the tabs: edit mode's switch and the open tab's tools, or, locked, only Unlock. */
function toolbarNode(props: WorkspaceModelProps, tab: SurfaceTab | undefined, ui: SurfaceUi, editing: boolean, inert: boolean): Node {
  const { canUndo, canRedo, document } = props;
  const items: Child[] = [];
  if (tab?.locked) {
    // A hold on a pointer (a brief press does nothing); Enter or Space from the keyboard.
    items.push(
      wire(
        h(
          'span',
          { class: 'yh-workspace__unlock', 'data-part': 'unlock' },
          component('Button', { label: 'Locked · hold to unlock', name: `unlock ${tab.title}`, size: 'sm', variant: 'quiet', disabled: inert }, { on: { onLongPress: 'unlock' } }),
        ),
        { on: { keydown: 'unlock:key' } },
      ),
    );
    return h('div', { class: 'yh-workspace__tools', 'data-part': 'tools', role: 'toolbar', 'aria-label': `${props.name} tools` }, ...items);
  }
  if (editing && tab && ui.naming?.target === 'tab' && ui.naming.id === tab.id) {
    items.push(namingNode(tab.title, ui.naming.text, inert));
  } else if (editing) {
    items.push(tool('+ View', 'tab:add', 'add a view', inert));
    if (tab) {
      items.push(tool('Rename', 'tab:rename', `rename ${tab.title}`, inert));
      items.push(tool('Duplicate', 'tab:duplicate', `duplicate ${tab.title}`, inert));
      items.push(tool('Remove', 'tab:remove', `remove ${tab.title}`, inert || document.tabs.length <= 1));
    }
    if ((props.panes ?? []).length > 0 && tab) items.push(tool('+ Pane', 'palette', ui.palette ? 'close the palette' : 'open the palette', inert, { expanded: ui.palette }));
    if (tab) items.push(tool('Lock', 'lock', `lock ${tab.title}`, inert));
  }
  if (canUndo !== undefined) items.push(tool('Undo', 'undo', 'undo', inert || !canUndo));
  if (canRedo !== undefined) items.push(tool('Redo', 'redo', 'redo', inert || !canRedo));
  items.push(tool(editing ? 'Done' : 'Edit', 'edit', editing ? 'finish editing' : 'edit the views', inert, { pressed: editing }));
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
 * The tree Workspace draws: the tab strip and the tools; while editing an unlocked tab, the open
 * region's tools, its settings and the palette when open; then the open tab's layout, each region
 * in the form its room fits, framed while editing. A known kind's content is the app's
 * `content:<id>` slot (its args: the instance, its target, its settings); an unknown kind is a
 * placeholder that names it.
 */
export function workspaceView(props: WorkspaceModelProps, ui: SurfaceUi, env: WorkspaceEnv): Node {
  const { name, document, panes, targets, disabled, className } = props;
  const inert = disabled === true;
  const tab = openTab(document);
  const editing = ui.editing && !tab?.locked;
  const index = paneIndex(panes);
  const regions = tab ? tabRegions(tab) : [];
  const byId = new Map((tab?.regions ?? []).map((r) => [r.id, r]));
  const cx: Cx = { props, env, ui, editing, inert, index, byId };
  const picked = editing ? regions.find((r) => r.id === ui.region) : undefined;
  const pickedPane = picked ? index.get(picked.kind) : undefined;
  const empty = textView({ role: 'body', tone: 'muted', className: 'yh-workspace__empty' });
  return h(
    'div',
    {
      class: `yh-workspace${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-dock-root': '',
      'data-editing': editing ? 'true' : undefined,
      'data-locked': tab?.locked ? 'true' : undefined,
      'data-docking': ui.docking ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    h(
      'div',
      { class: 'yh-workspace__head', 'data-part': 'head' },
      component('Tabs', { name: `${name} tabs`, items: document.tabs.map((t) => ({ id: t.id, label: t.title, disabled: inert })), value: tab?.id ?? null }, { on: { onChange: 'tab' } }),
      toolbarNode(props, tab, ui, editing, inert),
    ),
    picked ? regionToolsNode(picked, pickedPane, targetsFor(pickedPane, targets), ui, inert) : null,
    picked && pickedPane && ui.sheet && (pickedPane.settings ?? []).length > 0 ? sheetNode(picked, pickedPane, targets, inert) : null,
    editing && ui.palette && tab ? paletteNode(panes ?? [], picked, inert) : null,
    tab && tab.layout !== null && regions.length > 0
      ? h('div', { class: 'yh-workspace__layout', 'data-part': 'layout', role: 'group', 'aria-label': tab.title }, layoutNode(tab.layout, cx))
      : tab
        ? h('p', { class: empty.className, ...empty.attrs, 'data-part': 'empty' }, editing ? 'This view is empty: add a pane from the palette.' : 'This view is empty.')
        : null,
  );
}

/** The surface's own visual state: read at the moment a handler runs (several can run in one tick), and written. */
export interface UiStore {
  get(): SurfaceUi;
  set(ui: SurfaceUi): void;
}

/** The callbacks `workspaceView`'s tree names. Every edit is one intent; visual changes go through the store and `onUi`. */
export function workspaceHandlers(props: WorkspaceModelProps, ui: SurfaceUi, store: UiStore): Handlers {
  const { document, panes, targets, onIntent, onUi, disabled } = props;
  const handlers: Handlers = {};
  if (disabled) return handlers;
  const send = (intent: SurfaceIntent) => onIntent?.(intent);
  const visual = (change: Partial<SurfaceUi> | ((now: SurfaceUi) => Partial<SurfaceUi>), announce = true) => {
    const now = store.get();
    const next = { ...now, ...(typeof change === 'function' ? change(now) : change) };
    store.set(next);
    if (announce) onUi?.(surfaceUi(props, next));
  };
  const tab = openTab(document);
  const index = paneIndex(panes);

  handlers['tab'] = (id: string) => {
    if (id !== tab?.id) send({ type: 'selectTab', tab: id });
    if (ui.region !== undefined || ui.naming) visual({ region: undefined, naming: undefined, sheet: undefined });
  };
  handlers['edit'] = () => {
    const editing = !ui.editing;
    send({ type: 'setEditing', editing });
    visual(editing ? { editing } : { editing, region: undefined, palette: false, naming: undefined, sheet: undefined });
  };
  handlers['undo'] = () => send({ type: 'undo' });
  handlers['redo'] = () => send({ type: 'redo' });
  handlers['palette'] = () => visual({ palette: !ui.palette });
  handlers['sheet'] = () => visual({ sheet: !ui.sheet });
  handlers['tab:add'] = () => send({ type: 'addTab' });
  // Each region's measured room: visual state, not announced (it changes whenever the window does).
  for (const r of tab?.regions ?? []) {
    handlers[`room:${r.id}`] = (room: { w: number; h: number }) => {
      const was = store.get().rooms?.[r.id];
      if (was && Math.abs(was.w - room.w) < 1 && Math.abs(was.h - room.h) < 1) return;
      visual((now) => ({ rooms: { ...now.rooms, [r.id]: room } }), false);
    };
  }
  if (tab) {
    handlers['tab:rename'] = () => visual({ naming: { target: 'tab', id: tab.id, text: tab.title } });
    handlers['tab:duplicate'] = () => send({ type: 'duplicateTab', tab: tab.id });
    handlers['tab:remove'] = () => {
      if (document.tabs.length > 1) send({ type: 'removeTab', tab: tab.id });
    };
    handlers['lock'] = () => {
      send({ type: 'lockTab', tab: tab.id, locked: true });
      send({ type: 'setEditing', editing: false });
      visual({ editing: false, region: undefined, palette: false, naming: undefined, sheet: undefined });
    };
    handlers['unlock'] = () => send({ type: 'lockTab', tab: tab.id, locked: false });
    handlers['unlock:key'] = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      send({ type: 'lockTab', tab: tab.id, locked: false });
    };

    const regions = tabRegions(tab);
    const picked = regions.find((r) => r.id === ui.region);
    for (const p of panes ?? []) {
      handlers[`add:${p.kind}`] = () =>
        send(picked ? { type: 'addRegion', tab: tab.id, kind: p.kind, beside: picked.id, zone: 'right' } : { type: 'addRegion', tab: tab.id, kind: p.kind });
    }
    handlers['drag'] = (state: SurfaceUi['docking'] | null) => visual({ docking: state ?? undefined }, false);
    for (const r of regions) {
      handlers[`pick:${r.id}`] = () => visual({ region: ui.region === r.id ? undefined : r.id, naming: undefined, sheet: undefined });
      for (const d of SURFACE_DIRECTIONS) handlers[`move:${d}:${r.id}`] = () => send({ type: 'moveRegion', tab: tab.id, region: r.id, direction: d });
      handlers[`remove:${r.id}`] = () => {
        send({ type: 'removeRegion', tab: tab.id, region: r.id });
        visual({ region: undefined, sheet: undefined });
      };
      handlers[`retitle:${r.id}`] = () => visual({ naming: { target: 'region', id: r.id, text: r.title } });
      handlers[`dock:${r.id}`] = ({ target, zone }: { target: string; zone: DockZone }) => send({ type: 'dockRegion', tab: tab.id, region: r.id, target, zone });
      const offered = targetsFor(index.get(r.kind), targets);
      if (offered.length > 0) {
        handlers[`bind:${r.id}`] = (i: number) => {
          const t = offered[i - 1];
          send({ type: 'bindRegion', tab: tab.id, region: r.id, binding: t ? { mode: 'fixed', target: t.id } : { mode: 'selected' } });
        };
      }
    }
    // Resizing: a drag previews as visual state; its end, or one arrow press, is one resize.
    const walk = (node: LayoutNode | null): void => {
      if (node === null || !isSplit(node)) return;
      handlers[`preview:${node.id}`] = (shares: readonly number[] | null) => visual({ resizing: shares ? { split: node.id, shares } : undefined }, false);
      handlers[`commit:${node.id}`] = (shares: readonly number[]) => send({ type: 'resizeSplit', tab: tab.id, split: node.id, shares: shares.map((s) => Math.round(s * 1000) / 1000) });
      node.children.forEach((c) => walk(c.node));
    };
    walk(tab.layout);

    // Settings: each change is the region's whole next settings.
    const pane = picked ? index.get(picked.kind) : undefined;
    if (picked && pane) {
      const values = resolveSettings(pane, picked, targets);
      const configure = (key: string, value: SettingValue) => send({ type: 'configureRegion', tab: tab.id, region: picked.id, settings: { ...(picked.settings ?? {}), [key]: value } });
      for (const spec of pane.settings ?? []) {
        if (spec.type === 'choice') handlers[`set:${spec.key}`] = (i: number) => spec.options[i] && configure(spec.key, spec.options[i].value);
        else if (spec.type === 'toggle') handlers[`flip:${spec.key}`] = (checked: boolean) => configure(spec.key, checked);
        else if (spec.type === 'number') handlers[`num:${spec.key}`] = (v: number) => configure(spec.key, Math.min(spec.max, Math.max(spec.min, v)));
        else {
          const order = optionsOf(spec, targets).map((x) => x.value);
          for (const value of order) {
            handlers[`pick:${spec.key}:${value}`] = (checked: boolean) => {
              const now = (values[spec.key] as readonly string[] | undefined) ?? [];
              configure(spec.key, checked ? order.filter((v) => v === value || now.includes(v)) : now.filter((v) => v !== value));
            };
          }
        }
      }
    }
  }

  // A title being typed: the text is visual state; only Save (or Enter) sends the rename.
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
    } else if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
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
