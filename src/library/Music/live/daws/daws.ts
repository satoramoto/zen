// Whole DAWs composed from the reference kit (docs/live-views.md): each one a surface document
// built the way a person builds it, every step an intent the surface sends, applied with
// `applySurfaceIntent` to an empty tab, then locked for the gig. Nothing here is a component: a DAW
// is a document, the pack it wears and the window it is made for. The app (the stories' stand-in
// set, `views/LiveSet.story.tsx`) owns the readings and the engine; the kit (`Music.livePanes`)
// draws every region.
import { place } from '../../../layout/cells';
import { applySurfaceIntent, readDocument, splits } from '../../../layout/Workspace/surface';
import type { DockZone, SettingValue, SurfaceBinding, SurfaceDocument, SurfaceDocumentV2, SurfaceIntent, SurfaceTab } from '../../../layout/Workspace/Workspace.types';
import { KIND_SIZE, type ControlCell, type ControlKind } from '../ControlPanel/ControlPanel.model';
import { LIVE_PANES, type LivePaneKind } from '../panes';

/** One step of building a tab: a pane added (beside another, on a side), titled, bound and configured. */
interface Add {
  kind: LivePaneKind;
  /** The key later steps name this pane by. Default the kind. */
  as?: string;
  beside?: string;
  zone?: Exclude<DockZone, 'swap'>;
  title?: string;
  bind?: string;
  settings?: Readonly<Record<string, SettingValue>>;
}

/** A tab built through intents: its panes in order, then the shares of the split each named pair sits in. */
function build(id: string, title: string, adds: readonly Add[], shares: readonly (readonly [holding: string, shares: readonly number[]])[] = [], locked = true): SurfaceTab {
  let doc: SurfaceDocument = { version: 2, active: id, tabs: [{ id, title, layout: null, regions: [] }] };
  const apply = (intent: SurfaceIntent) => {
    doc = applySurfaceIntent(doc, intent, { titleOf: (kind) => (kind in LIVE_PANES ? LIVE_PANES[kind as LivePaneKind].label : kind) });
  };
  const tab = () => readDocument(doc).tabs[0];
  const ids = new Map<string, string>();
  for (const add of adds) {
    const before = new Set(tab().regions.map((r) => r.id));
    apply({ type: 'addRegion', tab: id, kind: add.kind, ...(add.beside ? { beside: ids.get(add.beside)!, zone: add.zone ?? 'right' } : {}) });
    const region = tab().regions.find((r) => !before.has(r.id))!.id;
    ids.set(add.as ?? add.kind, region);
    if (add.title) apply({ type: 'retitleRegion', tab: id, region, title: add.title });
    if (add.bind) apply({ type: 'bindRegion', tab: id, region, binding: { mode: 'fixed', target: add.bind } satisfies SurfaceBinding });
    if (add.settings) apply({ type: 'configureRegion', tab: id, region, settings: add.settings });
  }
  for (const [holding, next] of shares) {
    // `holding` is a pane's key, or two joined by `|`: the split that holds both (a branch can't be named, its panes can).
    const [a, b] = holding.split('|').map((k) => ids.get(k)!);
    const has = (node: unknown, leaf: string): boolean => (typeof node === 'string' ? node === leaf : (node as { children: { node: unknown }[] }).children.some((c) => has(c.node, leaf)));
    const all = splits(tab().layout);
    const split = b === undefined ? all.find((s) => s.children.some((c) => c.node === a)) : [...all].reverse().find((s) => has(s, a) && has(s, b));
    if (split && split.children.length === next.length) apply({ type: 'resizeSplit', tab: id, split: split.id, shares: next });
  }
  if (locked) apply({ type: 'lockTab', tab: id, locked: true });
  return tab();
}

