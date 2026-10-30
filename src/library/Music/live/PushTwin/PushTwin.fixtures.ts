// PushTwin's stories as plain props: PushTwin.stories.tsx draws them with React's or Svelte's
// `Tree`. The set's eight columns with LoopGrid's cells and MixBand's levels: Drums, Bass and Syn
// playing, Keys recording, Vox queued; Hidden Signals in its verse, on its +bass scene.
import { defineFixtures } from '../../../fixtures';
import type { PushCell, PushTrack, PushTwinProps } from './PushTwin.model';

const cell = (id: string, state: PushCell['state'], name?: string): PushCell => (name === undefined ? { id, state } : { id, state, name });
const rest = (from: string): PushCell[] => ['b', 'c', 'd', 'e'].filter((id) => id >= from).map((id) => cell(id, 'empty'));

/** Eight columns: the set's tracks in LoopGrid's order, each in its stem ink. */
export const pushTracks: readonly PushTrack[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', level: 0.8, cells: [cell('a', 'playing', 'Main'), cell('b', 'stopped', 'Break'), ...rest('c')] },
  { id: 'bass', name: 'Bass', ink: 'bass', level: 0.75, cells: [cell('a', 'playing', 'Sub'), ...rest('b')] },
  { id: 'keys', name: 'Keys', ink: 'piano', level: 0.7, cells: [cell('a', 'recording'), cell('b', 'stopped', 'Pad'), ...rest('c')] },
  { id: 'vox', name: 'Vox', ink: 'vocals', level: 0.8, cells: [cell('a', 'queued', 'Verse'), ...rest('b')] },
  { id: 'gtr', name: 'Gtr', ink: 'guitar', level: 0.6, cells: [cell('a', 'stopped', 'Riff'), ...rest('b')] },
  { id: 'perc', name: 'Perc', ink: 'drums', level: 0.55, cells: [cell('a', 'stopped', 'Top'), ...rest('b')] },
  { id: 'syn', name: 'Syn', ink: 'other', level: 0.65, cells: [cell('a', 'playing', 'Arp'), ...rest('b')] },
  { id: 'fx', name: 'FX', ink: 'other', level: 0.5, cells: [cell('a', 'empty'), ...rest('b')] },
];

export const pushSections: readonly string[] = ['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUT', 'FILL', 'VAR', 'FREE'];
export const pushTransitions: readonly string[] = ['RISER', 'DROP', 'CRASH', 'NOISE', 'STAB', 'HOLD A', 'HOLD B', 'CUT'];
/** Hidden Signals' scenes. */
export const pushScenes: readonly string[] = ['bed', '+bass', 'full', 'break', 'kept'];

/** The Push as the views use it. */
export const pushTwinBoard: PushTwinProps = {
  tracks: pushTracks,
  sections: pushSections,
  section: 1,
  transitions: pushTransitions,
  scenes: pushScenes,
  scene: 1,
  selected: 'keys',
};

/** The controls, the same in both Storybooks. */
export const pushTwinArgTypes = {
  tracks: { control: 'object' },
  sections: { control: 'object' },
  section: { control: { type: 'number', min: 0, max: 7 } },
  queuedSection: { control: { type: 'number', min: 0, max: 7 } },
  transitions: { control: 'object' },
  held: { control: 'text' },
  scenes: { control: 'object' },
  scene: { control: { type: 'number', min: 0, max: 7 } },
  selected: { control: 'text' },
  form: { control: 'inline-radio', options: ['full', 'grid'] },
  onPad: { control: false },
  onScene: { control: false },
} as const;

/** Every story's args by export name. */
export const pushTwinStories = defineFixtures<PushTwinProps>()({
  Default: { args: pushTwinBoard },
  EveryState: { args: { ...pushTwinBoard, queuedSection: 2, held: 'RISER', selected: 'drums' } },
  Dense: { args: { ...pushTwinBoard, queuedSection: 2, form: 'grid' } },
  FewTracks: { args: { ...pushTwinBoard, tracks: pushTracks.slice(0, 4), scenes: pushScenes.slice(0, 2), scene: 0, selected: 'bass' } },
  Empty: { args: { tracks: [], sections: [], section: 0, transitions: [], scenes: [] } },
  Disabled: { args: pushTwinBoard },
});
