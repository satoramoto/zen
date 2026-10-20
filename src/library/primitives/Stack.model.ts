// Stack's model: the view a renderer draws (its class and `data-*` attributes). No framework:
// `Stack.tsx` (React) and `Stack.svelte` (Svelte) both render `stackView`.
import type { Step } from './step';
import type { ElementView, TreeChildren } from './Text.model';
import { h, type Node } from '../view/Tree.model';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

/** What Stack decides from, in any framework. */
export interface StackModelProps {
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
  /** Classes added after the Stack's own. */
  className?: string;
}

/** Stack's element: `lib-stack` plus the caller's class, and the attributes `Stack.css` reads. */
export function stackView({ direction = 'column', gap = 2, align, justify, wrap = false, className }: StackModelProps): ElementView {
  return {
    className: `lib-stack${className ? ` ${className}` : ''}`,
    attrs: {
      'data-direction': direction,
      'data-gap': String(gap),
      'data-align': align,
      'data-justify': justify,
      'data-wrap': wrap ? 'true' : undefined,
    },
  };
}

/**
 * Stack as a view-tree element, for a model to inline: `stackNode({ direction: 'row' }, {},
 * ...children)` is the element `<Stack direction="row">` draws, its attributes (`attrs`, after
 * Stack's own) and children added. The same DOM as the `Stack` component, with no component in between.
 */
export function stackNode(props: StackModelProps & { as?: string }, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = stackView(props);
  return h(props.as ?? 'div', { class: view.className, ...view.attrs, ...attrs }, ...children);
}
