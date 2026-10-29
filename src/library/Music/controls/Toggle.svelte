<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { toggleHandlers, toggleView, type ToggleModelProps } from './Toggle.model';
  import './pressables.css';
  let { children, ...props }: ToggleModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={toggleView(props, children !== undefined)} handlers={toggleHandlers(props)} slots={{ children }} />
