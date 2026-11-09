// Workspace's stories as plain data: Workspace.stories.tsx (and the Document and Panes stories) draw
// them, React or Svelte by the toolbar's Renderer. The document is the app's (rows of region
// instances, each naming its kind); the panes are the app's definitions, here the Workspace's own
// five Lemur tabs over the zen-styled `components/music` parts, so the solver still decides sizes.
import { defineFixtures } from '../../fixtures';
import { ARP_SEQUENCER_FORMS } from '../../components/music/ArpSequencer/ArpSequencer.forms';
import { CHORD_STRIP_FORMS } from '../../components/music/ChordStrip/ChordStrip.forms';
import { LOOP_GRID_FORMS } from '../../components/music/LoopGrid/LoopGrid.forms';
import { MACRO_PADS_FORMS } from '../../components/music/MacroPads/MacroPads.forms';
import { MIX_BAND_FORMS } from '../../components/music/MixBand/MixBand.forms';
import { STEM_LANES_FORMS } from '../../components/music/StemLanes/StemLanes.forms';
import { TRANSITION_ROW_FORMS } from '../../components/music/TransitionRow/TransitionRow.forms';
import type { WorkspaceModelProps } from './Workspace.model';
import type { PaneDefinition, SurfaceDocument, SurfaceRegion, SurfaceTab, SurfaceTarget } from './Workspace.types';

/** The app's pane kinds, in palette order: the widgets' own forms. */
export const workspacePanes: readonly PaneDefinition[] = [
  { kind: 'loopGrid', label: 'Loop grid', description: 'Songs and tracks, stops under', forms: LOOP_GRID_FORMS, priority: 'now', targets: 'track' },
  { kind: 'mix', label: 'Mix', description: 'Levels, sends and lamps per track', forms: MIX_BAND_FORMS, priority: 'controls', head: true, targets: 'track' },
  { kind: 'follow', label: 'Follow', description: 'The progression, now and next', forms: CHORD_STRIP_FORMS, priority: 'now' },
  { kind: 'arp', label: 'Arp', description: 'Sixteen steps of chord degrees', forms: ARP_SEQUENCER_FORMS, priority: 'controls', head: true, targets: 'track' },
  { kind: 'throws', label: 'Throws', description: 'Two XY macro pads', forms: MACRO_PADS_FORMS, priority: 'controls', head: true },
  { kind: 'cuts', label: 'Transitions', description: 'Riser, drop, crash, holds, cut', forms: TRANSITION_ROW_FORMS, priority: 'controls' },
  { kind: 'stems', label: 'Stems', description: 'Four lanes, cues and the loop window', forms: STEM_LANES_FORMS, priority: 'now' },
];

/** What a region can be bound to: the set's tracks. */
export const workspaceTargets: readonly SurfaceTarget[] = [
  { id: 'drums', label: 'Drums', kind: 'track' },
  { id: 'bass', label: 'Bass', kind: 'track' },
  { id: 'keys', label: 'Keys', kind: 'track' },
];

const label = (kind: string): string => workspacePanes.find((p) => p.kind === kind)?.label ?? kind;

/** A tab from rows of kinds: instance ids `<tab>-<n>`, each following the selection. */
export function tabOf(id: string, title: string, layout: readonly (readonly string[])[]): SurfaceTab {
  const regions: SurfaceRegion[] = [];
  const rows = layout.map((row) =>
    row.map((kind) => {
      const region: SurfaceRegion = { id: `${id}-${regions.length + 1}`, kind, title: label(kind), binding: { mode: 'selected' } };
      regions.push(region);
      return region.id;
    }),
  );
  return { id, title, rows, regions };
}

/** The Workspace's own five tabs: stage, grid, arp, mix, stems. */
export const workspaceDocument: SurfaceDocument = {
  version: 1,
  active: 'stage',
  tabs: [
    tabOf('stage', 'My stage', [['loopGrid'], ['mix']]),
    tabOf('grid', 'Session grid', [['loopGrid'], ['cuts']]),
    tabOf('arp', 'Arp & follow', [['follow'], ['arp', 'throws']]),
    tabOf('mix', 'Mix & sends', [['mix']]),
    tabOf('stems', 'Stem deck', [['stems'], ['cuts']]),
  ],
};

/** The document opened on another tab. */
export const opened = (doc: SurfaceDocument, active: string): SurfaceDocument => ({ ...doc, active });

/** The controls, the same in both Storybooks. */
export const workspaceArgTypes = {
  name: { control: 'text' },
  document: { control: 'object' },
  panes: { control: 'object' },
  targets: { control: 'object' },
  selected: { control: 'text' },
  canUndo: { control: 'boolean' },
  canRedo: { control: 'boolean' },
  editing: { control: 'boolean' },
  editingRegion: { control: 'text' },
  paletteOpen: { control: 'boolean' },
  onIntent: { control: false },
  onUi: { control: false },
  disabled: { control: 'boolean' },
} as const;

/** Every story's args by export name (region contents join in the stories files). */
export const workspaceStories = defineFixtures<WorkspaceModelProps>()({
  Perform: { args: { name: 'Live', document: opened(workspaceDocument, 'grid'), panes: workspacePanes, targets: workspaceTargets, selected: 'keys' } },
  Edit: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, targets: workspaceTargets, selected: 'keys', editing: true } },
  EditOwn: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, targets: workspaceTargets, selected: 'keys' } },
  Picked: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, targets: workspaceTargets, editing: true, editingRegion: 'stage-1' } },
  Palette: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, editing: true, paletteOpen: true } },
  History: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, canUndo: true, canRedo: false } },
  NoHistory: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, canUndo: false, canRedo: false } },
  Bare: { args: { name: 'Live', document: workspaceDocument, editing: true } },
  Narrow: { args: { name: 'Live', document: { version: 1, active: 'stage', tabs: [workspaceDocument.tabs[0]] }, panes: workspacePanes } },
  Empty: { args: { name: 'Live', document: { version: 1, active: 'new', tabs: [{ id: 'new', title: 'New view', rows: [], regions: [] }] }, panes: workspacePanes } },
  Disabled: { args: { name: 'Live', document: workspaceDocument, panes: workspacePanes, editing: true, editingRegion: 'stage-1', disabled: true } },
});
