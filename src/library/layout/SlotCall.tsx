import type { ReactNode } from 'react';

// SlotCall: a slot whose content takes arguments, drawn from a view tree. A model draws it as
// `component('SlotCall', { args }, { slots: { content: slot(name) } })`, passing one of its own
// slots through as `content`: Region's body (the chosen view's id), an assembled screen's region
// (the chosen form and the placed region). `SlotCall.svelte` renders a snippet the same way.

export interface SlotCallProps {
  /** The slot's content: a node, or a function of `args` (an assembled screen's `RegionContent`). */
  content?: ReactNode | ((...args: any[]) => ReactNode);
  /** What `content` is called with, when it is a function. */
  args?: unknown[];
}

/** `content`, called with `args` when it is a function. Draws no element of its own. */
export function SlotCall({ content, args = [] }: SlotCallProps) {
  return typeof content === 'function' ? content(...args) : (content ?? null);
}
