// The Music live panes as one ready-made set of surface pane definitions (docs/live-views.md): an
// app hands `livePanes` (whole, in part, or beside its own) to the Workspace and draws each
// instance with the pane its `kind` names. Plain data: no renderer. Every pane only asks and reads
// back; what is playing, queued, muted or measured stays the host's to say. A pane's settings say
// what of the host's it shows (which tracks, which cuts, which moves); the app reads them in `pane`.
import type { PaneDefinition, SettingSpec } from '../../layouts/Workspace/Workspace.types';
import { DICE_MOVES } from './components/DicePad/DicePad.model';
import { CHORD_COMPASS_FORMS } from './components/ChordCompass/ChordCompass.forms';
import { CUT_PADS_FORMS } from './components/CutPads/CutPads.forms';
import { CONTROL_PANEL_FORMS } from './layouts/ControlPanel/ControlPanel.forms';
import { DICE_PAD_FORMS } from './components/DicePad/DicePad.forms';
import { LANDING_DIAL_FORMS } from './components/LandingDial/LandingDial.forms';
import { LAUNCH_GRID_FORMS } from './components/LaunchGrid/LaunchGrid.forms';
import { ORBIT_CLOCK_FORMS } from './components/OrbitClock/OrbitClock.forms';
import { PROGRESSION_STRIP_FORMS } from './components/ProgressionStrip/ProgressionStrip.forms';
import { PUSH_TWIN_FORMS } from './components/PushTwin/PushTwin.forms';
import { RIG_HEALTH_FORMS } from './components/RigHealth/RigHealth.forms';
import { SECTION_BAR_FORMS } from './components/SectionBar/SectionBar.forms';
import { SETLIST_RIVER_FORMS } from './components/SetlistRiver/SetlistRiver.forms';
import { SIGNAL_SPINE_FORMS } from './components/SignalSpine/SignalSpine.forms';
import { SONG_CARD_FORMS } from './components/SongCard/SongCard.forms';
import { STEM_DECK_FORMS } from './components/StemDeck/StemDeck.forms';
import { THROW_PADS_FORMS } from './components/ThrowPads/ThrowPads.forms';
import { TRACK_STRIPS_FORMS } from './components/TrackStrips/TrackStrips.forms';

/** Which of the app's tracks a pane shows: targets of kind `track`, all by default. */
const TRACKS: SettingSpec = { key: 'tracks', label: 'Tracks', type: 'targets', of: 'track', default: 'all' };

/** Every live pane by its kind: the component it is, its palette words, its forms, what it can follow. */
export const LIVE_PANES = {
  river: { kind: 'river', label: 'Setlist river', description: 'The night as a timeline under its tempo contour', forms: SETLIST_RIVER_FORMS, priority: 'context' },
  song: { kind: 'song', label: 'Song card', description: 'The song now and the song next, JAM from here', forms: SONG_CARD_FORMS, priority: 'now' },
  loop: { kind: 'loop', label: 'Launch grid', description: 'Songs folded above, tracks as columns, stops under', forms: LAUNCH_GRID_FORMS, priority: 'now', settings: [TRACKS] },
  sections: { kind: 'sections', label: 'Sections', description: 'The song’s sections, each as wide as its bars', forms: SECTION_BAR_FORMS, priority: 'now' },
  mix: { kind: 'mix', label: 'Track strips', description: 'Sends, fader and meter per track; FX returns', forms: TRACK_STRIPS_FORMS, priority: 'controls', settings: [TRACKS] },
  stems: { kind: 'stems', label: 'Stem deck', description: 'A song’s separated stems over their waveforms', forms: STEM_DECK_FORMS, priority: 'controls' },
  compass: { kind: 'compass', label: 'Chord compass', description: 'The circle of fifths with the progression round it', forms: CHORD_COMPASS_FORMS, priority: 'now' },
  follow: { kind: 'follow', label: 'Progression', description: 'The chords the band follows, now and next', forms: PROGRESSION_STRIP_FORMS, priority: 'now' },
  dice: {
    kind: 'dice',
    label: 'Dice pad',
    description: 'Mutate, shake, rotate, keep, revert, aimed at a track',
    forms: DICE_PAD_FORMS,
    priority: 'controls',
    targets: 'track',
    settings: [{ key: 'moves', label: 'Moves', type: 'choices', options: DICE_MOVES.map((m) => ({ value: m, label: m.toUpperCase() })), default: [...DICE_MOVES] }],
  },
  orbits: { kind: 'orbits', label: 'Orbits', description: 'One ring per generator: the polyrhythm visible', forms: ORBIT_CLOCK_FORMS, priority: 'now', targets: 'track' },
  spine: { kind: 'spine', label: 'Signal spine', description: 'A track as cartridges on one cable', forms: SIGNAL_SPINE_FORMS, priority: 'now', targets: 'track' },
  push: { kind: 'push', label: 'Push twin', description: 'The controller on screen', forms: PUSH_TWIN_FORMS, priority: 'now' },
  landing: { kind: 'landing', label: 'Landing', description: 'A transition’s countdown: when it lands, and on what', forms: LANDING_DIAL_FORMS, priority: 'next' },
  cuts: { kind: 'cuts', label: 'Cut pads', description: 'The transitions as the biggest targets', forms: CUT_PADS_FORMS, priority: 'controls', settings: [{ key: 'pads', label: 'Cuts', type: 'targets', of: 'cut', default: 'all' }] },
  throws: { kind: 'throws', label: 'Throws', description: 'Named XY throws, the finger’s trail behind', forms: THROW_PADS_FORMS, priority: 'controls' },
  controls: {
    kind: 'controls',
    label: 'Controls',
    description: 'Your own faders, knobs, pads and XYs on the app’s parameters',
    forms: CONTROL_PANEL_FORMS,
    priority: 'controls',
    settings: [
      { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 16, step: 1, default: 8 },
      { key: 'rows', label: 'Rows', type: 'number', min: 1, max: 8, step: 1, default: 4 },
      { key: 'cells', label: 'Controls', type: 'data', default: [] },
    ],
  },
  rig: { kind: 'rig', label: 'Rig health', description: 'Quantize, inputs, controllers, DSP load', forms: RIG_HEALTH_FORMS, priority: 'chrome' },
} as const satisfies Record<string, PaneDefinition>;

/** A live pane's kind. */
export type LivePaneKind = keyof typeof LIVE_PANES;

/** Whether a document's kind is one of the live panes. */
export const isLivePaneKind = (kind: string): kind is LivePaneKind => Object.hasOwn(LIVE_PANES, kind);

/** The set, in palette order: hand it to the Workspace's `panes`, or spread it beside the app's own. */
export const livePanes: readonly PaneDefinition[] = Object.values(LIVE_PANES);
