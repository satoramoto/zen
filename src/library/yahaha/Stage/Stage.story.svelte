<!--
  Stage's Svelte story (not shipped): the screen in the frame the React stories decorate it with
  (`yh-stage-frame`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Stage from './Stage.svelte';
  import type { StageModelProps } from './Stage.model';

  let args: StageModelProps<string | Snippet> = $props();
</script>

<div class="yh-stage-frame"><Stage {...args} /></div>
