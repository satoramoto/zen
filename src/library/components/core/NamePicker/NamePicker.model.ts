// NamePicker's model: its props, the tree it draws (the ground, the card, the title and message
// slots, the names as Radios in a radio group, the pick key and the `children` slot) and the
// handlers that tree names. No framework: `NamePicker.tsx` (React) and `NamePicker.svelte`
// (Svelte) both pass `namePickerView` and `namePickerHandlers` to their `Tree`, with the name
// chosen so far as their view state (`view/viewState.ts`).
import { textNode } from '../../../primitives/Text.model';
import { stackNode } from '../../../primitives/Stack.model';
import { component, h, slot, when, wire, type ComponentNode, type Handlers } from '../../../view/Tree.model';
import type { ViewState } from '../../../view/viewState';

/** Every NamePicker prop but its slots (`title`, `message`, `children`). */
export interface NamePickerModelProps {
  /** The names to pick from, in order. */
  names: readonly string[];
  /** The name chosen to start with (a remembered one), or `null`. When it changes, the list follows it. */
  value: string | null;
  /** Called with the chosen name when the pick key is pressed (or Enter on the list). */
  onPick: (name: string) => void;
  /** The pick key's label. Default `That's me`. */
  pickLabel?: string;
  className?: string;
}

/** Which slots the binding fills: a slot's element is drawn only when it is filled. */
export interface NamePickerSlots {
  title?: boolean;
  message?: boolean;
  children?: boolean;
}

/** The picker's own state, kept by the binding as view state. */
export interface NamePickerState {
  /** Ids for the title and the radios' group name, unique per mounted picker. */
  id: string;
  /** The name chosen in the list, or `null`. */
  chosen: string | null;
  /** The `value` prop `chosen` was set under: when `value` changes, the list follows it again. */
  from: string | null;
}

let pickers = 0;

/** A fresh state for a newly mounted picker, starting from `value`. */
export function namePickerState(value: string | null): NamePickerState {
  pickers += 1;
  return { id: `lib-name-picker-${pickers}`, chosen: value, from: value };
}

/** The name chosen now: the list's own choice while `value` hasn't changed since, else `value`;
 *  `null` when that name isn't in `names`. */
export function chosenName({ names, value }: Pick<NamePickerModelProps, 'names' | 'value'>, state: NamePickerState): string | null {
  const chosen = state.from === value ? state.chosen : value;
  return chosen !== null && names.includes(chosen) ? chosen : null;
}

/**
 * The tree NamePicker draws: a `ground` Surface filling the screen, and centred on it a `raised`
 * card (a Surface) holding a form: the title (a display Text, `title` slot), the message
 * (`message` slot), a `radiogroup` (named by the title) of a Radio per name, the primary pick key
 * (disabled until a name is chosen), then the `children` slot.
 */
export function namePickerView(
  { names, value, pickLabel = "That's me", className }: NamePickerModelProps,
  state: NamePickerState,
  slots: NamePickerSlots = {},
): ComponentNode {
  const { id } = state;
  const titleId = `${id}-title`;
  const chosen = chosenName({ names, value }, state);
  const form = wire(
    stackNode(
      { as: 'form', gap: 4, className: 'lib-name-picker__form' },
      { 'data-part': 'form', novalidate: '' },
      when(slots.title === true, () =>
        textNode({ as: 'h1', role: 'display', size: 'heading', className: 'lib-name-picker__title' }, { id: titleId, 'data-part': 'title' }, slot('title')),
      ),
      when(slots.message === true, () =>
        textNode({ as: 'div', role: 'body', tone: 'secondary', className: 'lib-name-picker__message' }, { 'data-part': 'message' }, slot('message')),
      ),
      stackNode(
        { gap: 1, className: 'lib-name-picker__names' },
        { role: 'radiogroup', 'aria-labelledby': slots.title === true ? titleId : undefined, 'data-part': 'names' },
        ...names.map((name, at) =>
          component('Radio', { checked: name === chosen, name: `${id}-name`, value: name }, { on: { onChange: `choose:${at}` }, slots: { children: [name] }, key: name }),
        ),
      ),
      component('Button', { label: pickLabel, variant: 'primary', size: 'cell', disabled: chosen === null }, { on: { onPress: 'pick' } }),
      when(slots.children === true, () => h('div', { class: 'lib-name-picker__extra', 'data-part': 'extra' }, slot('children'))),
    ),
    { on: { submit: 'pick', keydown: 'keys' } },
  );
  return component(
    'Surface',
    { layer: 'ground', radius: 'none', as: 'div', className: `lib-name-picker${className ? ` ${className}` : ''}`, 'data-part': 'root' },
    {
      slots: {
        children: [component('Surface', { layer: 'raised', radius: 'card', border: true, as: 'div', className: 'lib-name-picker__card', 'data-part': 'card' }, { slots: { children: [form] } })],
      },
    },
  );
}

/**
 * The handlers NamePicker's tree names: `choose:<n>` keeps the nth name as chosen when its Radio
 * is picked; `pick` (the pick key, or the form's submit) calls `onPick` with the chosen name, and
 * does nothing while none is; `keys` makes Enter on a Radio pick too (a browser doesn't always
 * submit a form from a radio).
 */
export function namePickerHandlers(props: NamePickerModelProps, state: ViewState<NamePickerState>): Handlers {
  const pick = (event?: Event) => {
    event?.preventDefault?.();
    const chosen = chosenName(props, state.get());
    if (chosen !== null) props.onPick(chosen);
  };
  const handlers: Handlers = {
    pick,
    keys: (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement | null;
      if (event.key === 'Enter' && target?.tagName === 'INPUT' && target.type === 'radio') pick(event);
    },
  };
  props.names.forEach((name, at) => {
    handlers[`choose:${at}`] = (checked: boolean) => {
      if (checked) state.set({ ...state.get(), chosen: name, from: props.value });
    };
  });
  return handlers;
}
