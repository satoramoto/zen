<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { initialTransportHost, transportHostHandlers, transportHostView, type TransportStoryArgs } from './TransportHarness.model';
  import '../controls/pressables.css';
  import './Transport.css';

  let props: TransportStoryArgs = $props();
  const state = viewState(untrack(() => initialTransportHost(props)));
  const held = fromStore(state);
</script>

<Tree tree={transportHostView(props, held.current)} handlers={transportHostHandlers(props, held.current, state.get, state.set)} />
