// A Svelte snippet that takes arguments, bound to them, so a view tree's `slot(name)` (which draws
// its snippet with none) can draw it: Region's body `children(chosenId)`, an assembled screen's
// region `(form, placed)`. Svelte 5 calls a snippet with its anchor and then one getter per
// argument; the bound snippet passes `args` as those getters, read when the snippet reads them, so
// they stay live.
import type { Snippet } from 'svelte';

/** `snippet` with its arguments given as getters: a snippet of no arguments, or undefined without one. */
export function bindSnippet<A extends unknown[]>(snippet: Snippet<A> | undefined, ...args: { [K in keyof A]: () => A[K] }): Snippet | undefined {
  if (!snippet) return undefined;
  const draw = snippet as unknown as (anchor: unknown, ...getters: (() => unknown)[]) => void;
  return ((anchor: unknown) => draw(anchor, ...args)) as unknown as Snippet;
}
