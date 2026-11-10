// Mix[flow]'s rig as plain data, copied (nothing imports across repos) from openflowfm/mix
// `src/rig/runtime/document.ts` (`defaultDocument`) and `definitions.ts` (`REGION_DEFINITIONS`):
// the document in exactly the shape mix stores, its own region kinds, and definitions for them on
// zen's live panes' forms. The Document stories draw it to show mix's rig fits the surface as it is.
import { CHORD_COMPASS_FORMS } from '../../music/live/components/ChordCompass/ChordCompass.forms';
import { LANDING_DIAL_FORMS } from '../../music/live/components/LandingDial/LandingDial.forms';
import { LAUNCH_GRID_FORMS } from '../../music/live/components/LaunchGrid/LaunchGrid.forms';
import { PROGRESSION_STRIP_FORMS } from '../../music/live/components/ProgressionStrip/ProgressionStrip.forms';
import { RIG_HEALTH_FORMS } from '../../music/live/components/RigHealth/RigHealth.forms';
import { SIGNAL_SPINE_FORMS } from '../../music/live/components/SignalSpine/SignalSpine.forms';
import { STEM_DECK_FORMS } from '../../music/live/components/StemDeck/StemDeck.forms';
import { THROW_PADS_FORMS } from '../../music/live/components/ThrowPads/ThrowPads.forms';
import { TRACK_STRIPS_FORMS } from '../../music/live/components/TrackStrips/TrackStrips.forms';
import type { PaneDefinition, SurfaceIntentType } from './Workspace.types';

/** Mix's region kinds (`REGION_KINDS`). */
export const MIX_REGION_KINDS = ['mixer', 'session', 'channels', 'waveforms', 'progression', 'compass', 'signal', 'landing', 'throws', 'health'] as const;
type MixRegionKind = (typeof MIX_REGION_KINDS)[number];

/** Mix's document types, as mix declares them. */
interface MixRegion {
  id: string;
  kind: MixRegionKind;
  title: string;
  binding: { mode: 'selected' } | { mode: 'fixed'; target: string };
}
interface MixTab {
  id: string;
  title: string;
  rows: readonly (readonly string[])[];
  regions: readonly MixRegion[];
}
export interface MixDocument {
  version: 1;
  active: string;
  tabs: readonly MixTab[];
}

/** Mix's palette words (`REGION_DEFINITIONS`), on zen's panes' forms. */
export const mixPanes: readonly PaneDefinition[] = [
  { kind: 'mixer', label: 'Original mix[flow]', description: 'The retained mixflow mixer.', forms: TRACK_STRIPS_FORMS, priority: 'now' },
  { kind: 'session', label: 'Session', description: 'Channel clips, scenes and launch controls.', forms: LAUNCH_GRID_FORMS, priority: 'now' },
  { kind: 'channels', label: 'Channels', description: 'Channel levels, sends and cue controls.', forms: TRACK_STRIPS_FORMS, priority: 'controls', targets: 'channel' },
  { kind: 'waveforms', label: 'Waveforms', description: 'Waveforms from the loaded decks.', forms: STEM_DECK_FORMS, priority: 'controls', targets: 'channel' },
  { kind: 'progression', label: 'Progression (read-only)', description: 'Read-only harmony progression view.', forms: PROGRESSION_STRIP_FORMS, priority: 'now' },
  { kind: 'compass', label: 'Compass (read-only)', description: 'Read-only harmonic relationship view.', forms: CHORD_COMPASS_FORMS, priority: 'now' },
  { kind: 'signal', label: 'Signal', description: 'Signal and output readings.', forms: SIGNAL_SPINE_FORMS, priority: 'now', targets: 'channel' },
  { kind: 'landing', label: 'Landing (read-only)', description: 'Read-only transition landing view.', forms: LANDING_DIAL_FORMS, priority: 'next' },
  { kind: 'throws', label: 'Throws', description: 'Effect throw workspace.', forms: THROW_PADS_FORMS, priority: 'controls' },
  { kind: 'health', label: 'Health', description: 'Engine availability and health readings.', forms: RIG_HEALTH_FORMS, priority: 'chrome' },
];

/** Mix's `defaultDocument()`, built as mix builds it. */
export function mixDefaultDocument(): MixDocument {
  const preset = (tabId: string, title: string, layout: MixRegionKind[][]): MixTab => {
    const regions: MixRegion[] = [];
    const rows = layout.map((row) =>
      row.map((kind) => {
        const regionId = `${tabId}-region-${regions.length + 1}`;
        regions.push({ id: regionId, kind, title: mixPanes.find((d) => d.kind === kind)!.label, binding: { mode: 'selected' } });
        return regionId;
      }),
    );
    return { id: tabId, title, rows, regions };
  };
  return {
    version: 1,
    active: 'original',
    tabs: [
      preset('original', 'Original mix[flow]', [['mixer']]),
      preset('session', 'Session', [['session'], ['channels']]),
      preset('hybrid', 'Hybrid', [['waveforms'], ['session', 'throws'], ['channels', 'signal'], ['health']]),
    ],
  };
}

/** Mix's channels, as targets. */
export const mixTargets = [
  { id: 'a', label: 'Deck A', kind: 'channel' },
  { id: 'b', label: 'Deck B', kind: 'channel' },
];

/** The edits mix's `SurfaceStore` has a method for, by the intent each one takes. */
export const MIX_STORE_INTENTS: readonly SurfaceIntentType[] = [
  'selectTab',
  'setEditing',
  'addTab',
  'renameTab',
  'duplicateTab',
  'removeTab',
  'addRegion',
  'removeRegion',
  'moveRegion',
  'bindRegion',
  'undo',
  'redo',
];
