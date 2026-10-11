<!--
  HarmArpScreen: a story-only wrapper for the Screens/Harm Arp stories. The Stage at 1440 × 900 as on
  its board (the app bar with Harm/Arp chosen, the section row, the band, the status line and the
  keys), with the HarmArp page in its display box (Stage's `page` slot). The band's Harm/Arp lamp
  follows the page's switch, as in the app: the same switch, drawn twice.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import { stageBoard } from '../Stage/Stage.fixtures'
  import HarmArp from './HarmArp.svelte'

  type Props = ComponentProps<typeof HarmArp>

  let { data, tipAction, onchange, onview }: Props = $props()

  const appBar = { ...stageBoard.appBar, chosen: 'harmArp' }
  const faders = $derived({
    ...stageBoard.faders,
    functionLamps: stageBoard.faders.functionLamps.map((lamp) => (lamp.id === 'harmArp' ? { ...lamp, on: data.on } : lamp)),
  })
</script>

<Stage {...stageBoard} {appBar} {faders} {tipAction} page={harmArpPage} />

{#snippet harmArpPage()}
  <HarmArp {data} {tipAction} {onchange} {onview} />
{/snippet}
