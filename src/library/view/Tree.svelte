<!--
  The Svelte renderer of a view tree (Tree.model.ts): every converted component's `.svelte` is one
  `<Tree tree={xView(props)} slots={…} handlers={…} />`. Recursive over `svelte:element`; the same
  DOM as Tree.tsx. An attachment mounts each element's `on` handlers, `bind` stores and form
  properties (mount.ts) and an effect gives them every new node and handlers. A component node draws
  the registered Svelte component through `TreeSlots`, which makes its slots snippets drawn in this tree.
-->
<script lang="ts">
  import { untrack, type Component, type Snippet } from 'svelte';
  import Self from './Tree.svelte';
  import TreeSlots from './TreeSlots.svelte';
  import { SVG_NS, childKey, componentProps, domAttrs, isComponent, isNode, isSlotFill, type Child, type Handlers, type Slot } from './Tree.model';
  import { mountNode, type Mounted } from './mount';
  import { stores as registry, type Stores } from './stores';
  import { svelteComponent } from './svelteComponents';

  interface Props {
    /** The view a model returned (or, inside, one of its children). */
    tree: Child;
    /** What fills each `slot(name)`: snippets. An unfilled slot draws nothing. */
    slots?: Record<string, Snippet | undefined>;
    /** The callbacks `on` and the store params name, by key. */
    handlers?: Handlers;
    /** The store registry (default: every registered store, `stores.ts`). */
    stores?: Stores;
    /** The component registry (default: `svelteComponents.ts`). */
    components?: (name: string) => Component<any>;
    /** Inside an `svg`: elements take the SVG namespace. */
    svg?: boolean;
  }

  let { tree, slots = {}, handlers = {}, stores = registry, components = svelteComponent, svg = false }: Props = $props();

  const node = $derived(typeof tree === 'object' && isNode(tree) ? tree : null);
  const part = $derived(typeof tree === 'object' && isComponent(tree) ? tree : null);
  const inSvg = $derived(svg || node?.tag === 'svg');
  const attrs = $derived(domAttrs(node?.attrs));

  /** A component node's props: its data, its `on` callbacks (the latest handler for each key) and
   *  any of this tree's own slots passed through. */
  const partProps = $derived.by(() => {
    if (!part) return {};
    const props = componentProps(part, (key) => handlers[key]);
    for (const [name, fill] of Object.entries(part.slots ?? {})) if (isSlotFill(fill)) props[name] = slots[fill.slot];
    return props;
  });
  /** Its slots filled with subtrees: `TreeSlots` makes each a snippet drawing it with this tree's context. */
  const partFills = $derived(
    Object.fromEntries(Object.entries(part?.slots ?? {}).filter((entry): entry is [string, (Child | null)[]] => !isSlotFill(entry[1]))),
  );

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

{#if typeof tree === 'string'}{tree}{:else if node}<svelte:element this={node.tag} xmlns={inSvg ? SVG_NS : undefined} {...attrs} {@attach attach}
    >{#each node.children ?? [] as child, i (childKey(child, i))}{#if child !== null}<Self
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
  />{:else}{@render slots[(tree as Slot).slot]?.()}{/if}
