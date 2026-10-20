// Radio's model: the tree it draws from its props (Checkbox's root, box and input, with a dot and
// Checkbox's dash) and the handlers that tree names. No framework: `Radio.tsx` (React) and
// `Radio.svelte` (Svelte) both pass `radioView` and `radioHandlers` to their `Tree`, with the
// uncontrolled radio's own mixed state as their view state (`view/viewState.ts`).
import { h, type Handlers, type Node } from '../../../view/Tree.model';
import { checkInputNode, checkRootNode, dashMarkNode, type CheckModelProps, type CheckSlots } from '../Checkbox/Checkbox.model';

export type RadioModelProps = CheckModelProps;

/**
 * The tree a radio draws: the label root (`data-mixed` while mixed: controlled, `checked` says so;
 * uncontrolled, `ownMixed`, from `defaultChecked` until it is picked), the box (input, face, dot,
 * dash) and the label.
 */
export function radioView(props: RadioModelProps, slots: CheckSlots, ownMixed: boolean): Node {
  const mixed = props.checked !== undefined ? props.checked === 'mixed' : ownMixed;
  return checkRootNode(
    'radio',
    props,
    slots,
    checkInputNode('radio', props, false),
    [h('span', { class: 'lib-radio__dot', 'data-part': 'dot', 'aria-hidden': 'true' }), dashMarkNode()],
    { 'data-mixed': mixed ? '' : undefined },
  );
}

/** The callbacks the tree names: `change` ends the own mixed state (`setOwnMixed(false)`) and hears the input's state. */
export function radioHandlers({ onChange }: RadioModelProps, setOwnMixed: (mixed: boolean) => void): Handlers {
  return {
    change: (e: Event) => {
      setOwnMixed(false);
      onChange?.((e.currentTarget as HTMLInputElement).checked);
    },
  };
}
