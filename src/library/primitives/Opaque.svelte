<!--
  Opaque: the Svelte binding of `opaqueTree` (Hole.model.ts), the same tree as React's `Opaque`
  (Surface.tsx, which says what it is for). Every layer inside draws its opaque fill and no backdrop
  (library.css), and no Surface inside draws a shader material: the tree's `Context` (`opaque`)
  sets `setOpaque` (opaqueScope.svelte.ts), as React's `OpaqueContext`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { opaqueTree } from './Hole.model';
  import './Surface.css';

  let { class: className, style, children }: { class?: string; style?: string; children?: Snippet } = $props();
</script>

<Tree tree={opaqueTree(className, style)} slots={{ children }} />
