<!--
  OneTouchPicker's Svelte cells story (not shipped): the picker in the five-cell grid the React
  Cells stories decorate it with (`CELLS_GRID`), the group role on the grid.
-->
<script lang="ts">
  import OneTouchPicker from './OneTouchPicker.svelte';
  import { CELLS_GRID } from './OneTouchPicker.fixtures';
  import type { OneTouchPickerProps } from './OneTouchPicker.model';

  let args: OneTouchPickerProps = $props();
</script>

<div
  role="group"
  aria-label={CELLS_GRID.name}
  style:display="grid"
  style:grid-template-columns="repeat({CELLS_GRID.columns}, 1fr)"
  style:gap="var(--space-1)"
  style:width="{CELLS_GRID.width}px"
  style:height="{CELLS_GRID.height}px"
>
  <OneTouchPicker {...args} />
</div>
