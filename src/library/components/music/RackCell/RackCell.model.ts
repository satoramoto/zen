// RackCell's model: its props (all but the mark, a React node or a Svelte snippet) and the tree both
// renderers draw from them (the cell, its one button, the caption line with the slot, the name line
// with the `mark` slot). No framework: `RackCell.tsx` (React) and `RackCell.svelte` (Svelte) both
// pass `rackCellView` and `rackCellHandlers` to their `Tree`, with the mark as the `mark` slot.
import { focusRing } from '../../../primitives/Ring';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, slot, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

export interface RackCellModelProps {
  /** The rack's name ("Sunday drive"). Empty: "No rack". */
  rack: string;
  /** The Quick Rack slot it's on ("A1"). Empty: no slot shown. */
  slot?: string;
  /** The small word before the slot. */
  label?: string;
  /** The accessible name. Default: "Rack: Sunday drive, on Quick Rack A1. Opens the Rack page". */
  name?: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
  /** Called on a click, Space or Enter (opens the Rack page). */
  onPress?: () => void;
}

/** Which of RackCell's slots the caller filled: an empty slot draws no wrapper. */
export interface RackCellSlots {
  /** A `mark` was given (a React node, a Svelte snippet). */
  mark?: boolean;
}

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/**
 * The tree RackCell draws from its props: the cell and its one button (`press` on click), holding
 * the caption line (a label Text: the small word, then the separator and the slot when there is
 * one) and the name line (a caption Text: the rack's name or "No rack", then the `mark` slot when
 * filled).
 */
export function rackCellView({ rack, slot: quick = '', label = 'Rack', name, tip }: RackCellModelProps, slots: RackCellSlots = {}): Node {
  const empty = rack.trim() === '';
  const shown = empty ? 'No rack' : rack;
  return h(
    'div',
    { class: 'yh-rack-cell' },
    wire(
      h(
        'button',
        {
          class: `yh-rack-cell__button ${focusRing}`,
          type: 'button',
          'aria-label': name ?? `${label}: ${shown}${quick ? `, on Quick Rack ${quick}` : ''}. Opens the Rack page`,
          'data-tip': tip,
        },
        h(
          'span',
          text({ role: 'label', size: 'caption', tabular: true, className: 'yh-rack-cell__head' }),
          h('span', { class: 'yh-rack-cell__label' }, label),
          when(quick !== '', () => h('span', { class: 'yh-rack-cell__separator', 'aria-hidden': 'true' }, '·')),
          when(quick !== '', () => h('span', text({ role: 'label', case: 'none', tabular: true, className: 'yh-rack-cell__slot' }), quick)),
        ),
        h(
          'span',
          { ...text({ role: 'caption', size: 'body', tabular: true, className: 'yh-rack-cell__name' }), 'data-empty': empty ? 'true' : undefined },
          h('span', text({ role: 'caption', size: empty ? 'caption' : 'body', tabular: true, className: 'yh-rack-cell__title' }), shown),
          when(slots.mark === true, () => h('span', { class: 'yh-rack-cell__mark' }, slot('mark'))),
        ),
      ),
      { on: { click: 'press' } },
    ),
  );
}

/** The callbacks `rackCellView`'s tree names: a press on the cell. */
export function rackCellHandlers(props: RackCellModelProps): Handlers {
  return { press: () => props.onPress?.() };
}
