<!--
  Group: the Svelte renderer of `groupView` (Group.model.ts), the same Stacks, header and body as
  `Group.tsx`; see Group.tsx for the job. `label` and `aside` are text or snippets. `toolbar` sets
  the control context (control.svelte.ts) to the toolbar's for what's inside.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Stack from '../primitives/Stack.svelte';
  import Text from '../primitives/Text.svelte';
  import { CONTROL_TOOLBAR, getControlContext, setControlContext } from '../primitives/control.svelte';
  import { GROUP_BODY_CLASS, GROUP_ROOT_STACK, groupBodyStack, groupLabel, groupView, type GroupModelProps } from './Group.model';
  import { styleString } from './style';
  import './Group.css';

  interface Props extends Omit<GroupModelProps, 'className'> {
    /** A visible label; `false` hides it (the name stays for assistive tech). */
    label?: string | Snippet | false;
    /** Header content on the right: a page switch, a count. */
    aside?: string | Snippet;
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let { name, label, aside, direction, wrap, gap, align, area, toolbar = false, class: className, style, children }: Props = $props();

  // A toolbar asks for the quiet look; otherwise the surrounding cluster's look holds.
  const outer = getControlContext();
  setControlContext({
    get quiet() {
      return toolbar ? CONTROL_TOOLBAR.quiet : outer.quiet;
    },
  });

  const root = $derived(groupView({ name, area, toolbar, className }));
  const body = $derived(groupBodyStack({ direction, wrap, gap, align }));
  const shown = $derived(groupLabel(name, label));
</script>

<Stack {...GROUP_ROOT_STACK} class={root.className} {...root.attrs} style={styleString(root.style, style)}>{#if shown || aside}<div class="lib-group__head" data-part="head">{#if shown}<Text size="caption" weight="strong" case="label" class="lib-group__label">{#if typeof shown === 'string'}{shown}{:else}{@render shown()}{/if}</Text>{/if}{#if aside}<span class="lib-group__aside">{#if typeof aside === 'string'}{aside}{:else}{@render aside()}{/if}</span>{/if}</div>{/if}<Stack {...body} class={GROUP_BODY_CLASS} data-part="body">{@render children?.()}</Stack></Stack>
