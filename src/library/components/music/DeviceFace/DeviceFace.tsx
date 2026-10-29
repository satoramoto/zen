import type { ReactNode } from 'react';
import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { DEVICE_FACE_FORMS } from './DeviceFace.forms';
import { deviceFaceHandlers, deviceFaceView, type DeviceFaceModelProps } from './DeviceFace.model';
// The params slot is the app's; the header reads through Button and LampButton styles.
import '../../core/Button/Button.css';
import '../../core/LampButton/LampButton.css';
import './DeviceFace.css';

// The props and the tree are framework-free, in the model; `DeviceFace.svelte` draws the same tree.
export { DEVICE_FACE_FORMS, type DeviceFaceForm } from './DeviceFace.forms';
export type { DeviceFaceModelProps } from './DeviceFace.model';

/** DeviceFace's props: data, callbacks, and the params slot. */
export type DeviceFaceProps = DeviceFaceModelProps & {
  /** The device's params (Knobs, Sliders, whatever the device is). */
  params?: ReactNode;
};

/**
 * **Job.** One effect's faceplate: a header of activator, name and fold triangle with the params
 * underneath. widgets' Device is the behaviour reference (the activator, the clipped name, the
 * folding strip); what a param looks like is the app's, filled through the `params` slot.
 *
 * **Kept.** A deactivated device dims but its params still play; folded is a strip. The face
 * holds no state: power, fold and point only ask.
 *
 * **Tuning knobs.**
 * - `--yh-deviceface-gap`: between the header and the params, and the header's own gap.
 */
export function DeviceFace({ params, ...props }: DeviceFaceProps) {
  const form = useForm(DEVICE_FACE_FORMS);
  return <Tree tree={deviceFaceView(props, form)} slots={{ params }} handlers={deviceFaceHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
DeviceFace.forms = DEVICE_FACE_FORMS;

export default DeviceFace;
