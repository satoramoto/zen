// The live views as plain data, in mix's surface-document shape (mix `src/rig/contract.ts`,
// version 1): every tab is rows of region instance ids, and each instance names its pane kind, its
// title and what it is bound to. A kind is never read out of an id. `liveScreen` turns a tab into
// the ScreenSpec the solver draws, each region with its pane's own forms. The panes are the Music
// family's live panes, mix[flow]'s face throughout. Editing a tab rewrites this value.
import type { RegionSpec, ScreenSpec } from '../layout/assembly/types';
import type { WorkspaceRegion } from '../layout/Workspace/Workspace.types';
import { CHORD_COMPASS_FORMS } from '../Music/live/ChordCompass/ChordCompass.forms';
import { CUT_PADS_FORMS } from '../Music/live/CutPads/CutPads.forms';
import { LANDING_DIAL_FORMS } from '../Music/live/LandingDial/LandingDial.forms';
import { LAUNCH_GRID_FORMS } from '../Music/live/LaunchGrid/LaunchGrid.forms';
import { ORBIT_CLOCK_FORMS } from '../Music/live/OrbitClock/OrbitClock.forms';
import { PROGRESSION_STRIP_FORMS } from '../Music/live/ProgressionStrip/ProgressionStrip.forms';
import { PUSH_TWIN_FORMS } from '../Music/live/PushTwin/PushTwin.forms';
import { RIG_HEALTH_FORMS } from '../Music/live/RigHealth/RigHealth.forms';
import { SECTION_BAR_FORMS } from '../Music/live/SectionBar/SectionBar.forms';
import { SETLIST_RIVER_FORMS } from '../Music/live/SetlistRiver/SetlistRiver.forms';
import { SIGNAL_SPINE_FORMS } from '../Music/live/SignalSpine/SignalSpine.forms';
import { STEM_DECK_FORMS } from '../Music/live/StemDeck/StemDeck.forms';
import { THROW_PADS_FORMS } from '../Music/live/ThrowPads/ThrowPads.forms';
import { TRACK_STRIPS_FORMS } from '../Music/live/TrackStrips/TrackStrips.forms';

/** Every kind a tab can hold: the palette, by kind. */
export const PANE_KINDS = {
  river: { kind: 'river', label: 'Setlist river', forms: SETLIST_RIVER_FORMS, priority: 'context', plate: false },
  loop: { kind: 'loop', label: 'Launch grid', forms: LAUNCH_GRID_FORMS, priority: 'now', plate: false },
  sections: { kind: 'sections', label: 'Sections', forms: SECTION_BAR_FORMS, priority: 'now', plate: false },
  mix: { kind: 'mix', label: 'Track strips', forms: TRACK_STRIPS_FORMS, priority: 'controls', plate: false },
  stems: { kind: 'stems', label: 'Stem deck', forms: STEM_DECK_FORMS, priority: 'controls', plate: false },
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

/** Whether a palette kind (a Workspace placement's) is one of the live panes. */
export const isPaneKind = (kind: string): kind is PaneKind => Object.hasOwn(PANE_KINDS, kind);

/** The palette, in the order the views use them. */
export const PANE_PALETTE: readonly WorkspaceRegion[] = Object.values(PANE_KINDS);

/** What a region shows: the selected track, or one fixed target. mix's `RegionBinding`. */
export type LiveBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };

/** One region instance: its own id, the pane kind it is, its title and its binding. mix's `SurfaceRegion`. */
export interface LiveRegion {
  id: string;
  kind: PaneKind;
  title: string;
  binding: LiveBinding;
}

/** One tab: rows of instance ids, and the instances. mix's `SurfaceTab`. */
export interface LiveTab {
  id: string;
  title: string;
  rows: readonly (readonly string[])[];
  regions: readonly LiveRegion[];
}

/** The live views. mix's `SurfaceDocument`, version 1. */
export interface LiveDocument {
  version: 1;
  active: string;
  tabs: readonly LiveTab[];
}

/** A region as the solver places it: the instance's id with its pane's forms and defaults. No plate: panes bring their own face. */
export function liveRegionSpec(region: LiveRegion): RegionSpec {
  const k: WorkspaceRegion = PANE_KINDS[region.kind];
  return { id: region.id, forms: k.forms, priority: k.priority, plate: k.plate, head: k.head };
}

/** A tab as the ScreenSpec the solver draws: its rows, each id resolved through the tab's own instances. */
export function liveScreen(tab: LiveTab): ScreenSpec {
  const byId = new Map(tab.regions.map((r) => [r.id, r]));
  return { rows: tab.rows.map((row) => row.flatMap((id) => (byId.has(id) ? [liveRegionSpec(byId.get(id)!)] : []))).filter((row) => row.length > 0) };
}

/** A tab from rows of kinds, as mix's `defaultDocument` builds its presets: fresh instance ids, each bound to the selected track. */
function preset(id: string, title: string, layout: readonly (readonly PaneKind[])[]): LiveTab {
  const regions: LiveRegion[] = [];
  const rows = layout.map((row) =>
    row.map((kind) => {
      const region: LiveRegion = { id: `${id}-region-${regions.length + 1}`, kind, title: PANE_KINDS[kind].label, binding: { mode: 'selected' } };
      regions.push(region);
      return region.id;
    }),
  );
  return { id, title, rows, regions };
}

/**
 * ONE: the unified board. The night along the top, the clips beside where the harmony is, the
 * song's sections beside where the set lands next, the strips beside the stems, the rig's line last.
 */
export const ONE_TAB = preset('one', 'ONE', [['river'], ['loop', 'compass'], ['sections', 'landing'], ['mix', 'stems'], ['rig']]);

/** Follow: the harmony as a place (compass), in time (orbits), and as the loop that plays it. */
export const FOLLOW_TAB = preset('follow', 'Follow', [['compass', 'orbits'], ['follow'], ['rig']]);

/** Track: one column as its signal path, the song's stems under it, the throws and the cuts under the hands. */
export const TRACK_TAB = preset('track', 'Track', [['spine'], ['stems'], ['throws', 'cuts'], ['rig']]);

/** Hands: the controller twin beside the orbits, the sections and the landing under them. */
export const HANDS_TAB = preset('hands', 'Hands', [['push', 'orbits'], ['sections', 'landing'], ['rig']]);

/** A blank page to build on: the river alone, the palette ready. */
export const MINE_TAB = preset('mine', 'Mine', [['river'], ['rig']]);

export const LIVE_DOCUMENT: LiveDocument = { version: 1, active: 'one', tabs: [ONE_TAB, FOLLOW_TAB, TRACK_TAB, HANDS_TAB, MINE_TAB] };