/** Cells for a control panel, each placed as the panel places it: `[kind, parameter, x, y, w?, h?, paramY?]`. */
type CellSpec = readonly [ControlKind, string, number, number, number?, number?, string?];
function cellsOf(specs: readonly CellSpec[], columns: number, rows: number): readonly ControlCell[] {
  return specs.reduce<readonly ControlCell[]>((cells, [control, param, x, y, w, h, paramY], i) => {
    const size = { w: w ?? KIND_SIZE[control].w, h: h ?? KIND_SIZE[control].h };
    return place(cells, { id: `k${i + 1}`, control, param, ...(paramY ? { paramY } : {}), x, y, ...size }, { columns, rows }) ?? cells;
  }, []);
}
const panel = (specs: readonly CellSpec[], columns: number, rows: number): Readonly<Record<string, SettingValue>> => ({ columns, rows, cells: cellsOf(specs, columns, rows) as unknown as SettingValue });

/** One showcase DAW: its document, the pack it wears, the window it is made for, and what it is. */
export interface Daw {
  id: string;
  name: string;
  /** One line: what it is for. */
  idea: string;
  /** The theme pack's id (`themes/packs.ts`) and mode. */
  pack: string;
  mode: 'dark' | 'light';
  frame: { w: number; h: number };
  document: SurfaceDocumentV2;
}

// ── Dub desk ─────────────────────────────────────────────────────────────────────────────────────
// A mixing desk played as an instrument: the strips to ride, a wide bank of sends and filters under
// them, the throws and the cuts under the right hand, the song across the top.
const DUB_TAB = build(
  'desk',
  'Desk',
  [
    { kind: 'song' },
    { kind: 'mix', title: 'Channels' },
    { kind: 'throws', beside: 'mix', zone: 'right', title: 'Echo throws' },
    { kind: 'cuts', beside: 'throws', zone: 'below', title: 'Drops' },
    {
      kind: 'controls',
      title: 'Sends & filter',
      settings: panel(
        [
          ['fader', 'cutoff', 0, 0, 1, 3],
          ['fader', 'drive', 1, 0, 1, 3],
          ['fader', 'delay', 2, 0, 1, 3],
          ['fader', 'feedback', 3, 0, 1, 3],
          ['fader', 'time', 4, 0, 1, 3],
          ['fader', 'reverb', 5, 0, 1, 3],
          ['xy', 'time', 6, 0, 3, 3, 'feedback'],
          ['pad', 'riser', 9, 0, 1, 1],
          ['pad', 'drop', 10, 0, 1, 1],
          ['pad', 'stutter', 9, 1, 1, 1],
          ['pad', 'kill', 10, 1, 1, 1],
          ['toggle', 'freeze', 9, 2, 2, 1],
        ],
        11,
        3,
      ),
    },
    { kind: 'rig' },
  ],
  [
    ['song', [0.62, 3.7, 2.4, 0.3]],
    ['mix|throws', [2.2, 1]],
    ['throws|cuts', [1.55, 1]],
  ],
);
const DUB_STEMS_TAB = build('stems', 'Stems', [{ kind: 'stems' }, { kind: 'sections' }, { kind: 'rig' }], [['stems', [4, 1.2, 0.32]]]);

// ── Orbit lab ────────────────────────────────────────────────────────────────────────────────────
// A generative rig: two orbit clocks, each fixed to its own track, either side of the compass; the
// dice and the landing at the right; the progression the generators follow under them all.
const ORBIT_TAB = build(
  'lab',
  'Lab',
  [
    { kind: 'orbits', as: 'left', bind: 'drums', title: 'Drums orbit' },
    { kind: 'compass', beside: 'left', zone: 'right' },
    { kind: 'orbits', as: 'right', beside: 'compass', zone: 'right', bind: 'keys', title: 'Keys orbit' },
    { kind: 'dice', beside: 'right', zone: 'right' },
    { kind: 'landing', beside: 'dice', zone: 'below' },
    { kind: 'follow', title: 'Progression' },
    { kind: 'rig' },
  ],
  [
    ['left|follow', [5, 1, 0.3]],
    ['left|dice', [1.12, 1, 1.12, 1.25]],
    ['dice|landing', [1, 1.2]],
  ],
);
const ORBIT_SPINE_TAB = build('chain', 'Chain', [{ kind: 'spine' }, { kind: 'throws' }, { kind: 'rig' }], [['spine', [3.2, 2, 0.32]]]);

