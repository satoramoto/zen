<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { contextControlsHandlers, contextControlsView, type ContextControlsModelProps } from './ContextControls.model';
  import '../controls/pressables.css';
  let { children, face, ...props }: ContextControlsModelProps & { children?: Snippet; face?: Snippet } = $props();
  const state = viewState(false);
  const view = fromStore(state);
  const id = $props.id();
</script>

<Tree tree={contextControlsView(props, { open: view.current, id })} handlers={contextControlsHandlers(props, state.set)} slots={{ children, face }} />
