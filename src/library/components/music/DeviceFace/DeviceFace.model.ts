// DeviceFace's model: one effect's faceplate, and the tree both renderers draw. No framework:
// `DeviceFace.tsx` (React) and `DeviceFace.svelte` (Svelte) both pass `deviceFaceView` and
// `deviceFaceHandlers` to their `Tree`. The faceplate holds no state: power asks for `onToggle`,
// the triangle for `onFold`, the face for `onSelect`. widgets' Device is the behaviour reference
// (a header of activator, name and fold triangle with the params underneath); what a param looks
// like is the app's, filled through the `params` slot.
import { component, h, slot, when, type Handlers, type Node } from '../../../view/Tree.model';
import { surfaceView } from '../../../primitives/Surface.model';
import type { DeviceFaceForm } from './DeviceFace.forms';

/** Every DeviceFace prop (its params reach it as the `params` slot, never as props). */
export interface DeviceFaceModelProps {
  /** The device's name: `'FX A Delay'`. Clipped, never wrapped. */
  name: string;
  /** Active: a dimmed face still plays its params. */
  on?: boolean;
  /** The activator was flipped. */
  onToggle?: (on: boolean) => void;
  /** Folded: the strip without its params. */
  folded?: boolean;
  /** The triangle was flipped. */
  onFold?: (folded: boolean) => void;
  /** The chain's pointed-at device. */
  selected?: boolean;
  /** The face was pointed at. */
  onSelect?: () => void;
  /** Shown, dimmed, deaf: the face is read, not played. */
  disabled?: boolean;
  /** Classes added to the root, after the face's own. */
  className?: string;
}

/**
 * The tree DeviceFace draws: a plate holding the header (activator, name, fold triangle) and,
 * unfolded, the params slot. `form` is the binding's (`useForm` / `getForm`).
 */
export function deviceFaceView({ name, on, folded, selected, disabled, className }: DeviceFaceModelProps, form: DeviceFaceForm): Node {
  const inert = disabled === true;
  const plate = surfaceView({ material: 'key', radius: 'card', className: 'yh-deviceface' });
  return h(
    'div',
    {
      class: plate.className,
      ...plate.attrs,
      'data-part': 'root',
      'data-form': form,
      'data-on': on === false ? 'false' : 'true',
      'data-folded': folded ? 'true' : undefined,
      'data-selected': selected ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    h(
      'div',
      { class: 'yh-deviceface__head', 'data-part': 'head' },
      component('LampButton', { label: 'On', on: on !== false, name: `${name} power`, disabled: inert }, { on: { onToggle: 'power' } }),
      component('Button', { label: name, name, variant: 'quiet', disabled: inert }, { on: { onPress: 'select' } }),
      component(
        'Button',
        { symbol: folded ? 'down' : 'up', name: folded ? `Unfold ${name}` : `Fold ${name}`, size: 'sm', variant: 'quiet', disabled: inert },
        { on: { onPress: 'fold' } },
      ),
    ),
    when(!folded, () => h('div', { class: 'yh-deviceface__body', 'data-part': 'body' }, slot('params'))),
  );
}

/** The callbacks `deviceFaceView`'s tree names: power, fold and point. */
export function deviceFaceHandlers({ on, folded, onToggle, onFold, onSelect }: DeviceFaceModelProps): Handlers {
  return {
    power: () => onToggle?.(!(on !== false)),
    fold: () => onFold?.(!folded),
    select: () => onSelect?.(),
  };
}
