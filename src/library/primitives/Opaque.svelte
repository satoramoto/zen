<!--
  Opaque: the Svelte binding of `opaqueTree` (Hole.model.ts), the same tree as React's `Opaque`
  (Surface.tsx, which says what it is for). Every layer inside draws its opaque fill and no backdrop
  (library.css). Svelte surfaces draw no shader yet, so its `opaque` context has nothing to set.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { opaqueTree } from './Hole.model';
  import './Surface.css';

  let { class: className, style, children }: { class?: string; style?: string; children?: Snippet } = $props();
</script>

<Tree tree={opaqueTree(className, style)} slots={{ children }} />
