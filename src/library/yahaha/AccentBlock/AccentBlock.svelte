<!--
  AccentBlock: the Svelte renderer of `accentBlockView` (AccentBlock.model.ts), the same markup,
  classes and attributes as `AccentBlock.tsx`; see AccentBlock.tsx for the job. The tooltip hook is
  the `tip` action (tip.svelte.ts, over `tip.ts`), attached through Text to the block.
-->
<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import Text from '../../primitives/Text.svelte';
  import { accentBlockView, styleText, type AccentBlockModelProps } from './AccentBlock.model';
  import { tip } from './tip.svelte';
  import './AccentBlock.css';

  let props: AccentBlockModelProps = $props();
  const view = $derived(accentBlockView(props));
</script>

<Text
  as={view.as}
  {...view.text}
  class={view.block.className}
  style={styleText(view.style)}
  {...view.block.attrs}
  onclick={view.as === 'button' ? () => props.onPress?.() : undefined}
  {@attach fromAction(tip, () => ({ tip: props.tip, tipAction: props.tipAction, enabled: view.tip }))}
  ><span class="yh-accentblock__text" data-part="text">{view.shown}</span>{#if view.chevron}<svg
      class="yh-accentblock__chevron"
      data-part="chevron"
      viewBox="0 0 12 12"
      aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg
    >{/if}</Text
>
