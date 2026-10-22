// Gate's model: its props, the tree it draws (the ground, the card, the title and message slots,
// the key field with its reveal key, the error line, the submit key and the `children` slot) and
// the handlers that tree names. No framework: `Gate.tsx` (React) and `Gate.svelte` (Svelte) both
// pass `gateView` and `gateHandlers` to their `Tree`, with the gate's own state (the key typed,
// revealed, busy, the last error) as their view state (`view/viewState.ts`). Focus is the
// `gateFocus` store (`gateFocus.ts`).
import { textNode } from '../../../primitives/Text.model';
import { stackNode } from '../../../primitives/Stack.model';
import { component, h, slot, when, wire, type ComponentNode, type Handlers } from '../../../view/Tree.model';
import type { ViewState } from '../../../view/viewState';

/** Every Gate prop but its slots (`title`, `message`, `children`). */
export interface GateModelProps {
  /** Checks the key. A thrown error or a rejected promise shows its message as the gate's error;
   *  while a returned promise is pending the field and the submit key are disabled. */
  onSubmit?: (key: string) => Promise<void> | void;
  /** Controlled error text, shown over the gate's own. */
  error?: string;
  /** The field's label. Default `Key`. */
  label?: string;
  /** The submit key's label. Default `Enter`. */
  submitLabel?: string;
  /** The reveal key's label while the key is hidden. Default `Show`. */
  showLabel?: string;
  /** The reveal key's label while the key is shown. Default `Hide`. */
  hideLabel?: string;
  className?: string;
}

/** Which slots the binding fills: a slot's element is drawn only when it is filled. */
export interface GateSlots {
  title?: boolean;
  message?: boolean;
  children?: boolean;
}

/** The gate's own state, kept by the binding as view state. */
export interface GateState {
  /** Ids for the field and the error line, unique per mounted gate. */
  id: string;
  /** What is typed in the field. */
  key: string;
  /** The key shown as text instead of dots. */
  revealed: boolean;
  /** A submit is running. */
  busy: boolean;
  /** The last submit's error, cleared by the next edit or submit. */
  error?: string;
}

/** The error shown when `onSubmit` fails without a message of its own. */
export const GATE_DEFAULT_ERROR = 'That key did not work.';

let gates = 0;

/** A fresh state for a newly mounted gate. */
export function gateState(): GateState {
  gates += 1;
  return { id: `lib-gate-${gates}`, key: '', revealed: false, busy: false };
}

/** What a failed `onSubmit` says: an error's message, a thrown string, or the default. */
export function gateErrorText(reason: unknown): string {
  if (reason instanceof Error && reason.message.trim() !== '') return reason.message;
  if (typeof reason === 'string' && reason.trim() !== '') return reason;
  return GATE_DEFAULT_ERROR;
}

/**
 * The tree Gate draws: a `ground` Surface filling the screen, and centred on it a `raised` card
 * (a Surface) holding a form: the title (a display Text, `title` slot), the message (`message`
 * slot), the labelled password field with its reveal key, the error line (`aria-live="polite"`,
 * always present so a new error is announced), the primary submit key, then the `children` slot.
 */
export function gateView(
  { error, label = 'Key', submitLabel = 'Enter', showLabel = 'Show', hideLabel = 'Hide', className }: GateModelProps,
  state: GateState,
  slots: GateSlots = {},
): ComponentNode {
  const { id, key, revealed, busy } = state;
  const fieldId = `${id}-field`;
  const errorId = `${id}-error`;
  const shown = error ?? state.error;
  const form = wire(
    stackNode(
      { as: 'form', gap: 4, className: 'lib-gate__form' },
      { 'data-part': 'form', novalidate: '', 'aria-busy': busy ? 'true' : undefined },
      when(slots.title === true, () =>
        textNode({ as: 'h1', role: 'display', size: 'heading', className: 'lib-gate__title' }, { 'data-part': 'title' }, slot('title')),
      ),
      when(slots.message === true, () =>
        textNode({ as: 'div', role: 'body', tone: 'secondary', className: 'lib-gate__message' }, { 'data-part': 'message' }, slot('message')),
      ),
      stackNode(
        { gap: 2 },
        {},
        textNode({ as: 'label', role: 'label', className: 'lib-gate__label' }, { for: fieldId, 'data-part': 'label' }, label),
        h(
          'div',
          { class: 'lib-gate__field', 'data-part': 'field', 'data-disabled': busy ? 'true' : undefined },
          wire(
            textNode(
              { as: 'input', role: 'body', className: 'lib-gate__input' },
              {
                id: fieldId,
                type: revealed ? 'text' : 'password',
                value: key,
                disabled: busy ? '' : undefined,
                autocomplete: 'current-password',
                autocapitalize: 'off',
                spellcheck: 'false',
                'aria-invalid': shown ? 'true' : undefined,
                'aria-describedby': errorId,
                'data-part': 'input',
              },
            ),
            { on: { input: 'input' }, bind: [['gateFocus', { busy }]] },
          ),
          component(
            'Button',
            { label: revealed ? hideLabel : showLabel, variant: 'quiet', size: 'md', disabled: busy, controls: fieldId },
            { on: { onPress: 'reveal' } },
          ),
        ),
        textNode(
          { as: 'p', role: 'body', size: 'caption', tone: 'danger', className: 'lib-gate__error' },
          { id: errorId, 'aria-live': 'polite', 'data-part': 'error' },
          shown ?? '',
        ),
      ),
      component('Button', { label: submitLabel, variant: 'primary', size: 'cell', disabled: busy }, { on: { onPress: 'submit' } }),
      when(slots.children === true, () => h('div', { class: 'lib-gate__extra', 'data-part': 'extra' }, slot('children'))),
    ),
    { on: { submit: 'submit' } },
  );
  return component(
    'Surface',
    { layer: 'ground', radius: 'none', as: 'div', className: `lib-gate${className ? ` ${className}` : ''}`, 'data-part': 'root', 'data-busy': busy ? 'true' : undefined },
    {
      slots: {
        children: [component('Surface', { layer: 'raised', radius: 'card', border: true, as: 'div', className: 'lib-gate__card', 'data-part': 'card' }, { slots: { children: [form] } })],
      },
    },
  );
}

/**
 * The handlers Gate's tree names: `input` keeps the typed key (and clears the gate's own error);
 * `reveal` flips the key between dots and text; `submit` (Enter in the field, or the submit key)
 * ignores an empty or whitespace-only key and a submit already running, else calls `onSubmit`
 * with the trimmed key, busy until it settles, and keeps a failure's message as the error.
 * `state` is the binding's view state, read afresh after the await.
 */
export function gateHandlers({ onSubmit }: GateModelProps, state: ViewState<GateState>): Handlers {
  return {
    input: (event: Event) => state.set({ ...state.get(), key: (event.currentTarget as HTMLInputElement).value, error: undefined }),
    reveal: () => state.set({ ...state.get(), revealed: !state.get().revealed }),
    submit: async (event?: Event) => {
      event?.preventDefault?.();
      const now = state.get();
      const key = now.key.trim();
      if (now.busy || key === '') return;
      state.set({ ...now, busy: true, error: undefined });
      try {
        await onSubmit?.(key);
        state.set({ ...state.get(), busy: false });
      } catch (reason) {
        state.set({ ...state.get(), busy: false, error: gateErrorText(reason) });
      }
    },
  };
}
