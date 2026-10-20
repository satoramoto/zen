<!--
  AppBar's Live Svelte story (not shipped): the bar holds its own state, as AppBar.stories.tsx's Live
  does, so the tabs, switches and popover respond as in the app.
-->
<script lang="ts">
  import AppBar from './AppBar.svelte';
  import type { AppBarModelProps } from './AppBar.model';

  let args: AppBarModelProps = $props();
  let chosen = $state<string | null>(args.chosen ?? 'stage');
  let metronome = $state(false);
  let open = $state(false);
  let volume = $state(90);
  let bell = $state(true);
  let unison = $state(false);
  let help = $state(false);
</script>

<div style:min-height="320px">
  <AppBar
    {...args}
    {chosen}
    onChoose={(id: string) => (chosen = id)}
    {metronome}
    onMetronome={(on: boolean) => (metronome = on)}
    metronomeOpen={open}
    onMetronomeSettings={() => (open = !open)}
    onMetronomeClose={() => (open = false)}
    metronomeVolume={volume}
    onMetronomeVolume={(v: number) => (volume = v)}
    metronomeBell={bell}
    onMetronomeBell={(on: boolean) => (bell = on)}
    {unison}
    onUnison={(on: boolean) => (unison = on)}
    {help}
    onHelp={(on: boolean) => (help = on)}
  />
</div>