// ── Stem booth ───────────────────────────────────────────────────────────────────────────────────
// A deck for a set of finished songs: the song now beside its sections along the top, the stems
// wide in the middle with the cuts and a blend panel at their right, four strips under the hands.
const BOOTH_TAB = build(
  'booth',
  'Booth',
  [
    { kind: 'song', title: 'Now' },
    { kind: 'sections', beside: 'song', zone: 'right' },
    { kind: 'stems', title: 'Deck' },
    { kind: 'cuts', beside: 'stems', zone: 'right' },
    {
      kind: 'controls',
      beside: 'cuts',
      zone: 'below',
      title: 'Blend',
      settings: panel(
        [
          ['knob', 'cutoff', 0, 0],
          ['knob', 'reverb', 1, 0],
          ['knob', 'delay', 2, 0],
          ['knob', 'drive', 3, 0],
          ['toggle', 'freeze', 0, 1, 2, 1],
          ['pad', 'stutter', 2, 1],
          ['pad', 'kill', 3, 1],
        ],
        4,
        2,
      ),
    },
    { kind: 'mix', settings: { tracks: ['drums', 'bass', 'keys', 'vox'] } },
    { kind: 'rig' },
  ],
  [
    ['song|mix', [0.7, 4.5, 2.4, 0.3]],
    ['song|sections', [1, 2.6]],
    ['stems|cuts', [2.3, 1]],
    ['cuts|controls', [1, 1.15]],
  ],
);

// ── Pocket ───────────────────────────────────────────────────────────────────────────────────────
// A phone on the mic stand: the song now, the cuts as the biggest targets, four pads and a filter.
const POCKET_TAB = build(
  'pocket',
  'Pocket',
  [
    { kind: 'song' },
    { kind: 'cuts' },
    {
      kind: 'controls',
      title: 'Hands',
      settings: panel(
        [
          ['pad', 'riser', 0, 0],
          ['pad', 'drop', 1, 0],
          ['pad', 'stutter', 0, 1],
          ['pad', 'kill', 1, 1],
          ['fader', 'cutoff', 2, 0, 1, 2],
          ['fader', 'delay', 3, 0, 1, 2],
        ],
        4,
        2,
      ),
    },
  ],
  [['song', [0.7, 1.6, 2.4]]],
);

const doc = (...tabs: SurfaceTab[]): SurfaceDocumentV2 => ({ version: 2, active: tabs[0].id, tabs });

/** The showcase DAWs. */
export const DAWS = {
  dub: { id: 'dub', name: 'Dub desk', idea: 'A mixing desk played as an instrument: ride the channels, the sends and the echo.', pack: 'yahaha-elektron', mode: 'dark', frame: { w: 1440, h: 900 }, document: doc(DUB_TAB, DUB_STEMS_TAB) },
  orbit: { id: 'orbit', name: 'Orbit lab', idea: 'A generative rig: two orbit clocks either side of the compass, dice in reach.', pack: 'linear', mode: 'light', frame: { w: 1440, h: 900 }, document: doc(ORBIT_TAB, ORBIT_SPINE_TAB) },
  booth: { id: 'booth', name: 'Stem booth', idea: 'A deck for finished songs: stems wide, cuts and a blend panel beside them.', pack: 'big-red', mode: 'dark', frame: { w: 1440, h: 900 }, document: doc(BOOTH_TAB) },
  pocket: { id: 'pocket', name: 'Pocket', idea: 'A phone on the mic stand: the song now, the cuts, four pads and two faders.', pack: 'mixflow', mode: 'dark', frame: { w: 390, h: 780 }, document: doc(POCKET_TAB) },
} as const satisfies Record<string, Daw>;

export type DawId = keyof typeof DAWS;
