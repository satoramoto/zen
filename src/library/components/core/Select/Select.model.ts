// Select's model: its props, the tree it draws from them and its view state (open, the highlighted
// row, the trigger's quiet look, the ids), and the handlers that tree names. No framework:
// `Select.tsx` (React) and `Select.svelte` (Svelte) both pass `selectView` and `selectHandlers` to
// their `Tree`. The keys, type-ahead, placement and dismissal are the stores in `selectInput.ts`,
// registered as `select` (on the trigger) and `selectMenu` (on the open menu) in
// `src/library/view/stores.ts`; they report the view state back through the `state` handler.
import { layerSurface } from '../../../layout/Layer.model';
import { textNode } from '../../../primitives/Text.model';
import { component, each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** How long a type-ahead keeps collecting before the next key starts a new word. */
export const TYPING_WINDOW = 700;

export interface SelectModelProps {
  items: readonly string[];
  index: number;
  onChange?(next: number): void;
  disabled?: boolean;
  /** The accessible name; falls back to `name`. */
  label?: string;
  /** A visible caption before the field. */
  name?: string;
  /** In px. Settle caller-owned labels so changing the selection can't resize a panel. */
  width?: number;
  className?: string;
  title?: string;
  /** A sentence for the host's hint strip, on the root as `data-hint`. */
  hint?: string;
}

/** What the stores change: whether the menu is open, and the highlighted row. */
export interface SelectState {
  open: boolean;
  active: number;
}

/** Closed, nothing highlighted yet (opening highlights the held member). */
export const SELECT_CLOSED: SelectState = { open: false, active: 0 };

/** What the binding knows and the props don't: the view state, the surrounding cluster's quiet
 *  look (`ControlContext`), and a per-instance id for the menu and its rows. */
export interface SelectView extends SelectState {
  quiet: boolean;
  id: string;
}

/** The held member, clamped into the list. */
export const heldIndex = (items: readonly string[], index: number) => Math.max(0, Math.min(items.length - 1, index));

/**
 * The tree Select draws: the root (the longest member's width as `--lib-select-chars`), the
 * caption, the trigger (a `combobox` binding the `select` store) holding the value and the caret,
 * and while open the menu: a body Text box in the top layer (`popover="manual"`, the `Popover`'s
 * `lib-popover` box, binding `selectMenu`) holding a float Layer's Surface, the `listbox`, its rows.
 */
export function selectView(
  { items, index, disabled = false, label, name, width, className, title, hint }: SelectModelProps,
  { open, active, quiet, id }: SelectView = { ...SELECT_CLOSED, quiet: false, id: 'select' },
): Node {
  const chars = Math.max(0, ...items.map((item) => item.length));
  const at = heldIndex(items, index);
  const menuId = `${id}-menu`;
  const optionId = (which: number) => `${id}-option-${which}`;
  const named = label ?? name;
  return h(
    'div',
    {
      class: `lib-select${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-disabled': disabled ? 'true' : undefined,
      'data-open': open ? 'true' : undefined,
      'data-quiet': quiet ? 'true' : undefined,
      'data-hint': hint,
      style: styleText({ '--lib-select-chars': String(chars), '--lib-select-width': width === undefined ? undefined : `${width}px` }),
    },
    when(!!name, () => textNode({ role: 'body', size: 'label', case: 'label', className: 'lib-select__caption' }, { 'data-part': 'caption' }, name!)),
    wire(
      textNode(
        { as: 'button', role: 'body', size: 'label', weight: 'strong', ariaRole: 'combobox', className: 'lib-select__trigger' },
        {
          type: 'button',
          'aria-haspopup': 'listbox',
          'aria-expanded': String(open),
          'aria-controls': menuId,
          'aria-activedescendant': open ? optionId(active) : undefined,
          disabled: disabled ? '' : undefined,
          'data-part': 'trigger',
          'aria-label': named,
          title,
        },
        h('span', { class: 'lib-select__value', 'data-part': 'value' }, items[at] || null),
        h('span', { class: 'lib-select__caret', 'data-part': 'caret', 'aria-hidden': 'true' }),
      ),
      { bind: [['select', { items, index: at, open, active, disabled, onState: 'state', onChange: 'change' }]] },
    ),
    when(open, () =>
      wire(
        textNode(
          { as: 'div', role: 'body', className: 'lib-popover' },
          { popover: 'manual', 'data-part': 'popover' },
          component(
            'Surface',
            { ...layerSurface({ level: 'float', className: 'lib-popover__panel lib-select__menu' }), as: 'div', 'data-part': 'panel', role: 'listbox', 'aria-label': named, id: menuId },
            {
              slots: {
                children: each(
                  items,
                  (item, which) => `${item}-${which}`,
                  (item, which) =>
                    textNode(
                      { as: 'div', role: 'body', size: 'label', ariaRole: 'option', className: 'lib-select__option' },
                      {
                        id: optionId(which),
                        'aria-selected': String(which === at),
                        'data-active': which === active ? '' : undefined,
                        'data-chosen': which === at ? '' : undefined,
                        'data-part': 'option',
                      },
                      h('span', { class: 'lib-select__value' }, item || null),
                    ),
                ),
              },
            },
          ),
        ),
        { bind: [['selectMenu', { items, index: at, active, onState: 'state', onChange: 'change' }]] },
      ),
    ),
  );
}

/** The callbacks `selectView`'s tree names: the view state's setter, and the member asked for. */
export function selectHandlers(props: SelectModelProps, state: (next: SelectState) => void): Handlers {
  return { state, change: props.onChange };
}
