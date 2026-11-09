// The surface document's pure helpers (docs/live-workspace.md): which tab is open, the regions a
// tab draws, the screen the solver lays out from a tab and the app's pane definitions, and
// `applySurfaceIntent`, the next document for an intent. No state is kept here: an app with a
// store of its own (mix's `SurfaceStore`) never needs the applier; a story or an app without one
// hands every intent the surface sends to it and gives the surface the result.
import type { Form, Forms, RegionSpec, ScreenSpec } from '../assembly/types';
import type { PaneDefinition, SurfaceBinding, SurfaceDocument, SurfaceIntent, SurfaceRegion, SurfaceTab, SurfaceTarget } from './Workspace.types';

/** The tab the surface shows: the document's `active`, else the first. */
export function openTab(doc: SurfaceDocument): SurfaceTab | undefined {
  return doc.tabs.find((t) => t.id === doc.active) ?? doc.tabs[0];
}

/** A tab's rows as instances, dangling ids skipped and emptied rows dropped. */
export function tabRows(tab: SurfaceTab): SurfaceRegion[][] {
  const byId = new Map(tab.regions.map((r) => [r.id, r]));
  return tab.rows.map((row) => row.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))).filter((row) => row.length > 0);
}

/** Every instance a tab draws, in reading order. */
export const tabRegions = (tab: SurfaceTab): SurfaceRegion[] => tabRows(tab).flat();

/** The placeholder's one form: a short card, so an unknown kind keeps its place and can still be moved and removed. */
const PLACEHOLDER_FORM: Form = {
  id: 'placeholder',
  min: { w: { chars: { caption: 24 } }, h: { control: 2 } },
  ideal: { w: { chars: { caption: 40 } }, h: { control: 3 } },
  grow: { w: true },
};
export const PLACEHOLDER_FORMS: Forms = [PLACEHOLDER_FORM];

/** The app's definitions by kind. */
export const paneIndex = (panes: readonly PaneDefinition[] | undefined): Map<string, PaneDefinition> => new Map((panes ?? []).map((p) => [p.kind, p]));

/** A region as the solver places it: the instance's id with its kind's forms; an unknown kind gets the placeholder's. */
export function regionSpec(region: SurfaceRegion, pane: PaneDefinition | undefined): RegionSpec {
  if (!pane) return { id: region.id, forms: PLACEHOLDER_FORMS, priority: 'context', plate: true };
  return { id: region.id, forms: pane.forms, priority: pane.priority ?? 'controls', plate: pane.plate ?? false, head: pane.head };
}

/** A tab as the ScreenSpec the solver draws. */
export function surfaceScreen(tab: SurfaceTab, panes: readonly PaneDefinition[] | undefined): ScreenSpec {
  const index = paneIndex(panes);
  return { rows: tabRows(tab).map((row) => row.map((r) => regionSpec(r, index.get(r.kind)))) };
}

/** The target a region shows: its fixed target, else the app's selection. */
export function resolveTarget(binding: SurfaceBinding, selected: string | undefined): string | undefined {
  return binding.mode === 'fixed' ? binding.target : selected;
}

/** The targets a definition can be bound to. */
export const targetsFor = (pane: PaneDefinition | undefined, targets: readonly SurfaceTarget[] | undefined): SurfaceTarget[] =>
  pane?.targets === undefined ? [] : (targets ?? []).filter((t) => t.kind === pane.targets);

