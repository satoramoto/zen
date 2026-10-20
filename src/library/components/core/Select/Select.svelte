<!--
  Select: the model's tree (`selectView`, Select.model.ts) drawn by the Svelte `Tree`, as
  `Select.tsx` draws it with the React one; see Select.tsx for the job and the parts. The keys,
  type-ahead, placement and dismissal are the `select` and `selectMenu` stores the tree binds
  (`selectInput.ts`); open and the highlighted row are kept here as view state (`viewState.ts`),
  the quiet look read from the surrounding cluster (`getControlContext`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { getControlContext } from '../../../primitives/control.svelte';
  import { viewState } from '../../music/viewState';
  import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import '../Popover/Popover.css';
  import './Select.css';

  let props: SelectModelProps = $props();
  const state = viewState(SELECT_CLOSED);
  const view = fromStore(state);
  const control = getControlContext();
  const id = $props.id();
</script>

<Tree tree={selectView(props, { ...view.current, quiet: control.quiet, id })} handlers={selectHandlers(props, state.set)} />
