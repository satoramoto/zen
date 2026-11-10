<!--
  WaitingChip: the model's tree (`waitingChipView`, WaitingChip.model.ts) drawn by the Svelte
  `Tree`, as `WaitingChip.tsx` draws it with the React one; see WaitingChip.tsx for the job and the
  tuning knobs. A blank label draws nothing.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { waitingChipView, type WaitingChipModelProps } from './WaitingChip.model';
  import '../../../primitives/Text/Text.css';
  import './WaitingChip.css';

  let props: WaitingChipModelProps = $props();
  const tree = $derived(waitingChipView(props));
</script>

{#if tree}<Tree {tree} />{/if}