/** An id no tab and no region in the document uses yet: `<base>-<n>`. */
export function freshId(doc: SurfaceDocument, base: string): string {
  const taken = new Set(doc.tabs.flatMap((t) => [t.id, ...t.regions.map((r) => r.id)]));
  let n = 1;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export interface ApplyOptions {
  /** The id for a new tab or region instance. Default `freshId(doc, base)`. */
  newId?: (doc: SurfaceDocument, base: string) => string;
  /** A new region's title, by kind. Default the kind. */
  titleOf?: (kind: string) => string;
}

const withTab = (doc: SurfaceDocument, id: string, change: (tab: SurfaceTab) => SurfaceTab | null): SurfaceDocument => {
  const tab = doc.tabs.find((t) => t.id === id);
  if (!tab) return doc;
  const next = change(tab);
  if (next === null || next === tab) return doc;
  return { ...doc, tabs: doc.tabs.map((t) => (t.id === id ? next : t)) };
};

/** Rows with a region taken out; emptied rows go. */
const without = (rows: readonly (readonly string[])[], id: string): string[][] => rows.map((row) => row.filter((r) => r !== id)).filter((row) => row.length > 0);

/** Where a region sits in a tab's rows. */
function locate(rows: readonly (readonly string[])[], id: string): { row: number; index: number } | null {
  for (let row = 0; row < rows.length; row++) {
    const index = rows[row].indexOf(id);
    if (index >= 0) return { row, index };
  }
  return null;
}

function move(tab: SurfaceTab, id: string, direction: 'left' | 'right' | 'up' | 'down'): SurfaceTab | null {
  const at = locate(tab.rows, id);
  if (!at) return null;
  const rows = tab.rows.map((r) => [...r]);
  if (direction === 'left' || direction === 'right') {
    const to = at.index + (direction === 'left' ? -1 : 1);
    if (to < 0 || to >= rows[at.row].length) return null;
    [rows[at.row][at.index], rows[at.row][to]] = [rows[at.row][to], rows[at.row][at.index]];
    return { ...tab, rows };
  }
  const alone = rows[at.row].length === 1;
  const to = at.row + (direction === 'up' ? -1 : 1);
  // Past the edge: a region sharing its row leaves for a new row of its own; one alone stays.
  if (to < 0 || to >= rows.length) {
    if (alone) return null;
    rows[at.row].splice(at.index, 1);
    if (direction === 'up') rows.unshift([id]);
    else rows.push([id]);
    return { ...tab, rows };
  }
  rows[at.row].splice(at.index, 1);
  rows[to].push(id);
  return { ...tab, rows: rows.filter((r) => r.length > 0) };
}

/**
 * The next document for an intent. An intent naming a tab or region the document doesn't hold
 * returns it unchanged, as do `setEditing`, `undo` and `redo` (none edits the document). The
 * last tab is never removed; a tab may be left empty.
 */
export function applySurfaceIntent(doc: SurfaceDocument, intent: SurfaceIntent, options: ApplyOptions = {}): SurfaceDocument {
  const newId = options.newId ?? freshId;
  const titleOf = options.titleOf ?? ((kind: string) => kind);
  switch (intent.type) {
    case 'selectTab':
      return doc.tabs.some((t) => t.id === intent.tab) && doc.active !== intent.tab ? { ...doc, active: intent.tab } : doc;
    case 'addTab': {
      const id = newId(doc, 'tab');
      const title = intent.title?.trim() || `View ${doc.tabs.length + 1}`;
      return { ...doc, active: id, tabs: [...doc.tabs, { id, title, rows: [], regions: [] }] };
    }
    case 'renameTab': {
      const title = intent.title.trim();
      return title ? withTab(doc, intent.tab, (t) => (t.title === title ? null : { ...t, title })) : doc;
    }
    case 'duplicateTab': {
      const source = doc.tabs.find((t) => t.id === intent.tab);
      if (!source) return doc;
      let draft: SurfaceDocument = doc;
      const id = newId(draft, source.id);
      draft = { ...draft, tabs: [...draft.tabs, { id, title: '', rows: [], regions: [] }] };
      const ids = new Map<string, string>();
      for (const r of source.regions) {
        const fresh = newId(draft, `${id}-region`);
        ids.set(r.id, fresh);
        draft = { ...draft, tabs: draft.tabs.map((t) => (t.id === id ? { ...t, regions: [...t.regions, { ...r, id: fresh }] } : t)) };
      }
      const copy: SurfaceTab = {
        id,
        title: `${source.title} copy`,
        rows: source.rows.map((row) => row.flatMap((r) => (ids.has(r) ? [ids.get(r)!] : []))).filter((row) => row.length > 0),
        regions: source.regions.map((r) => ({ ...r, id: ids.get(r.id)! })),
      };
      const at = doc.tabs.indexOf(source);
      return { ...doc, active: id, tabs: [...doc.tabs.slice(0, at + 1), copy, ...doc.tabs.slice(at + 1)] };
    }
    case 'removeTab': {
      const at = doc.tabs.findIndex((t) => t.id === intent.tab);
      if (at < 0 || doc.tabs.length === 1) return doc;
      const tabs = doc.tabs.filter((t) => t.id !== intent.tab);
      const active = doc.active === intent.tab ? tabs[Math.min(at, tabs.length - 1)].id : doc.active;
      return { ...doc, active, tabs };
    }
    case 'addRegion': {
      if (!doc.tabs.some((t) => t.id === intent.tab)) return doc;
      const id = newId(doc, `${intent.tab}-region`);
      return withTab(doc, intent.tab, (t) => {
        const rows = t.rows.map((r) => [...r]);
        const row = Math.max(0, Math.min(intent.row, rows.length));
        if (row === rows.length) rows.push([id]);
        else rows[row].splice(Math.max(0, Math.min(intent.index ?? rows[row].length, rows[row].length)), 0, id);
        const region: SurfaceRegion = { id, kind: intent.kind, title: titleOf(intent.kind), binding: { mode: 'selected' } };
        return { ...t, rows, regions: [...t.regions, region] };
      });
    }
    case 'removeRegion':
      return withTab(doc, intent.tab, (t) => {
        if (!t.regions.some((r) => r.id === intent.region)) return null;
        return { ...t, rows: without(t.rows, intent.region), regions: t.regions.filter((r) => r.id !== intent.region) };
      });
    case 'moveRegion':
      return withTab(doc, intent.tab, (t) => move(t, intent.region, intent.direction));
    case 'retitleRegion': {
      const title = intent.title.trim();
      if (!title) return doc;
      return withTab(doc, intent.tab, (t) => {
        const r = t.regions.find((x) => x.id === intent.region);
        if (!r || r.title === title) return null;
        return { ...t, regions: t.regions.map((x) => (x.id === intent.region ? { ...x, title } : x)) };
      });
    }
    case 'bindRegion':
      return withTab(doc, intent.tab, (t) => {
        if (!t.regions.some((x) => x.id === intent.region)) return null;
        return { ...t, regions: t.regions.map((x) => (x.id === intent.region ? { ...x, binding: intent.binding } : x)) };
      });
    case 'setEditing':
    case 'undo':
    case 'redo':
      return doc;
  }
}
