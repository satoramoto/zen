/**
 * Slider's typed readout, framework-free: a click on the readout button (`[data-part="readout"]`,
 * a `button` only when `typed`) opens the field (`[data-part="entry"]`) in its place with `start`;
 * typing reports the text; Enter sets it, leaving the field sets it, Escape closes it with nothing
 * set (and goes no further, so a sheet around it stays open). On opening the field is focused with
 * its text selected; on closing focus returns to the readout. Bound on the Slider's root, it
 * listens there (the field and the readout come and go inside it). Registered as `sliderEntry` in
 * `src/library/view/stores.ts`. It reports only through `onEntry` (the text, or null when closed:
 * the binding's view state, drawn back by the model) and `onCommit` (the text to set).
 */

export interface SliderEntryParams {
  /** Whether the field is open (the view state the model drew). */
  open: boolean;
  /** No typing: the readout ignores a click. */
  disabled?: boolean;
  /** The text the field opens with. */
  start: string;
  /** The field's text as it changes, or null when it closes. */
  onEntry?(text: string | null): void;
  /** The text to set (Enter, or leaving the field). */
  onCommit?(text: string): void;
}

/** A bound entry: `params` changed, or unbound. */
export interface SliderEntryBinding {
  update(params: SliderEntryParams): void;
  destroy(): void;
}

const ENTRY = '[data-part="entry"]';
const READOUT = 'button[data-part="readout"]';

/** Listens on `node` (the Slider's root) for the readout's click and the field's typing and keys. */
export function bindSliderEntry(node: HTMLElement, initial: SliderEntryParams): SliderEntryBinding {
  let params = initial;
  /** Whether the field is still open: the blur that follows Enter or Escape mustn't set it again. */
  let open = false;
  /** Whether the field was drawn open at the last update, to focus it or the readout on a change. */
  let wasOpen = params.open;

  const within = (target: EventTarget | null, selector: string): HTMLElement | null =>
    target instanceof Element && node.contains(target) ? (target.closest(selector) as HTMLElement | null) : null;

  function commit(field: HTMLInputElement) {
    if (!open) return;
    open = false;
    const text = field.value;
    params.onEntry?.(null);
    params.onCommit?.(text);
  }

  function onClick(event: MouseEvent) {
    if (params.disabled || within(event.target, READOUT) === null) return;
    open = true;
    params.onEntry?.(params.start);
  }

  function onInput(event: Event) {
    const field = within(event.target, ENTRY) as HTMLInputElement | null;
    if (field !== null) params.onEntry?.(field.value);
  }

  function onKeyDown(event: KeyboardEvent) {
    const field = within(event.target, ENTRY) as HTMLInputElement | null;
    if (field === null) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(field);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      open = false;
      params.onEntry?.(null);
    }
  }

  function onFocusOut(event: FocusEvent) {
    const field = within(event.target, ENTRY) as HTMLInputElement | null;
    if (field !== null) commit(field);
  }

  /** Focus the field (selected) once it is drawn open, the readout once it is drawn closed. */
  function follow() {
    if (params.open === wasOpen) return;
    wasOpen = params.open;
    const focus = () => {
      if (params.open) {
        const field = node.querySelector<HTMLInputElement>(ENTRY);
        field?.focus();
        field?.select();
        return field !== null;
      }
      const readout = node.querySelector<HTMLElement>(READOUT);
      readout?.focus();
      return readout !== null;
    };
    // A renderer may update the root before it draws the new child: try again after it has.
    if (!focus()) queueMicrotask(focus);
  }

  node.addEventListener('click', onClick);
  node.addEventListener('input', onInput);
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('focusout', onFocusOut);
  return {
    update(next) {
      params = next;
      follow();
    },
    destroy() {
      node.removeEventListener('click', onClick);
      node.removeEventListener('input', onInput);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('focusout', onFocusOut);
    },
  };
}
