<!--
  SoundCell: the Svelte renderer of `soundCellView` (SoundCell.model.ts), the same markup, classes
  and attributes as `SoundCell.tsx`; see SoundCell.tsx for the job and the tuning knobs. `marks`
  is a snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Text from '../../../primitives/Text.svelte';
  import { soundCellView, type SoundCellModelProps } from './SoundCell.model';
  import './SoundCell.css';

  interface Props extends SoundCellModelProps {
    /** The marks after the sound's name (the part's marks). */
    marks?: Snippet;
  }

  let props: Props = $props();
  const view = $derived(soundCellView(props));
</script>

<div class={view.root.className} {...view.root.attrs}
  ><Text as="button" {...view.part.text} class={view.part.className} {...view.part.attrs} onclick={() => props.onPart?.()}
    >{view.part.label}</Text
  ><Text as="button" {...view.sound.text} class={view.sound.className} {...view.sound.attrs} onclick={() => props.onSound?.()}
    ><span class={view.title.className}>{view.title.label}</span
    >{#if view.number}<Text {...view.number.text} class={view.number.className} {...view.number.attrs}>{view.number.label}</Text
      >{/if}{#if props.marks}<span class={view.marksClassName}>{@render props.marks()}</span>{/if}</Text
  ></div>
