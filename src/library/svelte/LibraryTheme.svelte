<!--
  The Svelte Storybook's theme decorator (`withLibraryTheme` in storybook-svelte.ts): the story in a
  `ThemeScope` of the toolbar's pack, mode and facets, on the pack's stand-in desktop, as React's
  `withLibraryTheme` (storybook.tsx) draws it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { resolveMode, resolveTheme, type ModeChoice, type ThemeChoice } from '../themes';
  import ThemeScope from './ThemeScope.svelte';
  import { systemMode } from './theme.svelte';

  interface Props {
    globals: ThemeChoice & { mode?: ModeChoice };
    /** The story's layout is `fullscreen`: the scope bleeds to the edges. */
    bleed?: boolean;
    children?: Snippet;
  }

  let { globals, bleed = false, children }: Props = $props();

  const theme = $derived(resolveTheme(globals));
  const mode = $derived(globals.mode ?? 'system');
  // A palette swapped in from another pack keeps this pack's desktop only if the pack's own palette is worn.
  const desktop = $derived(theme.facets.palette === theme.pack.facets.palette ? theme.pack.desktop : undefined);
</script>

{#snippet scope()}
  <ThemeScope facets={theme.facets} principles={theme.pack.principles} {mode} {bleed}>{@render children?.()}</ThemeScope>
{/snippet}

{#if desktop}
  <div style:background={desktop[resolveMode(mode, systemMode.current)]} style:min-height="100vh">{@render scope()}</div>
{:else}
  {@render scope()}
{/if}
