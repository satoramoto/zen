<!--
  Readout: the model's tree (`readoutView`, Readout.model.ts) drawn by the Svelte `Tree`, as
  `Readout.tsx` draws it with the React one; see Readout.tsx for the job. The drag, wheel and keys
  are the `readoutAdjust` store the tree binds (`adjust.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { readoutHandlers, readoutView, type ReadoutModelProps } from './Readout.model';
  import '../../../primitives/Text.css';
  import './Readout.css';

  let props: ReadoutModelProps = $props();
</script>

<Tree tree={readoutView(props)} handlers={readoutHandlers(props)} />
