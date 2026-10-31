// StemDeck's forms (docs/assembly.md): what a song's stems need, in scale units, never measured.
// `lanes` stacks a lane per stem (its head over its waveform) under the pane's head; `toggles` is
// the ONE board's deck strip, a toggle per stem in one row.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type StemDeckForm = 'lanes' | 'toggles';

/** One lane: its head line over a waveform well. */
const LANE = lengthSum({ control: 1 }, { control: 1.5 }, { space: [1] });

export const STEM_DECK_FORMS: Forms<StemDeckForm> = [
  {
    id: 'lanes',
    min: { w: { control: 16 }, h: lengthSum({ control: 1 }, { lines: { caption: 1 } }, LANE, LANE, LANE, LANE, { space: [1, 1, 1, 1, 1] }) },
    ideal: { w: { control: 30 }, h: lengthSum({ control: 1 }, { lines: { caption: 1 } }, LANE, LANE, LANE, LANE, { space: [2, 2, 2, 2, 2] }) },
    grow: { w: true, h: true },
  },
  {
    id: 'toggles',
    min: { w: { target: 4 }, h: { target: 1 } },
    ideal: { w: { control: 6 }, h: { control: 1 } },
    grow: { w: true },
  },
];
