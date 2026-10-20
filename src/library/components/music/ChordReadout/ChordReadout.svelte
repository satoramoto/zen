<!--
  ChordReadout: the Svelte renderer of `chordReadoutView` (ChordReadout.model.ts), the same markup,
  classes and attributes as `ChordReadout.tsx`; see ChordReadout.tsx for the job and the tuning
  knobs. The window is written as the `screen` Surface React draws (no shader: a `screen` without a
  layer has none). The hero's fit is the `chordFit` action (fit.svelte.ts, over `fit.ts`).
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../../primitives/Text.svelte';
  import { chordReadoutView, type ChordReadoutModelProps } from './ChordReadout.model';
  import type { Fit } from './fit';
  import { chordFit } from './fit.svelte';
  import '../../../primitives/Surface.css';
  import './ChordReadout.css';

  let props: ChordReadoutModelProps = $props();
  const view = $derived(chordReadoutView(props));
  let fit = $state<Fit>('full');

  /** The app's tooltip on the fingering, applied while both `tip` and `tipAction` are set. */
  const tip = (target: HTMLElement) => {
    const { tip: key, tipAction } = props;
    if (!tipAction || key === undefined) return;
    const handle = tipAction(target, key);
    return () => handle?.destroy?.();
  };
</script>

<div
  class="{view.surface.className} {view.root.className}"
  {...view.surface.attrs}
  {...view.root.attrs}
  style:--yh-chord-readout-hero={view.heroSize}
  ><Text
    as="div"
    role="display"
    leading="snug"
    class={view.hero.className}
    {...view.hero.attrs}
    data-fit={fit}
    {@attach fromAction(chordFit, () => ({
      onFit: (next: Fit) => (fit = next),
      key: [props.chord, props.extension, props.held, props.size],
    }))}
    >{view.chord}{#if view.raised !== null}<Text role="display" leading="tight" class="yh-chord-readout__ext" data-part="extension"
        >{view.raised}</Text
      >{/if}{#if view.bass !== null}<Text role="display" leading="snug" class="yh-chord-readout__bass" data-part="bass">{view.bass}</Text
      >{/if}</Text
  ><Text as="p" role="body" size="label" class="yh-chord-readout__line" data-part="line" aria-hidden="true"
    >{#if view.tones !== null}<Text role="body" size="inherit" weight="numeral" class="yh-chord-readout__tones" data-part="tones"
        >{#each view.tones as note, i (i)}<span class="yh-chord-readout__tone" data-part="tone">{note}</span>{/each}</Text
      >{/if}{#if view.fingering !== null}<span class="yh-chord-readout__fingering" {...view.fingering.attrs} {@attach tip}
        >{view.fingering.text}</span
      >{/if}{#if view.held}<Text role="body" size="caption" case="label" class="yh-chord-readout__held" data-part="held">held</Text
      >{/if}</Text
  ></div
>
