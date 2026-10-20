<!--
  Hole: the Svelte renderer of `holeView` (Hole.model.ts), the same element and attributes as
  React's `Hole` (Surface.tsx): a cut-out through every layer to what's behind the page.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { holeView } from './Hole.model';
  import './Surface.css';

  let { class: className, style, name, children }: { class?: string; style?: string; name?: string; children?: Snippet } = $props();

  const view = $derived(holeView(className, name));
</script>

<div class={view.className} {...view.attrs} {style}>{@render children?.()}</div>
