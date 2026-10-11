<!--
  QuickRacksScreen: the Quick Racks page tab at the app's 1440 × 900: the Stage (app bar with
  Quick Racks chosen, section row, band, status line, keys) with the QuickRacks page in its
  display box (Stage's `page` slot). The Stage's own data is one object (`stage`); everything else
  is QuickRacks' props, passed straight through. The Stage's callbacks aren't wired here: this is
  the page's screen, and the Stage has its own stories.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import QuickRacks from './QuickRacks.svelte'

  type StageData = Omit<ComponentProps<typeof Stage>, 'page' | 'tipAction'>
  type Props = ComponentProps<typeof QuickRacks> & {
    /** The Stage around the page: app bar, section row, band, status line and keys (Stage's data props). */
    stage: StageData
  }

  let { stage, ...qr }: Props = $props()
</script>

<Stage {...stage} tipAction={qr.tipAction}>
  {#snippet page()}<QuickRacks {...qr} />{/snippet}
</Stage>
