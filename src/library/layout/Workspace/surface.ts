// The surface document's pure helpers (docs/workspace.md): a document's version 2 reading, the open
// tab, its leaves, the form a region's room fits, a region's settings with their defaults, and
// `applySurfaceIntent`, the next document for an intent. No state is kept here: an app with a store of
// its own (mix's `SurfaceStore`) never needs the applier; a story or an app without one hands every
// intent the surface sends to it and gives the surface the result.
import type { Forms, Principles } from '../assembly/types';
import { resolveNeed } from '../assembly/units';
import type {
  DockZone,
  LayoutNode,
  PaneDefinition,
  ResolvedSettings,
  SettingValue,
  SplitChild,
  SplitNode,
  SurfaceBinding,
  SurfaceDirection,
  SurfaceDocument,
  SurfaceDocumentV2,
  SurfaceIntent,
  SurfaceRegion,
  SurfaceTab,
  SurfaceTabV1,
  SurfaceTarget,
} from './Workspace.types';

export const isSplit = (node: LayoutNode): node is SplitNode => typeof node !== 'string';

/** A version 1 tab's version 2 reading: a column of its rows, each row's regions side by side, equal shares. */
export function readTab(tab: SurfaceTab | SurfaceTabV1): SurfaceTab {
  if (!('rows' in tab)) return tab;
  const held = new Set(tab.regions.map((r) => r.id));
  const rows = tab.rows.map((row) => row.filter((id) => held.has(id))).filter((row) => row.length > 0);
  const nodes: LayoutNode[] = rows.map((row, i) => (row.length === 1 ? row[0] : { id: `${tab.id}-row-${i + 1}`, split: 'row', children: row.map((node) => ({ node, share: 1 })) }));
  const layout: LayoutNode | null = nodes.length === 0 ? null : nodes.length === 1 ? nodes[0] : { id: `${tab.id}-rows`, split: 'column', children: nodes.map((node) => ({ node, share: 1 })) };
  return { id: tab.id, title: tab.title, layout, regions: tab.regions };
}

/** A document's version 2 reading. A v2 document is returned as it is. */
export function readDocument(doc: SurfaceDocument): SurfaceDocumentV2 {
  if (doc.version === 2) return doc;
  return { version: 2, active: doc.active, tabs: doc.tabs.map(readTab) };
}

/** The tab the surface shows, read as version 2: the document's `active`, else the first. */
export function openTab(doc: SurfaceDocument): SurfaceTab | undefined {
  const tab = (doc.tabs as readonly (SurfaceTab | SurfaceTabV1)[]).find((t) => t.id === doc.active) ?? doc.tabs[0];
  return tab ? readTab(tab) : undefined;
}

/** Every leaf id of a layout, in reading order (left to right, top to bottom). */
export function leaves(node: LayoutNode | null): string[] {
  if (node === null) return [];
  return isSplit(node) ? node.children.flatMap((c) => leaves(c.node)) : [node];
}

/** Every instance a tab draws, in reading order: the leaves the tab holds an instance for. */
export function tabRegions(tab: SurfaceTab | SurfaceTabV1): SurfaceRegion[] {
  const read = readTab(tab);
  const byId = new Map(read.regions.map((r) => [r.id, r]));
  return leaves(read.layout).flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}

/** Every split of a layout, outermost first. */
export function splits(node: LayoutNode | null): SplitNode[] {
  if (node === null || !isSplit(node)) return [];
  return [node, ...node.children.flatMap((c) => splits(c.node))];
}

/** The placeholder's one form: a short card, so an unknown kind keeps its place and can still be moved and removed. */
export const PLACEHOLDER_FORMS: Forms = [
  { id: 'placeholder', min: { w: { chars: { caption: 24 } }, h: { control: 2 } }, ideal: { w: { chars: { caption: 40 } }, h: { control: 3 } }, grow: { w: true } },
];

/** The app's definitions by kind. */
export const paneIndex = (panes: readonly PaneDefinition[] | undefined): Map<string, PaneDefinition> => new Map((panes ?? []).map((p) => [p.kind, p]));

