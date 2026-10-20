<!--
  The Svelte renderer of a view tree (Tree.model.ts): every converted component's `.svelte` is one
  `<Tree tree={xView(props)} slots={…} handlers={…} />`. Recursive over `svelte:element`; the same
  DOM as Tree.tsx. An attachment mounts each element's `on` handlers, `bind` stores and form
  properties (mount.ts) and an effect gives them every new node and handlers. A component node draws
  the registered Svelte component through `TreeSlots`, which makes its slots snippets drawn in this
  tree. A fragment (a list of roots) draws each. `ref` binds the root element, and any other prop
  (native attributes, handlers, attachments) lands on it after the tree's own attributes (on a
  component root: its props). Inside a branch every read of `node` is null-safe: a tree that
  changes in the same flush as the first mount (a store setting state as it mounts) can run the
  element's expressions once more after `node` went before the branch is torn down.
-->
<script lang="ts">
  import { untrack, type Component, type Snippet } from 'svelte';
  import Self from './Tree.svelte';
  import TreeSlots from './TreeSlots.svelte';
  import { SVG_NS, VOID, childKey, componentProps, domAttrs, isComponent, isNode, isSlotFill, type Child, type Handlers, type Root, type Slot } from './Tree.model';
  import { mountNode, type Mounted } from './mount';
  import { stores as registry, type Stores } from './stores';
  import { svelteComponent } from './svelteComponents';

  interface Props {
    /** The view a model returned (or, inside, one of its children): any child, or a fragment. */
    tree: Root;
    /** What fills each `slot(name)`: snippets, rendered with the slot's arguments. An unfilled slot draws nothing. */
    slots?: Record<string, Snippet<any> | undefined>;
    /** The callbacks `on` and the store params name, by key. */
    handlers?: Handlers;
    /** The store registry (default: every registered store, `stores.ts`). */
    stores?: Stores;
    /** The component registry (default: `svelteComponents.ts`). */
    components?: (name: string) => Component<any>;
    /** Inside an `svg`: elements take the SVG namespace. */
    svg?: boolean;
    /** The root element (`bind:ref`). */
    ref?: Element | null;
    /** Anything else lands on the root. */
    [native: string]: unknown;
  }

  let { tree, slots = {}, handlers = {}, stores = registry, components = svelteComponent, svg = false, ref = $bindable(null), ...native }: Props = $props();

  const many = $derived(Array.isArray(tree) ? tree : null);
  const one = $derived(Array.isArray(tree) ? null : (tree as Child));
  const node = $derived(one !== null && typeof one === 'object' && isNode(one) ? one : null);
  const part = $derived(one !== null && typeof one === 'object' && isComponent(one) ? one : null);
  const hole = $derived(one !== null && typeof one === 'object' && !node && !part ? (one as Slot) : null);
  const inSvg = $derived(svg || node?.tag === 'svg');
  const attrs = $derived(domAttrs(node?.attrs));

  /** A component node's props: its data, its `on` callbacks (the handler for each key), any of this
   *  tree's own slots passed through, and, at the root, the props given to `Tree`. */
  const partProps = $derived.by(() => {
    if (!part) return {};
    const props = componentProps(part, (key) => handlers[key]);
    for (const [name, fill] of Object.entries(part.slots ?? {})) if (isSlotFill(fill)) props[name] = slots[fill.slot];
    return { ...props, ...native };
  });
  /** Its slots filled with subtrees: `TreeSlots` makes each a snippet drawing it with this tree's context. */
  const partFills = $derived(
    Object.fromEntries(Object.entries(part?.slots ?? {}).filter((entry): entry is [string, (Child | null)[]] => !isSlotFill(entry[1]))),
  );
  /** A slot's arguments (`slot(name, args)`), rendered with its snippet. */
  const args = $derived(hole?.args ?? []);

  let mounted: Mounted | null = null;
  const attach = (element: Element) => {
    // `xmlns` only picks the namespace: React sets no such attribute, so neither does the DOM here.
    if (element.hasAttribute('xmlns')) element.removeAttribute('xmlns');
    mounted = untrack(() => (node ? mountNode(element, node, { handlers, stores }) : null));
    return () => {
      mounted?.destroy();
      mounted = null;
    };
  };
  $effect(() => {
    const next = node;
    const context = { handlers, stores };
    untrack(() => {
      if (next) mounted?.update(next, context);
    });
  });
</script>

{#if many}{#each many as child, i (childKey(child, i))}{#if child !== null}<Self
        tree={child}
        {slots}
        {handlers}
        {stores}
        {components}
        {svg}
      />{/if}{/each}{:else if typeof one === 'string'}{one}{:else if node}<svelte:element
    this={node?.tag}
    xmlns={inSvg ? SVG_NS : undefined}
    {...attrs}
    {...native}
    bind:this={ref}
    {@attach attach}
    >{#each !node || VOID.has(node.tag) ? [] : (node.children ?? []) as child, i (childKey(child, i))}{#if child !== null}<Self
          tree={child}
          {slots}
          {handlers}
          {stores}
          {components}
          svg={inSvg}
        />{/if}{/each}</svelte:element
  >{:else if part}<TreeSlots
    drawn={components(part.component)}
    props={partProps}
    fills={partFills}
    names={Object.keys(partFills)}
    {slots}
    {handlers}
    {stores}
    {components}
    svg={inSvg}
  />{:else if hole}{@render slots[hole.slot]?.(args[0], args[1], args[2])}{/if}
