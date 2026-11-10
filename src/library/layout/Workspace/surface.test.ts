import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Forms, Principles } from '../assembly/types';
import { applySurfaceIntent, checkDocument, cleanLayout, intentKind, knownVersion, formForRoom, freshId, leaves, openTab, readDocument, readTab, resolveSettings, resolveTarget, splits, tabRegions, targetsFor } from './surface';
import { INTENT_KINDS, SURFACE_INTENTS, type LayoutNode, type PaneDefinition, type SurfaceDocument, type SurfaceDocumentV2, type SurfaceIntent, type SurfaceTab } from './Workspace.types';
import { workspaceDocument, workspacePanes, workspaceTargets } from './Workspace.fixtures';

// Mix's rig document, as mix declares it (openflowfm/mix src/rig/contract.ts, version 1), copied as
// types: nothing imports across repos. Its values must be ours as they are.
type MixRegionKind = 'mixer' | 'session' | 'channels' | 'waveforms' | 'progression' | 'compass' | 'signal' | 'landing' | 'throws' | 'health';
type MixBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };
interface MixRegion { id: string; kind: MixRegionKind; title: string; binding: MixBinding }
interface MixTab { id: string; title: string; rows: readonly (readonly string[])[]; regions: readonly MixRegion[] }
interface MixDocument { version: 1; active: string; tabs: readonly MixTab[] }

const region = (id: string, kind = 'mix') => ({ id, kind, title: id, binding: { mode: 'selected' as const } });

/** A: a row of a-1 and a column (a-2 over a-3), shares 2 and 1. B: one region. */
const doc: SurfaceDocumentV2 = {
  version: 2,
  active: 'a',
  tabs: [
    {
      id: 'a',
      title: 'A',
      layout: { id: 'a-split', split: 'row', children: [{ node: 'a-1', share: 2 }, { node: { id: 'a-col', split: 'column', children: [{ node: 'a-2', share: 1 }, { node: 'a-3', share: 1 }] }, share: 1 }] },
      regions: [region('a-1'), region('a-2', 'cuts'), { ...region('a-3', 'loopGrid'), binding: { mode: 'fixed', target: 'bass' } }],
    },
    { id: 'b', title: 'B', layout: 'b-1', regions: [region('b-1')] },
  ],
};
const tabA = (d: SurfaceDocument): SurfaceTab => readDocument(d).tabs.find((t) => t.id === 'a')!;
const apply = (intent: SurfaceIntent, d: SurfaceDocument = doc) => applySurfaceIntent(d, intent);

/** A layout as nested arrays, ids only: `['row', 'a-1', ['column', 'a-2', 'a-3']]`. */
function shape(node: LayoutNode | null): unknown {
  if (node === null || typeof node === 'string') return node;
  return [node.split, ...node.children.map((c) => shape(c.node))];
}

