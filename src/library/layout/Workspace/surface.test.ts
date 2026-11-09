import { describe, expect, expectTypeOf, it } from 'vitest';
import { PLACEHOLDER_FORMS, applySurfaceIntent, freshId, openTab, resolveTarget, surfaceScreen, tabRegions, targetsFor } from './surface';
import { SURFACE_INTENTS, type PaneDefinition, type SurfaceDocument, type SurfaceIntent } from './Workspace.types';
import { workspaceDocument, workspacePanes, workspaceTargets } from './Workspace.fixtures';

// Mix's rig document, as mix declares it (openflowfm/mix src/rig/contract.ts, version 1), copied as
// types: nothing imports across repos. Its values must be ours as they are.
type MixRegionKind = 'mixer' | 'session' | 'channels' | 'waveforms' | 'progression' | 'compass' | 'signal' | 'landing' | 'throws' | 'health';
type MixBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };
interface MixRegion { id: string; kind: MixRegionKind; title: string; binding: MixBinding }
interface MixTab { id: string; title: string; rows: readonly (readonly string[])[]; regions: readonly MixRegion[] }
interface MixDocument { version: 1; active: string; tabs: readonly MixTab[] }

const doc: SurfaceDocument = {
  version: 1,
  active: 'a',
  tabs: [
    {
      id: 'a',
      title: 'A',
      rows: [['a-1', 'a-2'], ['a-3']],
      regions: [
        { id: 'a-1', kind: 'mix', title: 'Mix', binding: { mode: 'selected' } },
        { id: 'a-2', kind: 'cuts', title: 'Cuts', binding: { mode: 'selected' } },
        { id: 'a-3', kind: 'loopGrid', title: 'Grid', binding: { mode: 'fixed', target: 'bass' } },
      ],
    },
    { id: 'b', title: 'B', rows: [['b-1']], regions: [{ id: 'b-1', kind: 'mix', title: 'Mix', binding: { mode: 'selected' } }] },
  ],
};
const tabA = (d: SurfaceDocument) => d.tabs.find((t) => t.id === 'a')!;

describe('the document', () => {
  it('takes mix’s rig document as it is', () => {
    expectTypeOf<MixDocument>().toMatchTypeOf<SurfaceDocument>();
  });

  it('opens the active tab, else the first', () => {
    expect(openTab(doc)?.id).toBe('a');
    expect(openTab({ ...doc, active: 'nowhere' })?.id).toBe('a');
    expect(openTab({ ...doc, tabs: [] })).toBeUndefined();
  });

  it('skips a row entry naming an instance the tab doesn’t hold, and the row it empties', () => {
    const tab = { ...tabA(doc), rows: [['a-1', 'ghost', 'a-2'], ['ghost'], ['a-3']] };
    expect(tabRegions(tab).map((r) => r.id)).toEqual(['a-1', 'a-2', 'a-3']);
    expect(surfaceScreen(tab, workspacePanes).rows.length).toBe(2);
  });

  it('places a kind it doesn’t know with the placeholder’s form, and a known kind with its own', () => {
    const tab = { ...tabA(doc), regions: tabA(doc).regions.map((r) => (r.id === 'a-2' ? { ...r, kind: 'mystery' } : r)) };
    const [[mix, mystery]] = surfaceScreen(tab, workspacePanes).rows as { id: string; forms: unknown }[][];
    expect(mix.forms).toBe(workspacePanes.find((p) => p.kind === 'mix')!.forms);
    expect(mystery.forms).toBe(PLACEHOLDER_FORMS);
  });

  it('reads a kind from `kind`, never from the id', () => {
    const tab = { id: 't', title: 'T', rows: [['mix-1']], regions: [{ id: 'mix-1', kind: 'loopGrid', title: 'G', binding: { mode: 'selected' as const } }] };
    expect(surfaceScreen(tab, workspacePanes).rows[0][0]).toMatchObject({ id: 'mix-1', forms: workspacePanes[0].forms });
  });

  it('resolves a region’s target from its binding', () => {
    expect(resolveTarget({ mode: 'selected' }, 'keys')).toBe('keys');
    expect(resolveTarget({ mode: 'fixed', target: 'bass' }, 'keys')).toBe('bass');
    expect(targetsFor(workspacePanes[0], workspaceTargets)).toHaveLength(3);
    expect(targetsFor(workspacePanes.find((p) => p.kind === 'cuts'), workspaceTargets)).toEqual([]);
  });

  it('makes ids nothing in the document uses', () => {
    expect(freshId(doc, 'a')).toBe('a-4');
    expect(freshId(doc, 'c')).toBe('c-1');
  });
});

