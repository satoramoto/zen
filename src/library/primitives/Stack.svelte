<!--
  A flex line with a scale step between its children: the model's tree (`stackNode`,
  Stack.model.ts) drawn by the Svelte `Tree`, the same element and attributes as `Stack.tsx`. See
  Stack.tsx for the job.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Tree from '../view/Tree.svelte';
  import { slot } from '../view/Tree.model';
  import { stackNode, type StackModelProps } from './Stack.model';
  import './Stack.css';

  interface Props extends HTMLAttributes<HTMLElement>, Omit<StackModelProps, 'className'> {
    /** The element to render; default `div`. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { direction, gap, align, justify, wrap, as, class: className, children, ...rest }: Props = $props();
</script>

<Tree tree={stackNode({ direction, gap, align, justify, wrap, className, as }, {}, slot('children'))} slots={{ children }} {...rest} />
