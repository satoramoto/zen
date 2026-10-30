// SetlistRiver's stories as plain props: SetlistRiver.stories.tsx draws them with React's or
// Svelte's `Tree`. Friday's set: two songs played, Hidden Signals now (on its +bass scene), Wire
// cued in 6 bars, a jam after it, three songs ahead.
import { defineFixtures } from '../../../fixtures';
import type { RiverSong, SetlistRiverProps } from './SetlistRiver.model';

export const riverSongs: readonly RiverSong[] = [
  { id: 'open', index: 1, name: 'Open', key: 'Am', tempo: 100, minutes: 4.5, state: 'done' },
  { id: 'glass', index: 2, name: 'Glass', key: 'F', tempo: 104, minutes: 5, state: 'done' },
  {
    id: 'hidden',
    index: 3,
    name: 'Hidden Signals',
    key: 'C',
    tempo: 112,
    minutes: 6.5,
    state: 'now',
    scenes: [
      { id: 'bed', name: 'bed', section: 'intro', state: 'played' },
      { id: 'bass', name: '+bass', section: 'verse', state: 'playing' },
      { id: 'full', name: 'full', section: 'chorus', state: 'ahead' },
      { id: 'break', name: 'break', section: 'bridge', state: 'ahead' },
      { id: 'kept', name: 'kept', section: 'from jam', state: 'ahead' },
    ],
  },
  { id: 'wire', index: 4, name: 'Wire', key: 'G', tempo: 118, minutes: 4, state: 'cued' },
  { id: 'jam', index: 0, name: 'Jam', tempo: 118, minutes: 3, state: 'jam' },
  { id: 'tide', index: 5, name: 'Low Tide', key: 'Dm', tempo: 84, minutes: 5.5, state: 'ahead' },
  { id: 'sunset', index: 6, name: 'Sunset Loop', key: 'G', tempo: 104, minutes: 4, state: 'ahead' },
  { id: 'closer', index: 7, name: 'Closer', key: 'B♭', tempo: 132, minutes: 5, state: 'ahead' },
];

/** The night as the views use it. */
export const setlistRiverBoard: SetlistRiverProps = { songs: riverSongs, progress: 0.38, barsToCue: 6 };

/** Late in the night: the closer now, on its last scene, nothing cued. */
const closing: readonly RiverSong[] = riverSongs.map((s) =>
  s.id === 'closer'
    ? {
        ...s,
        state: 'now',
        scenes: [
          { id: 'c-in', name: 'in', section: 'intro', state: 'played' },
          { id: 'c-all', name: 'all', section: 'chorus', state: 'played' },
          { id: 'c-out', name: 'out', section: 'outro', state: 'playing' },
        ],
      }
    : s.state === 'jam'
      ? s
      : { ...s, state: 'done', scenes: undefined },
);

/** The controls, the same in both Storybooks. */
export const setlistRiverArgTypes = {
  songs: { control: 'object' },
  progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  barsToCue: { control: { type: 'number', min: 0 } },
  form: { control: 'inline-radio', options: ['river', 'strip'] },
  onPick: { control: false },
  onScene: { control: false },
} as const;

/** Every story's args by export name. */
export const setlistRiverStories = defineFixtures<SetlistRiverProps>()({
  Default: { args: setlistRiverBoard },
  EveryState: { args: { ...setlistRiverBoard, progress: 0.9, barsToCue: 1 } },
  Closing: { args: { songs: closing, progress: 0.7 } },
  Dense: { args: { ...setlistRiverBoard, form: 'strip' } },
  Empty: { args: { songs: [], progress: 0 } },
  Disabled: { args: setlistRiverBoard },
});
