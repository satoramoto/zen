// Toggle's and Switch's models: their props, the trees they draw (classes, `data-*`, ARIA, the
// inline style, the `on` handler keys) and the handlers those trees name. No framework:
// `Toggle.tsx` / `Toggle.svelte` and `Switch` (in Toggle.tsx) / `Switch.svelte` pass them to their
// `Tree`, the face, reading or name as the `children` slot. Switch's own value is the binding's
// view state, flipped through `ownToggle.ts`.
import { focusRing } from '../../../primitives/Ring';
import { surfaceNode } from '../../../primitives/Surface.model';
import { textNode } from '../../../primitives/Text.model';
import { h, slot, styleText, type Handlers, type Node } from '../../../view/Tree.model';
import { ownToggle } from './ownToggle';
import type { ControlSize } from './sizes';

/** Every Toggle prop but its face or reading (a React node or a Svelte snippet, so each renderer adds its own). */
export interface ToggleModelProps {
  on: boolean;
  onChange(next: boolean): void;
  disabled?: boolean;
  /** The accessible name; falls back to `name`. */
  label?: string;
  /** The caption: over the key when stacked, at the left of the row when inside. */
  name?: string;
  /** Springs back instead of staying down, like `live.button`. */
  momentary?: boolean;
  /** The key's width in px, so a face that says On and Off doesn't change width as it's pressed.
   *  Default: four characters. Inside, the key spans the row. */
  width?: number;
  /** `stacked`: a caption over a lit key. `inside`: one line, the caption at the left and the state
   *  (`children`) at the right; the reading lights, not the whole row. */
  layout?: 'stacked' | 'inside';
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. */
  hint?: string;
  /** The colour it lights in (any CSS colour, e.g. `var(--hue-2)`). Default `--selected`. */
  ink?: string;
}

/**
 * The tree Toggle draws: the root, the caption (when `name`), the key (a `label` Text as a button;
 * the face as the `children` slot when stacked) and, inside with `children`, the readout holding the
 * slot. Momentary keys listen for pointer and Space/Enter down and up (and leave while on); a
 * latching key for clicks. `children`: whether a face or reading was passed.
 */
export function toggleView(
  { on, disabled = false, label, name, momentary = false, width, layout = 'stacked', className, title, hint, ink }: ToggleModelProps,
  children: boolean,
): Node {
  const inside = layout === 'inside';
  const key = textNode(
    { as: 'button', role: 'label', leading: 'tight', tabular: true, className: `lib-toggle__key ${focusRing}` },
    {
      type: 'button',
      'data-part': 'key',
      'data-on': on ? 'true' : undefined,
      'aria-pressed': momentary ? undefined : String(on),
      'aria-label': label ?? name,
      disabled: disabled ? '' : undefined,
      title,
    },
    inside ? null : slot('children'),
  );
  key.on = momentary
    ? { pointerdown: 'down', pointerup: 'up', ...(on ? { pointerleave: 'up' } : {}), keydown: 'keyDown', keyup: 'keyUp' }
    : { click: 'flip' };
  return h(
    'div',
    {
      class: `lib-toggle${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-layout': layout,
      'data-on': on ? 'true' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
      'data-hint': hint || undefined,
      style: styleText({ '--lib-toggle-width': width === undefined ? undefined : `${width}px`, '--lib-toggle-ink': ink }),
    },
    name ? textNode({ role: 'body', size: inside ? 'label' : 'caption', case: 'label', className: 'lib-toggle__caption' }, { 'data-part': 'caption' }, name) : null,
    key,
    inside && children
      ? textNode({ role: 'body', size: 'label', weight: 'strong', tabular: true, className: 'lib-toggle__readout' }, { 'data-part': 'readout' }, slot('children'))
      : null,
  );
}

/** The callbacks `toggleView`'s tree names: a latching press, and a momentary key's down and up
 *  (from the keyboard, held while Space or Enter is down). Disabled asks nothing. */
export function toggleHandlers({ on, onChange, disabled = false }: ToggleModelProps): Handlers {
  const press = (next: boolean) => {
    if (!disabled) onChange(next);
  };
  const holdKey = (next: boolean) => (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) press(next);
  };
  return {
    flip: () => press(!on),
    down: () => press(true),
    up: () => press(false),
    keyDown: holdKey(true),
    keyUp: holdKey(false),
  };
}

/** Every Switch prop but its name beside it (a React node or a Svelte snippet). */
export interface SwitchModelProps {
  /** What it turns on. Required unless `children` labels it. */
  'aria-label'?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let the switch keep its own state from `defaultChecked`. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** What it does, as a tooltip (over the whole line when labelled). */
  title?: string;
  className?: string;
}

/**
 * The tree Switch draws: the switch (a button with `role="switch"`, its thumb a `handle` Surface)
 * or, `labelled`, a `body` Text label holding the name (the `children` slot) and the switch.
 * `own`: the switch's own value (the binding's view state), shown when `checked` is unset.
 */
export function switchView(
  { size = 'regular', disabled, checked, 'aria-label': ariaLabel, title, className }: SwitchModelProps,
  own: boolean,
  labelled: boolean,
): Node {
  const control = h(
    'button',
    {
      type: 'button',
      role: 'switch',
      class: `lib-switch lib-sized ${focusRing}${!labelled && className ? ` ${className}` : ''}`,
      'data-part': 'switch',
      'data-size': size,
      'aria-label': ariaLabel,
      'aria-checked': String(checked ?? own),
      disabled: disabled ? '' : undefined,
      title: labelled ? undefined : title,
    },
    surfaceNode({ as: 'span', material: 'handle', radius: 'pill', className: 'lib-switch__thumb' }, { 'data-part': 'thumb', 'aria-hidden': 'true' }),
  );
  control.on = { click: 'flip' };
  if (!labelled) return control;
  return textNode(
    { as: 'label', role: 'body', className: `lib-switch-row${className ? ` ${className}` : ''}` },
    { 'data-part': 'row', 'data-size': size, 'data-disabled': disabled ? 'true' : undefined, title },
    h('span', { class: 'lib-switch-row__name', 'data-part': 'name' }, slot('children')),
    control,
  );
}

/** The callback `switchView`'s tree names: a flip, asked through `onChange` and kept as the
 *  switch's own value (`setOwn`) when it isn't controlled. */
export function switchHandlers({ checked, onChange }: SwitchModelProps, own: boolean, setOwn: (next: boolean) => void): Handlers {
  const value = ownToggle(checked, own, setOwn, onChange);
  return { flip: () => value.set(!value.current) };
}
