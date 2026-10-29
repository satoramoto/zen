<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { popupHandlers, popupView, type PopupModelProps } from './Popup.model';
  import './pressables.css';
  let { children, ...props }: PopupModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={popupView(props)} handlers={popupHandlers(props)} slots={{ children }} />
