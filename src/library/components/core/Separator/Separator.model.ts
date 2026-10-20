// Separator's model: its props and the line it draws (class, `data-*`, ARIA). No framework:
// `Separator.tsx` (React) and `Separator.svelte` (Svelte) both render `separatorView`.
import type { ElementView } from '../../../primitives/Text.model';

export interface SeparatorModelProps {
  /** `short`: a control's height less one `--space-3` step, centred in the row; `full`: the row's whole height. */
  length?: 'short' | 'full';
}

/** The line Separator draws: decorative, hidden from assistive tech. */
export function separatorView({ length = 'short' }: SeparatorModelProps): ElementView {
  return {
    className: 'yh-separator',
    attrs: { 'data-part': 'root', 'data-length': length, 'aria-hidden': 'true' },
  };
}
