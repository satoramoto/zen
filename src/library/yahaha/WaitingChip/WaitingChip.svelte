<!--
  WaitingChip: the Svelte renderer of `waitingChipView` (WaitingChip.model.ts), the same markup,
  classes and attributes as `WaitingChip.tsx`; see WaitingChip.tsx for the job and the tuning knobs.
  A blank label draws nothing.
-->
<script lang="ts">
  import Text from '../../primitives/Text.svelte';
  import { styleText, waitingChipView, type WaitingChipModelProps } from './WaitingChip.model';
  import './WaitingChip.css';

  let props: WaitingChipModelProps = $props();
  const view = $derived(waitingChipView(props));
</script>

{#if view}<Text {...view.text} class={view.chip.className} {...view.chip.attrs} style={styleText(view.style)}
    ><span class={view.arrow.className} {...view.arrow.attrs}></span>{view.label}</Text
  >{/if}
