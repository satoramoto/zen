<!--
  Story helper (not shipped): a story's instances (`items`, each over `args`) in a wrapping row,
  as the React stories lay out several instances (`display: flex`, `gap: var(--space-2)`).
-->
<script lang="ts">
  import type { Component } from 'svelte';
  import Render from './Render.svelte';

  interface Props {
    component: Component<any>;
    args?: Record<string, unknown>;
    items?: Record<string, unknown>[];
  }

  let { component, args = {}, items = [{}] }: Props = $props();
</script>

<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2)">
  {#each items as item, i (i)}<Render {component} props={{ ...args, ...item }} />{/each}
</div>
