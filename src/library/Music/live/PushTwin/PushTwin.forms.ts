// PushTwin's forms (docs/assembly.md): what the twin needs, in scale units, never measured. `full`
// the display strip, the 8×8 pads with their row bands and the scene column; `grid` the bare pads.
// The pads stay square either way, so both forms keep a ratio past their fixed parts.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type PushTwinForm = 'full' | 'grid';

const BAND_W = { chars: { caption: 8 } } as const;
const SCENE_W = { chars: { caption: 8 } } as const;
const DISPLAY_H = lengthSum({ lines: { caption: 2 } }, { control: 1 }, { space: [1, 1] });

export const PUSH_TWIN_FORMS: Forms<PushTwinForm> = [
  {
    id: 'full',
    min: { w: lengthSum(BAND_W, { target: 8 }, SCENE_W, { space: [1, 1] }), h: lengthSum(DISPLAY_H, { target: 8 }, { space: [1] }) },
    ideal: { w: lengthSum(BAND_W, { control: 16 }, SCENE_W, { space: [2, 2] }), h: lengthSum(DISPLAY_H, { control: 16 }, { space: [2] }) },
    grow: { w: true, h: true },
    ratio: { w: 8, h: 8, fixed: { w: lengthSum(BAND_W, SCENE_W, { space: [2, 2] }), h: lengthSum(DISPLAY_H, { space: [2] }) } },
  },
  {
    id: 'grid',
    min: { w: { target: 8 }, h: { target: 8 } },
    ideal: { w: { control: 12 }, h: { control: 12 } },
    grow: { w: true, h: true },
    ratio: { w: 8, h: 8 },
  },
];
