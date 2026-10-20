<!--
  HueLegend: the Svelte renderer of `hueLegendView` (HueLegend.model.ts), the same markup, classes
  and attributes as `HueLegend.tsx`; see HueLegend.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import Stack from '../../primitives/Stack.svelte';
  import Text from '../../primitives/Text.svelte';
  import { hueLegendView, type HueLegendProps } from './HueLegend.model';
  import './HueLegend.css';

  let props: HueLegendProps = $props();
  const view = $derived(hueLegendView(props));
</script>

<Stack as="ul" {...view.list.stack} class={view.list.className} {...view.list.attrs}
  >{#each view.entries as entry (entry.key)}<Stack as="li" {...entry.stack} class={entry.className} {...entry.attrs}
      ><span class={view.chip.className} {...view.chip.attrs}></span><Text {...view.word.text} class={view.word.className}
        >{entry.label}</Text
      ></Stack
    >{/each}</Stack
>
