// SignalSpine's forms (docs/assembly.md): the chain left to right with its cable, or stacked top to
// bottom for a narrow column.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SignalSpineForm = 'chain' | 'column';

/** One cartridge: its title, its chosen option and two params, in label characters. */
const CART_W = lengthSum({ chars: { label: 14 } }, { space: [2, 2] });
const LOOPER_W = lengthSum({ control: 5 }, { chars: { label: 12 } });
const CART_H = lengthSum({ lines: { caption: 2, label: 2 } }, { control: 3 }, { space: [2, 2] });

export const SIGNAL_SPINE_FORMS: Forms<SignalSpineForm> = [
  {
    id: 'chain',
    min: { w: lengthSum(CART_W, CART_W, CART_W, LOOPER_W, CART_W, { control: 2 }, { space: [3, 3, 3, 3, 3] }), h: lengthSum({ control: 1 }, CART_H) },
    ideal: { w: lengthSum(CART_W, CART_W, CART_W, LOOPER_W, CART_W, { control: 6 }, { space: [4, 4, 4, 4, 4] }), h: lengthSum({ control: 1 }, CART_H, { control: 2 }) },
    grow: { w: true, h: true },
    max: { h: { control: 10 } },
  },
  {
    id: 'column',
    min: { w: LOOPER_W, h: lengthSum({ control: 1 }, CART_H, CART_H, CART_H) },
    ideal: { w: lengthSum(LOOPER_W, { control: 2 }), h: lengthSum({ control: 1 }, CART_H, CART_H, CART_H, CART_H) },
    grow: { w: true, h: true },
  },
];
