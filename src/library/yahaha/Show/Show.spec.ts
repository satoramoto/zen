// The show's tabs (docs/assembly.md, docs/live-views.md): five Lemur pages over the seven-song
// set, each a ScreenSpec of widget forms. View 8's shape (grid on top, the chain beneath) with
// the tab strip the mockups wrap it in. Every form is the widget's own, so the solver decides.
import { ARP_SEQUENCER_FORMS } from '../../components/music/ArpSequencer/ArpSequencer.forms';
import { CHORD_STRIP_FORMS } from '../../components/music/ChordStrip/ChordStrip.forms';
import { LOOP_GRID_FORMS } from '../../components/music/LoopGrid/LoopGrid.forms';
import { MACRO_PADS_FORMS } from '../../components/music/MacroPads/MacroPads.forms';
import { MIX_BAND_FORMS } from '../../components/music/MixBand/MixBand.forms';
import { STEM_LANES_FORMS } from '../../components/music/StemLanes/StemLanes.forms';
import { TRANSITION_ROW_FORMS } from '../../components/music/TransitionRow/TransitionRow.forms';
import type { ScreenSpec } from '../../layout/assembly/types';
import type { WorkspaceTab } from '../../layout/Workspace/Workspace.types';

/** My stage: the loop grid over the mix — launch and levels, one glance. */
export const SHOW_STAGE_SPEC: ScreenSpec = {
  rows: [
    [{ id: 'loop', forms: LOOP_GRID_FORMS, priority: 'now' }],
    [{ id: 'mix', forms: MIX_BAND_FORMS, priority: 'controls', head: true }],
  ],
};

/** Session grid: the set the way Live lays it — folded songs, eight columns, stops, cuts. */
export const SHOW_GRID_SPEC: ScreenSpec = {
  rows: [
    [{ id: 'loop', forms: LOOP_GRID_FORMS, priority: 'now' }],
    [{ id: 'cuts', forms: TRANSITION_ROW_FORMS, priority: 'controls' }],
  ],
};

/** Arp & follow: the progression strip over the 16-step arp beside the macro throws. */
export const SHOW_ARP_SPEC: ScreenSpec = {
  rows: [
    [{ id: 'follow', forms: CHORD_STRIP_FORMS, priority: 'now' }],
    [
      { id: 'keys', forms: ARP_SEQUENCER_FORMS, priority: 'controls', head: true },
      { id: 'pads', forms: MACRO_PADS_FORMS, priority: 'controls', head: true },
    ],
  ],
};

/** Mix & sends: the column-aligned band, returns right — Live's mixer below the grid. */
export const SHOW_MIX_SPEC: ScreenSpec = {
  rows: [[{ id: 'mix', forms: MIX_BAND_FORMS, priority: 'controls', head: true }]],
};

/** Stem deck: four lanes, hot cues and the loop window, transitions underneath. */
export const SHOW_STEMS_SPEC: ScreenSpec = {
  rows: [
    [{ id: 'stems', forms: STEM_LANES_FORMS, priority: 'now' }],
    [{ id: 'cuts', forms: TRANSITION_ROW_FORMS, priority: 'controls' }],
  ],
};

/** The show's five tabs, in strip order. */
export const SHOW_TABS: readonly WorkspaceTab[] = [
  { id: 'stage', title: 'My stage', spec: SHOW_STAGE_SPEC },
  { id: 'grid', title: 'Session grid', spec: SHOW_GRID_SPEC },
  { id: 'arp', title: 'Arp & follow', spec: SHOW_ARP_SPEC },
  { id: 'mix', title: 'Mix & sends', spec: SHOW_MIX_SPEC },
  { id: 'stems', title: 'Stem deck', spec: SHOW_STEMS_SPEC },
];

/** The tab the show opens on. */
export const SHOW_START = 'stage';
