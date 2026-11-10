<!--
  Tree.svelte's helper for a component node's slots: draws `drawn` with `props`, after turning each
  slot fill in `fills` (named by `names`) into a snippet. One slot per level: this level declares a
  snippet for `names[0]` that draws its subtree with `Tree`, adds it to the props and recurses on the
  rest, so every snippet is an ordinary `{#snippet}` that the child renders with `{@render}`. No DOM
  of its own.
-->
<script lang="ts">
  import type { Component } from 'svelte';
  import Self from './TreeSlots.svelte';
  import Tree from './Tree.svelte';
  import { childKey, type Child, type Handlers } from './Tree.model';
  import type { Stores } from './stores';

  interface Props {
    drawn: Component<any>;
    props: Record<string, unknown>;
    fills: Record<string, (Child | null)[]>;
    names: string[];
    slots: Record<string, unknown>;
    handlers: Handlers;
    stores: Stores;
    components: (name: string) => Component<any>;
    svg: boolean;
  }

  let { drawn, props, fills, names, slots, handlers, stores, components, svg }: Props = $props();
  const name = $derived(names[0]);
</script>

{#snippet fill()}{#each fills[name] ?? [] as child, i (childKey(child, i))}{#if child !== null}<Tree
        tree={child}
        slots={slots as Record<string, any>}
        {handlers}
        {stores}
        {components}
        {svg}
      />{/if}{/each}{/snippet}

{#if names.length === 0}{@const Drawn = drawn}<Drawn {...props} />{:else}<Self
    {drawn}
    props={{ ...props, [name]: fill }}
    {fills}
    names={names.slice(1)}
    {slots}
    {handlers}
    {stores}
    {components}
    {svg}
  />{/if}
