// Separator's model: its props and the tree it draws (class, `data-*`, ARIA). No framework:
// `Separator.tsx` (React) and `Separator.svelte` (Svelte) both pass `separatorView` to their `Tree`.
import { h, type Node } from '../../../view/Tree.model';

export interface SeparatorModelProps {
  /** `short`: a control's height less one `--space-3` step, centred in the row; `full`: the row's whole height. */
  length?: 'short' | 'full';
}

/** The line Separator draws: one empty `span`, decorative, hidden from assistive tech. */
export function separatorView({ length = 'short' }: SeparatorModelProps): Node {
  return h('span', { class: 'yh-separator', 'data-part': 'root', 'data-length': length, 'aria-hidden': 'true' });
}
