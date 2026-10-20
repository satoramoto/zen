<!--
  AccentBlock: the model's tree (`accentBlockView`, AccentBlock.model.ts) drawn by the Svelte
  `Tree`, as `AccentBlock.tsx` draws it with the React one; see AccentBlock.tsx for the job. The
  tooltip is the kernel's `tip` store, bound from the tree.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { accentBlockHandlers, accentBlockView, type AccentBlockModelProps } from './AccentBlock.model';
  import '../../primitives/Text.css';
  import './AccentBlock.css';

  let props: AccentBlockModelProps = $props();
</script>

<Tree tree={accentBlockView(props)} handlers={accentBlockHandlers(props)} />
