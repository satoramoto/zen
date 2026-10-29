export interface Element {
  kind: 'column' | 'row' | 'text' | 'button' | 'section' | 'slider' | 'toggle' | 'select' | 'input';
  children: Element[];
  key?: string;
  label?: string;
  detail?: string;
  action?: string;
  payload?: unknown;
  value?: string | number | boolean;
  options?: {label: string; value: string}[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  selected?: boolean;
  tone?: 'muted' | 'danger';
  grow?: boolean;
  focusKey?: string;
  cursor?: boolean;
  dialog?: boolean;
  allowEmpty?: boolean;
}
export function element(kind: Element['kind'], props?: Partial<Element>, children?: Element[]): Element;
export function column(children: Element[], props?: Partial<Element>): Element;
export function row(children: Element[], props?: Partial<Element>): Element;
export function text(label: string, props?: Partial<Element>): Element;
export function button(label: string, action: string, props?: Partial<Element>): Element;
export function section(label: string, children: Element[]): Element;
export function control(kind: Element['kind'], label: string, value: Element['value'], action: string, props?: Partial<Element>): Element;
