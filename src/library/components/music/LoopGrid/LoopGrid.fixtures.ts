// LoopGrid's stories as plain props: LoopGrid.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures } from '../../../fixtures';
import type { LiveCell, LiveSong, LiveTrack } from '../live.model';
import type { LoopGridModelProps } from './LoopGrid.model';

const cell = (id: string, state: LiveCell['state'], over: Partial<LiveCell> = {}): LiveCell => ({ id, state, ...over });

/** Eight track columns: drums through vox, the way the mockups lay them out. */
export const loopBoard: readonly LiveTrack[] = [
  { id: 'drums', name: 'Drums', hue: 1, level: 0.8, meter: 0.7, cells: [cell('a', 'playing', { phase: 0.6, name: 'Main' }), cell('b', 'stopped', { name: 'Break' }), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'bass', name: 'Bass', hue: 2, level: 0.75, meter: 0.6, cells: [cell('a', 'playing', { phase: 0.6, name: 'Sub' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'keys', name: 'Keys', hue: 3, level: 0.7, meter: 0.5, cells: [cell('a', 'recording', { phase: 0.3, bars: 3 }), cell('b', 'stopped', { name: 'Pad' }), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'vox', name: 'Vox', hue: 4, level: 0.8, meter: 0.65, cells: [cell('a', 'queued', { phase: 0.1, name: 'Verse' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'gtr', name: 'Gtr', hue: 5, level: 0.6, meter: 0.4, cells: [cell('a', 'stopped', { name: 'Riff' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'perc', name: 'Perc', hue: 1, level: 0.55, meter: 0.45, cells: [cell('a', 'stopped', { name: 'Top' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'syn', name: 'Syn', hue: 2, level: 0.65, meter: 0.5, cells: [cell('a', 'playing', { phase: 0.85, name: 'Arp' }), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
  { id: 'fx', name: 'FX', hue: 3, level: 0.5, meter: 0.3, cells: [cell('a', 'empty'), cell('b', 'empty'), cell('c', 'empty'), cell('d', 'empty')] },
];

/** Seven songs, the third open; the rest fold to their summaries. */
export const loopSongs: readonly LiveSong[] = [
  { id: 'open', index: 1, name: 'Open', open: false, summary: '■■□', tempo: 100, key: 'Am' },
  { id: 'glass', index: 2, name: 'Glass', open: false, summary: '■■■□', tempo: 104, key: 'F' },
  { id: 'hidden', index: 3, name: 'Hidden Signals', open: true, summary: '■■■■', tempo: 112, key: 'C' },
  { id: 'wire', index: 4, name: 'Wire', open: false, summary: '■■□□', tempo: 118, key: 'G' },
];

/** The controls, the same in both Storybooks. */
export const loopGridArgTypes = {
  songs: { control: 'object' },
  tracks: { control: 'object' },
  loop: { control: 'object' },
  selected: { control: 'text' },
  onLaunch: { control: false },
  onStop: { control: false },
  onSelectTrack: { control: false },
  onToggleSong: { control: false },
  disabled: { control: 'boolean' },
} as const;

/** Every story's args by export name. */
export const loopGridStories = defineFixtures<LoopGridModelProps>()({
  Default: { args: { songs: loopSongs, tracks: loopBoard, loop: { phase: 0.5, bars: 8 }, selected: 'keys' } },
  EveryState: {
    args: {
      songs: [
        { id: 'open', index: 1, name: 'Open', open: true, summary: '■■□', tempo: 100, key: 'Am' },
        { id: 'glass', index: 2, name: 'Glass', open: false, summary: '■■■□', tempo: 104, key: 'F' },
      ],
      tracks: loopBoard,
      loop: { phase: 0.75, bars: 12, recording: true },
      selected: 'drums',
    },
  },
  Dense: { args: { songs: [{ id: 'hidden', index: 3, name: 'Hidden Signals', open: true, tempo: 112, key: 'C' }], tracks: loopBoard, loop: { phase: 0.2 }, selected: 'vox' } },
  Empty: { args: { songs: [], tracks: [], loop: { phase: 0 } } },
  Disabled: { args: { songs: loopSongs, tracks: loopBoard, loop: { phase: 0.5 }, disabled: true } },
});
