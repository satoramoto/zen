// Segmented's model: its props, the tree it draws from them and the handlers that tree names, and
// `itemsOf`. No framework: `Segmented.tsx` (React) and `Segmented.svelte` (Svelte) both pass
// `segmentedView` and `segmentedHandlers` to their `Tree`; the arrows, the clicks and focus
// following the choice are the `segmentedInput.ts` store beside it, registered as `segmented` in
// `src/library/view/stores.ts`.
import { textNode } from '../../../primitives/Text.model';
import { each, h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

export interface SegmentedModelProps {
  items: readonly string[];
  /**
   * What a screen reader names each member, by position, for members that show only a glyph or an
   * abbreviation (`'s'` → `'seconds'`). A member with no entry (or an empty one) is named by its text.
   */
  itemLabels?: readonly (string | undefined)[];
  index: number;
  onChange?(next: number): void;
  disabled?: boolean;
  /** The group's accessible name; falls back to `name`. */
  label?: string;
  /** A visible caption before the group. */
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  title?: string;
  /** A sentence for the host's hint strip, on the root as `data-hint`. */
  hint?: string;
}

/** The members of an enum parameter (anything with `items`), for handing straight to `items`. */
export function itemsOf(param: { readonly items?: readonly string[] }): readonly string[] {
  return param.items ?? [];
}

/**
 * The tree Segmented draws: the root, the caption, the track (the `radiogroup`, binding the
 * `segmented` store) and a `radio` button per member, a strong body Text at label size; only the
 * chosen one takes Tab.
 */
export function segmentedView({
  items,
  itemLabels,
  index,
  disabled = false,
  label,
  name,
  orientation = 'horizontal',
  className,
  title,
  hint,
}: SegmentedModelProps): Node {
  return h(
    'div',
    {
      class: `lib-segmented${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-orientation': orientation,
      'data-disabled': disabled ? 'true' : undefined,
      'data-hint': hint,
    },
    when(!!name, () => textNode({ role: 'body', size: 'label', case: 'label', className: 'lib-segmented__caption' }, { 'data-part': 'caption' }, name!)),
    wire(
      h(
        'div',
        {
          class: 'lib-segmented__track',
          'data-part': 'track',
          role: 'radiogroup',
          'aria-label': label ?? name,
          'aria-disabled': disabled ? 'true' : undefined,
          'aria-orientation': orientation,
          title,
        },
        each(
          items,
          (item, at) => `${item}-${at}`,
          (item, at) =>
            textNode(
              { as: 'button', role: 'body', size: 'label', weight: 'strong', case: 'label', ariaRole: 'radio', className: 'lib-segmented__segment' },
              {
                type: 'button',
                'aria-checked': String(at === index),
                tabindex: at === index ? '0' : '-1',
                disabled: disabled ? '' : undefined,
                'data-part': 'segment',
                'aria-label': itemLabels?.[at] || undefined,
              },
              item || null,
            ),
        ),
      ),
      { bind: [['segmented', { items, index, disabled, onChange: 'change' }]] },
    ),
  );
}

/** The callbacks `segmentedView`'s tree names: the member asked for. */
export function segmentedHandlers(props: SegmentedModelProps): Handlers {
  return { change: props.onChange };
}
