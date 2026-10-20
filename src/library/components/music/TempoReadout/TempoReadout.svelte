<!--
  TempoReadout: the model's tree (`tempoReadoutView`, TempoReadout.model.ts) drawn by the Svelte
  `Tree`, as `TempoReadout.tsx` draws it with the React one; see TempoReadout.tsx for the job and
  the tuning knobs. The drag, wheel, keys and + / − holds are the `tempoNumber` and `tempoStep`
  stores the tree binds (`tempoGestures.ts`); the tooltips are the `tip` store.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { tempoReadoutHandlers, tempoReadoutView, type TempoReadoutModelProps } from './TempoReadout.model';
  import '../../../primitives/Text.css';
  import './TempoReadout.css';

  let props: TempoReadoutModelProps = $props();
</script>

<Tree tree={tempoReadoutView(props)} handlers={tempoReadoutHandlers(props)} />
