<!--
  SlotCall: a slot whose content takes arguments, drawn from a view tree, as `SlotCall.tsx` draws
  it in React. A model passes one of its own slots through as `content` (a snippet) and the
  arguments as data (`args`); this renders the snippet with them, so no snippet is called by hand.
  Draws no element of its own. Up to two arguments (Region's view id; a region's form and placement).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The slot's content: a snippet taking up to two arguments. */
    content?: Snippet<[any, any]>;
    /** What `content` is rendered with. */
    args?: unknown[];
  }

  let { content, args = [] }: Props = $props();
</script>

{@render content?.(args[0], args[1])}
