// PushTwin's forms (docs/assembly.md): the controller's display strip, the 8×8 grid with its row
// bands and the scene column, or the bare grid. The pads stay square either way.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type PushTwinForm = 'full' | 'grid';

const BAND_W = { chars: { caption: 11 } } as const;
const SCENE_W = { control: 2 } as const;
const DISPLAY_H = lengthSum({ lines: { caption: 2 } }, { control: 1 }, { space: [2, 2] });

export const PUSH_TWIN_FORMS: Forms<PushTwinForm> = [
  {
    id: 'full',
    min: { w: lengthSum(BAND_W, { target: 8 }, SCENE_W, { space: [2, 2] }), h: lengthSum(DISPLAY_H, { target: 8 }, { space: [2] }) },
    ideal: { w: lengthSum(BAND_W, { control: 14 }, SCENE_W, { space: [3, 3] }), h: lengthSum(DISPLAY_H, { control: 14 }, { space: [3] }) },
    grow: { w: true, h: true },
    ratio: { w: 8, h: 8, fixed: { w: lengthSum(BAND_W, SCENE_W, { space: [3, 3] }), h: lengthSum(DISPLAY_H, { space: [3] }) } },
  },
  {
    id: 'grid',
    min: { w: { target: 8 }, h: { target: 8 } },
    ideal: { w: { control: 12 }, h: { control: 12 } },
    grow: { w: true, h: true },
    ratio: { w: 8, h: 8 },
  },
];
