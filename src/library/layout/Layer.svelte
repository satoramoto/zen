<!--
  Layer: the Svelte renderer of `layerSurface` (Layer.model.ts), the same Surface as `Layer.tsx`
  (deprecated there in favour of `<Surface layer=…>`; see it for the job). Every other prop
  (`ambient`, `as`, native attributes, handlers) goes to the Surface.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { AmbientRegion } from '../contract';
  import Surface from '../primitives/Surface.svelte';
  import { layerSurface, type LayerModelProps } from './Layer.model';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<LayerModelProps, 'className'> {
    /** Which region's ambient light it takes (`Surface`'s `ambient`). */
    ambient?: AmbientRegion;
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { level, class: className, children, ...rest }: Props = $props();

  const surface = $derived(layerSurface({ level, className }));
</script>

<Surface {...rest} layer={surface.layer} radius={surface.radius} class={surface.className}>{@render children?.()}</Surface>
