<!--
  TempoReadout's Cells story in Svelte (not shipped): the readout inside a CELLS_BOX size
  container, as TempoReadout.stories.tsx draws it.
-->
<script lang="ts">
  import TempoReadout from './TempoReadout.svelte';
  import { CELLS_BOX } from './TempoReadout.fixtures';
  import type { TempoReadoutModelProps } from './TempoReadout.model';

  let args: TempoReadoutModelProps = $props();
</script>

<div style:container-type="size" style:width="{CELLS_BOX.width}px" style:height="{CELLS_BOX.height}px"><TempoReadout {...args} /></div>
