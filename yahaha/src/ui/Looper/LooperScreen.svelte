<!--
  LooperScreen: a story-only wrapper for Screens/Looper. It renders the Stage with the Looper page in
  its display box (the `page` slot), as the app does on the Looper tab: the app bar (Looper chosen),
  the section row, the band, the status line and the keys stay as on the Stage. With `playground`,
  the page is the stateful LooperPlayground instead of the plain, controlled Looper.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import Looper from './Looper.svelte'
  import LooperPlayground from './LooperPlayground.svelte'
  import type { LooperChange, LooperPageData } from './types'

  type Props = Omit<ComponentProps<typeof Stage>, 'page'> & {
    /** The Looper page's data. */
    looper: LooperPageData
    /** The page's changes (an action in the story). */
    onlooper?: (change: LooperChange) => void
    /** Render the stateful playground page instead of the controlled one. */
    playground?: boolean
  }

  let { looper, onlooper, playground = false, ...stage }: Props = $props()
</script>

<Stage {...stage}>
  {#snippet page()}
    {#if playground}
      <LooperPlayground {...looper} tipAction={stage.tipAction} onchange={onlooper} />
    {:else}
      <Looper {...looper} tipAction={stage.tipAction} onchange={onlooper} />
    {/if}
  {/snippet}
</Stage>
