<!--
  HealthSlot: the model's tree (`healthSlotView`, HealthSlot.model.ts) drawn by the Svelte `Tree`,
  as `HealthSlot.tsx` draws it with the React one; see HealthSlot.tsx for the job and the states.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { healthSlotHandlers, healthSlotView, type HealthSlotModelProps } from './HealthSlot.model';
  import '../../primitives/Text.css';
  import './HealthSlot.css';

  let props: HealthSlotModelProps = $props();
</script>

<Tree tree={healthSlotView(props)} handlers={healthSlotHandlers(props)} />
