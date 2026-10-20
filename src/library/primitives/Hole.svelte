<!--
  Hole: the Svelte binding of `holeNode` (Hole.model.ts), the same tree as React's `Hole`
  (Surface.tsx): a cut-out through every layer to what's behind the page.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { slot } from '../view/Tree.model';
  import { holeNode } from './Hole.model';
  import './Surface.css';

  let { class: className, style, name, children }: { class?: string; style?: string; name?: string; children?: Snippet } = $props();
</script>

<Tree tree={holeNode(className, name, {}, slot('children'))} slots={{ children }} {style} />
