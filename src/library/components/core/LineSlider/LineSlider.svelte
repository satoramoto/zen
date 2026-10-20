<!--
  LineSlider: the Svelte renderer of `lineSliderView` (LineSlider.model.ts), the same markup,
  classes and attributes as `LineSlider.tsx`; see LineSlider.tsx for the job and the tuning knobs.
  The keys and the drag are the `lineSlider` action (slide.svelte.ts, over `slide.ts`).
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { lineSliderView, type LineSliderModelProps } from './LineSlider.model';
  import { lineSlider } from './slide.svelte';
  import './LineSlider.css';

  let props: LineSliderModelProps = $props();
  let held = $state(false);
  const view = $derived(lineSliderView(props, held));

  /** The app's tooltip action, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tip: key, tipAction } = props;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

<span class={view.root.className} {...view.root.attrs}
  ><span
    class={view.slider.className}
    {...view.slider.attrs}
    style:width={view.slider.width}
    use:lineSlider={{
      value: props.value,
      min: props.min,
      max: props.max,
      step: props.step,
      disabled: props.disabled,
      onchange: props.onchange,
      onheld: (next: boolean) => (held = next),
    }}
    {@attach tip}
    ><span class={view.track.className} {...view.track.attrs}
      ><span class={view.fill.className} {...view.fill.attrs} style:width={view.fill.width}></span><span
        class={view.thumb.className}
        {...view.thumb.attrs}
        style:left={view.thumb.left}
      ></span></span
    ></span
  ><span class={view.readout.className} {...view.readout.attrs}
    ><Text {...view.value.text} class={view.value.className} {...view.value.attrs} style="min-width: {view.value.minWidth}"
      >{view.value.shown}</Text
    >{#if view.unit}<Text {...view.unit.text} class={view.unit.className} {...view.unit.attrs}>{view.unit.shown}</Text>{/if}</span
  ></span
>
