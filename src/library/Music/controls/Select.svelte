<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';
  import './pressables.css';
  let props: SelectModelProps = $props();
  const state = viewState(SELECT_CLOSED);
  const view = fromStore(state);
  const id = $props.id();
</script>

<Tree tree={selectView(props, { ...view.current, id })} handlers={selectHandlers(props, state.set)} />
