<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { transportHandlers, transportView, type TransportModelProps, type TransportUnit } from './Transport.model';
  import '../controls/pressables.css';
  import './Transport.css';

  let { children, ...props }: TransportModelProps & { children?: Snippet } = $props();
  const state = viewState<TransportUnit>('beats');
  const unit = fromStore(state);
</script>

<Tree tree={transportView(props, unit.current)} handlers={transportHandlers(props, state.set)} slots={{ children }} />
