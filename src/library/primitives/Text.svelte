<!--
  Text in a role: the Svelte renderer of `textView` (Text.model.ts), the same element, classes and
  attributes as `Text.tsx`. See Text.tsx for the job and the tuning knobs. `as` names the element,
  `ref` binds it, and every other prop (native attributes, handlers, attachments) lands on it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { textView, type TextModelProps } from './Text.model';
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
    as = 'span',
    class: className,
    ref = $bindable(null),
    children,
    ...rest
  }: Props = $props();

  const view = $derived(textView({ role, ariaRole, tone, tabular, truncate, leading, size, weight, case: textCase, className }));
</script>

<svelte:element this={as} bind:this={ref} class={view.className} {...view.attrs} {...rest}>{@render children?.()}</svelte:element>
