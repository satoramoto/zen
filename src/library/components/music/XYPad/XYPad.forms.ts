// XYPad's forms (docs/assembly.md): a square field or a wide one, in scale units. `square` keeps
// the field's own 1:1 shape and `wide` a 2:1 one, so an assembled screen never stretches the pad
// into a shape its trails and crosshair were not drawn for. The needs are the pad's own box; the
// region's plate is the solver's.
import type { Forms } from '../../../layout/assembly/types';

/** A square-ish field, or a wide one for a strip beside other controls. */
export type XYPadForm = 'square' | 'wide';

/**
 * The forms, most room first. `square` wants a field nine control heights on a side (six at its
 * least); `wide` is 12 × 6 control heights (eight × four at its least). Both grow across, and the
 * height follows the width, so the field keeps its shape when a region gives it spare room.
 */
export const XY_PAD_FORMS: Forms<XYPadForm> = [
  {
    id: 'square',
    min: { w: { control: 6 }, h: { control: 6 } },
    ideal: { w: { control: 9 }, h: { control: 9 } },
    grow: { w: true },
    ratio: { w: 1, h: 1 },
  },
  {
    id: 'wide',
    min: { w: { control: 8 }, h: { control: 4 } },
    ideal: { w: { control: 12 }, h: { control: 6 } },
    grow: { w: true },
    ratio: { w: 2, h: 1 },
  },
];

/** The space between the field and the axis labels' edges, and between macro pads: one step. */
export const XY_PAD_GAP = 2;
