<!--
  Ring's Svelte stories (not shipped): the same specimens as Ring.stories.tsx, keys drawn with
  Surface.svelte. Every pack is drawn in its own ThemeScope.
-->
<script lang="ts">
  import type { ModeChoice } from '../theme.model';
  import { packs } from '../themes/packs';
  import ThemeScope from '../svelte/ThemeScope.svelte';
  import { focusRing, pressRing } from './Ring';
  import Surface from './Surface.svelte';
  import Text from './Text.svelte';

  interface Props {
    story: 'FocusAndPress' | 'FocusInEveryPack';
    /** The toolbar's mode, for every pack. */
    mode?: ModeChoice;
  }

  let { story, mode = 'system' }: Props = $props();
  let on = $state(false);

  const key = 'height: var(--control-h); padding: 0 var(--space-3); border: 0; cursor: pointer';
</script>

{#if story === 'FocusAndPress'}
  <div style:padding="var(--space-6)" style:display="flex" style:gap="var(--space-4)">
    <Surface as="button" material="key" class={focusRing} style={key}><Text role="label">Focus me</Text></Surface>
    <Surface
      as="button"
      material="key"
      pressed={on}
      aria-pressed={on ? 'true' : 'false'}
      class="{focusRing} {pressRing}"
      onclick={() => (on = !on)}
      style={key}><Text role="label">{on ? 'On' : 'Off'}</Text></Surface
    >
  </div>
{:else}
  <div style:display="grid" style:gap="var(--space-2)">
    {#each packs as pack (pack.id)}
      <div data-pack={pack.id}>
        <ThemeScope facets={pack.facets} principles={pack.principles} {mode}>
          <Text role="caption" tone="muted">{pack.label}</Text>
          <Surface as="button" material="key" class={focusRing} style={key}><Text role="label">Focus me</Text></Surface>
        </ThemeScope>
      </div>
    {/each}
  </div>
{/if}
