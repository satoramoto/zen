// The concept views as plain data: every pane kind the palette can place (the new concept panes
// beside the live widgets), and the tabs composed from them. A tab is a ScreenSpec of the panes'
// own forms, so the solver decides how each draws; editing a tab rewrites this value, never a grid.
import { ARP_SEQUENCER_FORMS } from '../components/music/ArpSequencer/ArpSequencer.forms';
import { CHORD_STRIP_FORMS } from '../components/music/ChordStrip/ChordStrip.forms';
import { LOOP_GRID_FORMS } from '../components/music/LoopGrid/LoopGrid.forms';
import { MACRO_PADS_FORMS } from '../components/music/MacroPads/MacroPads.forms';
import { MIX_BAND_FORMS } from '../components/music/MixBand/MixBand.forms';
import { STEM_LANES_FORMS } from '../components/music/StemLanes/StemLanes.forms';
import { TRANSITION_ROW_FORMS } from '../components/music/TransitionRow/TransitionRow.forms';
import type { ScreenSpec } from '../layout/assembly/types';
import type { WorkspaceRegion, WorkspaceTab } from '../layout/Workspace/Workspace.types';
import { CHORD_COMPASS_FORMS } from './panes/ChordCompass/ChordCompass.forms';
import { LANDING_DIAL_FORMS } from './panes/LandingDial/LandingDial.forms';
import { ORBIT_CLOCK_FORMS } from './panes/OrbitClock/OrbitClock.forms';
import { PUSH_TWIN_FORMS } from './panes/PushTwin/PushTwin.forms';
import { RIG_HEALTH_FORMS } from './panes/RigHealth/RigHealth.forms';
import { SETLIST_RIVER_FORMS } from './panes/SetlistRiver/SetlistRiver.forms';
import { SIGNAL_SPINE_FORMS } from './panes/SignalSpine/SignalSpine.forms';

/** Every kind a tab can hold. A region's id is its kind (a second one is `kind-2`), so content is found by kind. */
export const PANE_KINDS = {
  river: { kind: 'river', label: 'Setlist river', forms: SETLIST_RIVER_FORMS, priority: 'context' },
  compass: { kind: 'compass', label: 'Chord compass', forms: CHORD_COMPASS_FORMS, priority: 'now' },
  orbits: { kind: 'orbits', label: 'Orbits', forms: ORBIT_CLOCK_FORMS, priority: 'now' },
  spine: { kind: 'spine', label: 'Signal spine', forms: SIGNAL_SPINE_FORMS, priority: 'now' },
  push: { kind: 'push', label: 'Push twin', forms: PUSH_TWIN_FORMS, priority: 'now' },
  landing: { kind: 'landing', label: 'Landing', forms: LANDING_DIAL_FORMS, priority: 'next' },
  rig: { kind: 'rig', label: 'Rig health', forms: RIG_HEALTH_FORMS, priority: 'chrome', plate: false },
  loop: { kind: 'loop', label: 'Loop grid', forms: LOOP_GRID_FORMS, priority: 'now' },
  mix: { kind: 'mix', label: 'Mix', forms: MIX_BAND_FORMS, priority: 'controls', head: true },
  follow: { kind: 'follow', label: 'Progression', forms: CHORD_STRIP_FORMS, priority: 'now' },
  arp: { kind: 'arp', label: 'Arp', forms: ARP_SEQUENCER_FORMS, priority: 'controls', head: true },
  throws: { kind: 'throws', label: 'Throws', forms: MACRO_PADS_FORMS, priority: 'controls', head: true },
  cuts: { kind: 'cuts', label: 'Transitions', forms: TRANSITION_ROW_FORMS, priority: 'controls' },
  stems: { kind: 'stems', label: 'Stems', forms: STEM_LANES_FORMS, priority: 'now' },
} as const satisfies Record<string, WorkspaceRegion>;

export type PaneKind = keyof typeof PANE_KINDS;

/** The kind a region id names: `'compass-2'` is a compass. */
export const kindOf = (id: string): PaneKind | undefined => {
  const k = id.replace(/-\d+$/, '');
  return k in PANE_KINDS ? (k as PaneKind) : undefined;
};

/** A region of a kind, with the palette's defaults. */
const at = (kind: PaneKind, id: string = kind) => {
  const k: WorkspaceRegion = PANE_KINDS[kind];
  return { id, forms: k.forms, priority: k.priority, plate: k.plate, head: k.head };
};

/** The palette: the new panes first, then the live widgets. */
export const PANE_PALETTE: readonly WorkspaceRegion[] = Object.values(PANE_KINDS);

/**
 * ONE: the unified board. The night along the top, the clips beside where the harmony is and
 * where the set lands next, the mix under them and the rig's one line on the floor (a body row: the Workspace fills body regions only).
 */
export const ONE_SPEC: ScreenSpec = {
  rows: [
    [at('river')],
    [at('loop'), { id: 'aside', rows: [[at('compass')], [at('landing')]] }],
    [at('mix')],
    [at('rig')],
  ],
};

/** Follow: the harmony as a place (the compass), in time (the orbits), and as the loop that plays it. */
export const FOLLOW_SPEC: ScreenSpec = {
  rows: [[at('compass'), at('orbits')], [at('follow')], [at('rig')]],
};

/** Track: one column as its signal path, with the throws and the cuts under the hands. */
export const TRACK_SPEC: ScreenSpec = {
  rows: [[at('spine')], [at('throws'), at('cuts')], [at('rig')]],
};

/** Hands: the controller twin beside the landing and the compass dial — what the hardware is doing. */
export const HANDS_SPEC: ScreenSpec = {
  rows: [[at('push'), { id: 'aside', rows: [[at('landing')], [at('orbits')]] }], [at('rig')]],
};

/** A blank page to build on: the river alone, the palette ready. */
export const BLANK_SPEC: ScreenSpec = {
  rows: [[at('river')]],
};

export const CONCEPT_TABS: readonly WorkspaceTab[] = [
  { id: 'one', title: 'ONE', spec: ONE_SPEC },
  { id: 'follow', title: 'Follow', spec: FOLLOW_SPEC },
  { id: 'track', title: 'Track', spec: TRACK_SPEC },
  { id: 'hands', title: 'Hands', spec: HANDS_SPEC },
  { id: 'mine', title: 'Mine', spec: BLANK_SPEC },
];

