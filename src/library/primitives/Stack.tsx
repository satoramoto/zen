import { createContext, useContext, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import type { Step } from './step';
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

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'style' | 'children'> {
  /** How the children flow: a column (default) or a row. */
  direction?: 'row' | 'column';
  /** The space between children as a scale step: `0` none, 1–6 are `--space-1` to `--space-6`. Default `2`. */
  gap?: Step;
  /** Cross-axis alignment (`align-items`). Unset leaves the flex default (stretch). */
  align?: StackAlign;
  /** Main-axis distribution (`justify-content`); `between` and `around` are `space-*`. */
  justify?: StackJustify;
  /** Wrap children onto more lines when the line is full. */
  wrap?: boolean;
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
export function Stack({
  direction = 'column',
  gap = 2,
  align,
  justify,
  wrap = false,
  as: As = 'div',
  className,
  style,
  children,
  ...rest
}: StackProps) {
  return (
    <As
      {...rest}
      className={`lib-stack${className ? ` ${className}` : ''}`}
      style={style}
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
    >
      {children}
    </As>
  );
}
