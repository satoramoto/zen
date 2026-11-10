<!--
  A part of a tree that may fail without taking the rest down, as `Contain.tsx` is in React: while
  `children` draws it is all there is; once drawing it throws, `failed` is drawn in its place and
  `onError` is told, until `resetKey` changes and `children` is tried again. Draws no element.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** A change of this tries `children` again after a failure. */
    resetKey?: string | number;
    /** What failed, in the error's words. */
    onError?: (message: string) => void;
    children?: Snippet;
    /** Drawn in place of `children` once they fail. */
    failed?: Snippet;
  }

  let { resetKey, onError, children, failed: failedSlot }: Props = $props();
  const told = (error: unknown) => onError?.(error instanceof Error ? error.message : String(error));
</script>

{#key resetKey}
  <svelte:boundary onerror={told}>
    {@render children?.()}
    {#snippet failed()}{@render failedSlot?.()}{/snippet}
  </svelte:boundary>
{/key}
