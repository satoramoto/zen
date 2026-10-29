// Workspace's stories as plain data: Workspace.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer). Tabs are screens: each tab's spec is rows of regions using the widgets'
// own forms, so the solver still decides.
import { defineFixtures } from '../../fixtures';
import { LOOP_GRID_FORMS } from '../../components/music/LoopGrid/LoopGrid.forms';
import { MIX_BAND_FORMS } from '../../components/music/MixBand/MixBand.forms';
import { ARP_SEQUENCER_FORMS } from '../../components/music/ArpSequencer/ArpSequencer.forms';
import { TRANSITION_ROW_FORMS } from '../../components/music/TransitionRow/TransitionRow.forms';
import type { ScreenSpec } from '../assembly/types';
import type { WorkspaceModelProps } from './Workspace.model';
import type { WorkspaceRegion } from './Workspace.types';

/** The palette's kinds: the widgets' own forms, so the solver still decides. */
export const workspacePalette: readonly WorkspaceRegion[] = [
  { kind: 'loopGrid', label: 'Loop grid', forms: LOOP_GRID_FORMS },
  { kind: 'mix', label: 'Mix', forms: MIX_BAND_FORMS },
  { kind: 'arp', label: 'Arp', forms: ARP_SEQUENCER_FORMS },
  { kind: 'cuts', label: 'Transitions', forms: TRANSITION_ROW_FORMS },
];

/** The bindable tracks: the set's eight columns. */
export const workspaceTracks = [
  { id: 'drums', label: 'Drums' },
  { id: 'bass', label: 'Bass' },
  { id: 'keys', label: 'Keys' },
] as const;

/** My stage: the loop grid over the mix beside the arp. */
export const stageSpec: ScreenSpec = {
  rows: [
    [{ id: 'loop', forms: LOOP_GRID_FORMS, priority: 'now' }],
    [
      { id: 'mix', forms: MIX_BAND_FORMS, priority: 'controls', head: true },
      { id: 'arp', forms: ARP_SEQUENCER_FORMS, priority: 'controls', head: true },
    ],
  ],
};

/** Session grid: the loop grid with the transitions under it. */
export const gridSpec: ScreenSpec = {
  rows: [
    [{ id: 'loop', forms: LOOP_GRID_FORMS, priority: 'now' }],
    [{ id: 'cuts', forms: TRANSITION_ROW_FORMS, priority: 'controls' }],
  ],
};

/** Mix & sends: the band alone. */
export const mixSpec: ScreenSpec = {
  rows: [[{ id: 'mix', forms: MIX_BAND_FORMS, priority: 'controls', head: true }]],
};

/** The controls, the same in both Storybooks. */
export const workspaceArgTypes = {
  name: { control: 'text' },
  workspace: { control: 'object' },
  active: { control: 'text' },
  palette: { control: 'object' },
  bindings: { control: 'object' },
  tracks: { control: 'object' },
  editing: { control: 'boolean' },
  onTab: { control: false },
  onSpec: { control: false },
  onBinding: { control: false },
  disabled: { control: 'boolean' },
} as const;

/** Every story's args by export name (region contents join in the stories file). */
export const workspaceStories = defineFixtures<WorkspaceModelProps>()({
  Perform: {
    args: {
      name: 'Live',
      workspace: {
        tabs: [
          { id: 'stage', title: 'My stage', spec: stageSpec },
          { id: 'grid', title: 'Session grid', spec: gridSpec },
          { id: 'mix', title: 'Mix & sends', spec: mixSpec },
        ],
        start: 'stage',
      },
      active: 'stage',
      bindings: { loop: { track: 'drums' }, mix: { track: 'keys' } },
      tracks: [...workspaceTracks],
    },
  },
  Edit: {
    args: {
      name: 'Live',
      workspace: {
        tabs: [
          { id: 'stage', title: 'My stage', spec: stageSpec },
          { id: 'grid', title: 'Session grid', spec: gridSpec },
        ],
        start: 'stage',
      },
      active: 'stage',
      palette: workspacePalette,
      bindings: { loop: { track: 'drums' } },
      tracks: [...workspaceTracks],
      editing: true,
    },
  },
  Narrow: {
    args: {
      name: 'Live',
      workspace: { tabs: [{ id: 'stage', title: 'My stage', spec: stageSpec }], start: 'stage' },
      active: 'stage',
    },
  },
  Empty: { args: { name: 'Live', workspace: { tabs: [] }, active: 'stage' } },
  Disabled: {
    args: {
      name: 'Live',
      workspace: { tabs: [{ id: 'stage', title: 'My stage', spec: stageSpec }], start: 'stage' },
      active: 'stage',
      editing: true,
      palette: workspacePalette,
      disabled: true,
    },
  },
});
