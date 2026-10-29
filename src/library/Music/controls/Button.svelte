<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { buttonHandlers, buttonView, type ButtonModelProps } from './Button.model';
  import './pressables.css';
  let { children, ...props }: ButtonModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={buttonView(props)} handlers={buttonHandlers(props)} slots={{ children }} />
