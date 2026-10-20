<!--
  Surface: the Svelte renderer of `surfaceView` (Surface.model.ts), the same element, classes and
  attributes as `Surface.tsx`. See Surface.tsx for the job and the tuning knobs. `as` names the
  element, `ref` binds it, and every other prop (native attributes, handlers, attachments) lands on it.
  Its shader material is React's too: `surfaceShader` (surfaceShader.ts) picks the source from
  `shader` or the scope's pack, and the canvas node is drawn first with `Tree`; none without
  support, inside `Opaque` (opaqueScope.svelte.ts) or after a failure.
-->
<script module lang="ts">
  import { createSubscriber } from 'svelte/reactivity';
  import { shaderSupported, subscribeShaderSupport } from '../shader/supported';

  const followSupport = createSubscriber((update) => subscribeShaderSupport(update));
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ShaderMaterialName, ShaderSource } from '../shader/types';
  import { getThemeScope } from '../svelte/theme.svelte';
  import Tree from '../view/Tree.svelte';
  import { surfaceView, type SurfaceModelProps } from './Surface.model';
  import { SHADER_ERROR, chosenShader, surfaceShader, surfaceShaderNode, type SurfaceShader } from './surfaceShader';
  import { insideOpaque } from './opaqueScope.svelte';
  import './Surface.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<SurfaceModelProps, 'className'> {
    /** A shader material drawn under its content: a named material, a compiled `ShaderSource`, or
     *  `false` for none. Default: the scope's pack's `materials.shaders[layer]`. */
    shader?: SurfaceShader;
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
    shader,
    as = 'div',
    class: cls,
    className: treeClass,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props();

  const scope = getThemeScope();
  const opaque = insideOpaque();
  // The canvas reported a failure: drop it for the source that failed, so the CSS layer remains.
  let failed = $state.raw<ShaderMaterialName | ShaderSource | null>(null);
  const supported = $derived.by(() => {
    followSupport();
    return shaderSupported();
  });
  const shaders = $derived(scope?.facets.materials.shaders);
  const source = $derived(surfaceShader({ shader, layer, shaders, supported, opaque, failed }));
  const canvas = $derived(source ? surfaceShaderNode(source) : null);
  const handlers = $derived({ [SHADER_ERROR]: () => (failed = chosenShader({ shader, layer, shaders })) });
  const view = $derived(surfaceView({ layer, material, radius, pressed, lit, border, ambient, className: cls ?? treeClass }, source !== null));
</script>

<svelte:element this={as} bind:this={ref} class={view.className} {...view.attrs} {...rest}
  >{#if canvas}<Tree tree={canvas} {handlers} />{/if}{@render children?.()}</svelte:element
>
