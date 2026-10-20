<!--
  A theme scope: the Svelte twin of React's `ThemeScope` (theme.tsx), the same `.lib-scope` element
  drawn from `scopeView` (theme.model.ts), following the system mode while `mode` is `system`, and
  providing its facets and principles to `getThemeScope()`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Facets, PackPrinciples } from '../contract';
  import { resolveMode, scopeView, styleText, type ModeChoice } from '../theme.model';
  import { setThemeScope, systemMode } from './theme.svelte';

  interface Props {
    facets: Facets;
    /** The pack's layout principles, for screens assembled inside it. */
    principles?: PackPrinciples;
    mode?: ModeChoice;
    /** The scope is a whole screen (an app's window): it runs to the edges with no padding. */
    bleed?: boolean;
    children?: Snippet;
  }

  let { facets, principles, mode = 'system', bleed = false, children }: Props = $props();

  setThemeScope({
    get facets() {
      return facets;
    },
    get principles() {
      return principles;
    },
  });

  const view = $derived(scopeView(facets, resolveMode(mode, systemMode.current), bleed));
</script>

<div class={view.className} {...view.attrs} style={styleText(view.vars)}>{@render children?.()}</div>