describe('applySurfaceIntent', () => {
  const apply = (intent: SurfaceIntent, d = doc) => applySurfaceIntent(d, intent);

  it('selects a tab', () => {
    expect(apply({ type: 'selectTab', tab: 'b' }).active).toBe('b');
  });

  it('adds a tab, opened, with a fresh id', () => {
    const next = apply({ type: 'addTab', title: 'Jam' });
    expect(next.tabs.at(-1)).toMatchObject({ id: 'tab-1', title: 'Jam', rows: [], regions: [] });
    expect(next.active).toBe('tab-1');
  });

  it('renames a tab, ignoring an empty title', () => {
    expect(apply({ type: 'renameTab', tab: 'a', title: ' Opener ' }).tabs[0].title).toBe('Opener');
    expect(apply({ type: 'renameTab', tab: 'a', title: '  ' })).toBe(doc);
  });

  it('duplicates a tab beside it, with fresh instance ids and the same layout', () => {
    const next = apply({ type: 'duplicateTab', tab: 'a' });
    const copy = next.tabs[1];
    expect(copy.title).toBe('A copy');
    expect(next.active).toBe(copy.id);
    expect(copy.regions.map((r) => r.kind)).toEqual(['mix', 'cuts', 'loopGrid']);
    const ids = new Set(doc.tabs.flatMap((t) => t.regions.map((r) => r.id)));
    for (const r of copy.regions) expect(ids.has(r.id)).toBe(false);
    expect(copy.rows.map((row) => row.length)).toEqual([2, 1]);
    expect(copy.regions[2].binding).toEqual({ mode: 'fixed', target: 'bass' });
  });

  it('removes a tab, opening its neighbour, never the last', () => {
    const next = apply({ type: 'removeTab', tab: 'a' });
    expect(next.tabs.map((t) => t.id)).toEqual(['b']);
    expect(next.active).toBe('b');
    expect(apply({ type: 'removeTab', tab: 'b' }, next)).toBe(next);
  });

  it('adds a region at a row and index, or in a new row past the last', () => {
    const at = apply({ type: 'addRegion', tab: 'a', kind: 'stems', row: 0, index: 1 });
    expect(tabA(at).rows[0]).toEqual(['a-1', 'a-region-1', 'a-2']);
    expect(tabA(at).regions.at(-1)).toEqual({ id: 'a-region-1', kind: 'stems', title: 'stems', binding: { mode: 'selected' } });
    const below = apply({ type: 'addRegion', tab: 'a', kind: 'stems', row: 9 });
    expect(tabA(below).rows).toEqual([['a-1', 'a-2'], ['a-3'], ['a-region-1']]);
    const titled = applySurfaceIntent(doc, { type: 'addRegion', tab: 'a', kind: 'stems', row: 0 }, { titleOf: () => 'Stems', newId: () => 'mine' });
    expect(tabA(titled).regions.at(-1)).toMatchObject({ id: 'mine', title: 'Stems' });
  });

  it('removes a region and the row it empties; a tab may be left empty', () => {
    const next = apply({ type: 'removeRegion', tab: 'a', region: 'a-3' });
    expect(tabA(next).rows).toEqual([['a-1', 'a-2']]);
    expect(tabA(next).regions.map((r) => r.id)).toEqual(['a-1', 'a-2']);
    const b = apply({ type: 'removeRegion', tab: 'b', region: 'b-1' });
    expect(b.tabs[1]).toMatchObject({ rows: [], regions: [] });
  });

  it('moves a region within its row and between rows', () => {
    expect(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-1', direction: 'right' })).rows[0]).toEqual(['a-2', 'a-1']);
    expect(apply({ type: 'moveRegion', tab: 'a', region: 'a-1', direction: 'left' })).toBe(doc);
    expect(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-3', direction: 'up' })).rows).toEqual([['a-1', 'a-2', 'a-3']]);
    expect(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-2', direction: 'down' })).rows).toEqual([['a-1'], ['a-3', 'a-2']]);
  });

  it('moves a region that shares the edge row into a new row of its own; one alone stays', () => {
    expect(tabA(apply({ type: 'moveRegion', tab: 'a', region: 'a-1', direction: 'up' })).rows).toEqual([['a-1'], ['a-2'], ['a-3']]);
    expect(apply({ type: 'moveRegion', tab: 'a', region: 'a-3', direction: 'down' })).toBe(doc);
  });

  it('retitles and rebinds a region', () => {
    expect(tabA(apply({ type: 'retitleRegion', tab: 'a', region: 'a-1', title: 'Main mix' })).regions[0].title).toBe('Main mix');
    expect(tabA(apply({ type: 'bindRegion', tab: 'a', region: 'a-1', binding: { mode: 'fixed', target: 'drums' } })).regions[0].binding).toEqual({ mode: 'fixed', target: 'drums' });
  });

  it('leaves the document as it is for an intent naming what it doesn’t hold', () => {
    for (const intent of [
      { type: 'removeRegion', tab: 'a', region: 'ghost' },
      { type: 'moveRegion', tab: 'ghost', region: 'a-1', direction: 'left' },
      { type: 'retitleRegion', tab: 'a', region: 'ghost', title: 'X' },
      { type: 'bindRegion', tab: 'a', region: 'ghost', binding: { mode: 'selected' } },
      { type: 'addRegion', tab: 'ghost', kind: 'mix', row: 0 },
      { type: 'duplicateTab', tab: 'ghost' },
      { type: 'selectTab', tab: 'ghost' },
    ] satisfies SurfaceIntent[])
      expect(apply(intent)).toBe(doc);
  });

  it('edits nothing for edit mode, undo and redo', () => {
    for (const type of ['undo', 'redo'] as const) expect(apply({ type })).toBe(doc);
    expect(apply({ type: 'setEditing', editing: true })).toBe(doc);
  });

  it('applies every intent the surface can send', () => {
    // A sample of each, against the Workspace's own document: none throws, each returns a document.
    const samples: Record<(typeof SURFACE_INTENTS)[number], SurfaceIntent> = {
      selectTab: { type: 'selectTab', tab: 'grid' },
      addTab: { type: 'addTab' },
      renameTab: { type: 'renameTab', tab: 'stage', title: 'X' },
      duplicateTab: { type: 'duplicateTab', tab: 'stage' },
      removeTab: { type: 'removeTab', tab: 'stage' },
      addRegion: { type: 'addRegion', tab: 'stage', kind: 'cuts', row: 1 },
      removeRegion: { type: 'removeRegion', tab: 'stage', region: 'stage-1' },
      moveRegion: { type: 'moveRegion', tab: 'stage', region: 'stage-2', direction: 'up' },
      retitleRegion: { type: 'retitleRegion', tab: 'stage', region: 'stage-1', title: 'X' },
      bindRegion: { type: 'bindRegion', tab: 'stage', region: 'stage-1', binding: { mode: 'fixed', target: 'bass' } },
      setEditing: { type: 'setEditing', editing: true },
      undo: { type: 'undo' },
      redo: { type: 'redo' },
    };
    for (const name of SURFACE_INTENTS) expect(applySurfaceIntent(workspaceDocument, samples[name]).version).toBe(1);
  });
});

it('keeps the pane definitions plain data', () => {
  const pane: PaneDefinition = workspacePanes[0];
  expect(JSON.parse(JSON.stringify(pane))).toEqual(pane);
});
