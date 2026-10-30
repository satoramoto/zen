// The live views as plain data: every pane kind the palette can place (the Music family's live
// panes, mix[flow]'s face throughout) and the tabs composed from them. A tab is a ScreenSpec of the
// panes' own forms, so the solver decides how each draws; editing a tab rewrites this value.
import type { ScreenSpec } from '../layout/assembly/types';
import type { WorkspaceRegion, WorkspaceTab } from '../layout/Workspace/Workspace.types';
import { CHORD_COMPASS_FORMS } from '../Music/live/ChordCompass/ChordCompass.forms';
import { CUT_PADS_FORMS } from '../Music/live/CutPads/CutPads.forms';
import { LANDING_DIAL_FORMS } from '../Music/live/LandingDial/LandingDial.forms';
import { LAUNCH_GRID_FORMS } from '../Music/live/LaunchGrid/LaunchGrid.forms';
import { ORBIT_CLOCK_FORMS } from '../Music/live/OrbitClock/OrbitClock.forms';
import { PROGRESSION_STRIP_FORMS } from '../Music/live/ProgressionStrip/ProgressionStrip.forms';
import { PUSH_TWIN_FORMS } from '../Music/live/PushTwin/PushTwin.forms';
import { RIG_HEALTH_FORMS } from '../Music/live/RigHealth/RigHealth.forms';
import { SETLIST_RIVER_FORMS } from '../Music/live/SetlistRiver/SetlistRiver.forms';
import { SIGNAL_SPINE_FORMS } from '../Music/live/SignalSpine/SignalSpine.forms';
import { THROW_PADS_FORMS } from '../Music/live/ThrowPads/ThrowPads.forms';
import { TRACK_STRIPS_FORMS } from '../Music/live/TrackStrips/TrackStrips.forms';

/** Every kind a tab can hold. A region's id is its kind (a second one is `kind-2`), so content is found by kind. */
export const PANE_KINDS = {
  river: { kind: 'river', label: 'Setlist river', forms: SETLIST_RIVER_FORMS, priority: 'context', plate: false },
  loop: { kind: 'loop', label: 'Launch grid', forms: LAUNCH_GRID_FORMS, priority: 'now', plate: false },
  mix: { kind: 'mix', label: 'Track strips', forms: TRACK_STRIPS_FORMS, priority: 'controls', plate: false },
  compass: { kind: 'compass', label: 'Chord compass', forms: CHORD_COMPASS_FORMS, priority: 'now', plate: false },
  follow: { kind: 'follow', label: 'Progression', forms: PROGRESSION_STRIP_FORMS, priority: 'now', plate: false },
  orbits: { kind: 'orbits', label: 'Orbits', forms: ORBIT_CLOCK_FORMS, priority: 'now', plate: false },
  spine: { kind: 'spine', label: 'Signal spine', forms: SIGNAL_SPINE_FORMS, priority: 'now', plate: false },
  push: { kind: 'push', label: 'Push twin', forms: PUSH_TWIN_FORMS, priority: 'now', plate: false },
  landing: { kind: 'landing', label: 'Landing', forms: LANDING_DIAL_FORMS, priority: 'next', plate: false },
  cuts: { kind: 'cuts', label: 'Cut pads', forms: CUT_PADS_FORMS, priority: 'controls', plate: false },
  throws: { kind: 'throws', label: 'Throws', forms: THROW_PADS_FORMS, priority: 'controls', plate: false },
  rig: { kind: 'rig', label: 'Rig health', forms: RIG_HEALTH_FORMS, priority: 'chrome', plate: false },
} as const satisfies Record<string, WorkspaceRegion>;

export type PaneKind = keyof typeof PANE_KINDS;

/** The kind a region id names: `'compass-2'` is a compass. */
export const kindOf = (id: string): PaneKind | undefined => {
  const k = id.replace(/-\d+$/, '');
  return k in PANE_KINDS ? (k as PaneKind) : undefined;
};

/** A region of a kind, with the palette's defaults. Panes bring their own face, so no plate. */
const at = (kind: PaneKind, id: string = kind) => {
  const k: WorkspaceRegion = PANE_KINDS[kind];
  return { id, forms: k.forms, priority: k.priority, plate: k.plate, head: k.head };
};

/** The palette, in the order the views use them. */
export const PANE_PALETTE: readonly WorkspaceRegion[] = Object.values(PANE_KINDS);

/** The rig's one line, on the floor of every tab. */
const FOOTER = [at('rig')];

/**
 * ONE: the unified board. The night along the top, the clips beside where the harmony is and
 * where the set lands next, the strips under them, the rig on the floor.
 */
export const ONE_SPEC: ScreenSpec = {
  rows: [[at('river')], [at('loop'), { id: 'aside', rows: [[at('compass')], [at('landing')]] }], [at('mix')]],
  footer: FOOTER,
};

/** Follow: the harmony as a place (compass), in time (orbits), and as the loop that plays it. */
export const FOLLOW_SPEC: ScreenSpec = {
  rows: [[at('compass'), at('orbits')], [at('follow')]],
  footer: FOOTER,
};

/** Track: one column as its signal path, with the throws and the cuts under the hands. */
export const TRACK_SPEC: ScreenSpec = {
  rows: [[at('spine')], [at('throws'), at('cuts')]],
  footer: FOOTER,
};

/** Hands: the controller twin beside the landing and the orbits — what the hardware is doing. */
export const HANDS_SPEC: ScreenSpec = {
  rows: [[at('push'), { id: 'aside', rows: [[at('landing')], [at('orbits')]] }]],
  footer: FOOTER,
};

/** A blank page to build on: the river alone, the palette ready. */
export const BLANK_SPEC: ScreenSpec = {
  rows: [[at('river')]],
  footer: FOOTER,
};

export const LIVE_TABS: readonly WorkspaceTab[] = [
  { id: 'one', title: 'ONE', spec: ONE_SPEC },
  { id: 'follow', title: 'Follow', spec: FOLLOW_SPEC },
  { id: 'track', title: 'Track', spec: TRACK_SPEC },
  { id: 'hands', title: 'Hands', spec: HANDS_SPEC },
  { id: 'mine', title: 'Mine', spec: BLANK_SPEC },
];
