<!--
  Screen: the Svelte renderer of `screenView` and `screenGrid` (Screen.model.ts), the same root,
  header, grid and footer as `Screen.tsx`; see Screen.tsx for the job. `header` and `footer` are
  text or snippets, `gridRef` binds the grid. With a `spec` it draws `AssembledScreen.svelte`,
  each region's content a snippet given the chosen form and the placed region.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import AssembledScreen from './assembly/AssembledScreen.svelte';
  import type { Placed, Placement } from './assembly/types';
  import { screenGrid, screenView, type ScreenModelProps } from './Screen.model';
  import { styleString } from './style';
  import './Screen.css';

  interface Props extends Omit<ScreenModelProps, 'className'> {
    /** Fixed at the top: never scrolls or zooms with the grid (the app bar). */
    header?: string | Snippet;
    /** Fixed at the bottom: never scrolls or zooms with the grid. */
    footer?: string | Snippet;
    /** The grid between header and footer (`bind:gridRef`). */
    gridRef?: HTMLElement | null;
    /** Declarations on the grid (a zoom, a fit's custom properties). */
    gridStyle?: string;
    class?: string;
    style?: string;
    children?: Snippet;
    /** With `spec`: what goes in each region, by id (a snippet given the chosen form and the placed region). */
    regions?: Record<string, Snippet<[string, Placed]>>;
    /** With `spec`: called with each new placement. */
    onPlacement?: (placement: Placement) => void;
  }

  let {
    name,
    header,
    footer,
    areas,
    columns,
    rows,
    gridRef = $bindable(null),
    gridStyle,
    class: className,
    style,
    children,
    spec,
    regions,
    room,
    principles,
    onPlacement,
  }: Props = $props();

  const view = $derived(screenView(name, className));
  const grid = $derived(styleString(screenGrid({ areas, columns, rows }), gridStyle));
</script>

{#if spec}<AssembledScreen {name} {spec} {regions} {room} {principles} {onPlacement} class={className} {style} />{:else}<div class={view.className} {...view.attrs} {style}>{#if header}<div class="lib-screen__header" data-part="header">{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}</div>{/if}<div class="lib-screen__grid" data-part="grid" bind:this={gridRef} style={grid}>{@render children?.()}</div>{#if footer}<div class="lib-screen__footer" data-part="footer">{#if typeof footer === 'string'}{footer}{:else}{@render footer()}{/if}</div>{/if}</div>{/if}
