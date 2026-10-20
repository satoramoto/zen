<!--
  BarReadout: the model's tree (`barReadoutView`, BarReadout.model.ts) drawn by the Svelte `Tree`,
  as `BarReadout.tsx` draws it with the React one; see BarReadout.tsx for the job and the tuning
  knobs. The input (drag, wheel, keys, reset) is the `barInput` store the tree binds (`barInput.ts`),
  reporting its state (the local value, the drag) to this component's view state.
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../viewState';
  import { BAR_IDLE, barReadoutHandlers, barReadoutView, type BarReadoutModelProps } from './BarReadout.model';
  import type { BarState } from './barInput';
  import '../../../primitives/Text.css';
  import './BarReadout.css';

  let props: BarReadoutModelProps = $props();
  const bar = viewState<BarState>(BAR_IDLE);
  const state = fromStore(bar);
</script>

<Tree tree={barReadoutView(props, state.current)} handlers={barReadoutHandlers(props, bar.set)} />
