<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { viewState } from '../../../foundation/view/viewState';
  import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';
  import '../pressables.css';
  let props: SelectModelProps = $props();
  const state = viewState(SELECT_CLOSED);
  const view = fromStore(state);
  const id = $props.id();
</script>

<Tree tree={selectView(props, { ...view.current, id })} handlers={selectHandlers(props, state.set)} />
