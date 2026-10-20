<!--
  LampButton: the model's tree (`lampButtonView`, LampButton.model.ts) drawn by the Svelte `Tree`, as
  `LampButton.tsx` draws it with the React one; see LampButton.tsx for the job, the faces and the
  tuning knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { lampButtonHandlers, lampButtonView, type LampButtonModelProps } from './LampButton.model';
  import '../../../primitives/Text.css';
  import './LampButton.css';

  let props: LampButtonModelProps = $props();
</script>

<Tree tree={lampButtonView(props)} handlers={lampButtonHandlers(props)} />
