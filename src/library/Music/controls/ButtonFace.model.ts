import { flag, h, slot, styleText, wire, type Handlers, type Node } from '../../view/Tree.model';

/** The original shared action/switch surface. Native callbacks receive native DOM events. */
export interface ButtonFaceModelProps {
  lit?: boolean;
  size?: 'small' | 'medium';
  tone?: 'normal' | 'quiet' | 'danger';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  title?: string;
  id?: string;
  name?: string;
  value?: string | number;
  role?: string;
  tabIndex?: number;
  style?: Record<string, string | number | undefined>;
  [attribute: `aria-${string}`]: string | number | boolean | undefined;
  [attribute: `data-${string}`]: string | number | boolean | undefined;
  onClick?: (event: any) => void;
  onContextMenu?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onPointerUp?: (event: any) => void;
  onPointerCancel?: (event: any) => void;
  onPointerLeave?: (event: any) => void;
  onLostPointerCapture?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onKeyUp?: (event: any) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
}

export function buttonFaceView({ lit, size, tone = 'normal', className = '', style, ...props }: ButtonFaceModelProps): Node {
  const pressed = props['aria-pressed'];
  const toggle = lit !== undefined || pressed !== undefined;
  const attrs: Record<string, string | undefined> = {};
  const on: Record<string, string> = {};
  for (const [name, value] of Object.entries(props)) {
    if (/^on[A-Z]/.test(name)) {
      if (typeof value === 'function') on[name.slice(2).toLowerCase()] = name;
    } else if (value !== undefined) {
      attrs[name === 'tabIndex' ? 'tabindex' : name] = typeof value === 'boolean' ? name === 'disabled' ? value ? '' : undefined : flag(value) : String(value);
    }
  }
  return wire(h('button', {
    ...attrs,
    type: props.type ?? 'button',
    class: `wdg-body ${toggle ? 'wdg-toggle-body' : 'wdg-button-body'} ${className}`,
    'data-tone': tone,
    'data-size': size,
    'data-on': (lit ?? (pressed === true || pressed === 'true')) ? '' : undefined,
    style: styleText(style && Object.fromEntries(Object.entries(style).map(([name, value]) => [name, value === undefined ? undefined : String(value)]))),
  }, slot('children')), { on });
}

export function buttonFaceHandlers(props: ButtonFaceModelProps): Handlers {
  return Object.fromEntries(Object.entries(props).filter(([name, value]) => /^on[A-Z]/.test(name) && typeof value === 'function'));
}
