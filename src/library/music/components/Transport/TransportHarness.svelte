<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { viewState } from '../../../foundation/view/viewState';
  import { initialTransportHost, transportHostHandlers, transportHostView, type TransportStoryArgs } from './TransportHarness.model';
  import '../pressables.css';
  import './Transport.css';

  let props: TransportStoryArgs = $props();
  const state = viewState(untrack(() => initialTransportHost(props)));
  const held = fromStore(state);
</script>

<Tree tree={transportHostView(props, held.current)} handlers={transportHostHandlers(props, held.current, state.get, state.set)} />
