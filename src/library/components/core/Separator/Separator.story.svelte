<!--
  Separator's Svelte stories (not shipped): the same specimens as Separator.stories.tsx, from
  Separator.fixtures.ts.
-->
<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Separator from './Separator.svelte';
  import type { SeparatorModelProps } from './Separator.model';
  import { APP_BAR, APP_BAR_CHOSEN } from './Separator.fixtures';

  interface Props extends SeparatorModelProps {
    story: 'Board' | 'Full' | 'InAppBar';
  }

  let { story, ...args }: Props = $props();
</script>

{#if story === 'Board'}
  <div class="lib-row" style:height="var(--control-h)"><Separator {...args} /></div>
{:else if story === 'Full'}
  <div class="lib-row" style:height="calc(var(--control-h) * 1.5)" style:align-items="stretch"><Separator {...args} /></div>
{:else}
  <div class="lib-row" style:flex-wrap="nowrap">
    {#each APP_BAR as label, i (i)}{#if label === '|'}<Separator {...args} />{:else}<Button
          variant="quiet"
          {label}
          chosen={label === APP_BAR_CHOSEN || undefined}
        />{/if}{/each}
  </div>
{/if}
