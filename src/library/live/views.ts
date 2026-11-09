// The live views as surface documents (docs/live-views.md): the reference DAW built on the surface.
// Every tab is rows of region instance ids and the instances, each naming its Music live pane by
// `kind` (never by id), its title and its binding. The app owns this value: the Workspace draws it
// and sends every edit as an intent, which the stories apply with `applySurfaceIntent`.
import type { SurfaceDocument, SurfaceRegion, SurfaceTab } from '../layout/Workspace/Workspace.types';
import { LIVE_PANES, type LivePaneKind } from '../Music/live/panes';

/** A tab from rows of kinds, as mix's `defaultDocument` builds its presets: fresh instance ids, each bound to the selection. */
function preset(id: string, title: string, layout: readonly (readonly LivePaneKind[])[]): SurfaceTab {
  const regions: SurfaceRegion[] = [];
  const rows = layout.map((row) =>
    row.map((kind) => {
      const region: SurfaceRegion = { id: `${id}-region-${regions.length + 1}`, kind, title: LIVE_PANES[kind].label, binding: { mode: 'selected' } };
      regions.push(region);
      return region.id;
    }),
  );
  return { id, title, rows, regions };
}

/**
 * ONE: the unified board. The night along the top, the song now beside the dice (the wireframe's
 * header), the clips beside where the harmony is, the song's sections beside where the set lands
 * next, the strips beside the stems, the rig's line last.
 */
export const ONE_TAB = preset('one', 'ONE', [['river'], ['song', 'dice'], ['loop', 'compass'], ['sections', 'landing'], ['mix', 'stems'], ['rig']]);

/** Follow: the harmony as a place (compass), in time (orbits), the loop that plays it, and the dice. */
export const FOLLOW_TAB = preset('follow', 'Follow', [['compass', 'orbits'], ['follow', 'dice'], ['rig']]);

/** Track: one column as its signal path, the song's stems under it, the throws and the cuts under the hands. */
export const TRACK_TAB = preset('track', 'Track', [['spine'], ['stems'], ['throws', 'cuts'], ['rig']]);

/** Hands: the controller twin beside the orbits, the sections and the landing under them. */
export const HANDS_TAB = preset('hands', 'Hands', [['push', 'orbits'], ['sections', 'landing'], ['rig']]);

/** A blank page to build on: the river alone, the palette ready. */
export const MINE_TAB = preset('mine', 'Mine', [['river'], ['rig']]);

/** The live views, opening on ONE. */
export const LIVE_DOCUMENT: SurfaceDocument = { version: 1, active: 'one', tabs: [ONE_TAB, FOLLOW_TAB, TRACK_TAB, HANDS_TAB, MINE_TAB] };
