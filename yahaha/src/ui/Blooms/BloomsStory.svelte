<!--
  BloomsStory: a story-only wrapper for the Screens/Blooms stories. It lays the blooms behind the
  Stage board at the app's 1440 × 900 (or behind an empty ground, `stage` off), the way the screen
  wrappers do (panels/stage/StageScreen.svelte): the screen's ground transparent over them. While
  `playing`, a story-only clock counts beats at `bpm` for the blooms to lock to; it is read only when
  the blooms sync (every few seconds), never per frame.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import { stageBoard, stageStopped } from '../Stage/Stage.fixtures'
  import Blooms from './Blooms.svelte'

  type Props = ComponentProps<typeof Blooms> & {
    /** Shows the Stage board over the blooms (off: the blooms alone on the ground). */
    stage?: boolean
  }

  let { stage = true, beat: _beat, ...blooms }: Props = $props()

  // The story's clock: beats since the band started, at the tempo of the moment it started.
  let startedAt = performance.now()
  $effect(() => {
    if (blooms.playing) startedAt = performance.now()
  })
  const beat = () => ((performance.now() - startedAt) / 60000) * (blooms.bpm ?? 120)

  const board = $derived(blooms.playing ? stageBoard : { ...stageBoard, ...stageStopped })
</script>

<div class="frame">
  <Blooms {...blooms} {beat} />
  {#if stage}
    <Stage {...board} />
  {/if}
</div>

<style>
  .frame {
    position: relative;
    isolation: isolate;
    width: 1440px;
    height: 900px;
    overflow: hidden;
    background: var(--g);
    --backdrop-ground: transparent;
  }
</style>
