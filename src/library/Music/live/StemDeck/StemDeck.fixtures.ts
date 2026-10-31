// StemDeck's stories as plain props: StemDeck.stories.tsx draws them with React's or Svelte's
// `Tree`. Hidden Signals separated into four stems, routed as the stems wireframe has them. The
// envelopes are deterministic contract samples standing in for a host's measured peaks (not
// audio, not a separation), and which stems are muted is the host's.
import { defineFixtures } from '../../../fixtures';
import type { Peak } from '../../music/levels';
import type { DeckMarker, DeckStem, StemDeckProps } from './StemDeck.model';

/** A deterministic envelope: `pulse` beats in the song, `body` its sustained level, a quiet bridge. */
function envelope(columns: number, seed: number, pulse: number, body: number): Peak[] {
  let n = seed;
  const random = () => (n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: columns }, (_, i) => {
    const at = i / columns;
    const quiet = at > 0.62 && at < 0.74 ? 0.15 : 1;
    const beat = pulse ? ((i * pulse) / columns) % 1 : 0.5;
    const max = Math.min(1, (body + (1 - beat) ** 4 * (1 - body)) * quiet * (0.8 + random() * 0.2));
    return { min: -max, max };
  });
}

export const deckStems: readonly DeckStem[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', to: 'DRUMS track', muted: true, gain: 0.8, peaks: envelope(480, 3, 96, 0.1) },
  { id: 'bass', name: 'Bass', ink: 'bass', to: 'BASS track', gain: 0.5, peaks: envelope(480, 5, 48, 0.45) },
  { id: 'vocals', name: 'Vocals', ink: 'vocals', to: 'PLAYBACK (bv)', gain: 0.32, peaks: envelope(480, 7, 0, 0.35) },
  { id: 'other', name: 'Other', ink: 'other', to: 'PLAYBACK (bed)', gain: 0.4, peaks: envelope(480, 11, 24, 0.5) },
];

/** Section marks from the host's beat map, as the setlist shows them. */
export const deckMarkers: readonly DeckMarker[] = [
  { at: 0, name: 'INTRO' },
  { at: 0.1, name: 'VERSE' },
  { at: 0.42, name: 'CHORUS' },
  { at: 0.62, name: 'BRIDGE' },
  { at: 0.74, name: 'OUT' },
];

export const stemDeckBoard: StemDeckProps = { title: 'Hidden Signals', sub: '120 · Am · warped', stems: deckStems, markers: deckMarkers, position: 0.3 };

/** The controls, the same in both Storybooks. */
export const stemDeckArgTypes = {
  title: { control: 'text' },
  sub: { control: 'text' },
  stems: { control: 'object' },
  markers: { control: 'object' },
  position: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  form: { control: 'inline-radio', options: ['lanes', 'toggles'] },
  onMute: { control: false },
} as const;

/** Every story's args by export name. */
export const stemDeckStories = defineFixtures<StemDeckProps>()({
  Default: { args: { ...stemDeckBoard, form: 'lanes' } },
  /**
   * Every state: muted, audible, a stem the host has no envelope for, one not separated yet (with
   * the host's reason), no gain reading, and no playhead.
   */
  EveryState: {
    args: {
      ...stemDeckBoard,
      position: undefined,
      stems: [
        deckStems[0],
        { ...deckStems[1], peaks: undefined },
        { ...deckStems[2], gain: undefined },
        { ...deckStems[3], available: false, reason: 'separating…', peaks: undefined },
      ],
      form: 'lanes',
    },
  },
  /** The `toggles` form: the ONE board's deck strip. */
  Dense: { args: { ...stemDeckBoard, form: 'toggles' } },
  /** Nothing on the deck. */
  Empty: { args: { title: 'Deck', sub: undefined, stems: [], markers: [], position: undefined, form: 'lanes' } },
  Disabled: { args: { ...stemDeckBoard, form: 'lanes' } },
});
