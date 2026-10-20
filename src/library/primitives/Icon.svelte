<!--
  Icon: the model's tree (`iconNode`, Icon.model.ts) drawn by the Svelte `Tree`, the same slot and
  SVG as `Icon.tsx`. See Icon.tsx for the job and the tuning knobs. `children` is the SVG content
  (paths, shapes), drawn with `currentColor`; every other prop lands on the slot.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Tree from '../view/Tree.svelte';
  import { slot } from '../view/Tree.model';
  import { iconNode, type IconModelProps } from './Icon.model';
  import './Text.css';
  import './Icon.css';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, Omit<IconModelProps, 'className'> {
    class?: string;
    /** SVG content drawn with `currentColor`: strokes by default; set `fill="currentColor"` to fill. */
    children?: Snippet;
  }

  let { size, tone, label, viewBox, class: className, children, ...rest }: Props = $props();
</script>

<Tree tree={iconNode({ size, tone, label, viewBox, className }, {}, slot('children'))} slots={{ children }} {...rest} />
