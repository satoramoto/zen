<!--
  Layer: the model's tree (`layerView`, Layer.model.ts) drawn by the Svelte `Tree`, the same
  Surface element as `Layer.tsx` (deprecated there in favour of `<Surface layer=…>`; see it for the
  job). Every other prop (`ambient`, `as`, native attributes) lands on the element; event props
  (`onclick`) reach it through the tree's handlers (`layerHandlers`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { AmbientRegion } from '../contract';
  import Tree from '../view/Tree.svelte';
  import { layerHandlers, layerView, type LayerModelProps } from './Layer.model';
  import '../primitives/Surface.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<LayerModelProps, 'className'> {
    /** Which region's ambient light it takes (`Surface`'s `ambient`). */
    ambient?: AmbientRegion;
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { level, class: className, children, ...rest }: Props = $props();
</script>

<Tree tree={layerView({ ...rest, level, className }, false, layerHandlers(rest))} slots={{ children }} handlers={layerHandlers(rest)} />
