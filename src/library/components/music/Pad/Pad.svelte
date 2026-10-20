<!--
  Pad: the Svelte renderer of `padView` (Pad.model.ts), the same markup, classes and attributes as
  `Pad.tsx`; see Pad.tsx for the job, the faces and the tuning knobs. The press and the tooltip are
  the `padPress` action (padPress.svelte.ts, over `padPress.ts`), attached through Text to the face. The face is a
  Surface through its class and data attributes (no shader in Svelte).
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { padView, type PadModelProps } from './Pad.model';
  import { padPress } from './padPress.svelte';
  import '../../../primitives/Surface.css';
  import './Pad.css';

  let props: PadModelProps = $props();
  const view = $derived(padView(props));
</script>

<Text
  as="button"
  {...view.text}
  class={view.face.className}
  {...view.face.attrs}
  {@attach fromAction(padPress,() => ({ onPress: props.onPress, disabled: props.disabled, tip: props.tip, tipAction: props.tipAction }))}
  >{#if view.chip}<Text {...view.chip.text} class={view.chip.className} {...view.chip.attrs}>{view.chip.word}</Text
    >{/if}<span class="yh-pad__label" data-part="label">{view.label}</span></Text
>
