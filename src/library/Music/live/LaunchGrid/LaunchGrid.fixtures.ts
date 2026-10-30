// LaunchGrid's stories as plain props: LaunchGrid.stories.tsx draws them with React's or Svelte's
// `Tree`. A four-song set, Hidden Signals open: drums, bass and the arp playing, keys recording its
// third bar, the vox verse waiting for the next launch.
import { defineFixtures } from '../../../fixtures';
import type { LaunchCell, LaunchGridProps, LaunchSong, LaunchTrack } from './LaunchGrid.model';

const cell = (id: string, state: LaunchCell['state'], over: Partial<LaunchCell> = {}): LaunchCell => ({ id, state, ...over });
const empties = (...ids: string[]): LaunchCell[] => ids.map((id) => cell(id, 'empty'));

/** Eight track columns of four slots, drums through FX. */
export const launchTracks: readonly LaunchTrack[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', cells: [cell('a', 'playing', { phase: 0.6, name: 'Main' }), cell('b', 'stopped', { name: 'Break' }), ...empties('c', 'd')] },
  { id: 'bass', name: 'Bass', ink: 'bass', cells: [cell('a', 'playing', { phase: 0.6, name: 'Sub' }), ...empties('b', 'c', 'd')] },
  { id: 'keys', name: 'Keys', ink: 'piano', cells: [cell('a', 'recording', { phase: 0.3, bars: 3 }), cell('b', 'stopped', { name: 'Pad' }), ...empties('c', 'd')] },
  { id: 'vox', name: 'Vox', ink: 'vocals', cells: [cell('a', 'queued', { phase: 0.1, name: 'Verse' }), ...empties('b', 'c', 'd')] },
  { id: 'gtr', name: 'Gtr', ink: 'guitar', cells: [cell('a', 'stopped', { name: 'Riff' }), ...empties('b', 'c', 'd')] },
  { id: 'perc', name: 'Perc', ink: 'drums', cells: [cell('a', 'stopped', { name: 'Top' }), ...empties('b', 'c', 'd')] },
  { id: 'syn', name: 'Syn', ink: 'other', cells: [cell('a', 'playing', { phase: 0.85, name: 'Arp' }), ...empties('b', 'c', 'd')] },
  { id: 'fx', name: 'FX', ink: 'other', cells: empties('a', 'b', 'c', 'd') },
];

/** Four songs, the third open; the rest fold to their summaries. */
export const launchSongs: readonly LaunchSong[] = [
  { id: 'open', index: 1, name: 'Open', open: false, summary: '■■□', tempo: 100, key: 'Am' },
  { id: 'glass', index: 2, name: 'Glass', open: false, summary: '■■■□', tempo: 104, key: 'F' },
  { id: 'hidden', index: 3, name: 'Hidden Signals', open: true, summary: '■■■■', tempo: 112, key: 'C' },
  { id: 'wire', index: 4, name: 'Wire', open: false, summary: '■■□□', tempo: 118, key: 'G' },
];

/** The set as the views use it. */
export const launchGridBoard: LaunchGridProps = { songs: launchSongs, tracks: launchTracks, loop: { phase: 0.5, bars: 8 }, selected: 'keys' };

/** Every state in one column each: drums playing, queued, recording, stopped, empty, and a short column's holes. */
const everyState: readonly LaunchTrack[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', cells: [cell('a', 'playing', { phase: 0.25, name: 'Main' }), cell('b', 'queued', { name: 'Fill' }), cell('c', 'stopped', { name: 'Break' }), cell('d', 'empty'), cell('e', 'stopped', { name: 'Outro' })] },
  { id: 'bass', name: 'Bass', ink: 'bass', cells: [cell('a', 'stopped', { name: 'Sub' }), cell('b', 'playing', { phase: 0.9, name: 'Walk' })] },
  { id: 'keys', name: 'Keys', ink: 'piano', cells: [cell('a', 'recording', { phase: 0.7, bars: 1 }), cell('b', 'empty'), cell('c', 'empty')] },
  { id: 'vox', name: 'Vox', ink: 'vocals', cells: [cell('a', 'queued', { name: 'Verse' }), cell('b', 'stopped', { name: 'Hook' }), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'gtr', name: 'Gtr', ink: 'guitar', cells: [cell('a', 'playing', { phase: 0.5, name: 'Riff' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
];

/** The controls, the same in both Storybooks. */
export const launchGridArgTypes = {
  songs: { control: 'object' },
  tracks: { control: 'object' },
  loop: { control: 'object' },
  selected: { control: 'text' },
  form: { control: 'inline-radio', options: ['full', 'rows'] },
  onLaunch: { control: false },
  onStop: { control: false },
  onStopTrack: { control: false },
  onSelectTrack: { control: false },
  onToggleSong: { control: false },
} as const;

/** Every story's args by export name. */
export const launchGridStories = defineFixtures<LaunchGridProps>()({
  Default: { args: launchGridBoard },
  EveryState: {
    args: {
      songs: [
        { id: 'open', index: 1, name: 'Open', open: true, summary: '■■□', tempo: 100, key: 'Am' },
        { id: 'glass', index: 2, name: 'Glass', open: false, summary: '■■■□', tempo: 104, key: 'F' },
      ],
      tracks: everyState,
      loop: { phase: 0.75, bars: 12 },
      selected: 'drums',
    },
  },
  Dense: { args: { ...launchGridBoard, form: 'rows', loop: { phase: 0.2 }, selected: 'vox' } },
  Empty: { args: { songs: [], tracks: [] } },
  Disabled: { args: launchGridBoard },
});
