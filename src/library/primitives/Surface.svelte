<!--
  Surface: the Svelte renderer of `surfaceView` (Surface.model.ts), the same element, class and
  attributes as `Surface.tsx`; see Surface.tsx for the job and the tuning knobs. `as` names the
  element, `ref` binds it, and every other prop (native attributes, handlers, attachments) lands
  on it. It draws no shader material yet: the layer's CSS material is the whole look, as on
  React's fallback path.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { surfaceView, type SurfaceModelProps } from './Surface.model';
  import './Surface.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<SurfaceModelProps, 'className'> {
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    /** The rendered element (`bind:ref`). */
    ref?: HTMLElement | null;
    children?: Snippet;
  }

  let { layer, material, radius, pressed, lit, border, ambient, as = 'div', class: className, ref = $bindable(null), children, ...rest }: Props = $props();

  const view = $derived(surfaceView({ layer, material, radius, pressed, lit, border, ambient, className }));
</script>

<svelte:element this={as} bind:this={ref} class={view.className} {...view.attrs} {...rest}>{@render children?.()}</svelte:element>
