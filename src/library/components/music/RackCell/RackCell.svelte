<!--
  RackCell: the Svelte renderer of `rackCellView` (RackCell.model.ts), the same markup, classes and
  attributes as `RackCell.tsx`; see RackCell.tsx for the job and the tuning knobs. `mark` is a snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Text from '../../../primitives/Text.svelte';
  import { rackCellView, type RackCellModelProps } from './RackCell.model';
  import './RackCell.css';

  interface Props extends RackCellModelProps {
    /** The marks after the name (the modified dot). */
    mark?: Snippet;
  }

  let props: Props = $props();
  const view = $derived(rackCellView(props));
</script>

<div class={view.rootClassName}
  ><button class={view.button.className} {...view.button.attrs} type="button" onclick={() => props.onPress?.()}
    ><Text {...view.head.text} class={view.head.className} {...view.head.attrs}
      ><span class={view.label.className}>{view.label.label}</span
      >{#if view.slot}<span class={view.slot.separator.className} {...view.slot.separator.attrs}>{view.slot.separator.char}</span
        ><Text {...view.slot.value.text} class={view.slot.value.className} {...view.slot.value.attrs}>{view.slot.value.label}</Text
        >{/if}</Text
    ><Text {...view.name.text} class={view.name.className} {...view.name.attrs}
      ><Text {...view.title.text} class={view.title.className} {...view.title.attrs}>{view.title.label}</Text
      >{#if props.mark}<span class={view.markClassName}>{@render props.mark()}</span>{/if}</Text
    ></button
  ></div>
