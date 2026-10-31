// SongCard's forms (docs/assembly.md), in scale units, never measured. `card` is the ONE header's
// card (place and reading, name, next, JAM); `chip` is one line for a header or a footer.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SongCardForm = 'card' | 'chip';

export const SONG_CARD_FORMS: Forms<SongCardForm> = [
  {
    id: 'card',
    min: { w: lengthSum({ chars: { label: 24 } }, { control: 2 }, { space: [2, 2, 2] }), h: lengthSum({ lines: { caption: 2 } }, { lines: { label: 1 } }, { space: [1, 1, 2] }) },
    ideal: { w: lengthSum({ chars: { label: 32 } }, { control: 2 }, { space: [3, 3, 3] }), h: lengthSum({ lines: { caption: 2 } }, { lines: { label: 2 } }, { space: [2, 2, 3] }) },
    grow: { w: true },
  },
  {
    id: 'chip',
    min: { w: lengthSum({ chars: { label: 20 } }, { space: [2, 2] }), h: { control: 1 } },
    ideal: { w: lengthSum({ chars: { label: 36 } }, { space: [2, 2] }), h: { control: 1 } },
    grow: { w: true },
  },
];
