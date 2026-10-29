<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { untrack } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { parameterHostHandlers, parameterHostView, type ParameterHarnessProps, type ParameterHostState } from './KnobHarness.model';
  let props: ParameterHarnessProps = $props();
  const state = viewState<ParameterHostState>(untrack(() => ({ given: props.value, value: props.value, depth: props.depth })));
  const held = fromStore(state);
</script>
<Tree tree={parameterHostView(props, held.current)} handlers={parameterHostHandlers(props, state.get, state.set)} />
