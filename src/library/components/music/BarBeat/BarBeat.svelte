<!--
  BarBeat: the Svelte renderer of `barBeatView` (BarBeat.model.ts), the same markup, classes,
  attributes and inline custom properties as `BarBeat.tsx`; see BarBeat.tsx for the job and the
  tuning knobs.
-->
<script lang="ts">
  import { barBeatView, type BarBeatModelProps } from './BarBeat.model';
  import { styleText } from '../Meter/Meter.model';
  import './BarBeat.css';

  let props: BarBeatModelProps = $props();
  const view = $derived(barBeatView(props));
</script>

<div class={view.root.className} {...view.root.attrs} style={styleText(view.style)}
  >{#each view.cells as cell, i (i)}<span class={cell.className} {...cell.attrs}></span>{/each}</div
>
