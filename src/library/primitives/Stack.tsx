import { createContext, useContext, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { stackView, type StackModelProps } from './Stack.model';
import './Stack.css';

/**
 * What the controls inside a cluster should look like, set by where they sit rather than by a
 * per-use style: a toolbar `Group` provides `{ quiet: true }`, and a control that has a quiet
 * look (Select's trigger: text and a caret, no field) reads it. Anything that floats out of a
 * toolbar (a popover's panel) provides `CONTROL_FIELD` again, so its controls are fields.
 * It lives here, with the Stack, so controls (which build from primitives) can read it.
 */
export interface ControlContextValue {
  /** In a toolbar: drop field chrome, keep the hit target and the behaviour. */
  quiet: boolean;
}
export const CONTROL_FIELD: ControlContextValue = { quiet: false };
export const CONTROL_TOOLBAR: ControlContextValue = { quiet: true };
export const ControlContext = createContext<ControlContextValue>(CONTROL_FIELD);
/** The look the surrounding cluster asks of a control. */
export function useControlContext(): ControlContextValue {
  return useContext(ControlContext);
}

// The view is framework-free, in the model; `Stack.svelte` renders the same one.
export { stackView, type StackAlign, type StackJustify, type StackModelProps } from './Stack.model';

export interface StackProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'style' | 'children'>, Omit<StackModelProps, 'className'> {
  /** The element to render; default `div`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** A primitive, the Group tier's atom: a flex line of things with a scale step between them. Spacing
 * between things lives here, as `gap`, never as a margin on a control. It paints nothing and
 * sets no lengths of its own; its attributes (`data-direction`, `data-gap`, `data-align`,
 * `data-justify`, `data-wrap`) pick the rules in `Stack.css`. Groups are made of it.
 */
export function Stack({ direction, gap, align, justify, wrap, as: As = 'div', className, style, children, ...rest }: StackProps) {
  const view = stackView({ direction, gap, align, justify, wrap, className });
  return (
    <As {...rest} className={view.className} style={style} {...view.attrs}>
      {children}
    </As>
  );
}