describe('the document', () => {
  it('takes mix’s rig document as it is', () => {
    expectTypeOf<MixDocument>().toMatchTypeOf<SurfaceDocument>();
  });

  it('reads a version 1 tab as a column of rows with equal shares', () => {
    const read = readTab({ id: 't', title: 'T', rows: [['x', 'ghost', 'y'], ['ghost'], ['z']], regions: [region('x'), region('y'), region('z')] });
    expect(shape(read.layout)).toEqual(['column', ['row', 'x', 'y'], 'z']);
    expect(splits(read.layout).map((s) => s.id)).toEqual(['t-rows', 't-row-1']);
    expect(readTab({ id: 't', title: 'T', rows: [['x']], regions: [region('x')] }).layout).toBe('x');
    expect(readTab({ id: 't', title: 'T', rows: [], regions: [] }).layout).toBeNull();
  });

  it('opens the active tab, else the first, read as version 2', () => {
    expect(openTab(doc)?.id).toBe('a');
    expect(openTab({ ...doc, active: 'nowhere' })?.id).toBe('a');
    expect(openTab({ ...doc, tabs: [] })).toBeUndefined();
    expect(openTab({ version: 1, active: 'v', tabs: [{ id: 'v', title: 'V', rows: [['x', 'y']], regions: [region('x'), region('y')] }] })?.layout).toMatchObject({ split: 'row' });
  });

  it('draws the leaves it holds an instance for, in reading order', () => {
    expect(tabRegions(tabA(doc)).map((r) => r.id)).toEqual(['a-1', 'a-2', 'a-3']);
    expect(tabRegions({ ...tabA(doc), regions: tabA(doc).regions.filter((r) => r.id !== 'a-2') }).map((r) => r.id)).toEqual(['a-1', 'a-3']);
  });

  it('resolves a region’s target from its binding', () => {
    expect(resolveTarget({ mode: 'selected' }, 'keys')).toBe('keys');
    expect(resolveTarget({ mode: 'fixed', target: 'bass' }, 'keys')).toBe('bass');
    expect(targetsFor(workspacePanes[0], workspaceTargets)).toHaveLength(3);
    expect(targetsFor(workspacePanes.find((p) => p.kind === 'cuts'), workspaceTargets)).toEqual([]);
  });

  it('makes ids nothing in the document uses, splits included', () => {
    expect(freshId(doc, 'a')).toBe('a-4');
    expect(freshId({ ...doc, tabs: [{ ...doc.tabs[0], layout: { id: 'c-1', split: 'row', children: [{ node: 'a-1', share: 1 }] } }] }, 'c')).toBe('c-2');
  });
});

describe('the layout', () => {
  it('collapses a split of one and merges a child running the same way, keeping shares', () => {
    const merged = cleanLayout({ id: 'r', split: 'row', children: [{ node: 'x', share: 1 }, { node: { id: 'r2', split: 'row', children: [{ node: 'y', share: 1 }, { node: 'z', share: 3 }] }, share: 2 }] });
    expect(merged).toEqual({ id: 'r', split: 'row', children: [{ node: 'x', share: 1 }, { node: 'y', share: 0.5 }, { node: 'z', share: 1.5 }] });
    expect(cleanLayout({ id: 'r', split: 'row', children: [{ node: 'x', share: 1 }, { node: 'y', share: 1 }] }, (id) => id !== 'y')).toBe('x');
    expect(leaves(doc.tabs[0].layout)).toEqual(['a-1', 'a-2', 'a-3']);
  });
});

describe('forms by room', () => {
  const p = { scale: { unit: 4, control: 32, sizes: {} }, minTarget: 32 } as unknown as Principles;
  const forms: Forms = [
    { id: 'tall', min: { w: { px: 300 }, h: { px: 200 } }, ideal: { w: { px: 400 }, h: { px: 300 } } },
    { id: 'short', min: { w: { px: 200 }, h: { px: 80 } }, ideal: { w: { px: 300 }, h: { px: 100 } } },
  ];
  it('picks the richest form whose least room fits, the smallest (cramped) when none does', () => {
    expect(formForRoom(forms, { w: 320, h: 220 }, p)).toEqual({ form: 'tall', cramped: false });
    expect(formForRoom(forms, { w: 320, h: 120 }, p)).toEqual({ form: 'short', cramped: false });
    expect(formForRoom(forms, { w: 100, h: 50 }, p)).toEqual({ form: 'short', cramped: true });
    expect(formForRoom(forms, undefined, p).form).toBe('tall');
  });
});

