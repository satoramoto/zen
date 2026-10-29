// TransitionRow's model: the states and pads it takes, and the tree both renderers draw from them
// (the six oversized pad faces, their labels, hints and state marks, classes, `data-*` and ARIA). No
// framework: `TransitionRow.tsx` (React) and `TransitionRow.svelte` (Svelte) both pass
// `transitionRowView` and `transitionRowHandlers` to their `Tree`. The row holds no state and binds
// no store: a click only asks for `onFire` with the pad's id.
import type { HueSlot } from '../../core/hue';
import { focusRing, pressRing } from '../../../primitives/Ring';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView } from '../../../primitives/Text.model';
import { each, h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { TransitionRowForm } from './TransitionRow.forms';

/* ---------- the shared vocabulary ---------- */

/** What a transition pad is doing. The union comes from this tuple, so a new state is a type error everywhere it isn't drawn. */
export const TRANSITION_STATES = ['idle', 'armed', 'fired'] as const;
export type TransitionState = (typeof TRANSITION_STATES)[number];

/** One transition pad: its word, its state and, optionally, its hue slot and a caption. */
export interface TransitionPad {
  id: string;
  /** The word on the pad: `'RISER'`, `'HOLD A'`. */
  label: string;
  state: TransitionState;
  /** The pad's categorical hue slot: what it fills with when it fires. Its meaning is the app's. */
  hue?: HueSlot;
  /** A caption under the label: `'8 bars'`, `'next bar'`. */
  hint?: string;
}

/** Every TransitionRow prop (the row has no framework children). */
export interface TransitionRowModelProps {
  /** The pads, left to right (the grid wraps them three to a row). */
  pads: readonly TransitionPad[];
  /** The id of the pad the app holds as current: it keeps a rule across its foot. */
  selected?: string;
  /**
   * A pad was fired, by click, Space or Enter. Without it the row is inert: every pad is
   * `aria-disabled`, dashed and muted, and a click asks for nothing (the Disabled story).
   */
  onFire?: (id: string) => void;
  /** Classes added to the root, after the row's own. */
  className?: string;
}

/** Whether a click on this row fires: only with an `onFire` to ask. */
export const rowFires = ({ onFire }: Pick<TransitionRowModelProps, 'onFire'>): boolean => onFire !== undefined;

/**
 * One pad's tree: a `key` Surface drawn as a `<button>`, its lamp, label and hint Texts and the
 * selected rule, with its state as `data-state` and its hue slot as `data-hue`. Armed, it shows a
 * lit lamp and an inset ring; fired, the hue fills the face and the words take `on-solid` ink.
 * A pad with no hue fills with `--role-2` when fired.
 */
function padNode(pad: TransitionPad, index: number, selected: string | undefined, inert: boolean): Node {
  const surface = surfaceView({ material: 'key', radius: 'control', className: `yh-transitionrow__pad ${focusRing} ${pressRing}` });
  const fired = pad.state === 'fired';
  const label = textView({ role: 'label', leading: 'tight', tone: fired ? 'on-solid' : undefined, className: 'yh-transitionrow__label' });
  const hint = textView({ role: 'caption', tone: fired ? 'on-solid' : 'muted', className: 'yh-transitionrow__hint' });
  return wire(
    h(
      'button',
      {
        class: surface.className,
        ...surface.attrs,
        type: 'button',
        'data-part': 'pad',
        'data-state': pad.state,
        'data-hue': pad.hue === undefined ? undefined : String(pad.hue),
        'data-selected': pad.id === selected ? 'true' : undefined,
        'data-row-disabled': inert ? 'true' : undefined,
        'aria-current': pad.id === selected ? 'true' : undefined,
        'aria-disabled': inert ? 'true' : undefined,
        'aria-label': pad.hint ? `${pad.label}, ${pad.hint}` : pad.label,
      },
      h('span', { class: 'yh-transitionrow__lamp', 'data-part': 'lamp', 'aria-hidden': 'true' }),
      h('span', { class: label.className, ...label.attrs, 'data-part': 'label' }, pad.label),
      pad.hint ? h('span', { class: hint.className, ...hint.attrs, 'data-part': 'hint' }, pad.hint) : null,
      h('span', { class: 'yh-transitionrow__mark', 'data-part': 'mark', 'aria-hidden': 'true' }),
    ),
    { on: { click: `fire${index}` } },
  );
}

/**
 * The tree TransitionRow draws: the root (its form as `data-form`) and the six pad faces, or the
 * empty mark when there are none. `form` is the binding's (`useForm` / `getForm`): `row` one line,
 * `grid` two rows of three.
 */
export function transitionRowView({ pads, selected, onFire, className }: TransitionRowModelProps, form: TransitionRowForm): Node {
  const inert = !rowFires({ onFire });
  const empty = textView({ role: 'caption', tone: 'muted', className: 'yh-transitionrow__empty' });
  return h(
    'div',
    {
      class: `yh-transitionrow${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      'data-empty': pads.length === 0 ? 'true' : undefined,
      'data-disabled': inert ? 'true' : undefined,
    },
    when(pads.length === 0, () => h('span', { class: empty.className, ...empty.attrs, 'data-part': 'empty' }, 'No transitions')),
    each(pads, (pad) => pad.id, (pad, i) => padNode(pad, i, selected, inert)),
  );
}

/** The callbacks `transitionRowView`'s tree names: one fire per pad (`fire<i>`, with its id). */
export function transitionRowHandlers({ pads, onFire }: TransitionRowModelProps): Handlers {
  const handlers: Handlers = {};
  pads.forEach((pad, i) => {
    handlers[`fire${i}`] = () => onFire?.(pad.id);
  });
  return handlers;
}
