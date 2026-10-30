// SignalSpine's forms (docs/assembly.md): the chain left to right on its cable, or stacked top to
// bottom for a narrow column.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SignalSpineForm = 'chain' | 'column';

/** One cartridge: its title, its chosen option and up to three small knobs or readings. */
const CART_W = lengthSum({ chars: { caption: 18 } }, { space: [2, 2] });
/** The looper: the rings beside the layer list. */
const LOOPER_W = lengthSum({ control: 6 }, { chars: { caption: 14 } });
const CART_H = lengthSum({ lines: { caption: 2 } }, { control: 3 }, { space: [2, 2] });
const OUT_W = lengthSum({ control: 3 });

export const SIGNAL_SPINE_FORMS: Forms<SignalSpineForm> = [
  {
    id: 'chain',
    min: { w: lengthSum(CART_W, CART_W, CART_W, LOOPER_W, CART_W, OUT_W, { space: [3, 3, 3, 3, 3] }), h: lengthSum({ control: 1 }, CART_H, { control: 2 }) },
    ideal: { w: lengthSum(CART_W, CART_W, CART_W, LOOPER_W, CART_W, OUT_W, { control: 4 }, { space: [4, 4, 4, 4, 4] }), h: lengthSum({ control: 1 }, CART_H, { control: 4 }) },
    grow: { w: true, h: true },
    max: { h: { control: 12 } },
  },
  {
    id: 'column',
    min: { w: LOOPER_W, h: lengthSum({ control: 1 }, CART_H, CART_H, CART_H, CART_H) },
    ideal: { w: lengthSum(LOOPER_W, { control: 2 }), h: lengthSum({ control: 1 }, CART_H, CART_H, CART_H, CART_H, CART_H, { control: 6 }) },
    grow: { w: true, h: true },
  },
];
