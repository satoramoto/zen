<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { labelView, type LabelModelProps } from './Label.model';
  import './pressables.css';
  let { children, ...props }: LabelModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={labelView(props)} slots={{ children }} />
