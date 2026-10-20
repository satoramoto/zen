// Popover's model: its props, the tree it draws from them (the positioned box, a body Text in the
// top layer, holding the float Layer with the `children` slot) and the handlers that tree names. No
// framework: `Popover.tsx` (React) and `Popover.svelte` (Svelte) both pass `popoverView` and
// `popoverHandlers` to their `Tree`; placement and dismissal are the `popover` store (`placement.ts`),
// moving it into the theme scope the `portal` store (`portal.ts`).
import { layerView } from '../../../layout/Layer.model';
import { textView } from '../../../primitives/Text.model';
import { h, wire, type Bind, type Handlers, type Node } from '../../../view/Tree.model';
import type { HoverPanel } from './hoverIntent';
import { portalTarget, resolveAnchor, resolveElement, type Dismissal, type ElementRef, type PopoverAnchor } from './placement';

/** The props that are data: what the tree is drawn from. */
export interface PopoverModelProps {
  role?: string;
  /** The panel's accessible name. */
  label?: string;
  id?: string;
  /** On the panel: how wide it is, whether its rows scroll. */
  className?: string;
  /** The box and the panel as `span`s, so it may sit inside running text. */
  inline?: boolean;
  /** Rendered into the theme scope around a live anchor (else `document.body`) instead of in place. */
  portal?: boolean;
  /** The panel takes a hover intent's half: its pointer enter and leave reach it. */
  hover?: boolean;
}

/** Everything a binding passes: the data, and what it hangs from, how it goes away, its shield and
 *  its hover half (functions and refs, which reach the tree through `popoverHandlers`). */
export interface PopoverBindingProps extends Omit<PopoverModelProps, 'hover'> {
  anchor: PopoverAnchor;
  onDismiss?(how: Dismissal): void;
  within?: ElementRef | Element | null;
  hover?: HoverPanel;
}

/**
 * The tree Popover draws: the positioned box (a body `Text`, `lib-popover`, `popover="manual"`,
 * `data-part="popover"`) holding the float `Layer` (`lib-popover__panel` plus the caller's class,
 * its `role`, `aria-label` and `id`) with the `children` slot; both `span`s when `inline`. The box
 * binds `popover` (placement and dismissal) and, when `portal`, first `portal` (moved into the theme
 * scope), inside an empty `display: contents` span that stays where it is mounted; with `hover`, its
 * pointer enter and leave call `hoverEnter` and `hoverLeave`.
 */
export function popoverView({ role, label, id, className, inline = false, portal = false, hover = false }: PopoverModelProps): Node {
  const tag = inline ? 'span' : 'div';
  const text = textView({ role: 'body', className: 'lib-popover' });
  const bind: Bind[] = [];
  if (portal) bind.push(['portal', { into: 'portalTarget' }]);
  bind.push(['popover', { anchor: 'anchor', within: 'within', onDismiss: 'dismiss' }]);
  const box = wire(
    h(
      tag,
      { class: text.className, ...text.attrs, popover: 'manual', 'data-part': 'popover' },
      // Both `Tree`s draw a component node as a child as they do anywhere (typed as their `Node`).
      layerView({
        level: 'float',
        as: tag,
        className: `lib-popover__panel${className ? ` ${className}` : ''}`,
        'data-part': 'panel',
        role,
        'aria-label': label,
        id,
      }),
    ),
    { ...(hover ? { on: { pointerenter: 'hoverEnter', pointerleave: 'hoverLeave' } } : {}), bind },
  );
  return portal ? h('span', { 'data-part': 'portal', style: 'display: contents' }, box) : box;
}

/** The callbacks `popoverView`'s tree names: the anchor, the shield and the portal's target as they
 *  are now, `dismiss`, and the hover half's pointer enter and leave. */
export function popoverHandlers(props: PopoverBindingProps): Handlers {
  return {
    anchor: () => resolveAnchor(props.anchor),
    within: () => resolveElement(props.within),
    portalTarget: () => portalTarget(props.anchor),
    dismiss: (how: Dismissal) => props.onDismiss?.(how),
    hoverEnter: (e: PointerEvent) => props.hover?.onPointerEnter(e),
    hoverLeave: (e: PointerEvent) => props.hover?.onPointerLeave(e),
  };
}
