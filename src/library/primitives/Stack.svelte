<!--
  A flex line with a scale step between its children: the Svelte renderer of `stackView`
  (Stack.model.ts), the same element and attributes as `Stack.tsx`. See Stack.tsx for the job.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { stackView, type StackModelProps } from './Stack.model';
  import './Stack.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<StackModelProps, 'className'> {
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { direction, gap, align, justify, wrap, as = 'div', class: className, children, ...rest }: Props = $props();

  const view = $derived(stackView({ direction, gap, align, justify, wrap, className }));
</script>

<svelte:element this={as} {...rest} class={view.className} {...view.attrs}>{@render children?.()}</svelte:element>
