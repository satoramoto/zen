<!--
  MultiPadsOnStage: a story-only frame for the Screens/MultiPads stories. It shows the Multi Pads
  page where the app shows it: in the Stage's display box (its `page` slot), with the Stage board's
  app bar (Multi Pads chosen), section row, band and keys around it, at 1440 × 900. It takes
  MultiPads' props and passes them through.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { stageBoard } from '../Stage/Stage.fixtures'
  import Stage from '../Stage/Stage.svelte'
  import MultiPads from './MultiPads.svelte'

  let p: ComponentProps<typeof MultiPads> = $props()
</script>

<Stage {...stageBoard} appBar={{ ...stageBoard.appBar, chosen: 'multiPads' }} tipAction={p.tipAction}>
  {#snippet page()}
    <MultiPads {...p} />
  {/snippet}
</Stage>