/** The richest form whose least room fits `room`, else the smallest (the region is cramped). Unmeasured: the richest. */
export function formForRoom(forms: Forms, room: { w: number; h: number } | undefined, principles: Principles): { form: string; cramped: boolean } {
  if (!room) return { form: forms[0].id, cramped: false };
  for (const f of forms) {
    const min = resolveNeed(f.min, principles);
    if (min.w <= room.w + 0.5 && min.h <= room.h + 0.5) return { form: f.id, cramped: false };
  }
  return { form: forms[forms.length - 1].id, cramped: true };
}

/** The least room a pane takes: its smallest form's `min`. */
export function leastRoom(forms: Forms, principles: Principles): { w: number; h: number } {
  return resolveNeed(forms[forms.length - 1].min, principles);
}

/** The target a region shows: its fixed target, else the app's selection. */
export function resolveTarget(binding: SurfaceBinding, selected: string | undefined): string | undefined {
  return binding.mode === 'fixed' ? binding.target : selected;
}

/** The targets a definition can be bound to. */
export const targetsFor = (pane: PaneDefinition | undefined, targets: readonly SurfaceTarget[] | undefined): SurfaceTarget[] =>
  pane?.targets === undefined ? [] : (targets ?? []).filter((t) => t.kind === pane.targets);

/** A region's settings: each its kind declares, the region's value or the default (`'all'` targets expand to every one). */
export function resolveSettings(pane: PaneDefinition | undefined, region: SurfaceRegion, targets?: readonly SurfaceTarget[]): ResolvedSettings {
  const out: Record<string, SettingValue> = {};
  for (const spec of pane?.settings ?? []) {
    const given = region.settings?.[spec.key];
    if (spec.type === 'targets') {
      const all = (targets ?? []).filter((t) => t.kind === spec.of).map((t) => t.id);
      const value = given ?? spec.default;
      out[spec.key] = value === 'all' ? all : (value as readonly string[]);
    } else {
      out[spec.key] = given ?? spec.default;
    }
  }
  return out;
}

