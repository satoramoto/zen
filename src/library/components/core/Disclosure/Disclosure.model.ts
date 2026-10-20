// Disclosure's model: its props, the tree it draws (the button's class, `data-*`, ARIA, the
// chevron) and the handler that tree names. No framework: `Disclosure.tsx` (React) and
// `Disclosure.svelte` (Svelte) both pass `disclosureView` and `disclosureHandlers` to their `Tree`,
// with its own value as their view state (`view/viewState.ts`), flipped through `Toggle/ownToggle.ts`.
import { focusRing } from '../../../primitives/Ring';
import { h, type Handlers, type Node } from '../../../view/Tree.model';
import { ownToggle } from '../Toggle/ownToggle';
import type { ControlSize } from '../Toggle/sizes';

export interface DisclosureModelProps {
  /** What it shows or hides. */
  'aria-label': string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let it keep its own state from `defaultExpanded`. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChange?: (expanded: boolean) => void;
  /** The id of what it shows or hides. */
  controls?: string;
}

/** The tree Disclosure draws: the button (`aria-expanded`, `aria-controls`) and its chevron.
 *  `own`: its own value (the binding's view state), shown when `expanded` is unset. */
export function disclosureView({ size = 'regular', disabled, expanded, controls, 'aria-label': ariaLabel }: DisclosureModelProps, own: boolean): Node {
  const button = h(
    'button',
    {
      type: 'button',
      class: `lib-disclosure lib-sized ${focusRing}`,
      'data-part': 'root',
      'data-size': size,
      'aria-label': ariaLabel,
      'aria-expanded': String(expanded ?? own),
      'aria-controls': controls,
      disabled: disabled ? '' : undefined,
    },
    h(
      'svg',
      { class: 'lib-disclosure__chevron', 'data-part': 'chevron', viewBox: '0 0 12 12', 'aria-hidden': 'true' },
      h('path', {
        d: 'M2.4 4.4 6 8 9.6 4.4',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.7',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    ),
  );
  button.on = { click: 'flip' };
  return button;
}

/** The callback `disclosureView`'s tree names: a flip, asked through `onChange` and kept as its
 *  own value (`setOwn`) when it isn't controlled. */
export function disclosureHandlers({ expanded, onChange }: DisclosureModelProps, own: boolean, setOwn: (next: boolean) => void): Handlers {
  const value = ownToggle(expanded, own, setOwn, onChange);
  return { flip: () => value.set(!value.current) };
}
