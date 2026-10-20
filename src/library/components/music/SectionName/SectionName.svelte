<!--
  SectionName: the Svelte renderer of `sectionNameView` (SectionName.model.ts), the same markup,
  classes, attributes and inline size as `SectionName.tsx`; see SectionName.tsx for the job and the
  tuning knobs.
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { sectionNameView, type SectionNameModelProps } from './SectionName.model';
  import { styleText } from '../Meter/Meter.model';
  import './SectionName.css';

  let props: SectionNameModelProps = $props();
  const view = $derived(sectionNameView(props));
</script>

<Text {...view.name.text} class={view.name.className} {...view.name.attrs} style={view.style ? styleText(view.style) : undefined}
  >{view.word}{#if view.variant}{' '}<Text {...view.variant.text} class={view.variant.className} {...view.variant.attrs}
      >{view.variant.content}</Text
    >{/if}</Text
>
