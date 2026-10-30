// CutPads' model: the transitions a player fires, and the tree both renderers draw from them. No
// framework: `CutPads.tsx` and `CutPads.svelte` both pass `cutPadsView` and `cutPadsHandlers` to
// their `Tree`. The pads hold no state: a press only asks `onFire` with the pad's id; armed, fired
// and held are the app's to say.
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { liveHead, livePane } from '../live.model';
import type { CutPadsForm } from './CutPads.forms';

/** What a transition pad is doing: waiting, armed for the next boundary, fired, or held down. */
export const CUT_PAD_STATES = ['idle', 'armed', 'fired', 'held'] as const;
export type CutPadState = (typeof CUT_PAD_STATES)[number];

/** One transition pad. */
export interface CutPad {
  id: string;
  /** The word on the pad: `'RISER'`, `'HOLD A'`. */
  label: string;
  state: CutPadState;
  /** The mono caption under it: `'8 bars'`, `'next bar'`. */
  hint?: string;
}

export interface CutPadsProps {
  /** The pads, left to right (the grid wraps them into two rows). */
  pads: readonly CutPad[];
  /** The pad the app holds as current: a 2px foot rule. */
  selected?: string;
  /** A pad was pressed. Without it the pads are inert: dashed and read-only. */
  onFire?: (id: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: CutPadsForm;
  className?: string;
}

/** The small state tag in a pad's corner, and its spoken word. */
const STATE_WORD: Record<CutPadState, string> = { idle: 'idle', armed: 'armed', fired: 'fired', held: 'held' };

function pad(p: CutPad, selected: string | undefined, inert: boolean): Node {
  const isSelected = p.id === selected;
  return wire(
    h(
      'button',
      {
        class: 'live-cell live-cuts-pad',
        type: 'button',
        'data-part': 'pad',
        'data-state': p.state,
        'data-selected': isSelected ? 'true' : undefined,
        'aria-current': isSelected ? 'true' : undefined,
        'aria-label': `${p.label}${p.hint ? `, ${p.hint}` : ''}${p.state === 'idle' ? '' : `, ${STATE_WORD[p.state]}`}`,
        disabled: inert ? '' : undefined,
      },
      h('span', { class: 'live-cuts-label', 'data-part': 'label' }, p.label),
      when(p.hint !== undefined, () => h('span', { class: 'live-cuts-hint', 'data-part': 'hint' }, p.hint!)),
      when(p.state !== 'idle', () => h('span', { class: 'live-cuts-tag', 'data-part': 'state', 'aria-hidden': 'true' }, STATE_WORD[p.state])),
    ),
    { on: { click: `fire:${p.id}` } },
  );
}

/**
 * The tree CutPads draws: in `grid`, the pane's head (the armed count) over two rows of pads; in
 * `row`, the pads alone in one line. Each pad is a tall launch cell: its word, its mono caption
 * and, while it isn't idle, its state in the corner. `form` is the binding's (`useForm` / `getForm`).
 */
export function cutPadsView({ pads, selected, onFire, className }: CutPadsProps, form: CutPadsForm): Node {
  const inert = onFire === undefined;
  const armed = pads.filter((p) => p.state === 'armed').length;
  const columns = form === 'grid' ? Math.max(1, Math.ceil(pads.length / 2)) : Math.max(1, pads.length);
  return livePane(
    'cuts',
    { class: className, 'data-form': form, 'data-inert': inert ? 'true' : undefined, role: 'group', 'aria-label': 'Transitions' },
    when(form === 'grid', () => liveHead({ title: 'Transitions', sub: inert ? 'read-only' : undefined, aside: armed ? `${armed} armed` : undefined })),
    pads.length === 0
      ? h('div', { class: 'live-cuts-empty', 'data-part': 'empty' }, h('span', { class: 'live-axis' }, 'No transitions'))
      : h(
          'div',
          { class: 'live-cuts-pads', 'data-part': 'pads', style: styleText({ '--live-cuts-cols': String(columns) }) },
          ...each(pads, (p) => p.id, (p) => pad(p, selected, inert)),
        ),
  );
}

/** The callbacks the tree names: one fire per pad (`fire:<id>`). */
export function cutPadsHandlers({ pads, onFire }: CutPadsProps): Handlers {
  const handlers: Handlers = {};
  for (const { id } of pads) handlers[`fire:${id}`] = () => onFire?.(id);
  return handlers;
}
