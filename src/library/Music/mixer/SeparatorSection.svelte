<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { mixerSectionView } from './Separator.model';
  let { className, children }: { className: string; children?: Snippet } = $props();
</script>

<Tree tree={mixerSectionView({ className })} slots={{ children }} />