describe('settings', () => {
  const pane: PaneDefinition = {
    kind: 'mix',
    label: 'Mix',
    forms: workspacePanes[0].forms,
    settings: [
      { key: 'tracks', label: 'Tracks', type: 'targets', of: 'track', default: 'all' },
      { key: 'sends', label: 'Sends', type: 'toggle', default: true },
      { key: 'size', label: 'Size', type: 'number', min: 1, max: 8, default: 4 },
    ],
  };
  it('fills defaults, expands all targets, and keeps a region’s own values', () => {
    expect(resolveSettings(pane, region('m'), workspaceTargets)).toEqual({ tracks: ['drums', 'bass', 'keys'], sends: true, size: 4 });
    expect(resolveSettings(pane, { ...region('m'), settings: { tracks: ['bass'], sends: false } }, workspaceTargets)).toEqual({ tracks: ['bass'], sends: false, size: 4 });
  });
  it('passes a data setting through as plain data, its default when the region has none', () => {
    const panel: PaneDefinition = { ...pane, settings: [{ key: 'cells', label: 'Cells', type: 'data', default: [] }] };
    expect(resolveSettings(panel, region('p'))).toEqual({ cells: [] });
    const cells = [{ id: 'c1', control: 'fader', x: 0, y: 0, w: 1, h: 2 }];
    expect(resolveSettings(panel, { ...region('p'), settings: { cells } })).toEqual({ cells });
  });
  it('shows only what the kind declares', () => {
    expect(resolveSettings(pane, { ...region('m'), settings: { gone: 'x' } }, workspaceTargets)).not.toHaveProperty('gone');
    expect(resolveSettings(undefined, region('m'))).toEqual({});
  });
});

