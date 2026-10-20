<!--
  Screen: the model's tree (`screenView`, Screen.model.ts) drawn by the Svelte `Tree`, as
  `Screen.tsx` draws it with the React one; see Screen.tsx for the job. `header` and `footer` are
  text or snippets, `gridRef` binds the grid (the `ref` store, through the `gridRef` handler). With a
  `spec` the tree is the `AssembledScreen` component, each region's content a snippet given the
  chosen form and the placed region, passed through as its `regions`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import type { Placed, Placement } from './assembly/types';
  import { REGIONS_SLOT, screenHandlers, screenView, type ScreenModelProps } from './Screen.model';
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

  let { header, footer, gridRef = $bindable(null), class: className, children, regions, onPlacement, ...props }: Props = $props();

  // `regions` is no snippet: its slot passes it through, untouched, as AssembledScreen's `regions`.
  const slots = $derived({
    header: typeof header === 'string' ? undefined : header,
    footer: typeof footer === 'string' ? undefined : footer,
    children,
    [REGIONS_SLOT]: (regions ?? {}) as unknown as Snippet,
  });
  const handlers = $derived(screenHandlers({ gridRef: (element: HTMLElement | null) => (gridRef = element), onPlacement }));
</script>

<Tree tree={screenView({ ...props, className }, { header, footer })} {slots} {handlers} />
