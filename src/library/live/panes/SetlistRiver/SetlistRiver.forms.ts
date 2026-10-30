// SetlistRiver's forms (docs/assembly.md): the night with its tempo contour, the scenes of the
// song now and a minute ruler, or one strip of songs.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SetlistRiverForm = 'river' | 'strip';

/** One song's least segment: its number and a few letters of its name. */
const SONGS = 8;
const SEGMENT_W = lengthSum({ chars: { label: 5 } }, { space: [2, 2] });
const STRIP_H = lengthSum({ lines: { label: 1, caption: 1 } }, { space: [2, 2] });

export const SETLIST_RIVER_FORMS: Forms<SetlistRiverForm> = [
  {
    id: 'river',
    min: { w: lengthSum(...Array.from({ length: SONGS }, () => SEGMENT_W), { control: 4 }), h: lengthSum({ control: 2 }, STRIP_H, { control: 1 }, { lines: { caption: 1 } }) },
    ideal: { w: lengthSum(...Array.from({ length: SONGS }, () => SEGMENT_W), { control: 12 }), h: lengthSum({ control: 3 }, STRIP_H, { control: 1.5 }, { lines: { caption: 1 } }) },
    grow: { w: true, h: true },
    max: { h: { control: 8 } },
  },
  {
    id: 'strip',
    min: { w: lengthSum(...Array.from({ length: SONGS }, () => SEGMENT_W)), h: STRIP_H },
    ideal: { w: lengthSum(...Array.from({ length: SONGS }, () => SEGMENT_W), { control: 8 }), h: STRIP_H },
    grow: { w: true },
  },
];
