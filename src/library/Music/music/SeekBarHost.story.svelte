<script lang="ts">
  import SeekBar from './SeekBar.svelte';
  import type { SeekBarProps } from './SeekBar.model';
  let props: SeekBarProps = $props();
  let position = $state(props.position);
</script>
<div>
  <SeekBar {...props} {position} />
  <button type="button" onclick={() => position = 35}>Update host position</button>
</div>
