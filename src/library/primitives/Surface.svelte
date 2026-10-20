<!--
  Surface: the Svelte renderer of `surfaceView` (Surface.model.ts), the same element, classes and
  attributes as `Surface.tsx`. See Surface.tsx for the job and the tuning knobs. `as` names the
  element, `ref` binds it, and every other prop (native attributes, handlers, attachments) lands on it.
  No shader material yet: `shader` is accepted and ignored, so the layer's CSS material is the whole
  look (the fallback React draws without WebGL2), and there is no `Opaque` scope to switch it off.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { surfaceView, type SurfaceModelProps } from './Surface.model';
  import './Surface.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<SurfaceModelProps, 'className'> {
    /** Accepted for the React Surface's API; Svelte draws no shader material yet. */
    shader?: string | false;
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    /** The class as a view tree's `component('Surface', …)` passes it (`class` wins). */
    className?: string;
    /** The rendered element (`bind:ref`). */
    ref?: HTMLElement | null;
    children?: Snippet;
  }

  let {
    layer,
    material,
    radius,
    pressed,
    lit,
    border,
    ambient,
    shader: _shader,
    as = 'div',
    class: cls,
    className: treeClass,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props();

  const view = $derived(surfaceView({ layer, material, radius, pressed, lit, border, ambient, className: cls ?? treeClass }));
</script>

<svelte:element this={as} bind:this={ref} class={view.className} {...view.attrs} {...rest}>{@render children?.()}</svelte:element>
