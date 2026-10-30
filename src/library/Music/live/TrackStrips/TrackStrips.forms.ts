// TrackStrips' forms (docs/assembly.md): what the looper's mixer needs, in scale units, never
// measured. `tall` has every part of a strip; `short` drops the send knobs and keeps the fader,
// its meter, the dB reading and M / S / ●.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

export type TrackStripsForm = 'tall' | 'short';

/** One strip's least width: two send knobs side by side, or three toggles. */
const STRIP_W: Length = lengthMax({ target: 2 }, { control: 4 });
/** A short strip's least width: the three toggles. */
const SHORT_W: Length = lengthMax({ target: 1 }, { control: 3 });

const across = (strip: Length, strips: number): Length => lengthSum(...Array<Length>(strips).fill(strip), { space: Array<Step>(Math.max(0, strips - 1)).fill(1) });

export const TRACK_STRIPS_FORMS: Forms<TrackStripsForm> = [
  {
    id: 'tall',
    min: { w: across(STRIP_W, 10), h: { control: 14 } },
    ideal: { w: across(STRIP_W, 10), h: { control: 18 } },
    grow: { w: true, h: true },
  },
  {
    id: 'short',
    min: { w: across(SHORT_W, 10), h: { control: 8 } },
    ideal: { w: across(SHORT_W, 10), h: { control: 11 } },
    grow: { w: true, h: true },
  },
];
