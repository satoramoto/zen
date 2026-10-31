// SongCard's stories as plain props: SongCard.stories.tsx draws them with React's or Svelte's
// `Tree`. The ONE wireframe's header: Hidden Signals, song 3 of 7, Big Red cued. Which song plays
// and what is cued is controlled contract data: the host's.
import { defineFixtures } from '../../../fixtures';
import type { SongCardProps } from './SongCard.model';

export const songCardBoard: SongCardProps = {
  song: { id: 'hidden', name: 'Hidden Signals', tempo: 120, key: 'Am' },
  index: 3,
  total: 7,
  next: { id: 'big-red', name: 'Big Red', tempo: 128, key: 'E', cued: true, barsToCue: 6 },
  jam: false,
};

/** The controls, the same in both Storybooks. */
export const songCardArgTypes = {
  song: { control: 'object' },
  index: { control: { type: 'number', min: 1 } },
  total: { control: { type: 'number', min: 1 } },
  next: { control: 'object' },
  jam: { control: 'boolean' },
  form: { control: 'inline-radio', options: ['card', 'chip'] },
  onJam: { control: false },
} as const;

/** Every story's args by export name. */
export const songCardStories = defineFixtures<SongCardProps>()({
  Default: { args: { ...songCardBoard, form: 'card' } },
  /** In a jam: no song, the next one only ahead (not cued), JAM lit. */
  EveryState: {
    args: { song: undefined, index: undefined, total: 7, next: { id: 'low-tide', name: 'Low Tide', tempo: 84, key: 'Dm' }, jam: true, form: 'card' },
  },
  /** The `chip` form: one line for a header. */
  Dense: { args: { ...songCardBoard, form: 'chip' } },
  /** Between songs, nothing next: the place alone. */
  Empty: { args: { song: undefined, index: undefined, total: undefined, next: undefined, jam: false, form: 'card' } },
  Disabled: { args: { ...songCardBoard, form: 'card' } },
});
