<!--
  BarReadout: the Svelte renderer of `barReadoutView` (BarReadout.model.ts), the same markup,
  classes and attributes as `BarReadout.tsx`; see BarReadout.tsx for the job and the tuning knobs.
  The input (drag, wheel, keys, reset, the local value) is the `barInput` action
  (barInput.svelte.ts, over `barInput.ts`) on the slider.
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { barParams, barReadoutView, type BarReadoutModelProps } from './BarReadout.model';
  import type { BarState } from './barInput';
  import { barInput } from './barInput.svelte';
  import './BarReadout.css';

  let props: BarReadoutModelProps = $props();
  let bar = $state<BarState>({ local: null, dragging: false });
  const view = $derived(barReadoutView(props, bar));
</script>

<div class={view.className}
  ><Text role="body" size="caption" case="label" class="yh-bar-readout__label"
    ><span class="yh-bar-readout__label-text">{view.label}</span>{#if view.waiting}<Text
        role="body"
        size="inherit"
        weight="strong"
        class="yh-bar-readout__away"
        aria-hidden="true">↕</Text
      >{/if}</Text
  ><!-- svelte-ignore a11y_no_noninteractive_tabindex (the slider role comes in the spread) --><span
    class="yh-bar-readout__bar"
    tabindex="0"
    {...view.slider}
    {@attach fromAction(barInput, () => ({ ...barParams(props), onState: (next: BarState) => (bar = next) }))}
    ><span class="yh-bar-readout__track"></span>{#if view.centre}<span class="yh-bar-readout__centre"></span>{/if}{#if view.fill}<span
        class="yh-bar-readout__fill"
        style:left={view.fill.left}
        style:width={view.fill.width}
      ></span><span class="yh-bar-readout__cap" style:left={view.fill.cap}></span>{/if}</span
  ><span class="yh-bar-readout__slot" aria-hidden="true"
    ><Text role="numeral" size="body" class="yh-bar-readout__value">{view.value}</Text><Text
      role="body"
      size="caption"
      class="yh-bar-readout__unit">{view.unit}</Text
    ></span
  ></div
>
