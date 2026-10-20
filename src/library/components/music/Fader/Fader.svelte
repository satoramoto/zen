<!--
  Fader: the Svelte renderer of `faderView` (Fader.model.ts), the same markup, classes and
  attributes as `Fader.tsx`; see Fader.tsx for the job and the tuning knobs. The drag, keys and
  wheel are the `faderInput` action (faderInput.svelte.ts, over `faderInput.ts`). The groove and meter are drawn
  with Surface's attributes and stylesheet (no shader: they have no layer).
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { faderView, surfaceAttrs, type FaderModelProps } from './Fader.model';
  import { faderInput } from './faderInput.svelte';
  import '../../../primitives/Surface.css';
  import './Fader.css';

  let props: FaderModelProps = $props();
  const view = $derived(faderView(props));

  let rail = $state<HTMLElement | null>(null);

  /** The app's tooltip action, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tip: key, tipAction } = props;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (the model's attrs give it `role="slider"`) -->
<div
  class={view.root.className}
  tabindex={view.root.tabIndex}
  {...view.root.attrs}
  style:--yh-fader-level={view.root.style['--yh-fader-level']}
  style:width={view.root.style.width}
  use:faderInput={{ level: props.level ?? 0, parked: view.parked, rail: () => rail, onlevel: props.onlevel }}
  {@attach tip}
><span class="yh-fader__head" data-part="head" aria-hidden="true"
    >{#if view.word}<Text role="label" size="caption" leading="tight" class="yh-fader__word">{view.word}</Text>{/if}<Text
      role="numeral"
      size={view.numSize}
      class="yh-fader__value"
      data-part="value">{view.num}</Text
    ></span
  ><span class="yh-fader__travel" data-part="travel" aria-hidden="true"
    ><span class="yh-fader__rail" bind:this={rail}
      ><span class="lib-surface {view.groove.className}" {...surfaceAttrs(view.groove.surface)} {...view.groove.attrs}></span
      >{#if view.fill}<span class="yh-fader__fill" data-part="fill"></span>{/if}{#if view.ghost}<span
          class="yh-fader__ghost"
          data-part="ghost"
          style:--yh-fader-away={view.ghost['--yh-fader-away']}
        ></span>{/if}{#if view.fill}<span class="yh-fader__cap" data-part="cap"></span>{/if}</span
    >{#if view.meter}<span class="yh-fader__meters"
        ><span
          class="lib-surface {view.meter.className}"
          {...surfaceAttrs(view.meter.surface)}
          {...view.meter.attrs}
          style:--yh-fader-m={view.meter.style?.['--yh-fader-m']}
        ></span></span
      >{/if}</span
  >{#if view.takeover}<svg class="yh-fader__takeover" viewBox="0 0 10 10" aria-hidden="true"
      ><path d={view.takeover} /></svg
    >{/if}</div
>
