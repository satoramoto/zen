// DeviceFace's forms (docs/assembly.md): one effect's faceplate, in scale units. One form: the
// header plus its params, growing across whatever width the chain gives it.
import type { Forms } from '../../../layout/assembly/types';

export type DeviceFaceForm = 'face';

/** The faceplate's one form: header plus params, growing across. */
export const DEVICE_FACE_FORMS: Forms<DeviceFaceForm> = [
  {
    id: 'face',
    min: { w: { control: 8 }, h: { control: 3 } },
    ideal: { w: { control: 14 }, h: { control: 4 } },
    grow: { w: true },
  },
];
