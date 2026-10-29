export interface DeckHostParams {
  captures: readonly string[];
  onCapture?(event: Event): unknown;
}

/** The tree's normal `on` handles bubbling; native host capture listeners retain their phase. */
export function bindDeckHost(node: HTMLElement, initial: DeckHostParams) {
  let params = initial;
  let events = new Set<string>();
  const listener = (event: Event) => params.onCapture?.(event);
  const update = (next: DeckHostParams) => {
    params = next;
    const wanted = new Set(next.captures);
    for (const type of events) if (!wanted.has(type)) node.removeEventListener(type, listener, true);
    for (const type of wanted) if (!events.has(type)) node.addEventListener(type, listener, true);
    events = wanted;
  };
  update(initial);
  return { update, destroy() { for (const type of events) node.removeEventListener(type, listener, true); } };
}