describe('applySurfaceIntent', () => {
  it('selects, adds, renames, locks and removes tabs', () => {
    expect(apply({ type: 'selectTab', tab: 'b' }).active).toBe('b');
    const added = apply({ type: 'addTab', title: 'Jam' });
    expect(readDocument(added).tabs.at(-1)).toMatchObject({ id: 'tab-1', title: 'Jam', layout: null, regions: [] });
    expect(tabA(apply({ type: 'renameTab', tab: 'a', title: ' Opener ' })).title).toBe('Opener');
    expect(apply({ type: 'renameTab', tab: 'a', title: '  ' })).toBe(doc);
    expect(tabA(apply({ type: 'lockTab', tab: 'a', locked: true })).locked).toBe(true);
    expect(apply({ type: 'lockTab', tab: 'a', locked: false })).toBe(doc);
    const removed = readDocument(apply({ type: 'removeTab', tab: 'a' }));
    expect(removed.tabs.map((t) => t.id)).toEqual(['b']);
    expect(removed.active).toBe('b');
    expect(apply({ type: 'removeTab', tab: 'b' }, removed)).toBe(removed);
  });

  it('duplicates a tab beside it: fresh region and split ids, the same layout and bindings', () => {
    const next = readDocument(apply({ type: 'duplicateTab', tab: 'a' }));
    const copy = next.tabs[1];
    expect(copy.title).toBe('A copy');
    expect(next.active).toBe(copy.id);
    expect(copy.regions.map((r) => r.kind)).toEqual(['mix', 'cuts', 'loopGrid']);
    const old = new Set(['a-1', 'a-2', 'a-3', 'a-split', 'a-col']);
    for (const id of [...leaves(copy.layout), ...splits(copy.layout).map((s) => s.id)]) expect(old.has(id)).toBe(false);
    expect(shape(copy.layout)).toEqual(['row', expect.any(String), ['column', expect.any(String), expect.any(String)]]);
    expect(copy.regions[2].binding).toEqual({ mode: 'fixed', target: 'bass' });
  });

  it('adds a region at the tab’s end, beside a region, or as the first of an empty tab', () => {
    const end = tabA(apply({ type: 'addRegion', tab: 'a', kind: 'stems' }));
    expect(shape(end.layout)).toEqual(['column', ['row', 'a-1', ['column', 'a-2', 'a-3']], 'a-region-1']);
    expect(end.regions.at(-1)).toEqual({ id: 'a-region-1', kind: 'stems', title: 'stems', binding: { mode: 'selected' } });
    const beside = tabA(apply({ type: 'addRegion', tab: 'a', kind: 'stems', beside: 'a-2', zone: 'above' }));
    expect(shape(beside.layout)).toEqual(['row', 'a-1', ['column', 'a-region-1', 'a-2', 'a-3']]);
    const empty = readDocument(apply({ type: 'addRegion', tab: 'tab-1', kind: 'mix' }, apply({ type: 'addTab' }))).tabs.at(-1)!;
    expect(empty.layout).toBe('tab-1-region-1');
    const titled = tabA(applySurfaceIntent(doc, { type: 'addRegion', tab: 'a', kind: 'stems' }, { titleOf: () => 'Stems', newId: (_d, base) => `${base}-x` }));
    expect(titled.regions.at(-1)).toMatchObject({ id: 'a-region-x', title: 'Stems' });
  });

  it('removes a region; a split left with one child collapses; a tab may be left empty', () => {
    expect(shape(tabA(apply({ type: 'removeRegion', tab: 'a', region: 'a-3' })).layout)).toEqual(['row', 'a-1', 'a-2']);
    expect(readDocument(apply({ type: 'removeRegion', tab: 'b', region: 'b-1' })).tabs[1]).toMatchObject({ layout: null, regions: [] });
  });

  it('docks a region beside, above, below or in place of another', () => {
    expect(shape(tabA(apply({ type: 'dockRegion', tab: 'a', region: 'a-1', target: 'a-3', zone: 'below' })).layout)).toEqual(['column', 'a-2', 'a-3', 'a-1']);
    expect(shape(tabA(apply({ type: 'dockRegion', tab: 'a', region: 'a-3', target: 'a-1', zone: 'left' })).layout)).toEqual(['row', 'a-3', 'a-1', 'a-2']);
    expect(shape(tabA(apply({ type: 'dockRegion', tab: 'a', region: 'a-2', target: 'a-1', zone: 'above' })).layout)).toEqual(['row', ['column', 'a-2', 'a-1'], 'a-3']);
    expect(shape(tabA(apply({ type: 'dockRegion', tab: 'a', region: 'a-1', target: 'a-3', zone: 'swap' })).layout)).toEqual(['row', 'a-3', ['column', 'a-2', 'a-1']]);
    expect(apply({ type: 'dockRegion', tab: 'a', region: 'a-1', target: 'a-1', zone: 'left' })).toBe(doc);
  });

  it('gives a docked region half its target’s share', () => {
    const next = tabA(apply({ type: 'dockRegion', tab: 'a', region: 'a-3', target: 'a-1', zone: 'right' })).layout as unknown as { children: { share: number }[] };
    expect(next.children.map((c) => c.share)).toEqual([1, 1, 1]);
  });

  it('resizes a split by its id; a resize naming no split, or the wrong count, changes nothing', () => {
    const next = tabA(apply({ type: 'resizeSplit', tab: 'a', split: 'a-col', shares: [3, 1] }));
    expect(splits(next.layout).find((s) => s.id === 'a-col')!.children.map((c) => c.share)).toEqual([3, 1]);
    expect(apply({ type: 'resizeSplit', tab: 'a', split: 'nowhere', shares: [1, 1] })).toBe(doc);
    expect(apply({ type: 'resizeSplit', tab: 'a', split: 'a-col', shares: [1] })).toBe(doc);
    expect(apply({ type: 'resizeSplit', tab: 'a', split: 'a-col', shares: [1, 0] })).toBe(doc);
  });

  it('steps a region within its split, out of a branch, or to a new edge; one already at the edge stays', () => {
    expect(shape(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-2', direction: 'down' })).layout)).toEqual(['row', 'a-1', ['column', 'a-3', 'a-2']]);
    expect(shape(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-2', direction: 'left' })).layout)).toEqual(['row', 'a-1', 'a-2', 'a-3']);
    expect(shape(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-1', direction: 'up' })).layout)).toEqual(['column', 'a-1', 'a-2', 'a-3']);
    expect(apply({ type: 'moveRegion', tab: 'a', region: 'a-1', direction: 'left' })).toBe(doc);
    expect(apply({ type: 'moveRegion', tab: 'b', region: 'b-1', direction: 'up' })).toBe(doc);
  });

  it('retitles, rebinds and configures a region', () => {
    expect(tabA(apply({ type: 'retitleRegion', tab: 'a', region: 'a-1', title: 'Main mix' })).regions[0].title).toBe('Main mix');
    expect(tabA(apply({ type: 'bindRegion', tab: 'a', region: 'a-1', binding: { mode: 'fixed', target: 'drums' } })).regions[0].binding).toEqual({ mode: 'fixed', target: 'drums' });
    expect(tabA(apply({ type: 'configureRegion', tab: 'a', region: 'a-1', settings: { tracks: ['bass'] } })).regions[0].settings).toEqual({ tracks: ['bass'] });
  });

  it('upgrades a version 1 document when it changes it', () => {
    const v1: SurfaceDocument = { version: 1, active: 'v', tabs: [{ id: 'v', title: 'V', rows: [['x', 'y'], ['z']], regions: [region('x'), region('y'), region('z')] }] };
    const next = applySurfaceIntent(v1, { type: 'resizeSplit', tab: 'v', split: 'v-row-1', shares: [3, 1] });
    expect(next.version).toBe(2);
    expect(shape(readDocument(next).tabs[0].layout)).toEqual(['column', ['row', 'x', 'y'], 'z']);
    expect(applySurfaceIntent(v1, { type: 'undo' })).toBe(v1);
  });

  it('leaves the document as given for an intent naming what it doesn’t hold', () => {
    for (const intent of [
      { type: 'removeRegion', tab: 'a', region: 'ghost' },
      { type: 'moveRegion', tab: 'ghost', region: 'a-1', direction: 'left' },
      { type: 'dockRegion', tab: 'a', region: 'ghost', target: 'a-1', zone: 'left' },
      { type: 'retitleRegion', tab: 'a', region: 'ghost', title: 'X' },
      { type: 'bindRegion', tab: 'a', region: 'ghost', binding: { mode: 'selected' } },
      { type: 'configureRegion', tab: 'a', region: 'ghost', settings: {} },
      { type: 'addRegion', tab: 'ghost', kind: 'mix' },
      { type: 'addRegion', tab: 'a', kind: 'mix', beside: 'ghost' },
      { type: 'lockTab', tab: 'ghost', locked: true },
      { type: 'duplicateTab', tab: 'ghost' },
      { type: 'selectTab', tab: 'ghost' },
    ] satisfies SurfaceIntent[])
      expect(apply(intent)).toBe(doc);
  });

  it('applies every intent the surface can send', () => {
    const samples: Record<(typeof SURFACE_INTENTS)[number], SurfaceIntent> = {
      selectTab: { type: 'selectTab', tab: 'grid' },
      addTab: { type: 'addTab' },
      renameTab: { type: 'renameTab', tab: 'stage', title: 'X' },
      duplicateTab: { type: 'duplicateTab', tab: 'stage' },
      removeTab: { type: 'removeTab', tab: 'stage' },
      lockTab: { type: 'lockTab', tab: 'stage', locked: true },
      addRegion: { type: 'addRegion', tab: 'stage', kind: 'cuts' },
      removeRegion: { type: 'removeRegion', tab: 'stage', region: 'stage-1' },
      moveRegion: { type: 'moveRegion', tab: 'stage', region: 'stage-2', direction: 'up' },
      dockRegion: { type: 'dockRegion', tab: 'stage', region: 'stage-2', target: 'stage-1', zone: 'left' },
      resizeSplit: { type: 'resizeSplit', tab: 'stage', split: 'stage-rows', shares: [2, 1] },
      retitleRegion: { type: 'retitleRegion', tab: 'stage', region: 'stage-1', title: 'X' },
      bindRegion: { type: 'bindRegion', tab: 'stage', region: 'stage-1', binding: { mode: 'fixed', target: 'bass' } },
      configureRegion: { type: 'configureRegion', tab: 'stage', region: 'stage-1', settings: { tracks: ['bass'] } },
      setEditing: { type: 'setEditing', editing: true },
      undo: { type: 'undo' },
      redo: { type: 'redo' },
    };
    for (const name of SURFACE_INTENTS) expect([1, 2]).toContain(applySurfaceIntent(workspaceDocument, samples[name]).version);
  });
});

it('keeps the pane definitions plain data', () => {
  const pane: PaneDefinition = workspacePanes[0];
  expect(JSON.parse(JSON.stringify(pane))).toEqual(pane);
});

describe('a document the surface can’t trust', () => {
  const v3 = { version: 3, active: 'a', tabs: [{ id: 'a', title: 'A', grid: [] }] } as unknown as SurfaceDocument;

  it('reads versions 1 and 2 and no other', () => {
    expect(knownVersion(doc)).toBe(true);
    expect(knownVersion({ version: 1 })).toBe(true);
    expect(knownVersion(v3)).toBe(false);
    expect(openTab(v3)).toBeUndefined();
  });

  it('returns a version it doesn’t read as given, whatever the intent', () => {
    for (const intent of [{ type: 'addTab' }, { type: 'selectTab', tab: 'a' }, { type: 'removeTab', tab: 'a' }] as SurfaceIntent[]) expect(applySurfaceIntent(v3, intent)).toBe(v3);
    expect(checkDocument(v3)).toEqual([{ issue: 'unknown-version', id: '3' }]);
  });

  it('draws a leaf named twice once, and leaves an instance no leaf names undrawn', () => {
    const tab: SurfaceTab = { id: 't', title: 'T', layout: { id: 's', split: 'row', children: [{ node: 'x', share: 1 }, { node: 'x', share: 1 }] }, regions: [region('x'), region('y')] };
    expect(tabRegions(tab).map((r) => r.id)).toEqual(['x']);
    const issues = checkDocument({ version: 2, active: 't', tabs: [tab] });
    expect(issues).toEqual([
      { issue: 'repeated-leaf', tab: 't', id: 'x' },
      { issue: 'orphan-region', tab: 't', id: 'y' },
    ]);
    // The orphan is kept until the app removes it.
    const removed = applySurfaceIntent({ version: 2, active: 't', tabs: [tab] }, { type: 'removeRegion', tab: 't', region: 'y' });
    expect(readDocument(removed).tabs[0].regions.map((r) => r.id)).toEqual(['x']);
  });

  it('lists every other problem and finds none in a sound document', () => {
    expect(checkDocument(doc)).toEqual([]);
    expect(checkDocument(workspaceDocument)).toEqual([]);
    const bad: SurfaceDocument = {
      version: 2,
      active: 'gone',
      tabs: [
        { id: 'a', title: 'A', layout: { id: 's', split: 'row', children: [{ node: 'a-1', share: 0 }, { node: 'nope', share: 1 }] }, regions: [region('a-1'), region('a-1')] },
        { id: 'a', title: 'Again', layout: null, regions: [] },
      ],
    };
    expect(checkDocument(bad).map((i) => i.issue)).toEqual(['duplicate-tab', 'unknown-active', 'duplicate-region', 'dangling-leaf', 'bad-share']);
    // A version 1 row naming an instance the tab doesn't hold is found before the reading drops it.
    expect(checkDocument({ version: 1, active: 'm', tabs: [{ id: 'm', title: 'M', rows: [['m-1', 'ghost']], regions: [region('m-1')] }] })).toEqual([{ issue: 'dangling-leaf', tab: 'm', id: 'ghost' }]);
  });

  it('carries fields it doesn’t know through every edit', () => {
    const extra = {
      ...doc,
      appNote: 'mine',
      tabs: doc.tabs.map((t) => ({ ...t, colour: 'teal', regions: t.regions.map((r) => ({ ...r, pinned: true })) })),
    } as unknown as SurfaceDocumentV2;
    const next = readDocument(applySurfaceIntent(applySurfaceIntent(extra, { type: 'renameTab', tab: 'a', title: 'Renamed' }), { type: 'duplicateTab', tab: 'a' })) as unknown as { appNote: string; tabs: { colour: string; regions: { pinned: boolean }[] }[] };
    expect(next.appNote).toBe('mine');
    expect(next.tabs.map((t) => t.colour)).toEqual(['teal', 'teal', 'teal']);
    expect(next.tabs.flatMap((t) => t.regions).every((r) => r.pinned)).toBe(true);
    // A version 1 document's own fields reach its version 2 reading.
    const v1 = { version: 1, active: 'm', saved: 'today', tabs: [{ id: 'm', title: 'M', rows: [['m-1']], regions: [region('m-1')], scene: 4 }] } as unknown as SurfaceDocument;
    const read = readDocument(v1) as unknown as { saved: string; tabs: { scene: number; rows?: unknown }[] };
    expect(read.saved).toBe('today');
    expect(read.tabs[0].scene).toBe(4);
    expect(read.tabs[0].rows).toBeUndefined();
  });
});

describe('what an intent is', () => {
  it('sorts every intent into one kind', () => {
    const kinds = Object.fromEntries(SURFACE_INTENTS.map((type) => [type, intentKind({ type } as SurfaceIntent)]));
    expect(kinds.selectTab).toBe('navigation');
    expect(kinds.undo).toBe('history');
    expect(kinds.redo).toBe('history');
    expect(kinds.setEditing).toBe('mode');
    expect(Object.entries(kinds).filter(([, k]) => k === 'edit').map(([t]) => t)).toEqual(['addTab', 'renameTab', 'duplicateTab', 'removeTab', 'lockTab', 'addRegion', 'removeRegion', 'moveRegion', 'dockRegion', 'resizeSplit', 'retitleRegion', 'bindRegion', 'configureRegion']);
    for (const k of Object.values(kinds)) expect(INTENT_KINDS).toContain(k);
  });

  it('names what it adds itself, or lets the app', () => {
    const own = readDocument(apply({ type: 'addRegion', tab: 'b', kind: 'cuts' }));
    expect(own.tabs[1].regions.map((r) => r.id)).toEqual(['b-1', 'b-region-1']);
    const named = readDocument(applySurfaceIntent(doc, { type: 'addRegion', tab: 'b', kind: 'cuts' }, { newId: (_d, base) => `app:${base}` }));
    expect(named.tabs[1].regions.map((r) => r.id)).toEqual(['b-1', 'app:b-region']);
  });
});

describe('a setting’s value that no longer fits', () => {
  const pane: PaneDefinition = {
    kind: 'k',
    label: 'K',
    forms: workspacePanes[0].forms,
    settings: [
      { key: 'view', label: 'View', type: 'choice', options: [{ value: 'bars', label: 'Bars' }, { value: 'dots', label: 'Dots' }], default: 'bars' },
      { key: 'show', label: 'Show', type: 'choices', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: ['a'] },
      { key: 'on', label: 'On', type: 'toggle', default: true },
      { key: 'n', label: 'N', type: 'number', min: 1, max: 8, default: 4 },
    ],
  };
  const read = (settings: Record<string, unknown>) => resolveSettings(pane, { ...region('r', 'k'), settings: settings as never });

  it('reads as the default, and a number is held to its range', () => {
    expect(read({ view: 'rings', show: 'a', on: 'yes', n: 'four' })).toEqual({ view: 'bars', show: ['a'], on: true, n: 4 });
    expect(read({ view: 'dots', show: ['b', 'gone'], on: false, n: 99 })).toEqual({ view: 'dots', show: ['b'], on: false, n: 8 });
    expect(read({ n: Number.NaN }).n).toBe(4);
    expect(read({ n: -3 }).n).toBe(1);
  });
});
