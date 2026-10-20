<!--
  Opaque: the Svelte renderer of `opaqueView` (Hole.model.ts), the same element as React's
  `Opaque` (Surface.tsx, which says what it is for). Every layer inside draws its opaque fill and
  no backdrop (library.css), and no Surface inside draws a shader material (`setOpaque`,
  opaqueScope.svelte.ts, as React's `OpaqueContext`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { opaqueView } from './Hole.model';
  import { setOpaque } from './opaqueScope.svelte';
  import './Surface.css';

  let { class: className, style, children }: { class?: string; style?: string; children?: Snippet } = $props();

  setOpaque();
</script>

<div class={opaqueView(className).className} {style}>{@render children?.()}</div>
