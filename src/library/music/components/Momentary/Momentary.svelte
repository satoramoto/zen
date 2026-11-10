<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { momentaryHandlers, momentaryView, type MomentaryModelProps } from './Momentary.model';
  import '../pressables.css';
  let { children, ...props }: MomentaryModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={momentaryView(props)} handlers={momentaryHandlers(props)} slots={{ children }} />
