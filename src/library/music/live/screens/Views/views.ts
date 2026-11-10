// The live views as surface documents (docs/live-views.md): the reference DAW built on the surface.
// Every tab is rows of region instance ids and the instances, each naming its Music live pane by
// `kind` (never by id), its title and its binding. The app owns this value: the Workspace draws it
// and sends every edit as an intent, which the stories apply with `applySurfaceIntent`.
import { applySurfaceIntent, readDocument, readTab, splits } from '../../../../layouts/Workspace/surface';
import { place } from '../../../../layouts/cells';
import { KIND_SIZE, type ControlCell, type ControlKind } from '../../layouts/ControlPanel/ControlPanel.model';
import type { SurfaceDocument, SurfaceDocumentV2, SurfaceIntent, SurfaceRegion, SurfaceTab } from '../../../../layouts/Workspace/Workspace.types';
import { LIVE_PANES, type LivePaneKind } from '../../panes';

/** A tab from rows of kinds, as mix's `defaultDocument` builds its presets (read as a column of rows): fresh instance ids, each bound to the selection. */
function preset(id: string, title: string, layout: readonly (readonly LivePaneKind[])[], heights?: readonly number[]): SurfaceTab {
  const regions: SurfaceRegion[] = [];
  const rows = layout.map((row) =>
    row.map((kind) => {
      const region: SurfaceRegion = { id: `${id}-region-${regions.length + 1}`, kind, title: LIVE_PANES[kind].label, binding: { mode: 'selected' } };
      regions.push(region);
      return region.id;
    }),
  );
  const tab = readTab({ id, title, rows, regions });
  // Each row's share of the height: the board's proportions, the rig's line thin.
  const root = tab.layout;
  if (!heights || root === null || typeof root === 'string' || root.split !== 'column') return tab;
  return { ...tab, layout: { ...root, children: root.children.map((c, i) => ({ ...c, share: heights[i] ?? 1 })) } };
}

/**
 * ONE: the unified board. The night along the top, the song now beside the dice (the wireframe's
 * header), the clips beside where the harmony is, the song's sections beside where the set lands
 * next, the strips beside the stems, the rig's line last.
 */
export const ONE_TAB = preset('one', 'ONE', [['river'], ['song', 'dice'], ['loop', 'compass'], ['sections', 'landing'], ['mix', 'stems'], ['rig']], [1.9, 1.1, 2.1, 1.2, 2.9, 0.33]);

/** Follow: the harmony as a place (compass), in time (orbits), the loop that plays it, and the dice. */
export const FOLLOW_TAB = preset('follow', 'Follow', [['compass', 'orbits'], ['follow', 'dice'], ['rig']], [4, 2, 0.3]);

/** Track: one column as its signal path, the song's stems under it, the throws and the cuts under the hands. */
export const TRACK_TAB = preset('track', 'Track', [['spine'], ['stems'], ['throws', 'cuts'], ['rig']], [3, 2, 2.6, 0.35]);

/** Hands: the controller twin beside the orbits, the sections and the landing under them. */
export const HANDS_TAB = preset('hands', 'Hands', [['push', 'orbits'], ['sections', 'landing'], ['rig']], [4, 1.6, 0.3]);

/** A blank page to build on: the river alone, the palette ready. */
export const MINE_TAB = preset('mine', 'Mine', [['river'], ['rig']], [6, 1]);

/** The four tracks the looper board carries. */
export const LOOPER_TRACKS = ['drums', 'bass', 'keys', 'vox'] as const;

/** The looper's macros: four faders on the FX the set rides, four pads it fires, a freeze toggle. Each placed as the panel places it. */
export const LOOPER_MACROS: readonly ControlCell[] = (
  [
    ['fader', 'cutoff', 0, 0],
    ['fader', 'delay', 1, 0],
    ['fader', 'reverb', 2, 0],
    ['fader', 'drive', 3, 0],
    ['pad', 'riser', 4, 0],
    ['pad', 'drop', 5, 0],
    ['pad', 'stutter', 4, 1],
    ['pad', 'kill', 5, 1],
    ['toggle', 'freeze', 4, 2],
  ] as const
).reduce<readonly ControlCell[]>((cells, [control, param, x, y], i) => {
  const size = control === 'fader' ? { w: 1, h: 3 } : control === 'toggle' ? { w: 2, h: 1 } : KIND_SIZE[control as ControlKind];
  return place(cells, { id: `m${i + 1}`, control, param, x, y, ...size }, { columns: 6, rows: 3 }) ?? cells;
}, []);

/**
 * The looper performance board, built the way a person builds it: every step an intent the builder
 * sends, applied to an empty tab. The song now along the top; the launch grid with the cuts and the
 * throws stacked at its right; four track strips under them beside the macros; the rig's line last;
 * then locked.
 */
function looperTab(): SurfaceTab {
  const title = (kind: string) => (kind in LIVE_PANES ? LIVE_PANES[kind as LivePaneKind].label : kind);
  let doc: SurfaceDocument = { version: 2, active: 'looper', tabs: [{ id: 'looper', title: 'Looper', layout: null, regions: [] }] };
  const apply = (intent: SurfaceIntent) => {
    doc = applySurfaceIntent(doc, intent, { titleOf: title });
  };
  const tab = () => readDocument(doc).tabs[0];
  const idOf = (kind: string) => tab().regions.find((r) => r.kind === kind)!.id;
  for (const kind of ['song', 'loop', 'mix'] as const) apply({ type: 'addRegion', tab: 'looper', kind });
  apply({ type: 'addRegion', tab: 'looper', kind: 'cuts', beside: idOf('loop'), zone: 'right' });
  apply({ type: 'addRegion', tab: 'looper', kind: 'throws', beside: idOf('cuts'), zone: 'below' });
  apply({ type: 'addRegion', tab: 'looper', kind: 'controls', beside: idOf('mix'), zone: 'right' });
  apply({ type: 'addRegion', tab: 'looper', kind: 'rig' });
  apply({ type: 'configureRegion', tab: 'looper', region: idOf('loop'), settings: { tracks: [...LOOPER_TRACKS] } });
  apply({ type: 'configureRegion', tab: 'looper', region: idOf('mix'), settings: { tracks: [...LOOPER_TRACKS] } });
  apply({ type: 'configureRegion', tab: 'looper', region: idOf('controls'), settings: { columns: 6, rows: 3, cells: LOOPER_MACROS as never } });
  const holding = (id: string) => splits(tab().layout).find((s) => s.children.some((c) => c.node === id))!;
  apply({ type: 'resizeSplit', tab: 'looper', split: holding(idOf('song')).id, shares: [1, 3.2, 3, 0.35] });
  apply({ type: 'resizeSplit', tab: 'looper', split: holding(idOf('loop')).id, shares: [2.2, 1] });
  apply({ type: 'resizeSplit', tab: 'looper', split: holding(idOf('mix')).id, shares: [1.6, 1] });
  apply({ type: 'lockTab', tab: 'looper', locked: true });
  return tab();
}

/** The looper performance board: the first panel built to be played. */
export const LOOPER_TAB = looperTab();

/** The live views, opening on ONE. */
export const LIVE_DOCUMENT: SurfaceDocumentV2 = { version: 2, active: 'one', tabs: [LOOPER_TAB, ONE_TAB, FOLLOW_TAB, TRACK_TAB, HANDS_TAB, MINE_TAB] };
