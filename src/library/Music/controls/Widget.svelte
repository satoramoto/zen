<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { widgetView, type WidgetModelProps } from './Widget.model';
  import './parameters.css';
  interface Props extends Omit<WidgetModelProps, 'readout'> { children?: Snippet; readout?: string | number | Snippet }
  let { children, readout, ...props }: Props = $props();
</script>
{#snippet reading()}{#if typeof readout === 'function'}{@render readout()}{:else}{readout}{/if}{/snippet}
<Tree tree={widgetView(props, undefined, { readout: readout !== undefined })} slots={{ children, readout: reading }} />
