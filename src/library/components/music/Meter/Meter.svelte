<!--
  Meter: the Svelte renderer of `meterView` (Meter.model.ts), the same markup, classes, attributes
  and inline custom properties as `Meter.tsx`; see Meter.tsx for the job and the parts. The channel
  is a plain element with Surface's attributes (no shader: it takes no layer).
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { meterView, styleText, type MeterModelProps } from './Meter.model';
  import '../../../primitives/Surface.css';
  import './Meter.css';

  interface Props extends Omit<MeterModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const view = $derived(meterView({ ...props, className }));
</script>

<div class={view.root.className} {...view.root.attrs} style={styleText(view.style)}
  >{#if view.caption}<Text {...view.caption.text} class={view.caption.className} {...view.caption.attrs}>{view.caption.content}</Text
    >{/if}<div class={view.frame.className} {...view.frame.attrs}
    ><div class={view.channel.className} {...view.channel.attrs}
      ><i class={view.level.className} {...view.level.attrs}></i>{#if view.hold}<i class={view.hold.className} {...view.hold.attrs}
        ></i>{/if}</div
    ></div
  >{#if view.readout}<Text {...view.readout.text} class={view.readout.className} {...view.readout.attrs}>{view.readout.content}</Text
    >{/if}</div
>
