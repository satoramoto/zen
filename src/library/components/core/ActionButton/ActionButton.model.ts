// ActionButton's model: its props, the tree it draws (the root, the caption, the face holding the
// `children` slot) and the handlers that tree names; and ButtonFace's tree, the pressable face both
// draw. No framework: `ActionButton.tsx` (React) and `ActionButton.svelte` (Svelte) both pass
// `actionButtonView` to their `Tree`.
import { focusRing } from '../../../primitives/Ring';
import { textNode, textView, type TreeChildren } from '../../../primitives/Text.model';
import { h, slot, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';

export type ActionTone = 'normal' | 'quiet' | 'danger';

/** What the face decides from (each binding adds the native attributes, events and children). */
export interface ButtonFaceModelProps {
  /** On or off, for a face that is a switch. Set (true or false), the face is a toggle. */
  lit?: boolean;
  /** Smaller than the control height, for dense rows. Left out, the face is `--control-h` tall. */
  size?: 'small' | 'medium';
  /** How loudly it asks to be noticed. Default `normal`. */
  tone?: ActionTone;
  /** Classes after the face's own. */
  className?: string;
  /** The ARIA role. */
  ariaRole?: string;
  /** `aria-pressed`: set, the face is a toggle, on when true. */
  pressed?: boolean | 'true' | 'false' | 'mixed';
  /** The button's `type`; default `button`. */
  type?: string;
}

/**
 * The face: a label Text `<button>` (tight leading, no case) in the key material, with `attrs` (the
 * caller's native attributes, which may rename `data-part`) and `children`. `data-tone` is the
 * action tone, which replaces Text's ink tone (none is set, the class sets the ink).
 */
export function buttonFaceView(
  { lit, size, tone = 'normal', className = '', ariaRole, pressed, type }: ButtonFaceModelProps,
  attrs: Record<string, string | undefined> = {},
  ...children: TreeChildren
): Node {
  const toggle = lit !== undefined || pressed !== undefined;
  const on = lit ?? (pressed === true || pressed === 'true');
  const text = textView({ role: 'label', leading: 'tight', case: 'none', ariaRole, className: `lib-action-button-face ${focusRing}${className ? ` ${className}` : ''}` });
  return h(
    'button',
    {
      class: text.className,
      ...text.attrs,
      'data-part': 'face',
      ...attrs,
      type: type ?? 'button',
      'aria-pressed': pressed === undefined ? undefined : String(pressed),
      'data-kind': toggle ? 'toggle' : 'button',
      'data-tone': tone,
      'data-size': size,
      'data-on': on ? '' : undefined,
    },
    ...children,
  );
}

/** Every ActionButton prop but its children (a React node or a Svelte snippet, so each renderer adds its own). */
export interface ActionButtonModelProps {
  /** It happened. The event carries the modifiers held while it did. */
  onPress(event: MouseEvent): void;
  disabled?: boolean;
  /** For assistive technology. Defaults to the caption, then to the children. */
  label?: string;
  /** Printed caption above, for a button that sits in a row beside captioned controls. */
  name?: string;
  tone?: ActionTone;
  /** In px. The children are the caller's and can be any length. */
  width?: number;
  className?: string;
  title?: string;
  /** A sentence for a hint strip, on the root as `data-hint`. Left out, a strip falls back to `title`. */
  hint?: string;
}

/** The root (hint, width), the caption when `name` is given, then the face holding the `children` slot. */
export function actionButtonView({ disabled = false, label, name, tone = 'normal', width, className, title, hint }: Omit<ActionButtonModelProps, 'onPress'>): Node {
  return h(
    'div',
    {
      class: `lib-action-button${className ? ` ${className}` : ''}`,
      'data-hint': hint,
      style: width === undefined ? undefined : styleText({ '--lib-action-button-width': `${width}px` }),
    },
    name ? textNode({ role: 'caption', leading: 'tight', case: 'label', className: 'lib-action-button__caption' }, { 'data-part': 'caption' }, name) : null,
    wire(buttonFaceView({ tone, type: 'button' }, { 'aria-label': label ?? name, disabled: disabled ? '' : undefined, title }, slot('children')), {
      on: { click: 'press' },
    }),
  );
}

/** The handlers ActionButton's tree names: `press` is `onPress`. */
export function actionButtonHandlers({ onPress }: Pick<ActionButtonModelProps, 'onPress'>): Handlers {
  return { press: (event: MouseEvent) => onPress(event) };
}

/** A native prop as a DOM attribute name: `data-*` and `aria-*` as is, `htmlFor` as `for`, others lower case (`tabIndex` → `tabindex`). */
const attrName = (prop: string) => (prop.startsWith('data-') || prop.startsWith('aria-') ? prop : prop === 'htmlFor' ? 'for' : prop.toLowerCase());

/** An event prop's DOM event: `onClick` → `click`, `onPointerDown` → `pointerdown`, `onDoubleClick` → `dblclick`. */
const eventName = (prop: string) => (prop === 'onDoubleClick' ? 'dblclick' : prop.slice(2).toLowerCase());

/** A style object (`{ minWidth: '2px', '--x': 1 }`) as declarations (`min-width: 2px; --x: 1`). */
const styleDecls = (style: Record<string, unknown>) =>
  styleText(
    Object.fromEntries(
      Object.entries(style).map(([name, value]) => [name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), value === undefined || value === null ? undefined : String(value)]),
    ),
  );

/**
 * A face's native props as the tree takes them: event props (`onClick`, `onpointerdown`) become
 * `on` entries keyed by the prop's name with the callbacks as `handlers`; every other prop an
 * attribute (true `''`, false or nullish none, `data-*` and `aria-*` spelled out, a style object as
 * its declarations).
 */
export function faceWiring(props: Record<string, unknown>): { attrs: Record<string, string | undefined>; on: Record<string, string>; handlers: Handlers } {
  const attrs: Record<string, string | undefined> = {};
  const on: Record<string, string> = {};
  const handlers: Handlers = {};
  for (const [prop, value] of Object.entries(props)) {
    if (typeof value === 'function' && /^on[a-zA-Z]/.test(prop)) {
      on[eventName(prop)] = prop;
      handlers[prop] = value as Handlers[string];
    } else if (prop === 'style' && typeof value === 'object' && value !== null) {
      attrs.style = styleDecls(value as Record<string, unknown>);
    } else if (prop.startsWith('data-') || prop.startsWith('aria-')) {
      attrs[prop] = value === undefined || value === null ? undefined : String(value);
    } else if (value === true) {
      attrs[attrName(prop)] = '';
    } else if (value !== false && value !== undefined && value !== null && typeof value !== 'function' && typeof value !== 'object') {
      attrs[attrName(prop)] = String(value);
    }
  }
  return { attrs, on, handlers };
}
