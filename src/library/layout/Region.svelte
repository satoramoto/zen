<!--
  Region: the Svelte renderer of `regionView` (Region.model.ts), the same section, header and body
  as `Region.tsx`; see Region.tsx for the job. Untabbed only for now: the views' tabs need the
  Svelte `Tabs`, and the model already holds the tabbed choices (`chosenView`, `regionIds`).
  `label` and `aside` are text or snippets.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Text from '../primitives/Text.svelte';
  import { regionBodyView, regionHasHead, regionView, type RegionModelProps } from './Region.model';
  import { styleString } from './style';
  import './Region.css';

  interface Props extends Omit<RegionModelProps, 'className'> {
    /** A visible header label; omit for a region that needs none. */
    label?: string | Snippet;
    /** Header content on the right: a second switch, a count. */
    aside?: string | Snippet;
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let { name, label, aside, area, gap, fit, class: className, style, children }: Props = $props();

  const root = $derived(regionView({ name, area, fit, className }));
  const body = $derived(regionBodyView(gap));
</script>

<section class={root.className} {...root.attrs} style={styleString(root.style, style)}>{#if regionHasHead(label, aside, false)}<header class="lib-region__head" data-part="head">{#if label}<Text size="caption" weight="strong" case="label" class="lib-region__label">{#if typeof label === 'string'}{label}{:else}{@render label()}{/if}</Text>{/if}{#if aside}<span class="lib-region__aside">{#if typeof aside === 'string'}{aside}{:else}{@render aside()}{/if}</span>{/if}</header>{/if}<div class={body.className} {...body.attrs}>{@render children?.()}</div></section>
