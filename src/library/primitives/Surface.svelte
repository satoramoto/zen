<!--
  Surface: the model's tree (`surfaceTree`, Surface.model.ts) drawn by the Svelte `Tree`, the same
  element, classes and attributes as `Surface.tsx`. See Surface.tsx for the job and the tuning knobs.
  `as` names the element, `ref` binds it, and every other prop (native attributes, handlers,
  attachments) lands on it. No shader material yet: `shader` is accepted and ignored, so the layer's
  CSS material is the whole look (the fallback React draws without WebGL2), and there is no `Opaque`
  scope to switch it off.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Tree from '../view/Tree.svelte';
  import { surfaceTree, type SurfaceModelProps } from './Surface.model';
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
    as,
    class: cls,
    className: treeClass,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props();
</script>

<Tree tree={surfaceTree({ layer, material, radius, pressed, lit, border, ambient, className: cls ?? treeClass, as })} slots={{ children }} bind:ref {...rest} />
