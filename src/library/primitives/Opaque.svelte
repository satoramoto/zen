<!--
  Opaque: the Svelte renderer of `opaqueView` (Surface.model.ts), the same element as React's
  `Opaque` (Surface.tsx, which says what it is for). Every layer inside draws its opaque fill and
  no backdrop (library.css). Svelte surfaces draw no shader yet, so there is no context to set.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { opaqueView } from './Surface.model';
  import './Surface.css';

  let { class: className, style, children }: { class?: string; style?: string; children?: Snippet } = $props();
</script>

<div class={opaqueView(className).className} {style}>{@render children?.()}</div>