/** An id no tab, region or split in the document uses yet: `<base>-<n>`. */
export function freshId(doc: SurfaceDocument, base: string): string {
  const taken = new Set(readDocument(doc).tabs.flatMap((t) => [t.id, ...t.regions.map((r) => r.id), ...splits(t.layout).map((s) => s.id)]));
  let n = 1;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// ── The tree edits ───────────────────────────────────────────────────────────────────────────────

const sum = (children: readonly SplitChild[]): number => children.reduce((a, c) => a + c.share, 0) || 1;

/**
 * The layout with only the leaves `keep` holds: a split left with one child collapses into it, a
 * child split running the same way as its parent merges into the parent (its children keep their
 * part of its share), and an empty layout is null.
 */
export function cleanLayout(node: LayoutNode | null, keep: (id: string) => boolean = () => true): LayoutNode | null {
  if (node === null) return null;
  if (!isSplit(node)) return keep(node) ? node : null;
  const children: SplitChild[] = [];
  for (const c of node.children) {
    const n = cleanLayout(c.node, keep);
    if (n === null) continue;
    if (isSplit(n) && n.split === node.split) {
      const total = sum(n.children);
      for (const g of n.children) children.push({ node: g.node, share: (c.share * g.share) / total });
    } else children.push({ node: n, share: c.share });
  }
  if (children.length === 0) return null;
  if (children.length === 1) return children[0].node;
  return { ...node, children };
}

type Side = Exclude<DockZone, 'swap'>;
const axisOf = (zone: Side): 'row' | 'column' => (zone === 'left' || zone === 'right' ? 'row' : 'column');
const beforeOf = (zone: Side): boolean => zone === 'left' || zone === 'above';

/** `leaf` placed beside `target` on `zone`'s side: a sibling in a split running that way, or the target wrapped in a new one. */
function place(node: LayoutNode, target: string, leaf: string, zone: Side, splitId: () => string): LayoutNode {
  const axis = axisOf(zone);
  const pair = (t: LayoutNode, share: number): SplitChild[] => (beforeOf(zone) ? [{ node: leaf, share }, { node: t, share }] : [{ node: t, share }, { node: leaf, share }]);
  if (!isSplit(node)) return node === target ? { id: splitId(), split: axis, children: pair(node, 1) } : node;
  const i = node.children.findIndex((c) => c.node === target);
  if (i >= 0 && node.split === axis) {
    const children = [...node.children];
    children.splice(i, 1, ...pair(target, node.children[i].share / 2));
    return { ...node, children };
  }
  return { ...node, children: node.children.map((c) => ({ ...c, node: place(c.node, target, leaf, zone, splitId) })) };
}

/** Two leaves traded. */
function swap(node: LayoutNode, a: string, b: string): LayoutNode {
  if (!isSplit(node)) return node === a ? b : node === b ? a : node;
  return { ...node, children: node.children.map((c) => ({ ...c, node: swap(c.node, a, b) })) };
}

/** The splits from the root down to `id`'s leaf, with the index of the child holding it. */
function pathTo(node: LayoutNode | null, id: string): { split: SplitNode; index: number }[] | null {
  if (node === null) return null;
  if (!isSplit(node)) return node === id ? [] : null;
  for (let i = 0; i < node.children.length; i++) {
    const rest = pathTo(node.children[i].node, id);
    if (rest) return [{ split: node, index: i }, ...rest];
  }
  return null;
}

const MARK = '\u0000moving';

/** `split` with `child` inserted at `index`, wherever it sits in the tree. */
function insertInto(node: LayoutNode, splitId: string, index: number, child: SplitChild): LayoutNode {
  if (!isSplit(node)) return node;
  if (node.id === splitId) {
    const children = [...node.children];
    children.splice(index, 0, child);
    return { ...node, children };
  }
  return { ...node, children: node.children.map((c) => ({ ...c, node: insertInto(c.node, splitId, index, child) })) };
}

/** `split`'s children at `i` and `j` traded, shares staying in place. */
function tradeChildren(node: LayoutNode, splitId: string, i: number, j: number): LayoutNode {
  if (!isSplit(node)) return node;
  if (node.id === splitId) {
    const children = [...node.children];
    children[i] = { node: node.children[j].node, share: node.children[i].share };
    children[j] = { node: node.children[i].node, share: node.children[j].share };
    return { ...node, children };
  }
  return { ...node, children: node.children.map((c) => ({ ...c, node: tradeChildren(c.node, splitId, i, j) })) };
}

function replaceLeaf(node: LayoutNode, from: string, to: string): LayoutNode {
  if (!isSplit(node)) return node === from ? to : node;
  return { ...node, children: node.children.map((c) => ({ ...c, node: replaceLeaf(c.node, from, to) })) };
}

/**
 * One step of `id` in `direction`: within the nearest split running that way it trades places with
 * its neighbour, or, when it sits deeper inside one of that split's children, steps out beside that
 * child. A region at the edge of every such split leaves its branch for a new one at the tab's edge;
 * one already directly at that edge stays.
 */
function step(layout: LayoutNode, id: string, direction: SurfaceDirection, splitId: () => string): LayoutNode | null {
  const axis = direction === 'left' || direction === 'right' ? 'row' : 'column';
  const delta = direction === 'left' || direction === 'up' ? -1 : 1;
  const path = pathTo(layout, id);
  if (!path) return null;
  let direct = false;
  for (let k = path.length - 1; k >= 0; k--) {
    const { split, index } = path[k];
    if (split.split !== axis) continue;
    const child = split.children[index];
    if (child.node === id) {
      const j = index + delta;
      if (j >= 0 && j < split.children.length) return tradeChildren(layout, split.id, index, j);
      direct = true;
      continue;
    }
    const at = delta < 0 ? index : index + 1;
    const marked = insertInto(layout, split.id, at, { node: MARK, share: child.share / 2 });
    return replaceLeaf(cleanLayout(marked, (x) => x !== id)!, MARK, id);
  }
  if (direct || !isSplit(layout)) return null;
  const rest = cleanLayout(layout, (x) => x !== id);
  if (rest === null) return null;
  const children: SplitChild[] = delta < 0 ? [{ node: id, share: 1 }, { node: rest, share: 2 }] : [{ node: rest, share: 2 }, { node: id, share: 1 }];
  return cleanLayout({ id: splitId(), split: axis, children });
}

/** The layout with every leaf id renamed by `rename` and every split given a fresh id. */
function copyLayout(node: LayoutNode | null, rename: (id: string) => string, splitId: () => string): LayoutNode | null {
  if (node === null) return null;
  if (!isSplit(node)) return rename(node);
  return { id: splitId(), split: node.split, children: node.children.map((c) => ({ node: copyLayout(c.node, rename, splitId)!, share: c.share })) };
}

export interface ApplyOptions {
  /** The id for a new tab, region or split. Default `freshId(doc, base)`. */
  newId?: (doc: SurfaceDocument, base: string) => string;
  /** A new region's title, by kind. Default the kind. */
  titleOf?: (kind: string) => string;
}

/**
 * The next document for an intent, always version 2 when anything changed (a v1 document is read as
 * v2 first). An intent naming a tab, region or split the document doesn't hold returns the document
 * as given, as do `setEditing`, `undo` and `redo` (none edits the document). The last tab is never
 * removed; a tab may be left empty.
 */
export function applySurfaceIntent(given: SurfaceDocument, intent: SurfaceIntent, options: ApplyOptions = {}): SurfaceDocument {
  const doc = readDocument(given);
  const fresh = options.newId ?? freshId;
  const titleOf = options.titleOf ?? ((kind: string) => kind);
  // Ids minted while one intent applies are held aside, so two in a row never collide.
  const minted: string[] = [];
  const newId = (base: string): string => {
    const draft: SurfaceDocumentV2 = { ...doc, tabs: [...doc.tabs, { id: '', title: '', layout: null, regions: minted.map((id) => ({ id, kind: '', title: '', binding: { mode: 'selected' } })) }] };
    const id = fresh(draft, base);
    minted.push(id);
    return id;
  };
  const withTab = (id: string, change: (tab: SurfaceTab) => SurfaceTab | null): SurfaceDocument => {
    const tab = doc.tabs.find((t) => t.id === id);
    if (!tab) return given;
    const next = change(tab);
    if (next === null || next === tab) return given;
    return { ...doc, tabs: doc.tabs.map((t) => (t.id === id ? next : t)) };
  };
  const holds = (tab: SurfaceTab, region: string) => tab.regions.some((r) => r.id === region) && leaves(tab.layout).includes(region);

  switch (intent.type) {
    case 'selectTab':
      return doc.tabs.some((t) => t.id === intent.tab) && doc.active !== intent.tab ? { ...doc, active: intent.tab } : given;
    case 'addTab': {
      const id = newId('tab');
      const title = intent.title?.trim() || `View ${doc.tabs.length + 1}`;
      return { ...doc, active: id, tabs: [...doc.tabs, { id, title, layout: null, regions: [] }] };
    }
    case 'renameTab': {
      const title = intent.title.trim();
      return title ? withTab(intent.tab, (t) => (t.title === title ? null : { ...t, title })) : given;
    }
    case 'lockTab':
      return withTab(intent.tab, (t) => ((t.locked ?? false) === intent.locked ? null : { ...t, locked: intent.locked }));
    case 'duplicateTab': {
      const source = doc.tabs.find((t) => t.id === intent.tab);
      if (!source) return given;
      const id = newId(source.id);
      const ids = new Map(source.regions.map((r) => [r.id, newId(`${id}-region`)]));
      const copy: SurfaceTab = {
        id,
        title: `${source.title} copy`,
        layout: copyLayout(cleanLayout(source.layout, (x) => ids.has(x)), (x) => ids.get(x)!, () => newId(`${id}-split`)),
        regions: source.regions.map((r) => ({ ...r, id: ids.get(r.id)! })),
        ...(source.locked ? { locked: true } : {}),
      };
      const at = doc.tabs.indexOf(source);
      return { ...doc, active: id, tabs: [...doc.tabs.slice(0, at + 1), copy, ...doc.tabs.slice(at + 1)] };
    }
    case 'removeTab': {
      const at = doc.tabs.findIndex((t) => t.id === intent.tab);
      if (at < 0 || doc.tabs.length === 1) return given;
      const tabs = doc.tabs.filter((t) => t.id !== intent.tab);
      const active = doc.active === intent.tab ? tabs[Math.min(at, tabs.length - 1)].id : doc.active;
      return { ...doc, active, tabs };
    }
    case 'addRegion':
      return withTab(intent.tab, (t) => {
        if (intent.beside !== undefined && !holds(t, intent.beside)) return null;
        const id = newId(`${t.id}-region`);
        const region: SurfaceRegion = { id, kind: intent.kind, title: titleOf(intent.kind), binding: { mode: 'selected' } };
        let layout: LayoutNode;
        if (t.layout === null) layout = id;
        else if (intent.beside !== undefined) layout = place(t.layout, intent.beside, id, intent.zone ?? 'right', () => newId(`${t.id}-split`));
        else if (isSplit(t.layout) && t.layout.split === 'column') layout = { ...t.layout, children: [...t.layout.children, { node: id, share: sum(t.layout.children) / t.layout.children.length }] };
        else layout = { id: newId(`${t.id}-split`), split: 'column', children: [{ node: t.layout, share: 2 }, { node: id, share: 1 }] };
        return { ...t, layout: cleanLayout(layout), regions: [...t.regions, region] };
      });
    case 'removeRegion':
      return withTab(intent.tab, (t) => {
        if (!t.regions.some((r) => r.id === intent.region)) return null;
        return { ...t, layout: cleanLayout(t.layout, (x) => x !== intent.region), regions: t.regions.filter((r) => r.id !== intent.region) };
      });
    case 'moveRegion':
      return withTab(intent.tab, (t) => {
        if (!holds(t, intent.region) || t.layout === null) return null;
        const layout = step(t.layout, intent.region, intent.direction, () => newId(`${t.id}-split`));
        return layout === null ? null : { ...t, layout };
      });
    case 'dockRegion':
      return withTab(intent.tab, (t) => {
        const { region, target, zone } = intent;
        if (region === target || !holds(t, region) || !holds(t, target) || t.layout === null) return null;
        if (zone === 'swap') return { ...t, layout: swap(t.layout, region, target) };
        const rest = cleanLayout(t.layout, (x) => x !== region)!;
        return { ...t, layout: cleanLayout(place(rest, target, region, zone, () => newId(`${t.id}-split`))) };
      });
    case 'resizeSplit':
      return withTab(intent.tab, (t) => {
        const target = splits(t.layout).find((s) => s.id === intent.split);
        if (!target || intent.shares.length !== target.children.length || intent.shares.some((x) => !(x > 0))) return null;
        const resize = (node: LayoutNode): LayoutNode =>
          !isSplit(node)
            ? node
            : node.id === intent.split
              ? { ...node, children: node.children.map((c, i) => ({ ...c, share: intent.shares[i] })) }
              : { ...node, children: node.children.map((c) => ({ ...c, node: resize(c.node) })) };
        return { ...t, layout: resize(t.layout!) };
      });
    case 'retitleRegion': {
      const title = intent.title.trim();
      if (!title) return given;
      return withTab(intent.tab, (t) => {
        const r = t.regions.find((x) => x.id === intent.region);
        if (!r || r.title === title) return null;
        return { ...t, regions: t.regions.map((x) => (x.id === intent.region ? { ...x, title } : x)) };
      });
    }
    case 'bindRegion':
      return withTab(intent.tab, (t) => {
        if (!t.regions.some((x) => x.id === intent.region)) return null;
        return { ...t, regions: t.regions.map((x) => (x.id === intent.region ? { ...x, binding: intent.binding } : x)) };
      });
    case 'configureRegion':
      return withTab(intent.tab, (t) => {
        if (!t.regions.some((x) => x.id === intent.region)) return null;
        return { ...t, regions: t.regions.map((x) => (x.id === intent.region ? { ...x, settings: intent.settings } : x)) };
      });
    case 'setEditing':
    case 'undo':
    case 'redo':
      return given;
  }
}
