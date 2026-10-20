<!--
  Text in a role: the model's tree (`textNode`, Text.model.ts) drawn by the Svelte `Tree`, the same
  element, classes and attributes as `Text.tsx`. See Text.tsx for the job and the tuning knobs. `as`
  names the element, `ref` binds it, and every other prop (native attributes, handlers, attachments)
  lands on it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Tree from '../view/Tree.svelte';
  import { slot } from '../view/Tree.model';
  import { textNode, type TextModelProps } from './Text.model';
  import './Text.css';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'role'>, Omit<TextModelProps, 'className'> {
    /** The element to render; default `span`. */
    as?: string;
    class?: string;
    /** The rendered element (`bind:ref`). */
    ref?: HTMLElement | null;
    children?: Snippet;
  }

  let {
    role,
    ariaRole,
    tone,
    tabular,
    truncate,
    leading,
    size,
    weight,
    case: textCase,
    as,
    class: className,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props();
</script>

<Tree
  tree={textNode({ role, ariaRole, tone, tabular, truncate, leading, size, weight, case: textCase, className, as }, {}, slot('children'))}
  slots={{ children }}
  bind:ref
  {...rest}
/>
