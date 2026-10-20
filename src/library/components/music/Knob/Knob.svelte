<!--
  Knob: the Svelte renderer of `knobView` (Knob.model.ts), the same markup, classes and attributes
  as `Knob.tsx`; see Knob.tsx for the job and the tuning knobs. The input (drag, keys, wheel, press,
  tooltip) is the `knobInput` action (knobInput.svelte.ts, over `knobInput.ts`). The well and the cap
  are plain spans with Surface's class and data (no shader).
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { knobView, type KnobModelProps } from './Knob.model';
  import { knobInput } from './knobInput.svelte';
  import '../../../primitives/Surface.css';
  import './Knob.css';

  let props: KnobModelProps = $props();
  const view = $derived(knobView(props));
  const input = $derived({
    unused: props.unused,
    tip: props.tip,
    tipAction: props.tipAction,
    onpress: props.onpress,
    onstep: props.onstep,
  });
</script>

<button class={view.root.className} {...view.root.attrs} use:knobInput={input}
  ><Text {...view.label} class="yh-knob__label" data-part="label">{props.label}</Text
  ><span class="yh-knob__dial" data-part="dial"
    ><span class={view.track.className} {...view.track.attrs}></span><span class={view.body.className} {...view.body.attrs}
    ></span><svg class="yh-knob__ring" viewBox={view.viewBox} aria-hidden="true"
      >{#if view.arc !== null}<path class="yh-knob__lit" data-part="arc" d={view.arc} />{/if}{#if view.pointer}<line
          class="yh-knob__pointer"
          data-part="pointer"
          {...view.pointer}
        />{/if}</svg
    >{#if view.value !== null}<Text role="numeral" class="yh-knob__value" data-part="value"
        >{view.value}{#if view.unit !== null}<Text role="body" size="caption" leading="tight" class="yh-knob__unit" data-part="unit"
            >{view.unit}</Text
          >{/if}</Text
      >{/if}</span
  >{#if view.code !== null}<Text role="caption" class="yh-knob__code" data-part="code">{view.code}</Text>{/if}</button
>
