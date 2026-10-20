<!--
  The Svelte renderer of a view tree (tree.ts): every converted component's `.svelte` is one
  `<Tree tree={xView(props)} slots={…} handlers={…} />`. Recursive over `svelte:element`; the same
  DOM as Tree.tsx. An attachment mounts each element's `on` handlers and `bind` stores (mount.ts)
  and an effect gives them every new node and handlers.
-->
<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import Self from './Tree.svelte';
  import { SVG_NS, childKey, domAttrs, isNode, type Child, type Handlers, type Slot } from './Tree.model';
  import { mountNode, type Mounted } from './mount';
  import { stores as registry, type Stores } from './stores';

  interface Props {
    /** The view a model returned (or, inside, one of its children). */
    tree: Child;
    /** What fills each `slot(name)`: snippets. An unfilled slot draws nothing. */
    slots?: Record<string, Snippet | undefined>;
    /** The callbacks `on` and the store params name, by key. */
    handlers?: Handlers;
    /** The store registry (default: every registered store, `stores.ts`). */
    stores?: Stores;
    /** Inside an `svg`: elements take the SVG namespace. */
    svg?: boolean;
  }

  let { tree, slots = {}, handlers = {}, stores = registry, svg = false }: Props = $props();

  const node = $derived(typeof tree === 'object' && isNode(tree) ? tree : null);
  const inSvg = $derived(svg || node?.tag === 'svg');
  const attrs = $derived(domAttrs(node?.attrs));

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
    >{#each node.children ?? [] as child, i (childKey(child, i))}{#if child !== null}<Self tree={child} {slots} {handlers} {stores} svg={inSvg} />{/if}{/each}</svelte:element
  >{:else}{@render slots[(tree as Slot).slot]?.()}{/if}
