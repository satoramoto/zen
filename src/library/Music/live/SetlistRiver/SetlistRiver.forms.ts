// SetlistRiver's forms (docs/assembly.md): what the river needs, in scale units, never measured.
// `river` the head, the tempo contour, the songs with the song now's scenes and the minute ruler;
// `strip` the row of songs alone, with the playhead.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SetlistRiverForm = 'river' | 'strip';

/** One song's least cell: its number and a few letters of its name. */
const SONGS = 8;
const CELL_W = lengthSum({ chars: { caption: 6 } }, { space: [1, 1] });
const ROW_W = lengthSum(...Array.from({ length: SONGS }, () => CELL_W));
const CELL_H = lengthSum({ lines: { caption: 2 } }, { space: [1, 1] });

export const SETLIST_RIVER_FORMS: Forms<SetlistRiverForm> = [
  {
    id: 'river',
    min: { w: ROW_W, h: lengthSum({ control: 1 }, { control: 1.5 }, CELL_H, { control: 1 }, { lines: { caption: 1 } }) },
    ideal: { w: lengthSum(ROW_W, { control: 16 }), h: lengthSum({ control: 1 }, { control: 3 }, CELL_H, { control: 1 }, { lines: { caption: 1 } }) },
    grow: { w: true, h: true },
    max: { h: { control: 10 } },
  },
  {
    id: 'strip',
    min: { w: ROW_W, h: CELL_H },
    ideal: { w: lengthSum(ROW_W, { control: 8 }), h: CELL_H },
    grow: { w: true },
  },
];
