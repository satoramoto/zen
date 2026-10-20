<!--
  Region's Svelte stories (not shipped): the untabbed specimens of Region.stories.tsx, from
  Region.fixtures.ts.
-->
<script lang="ts">
  import Button from '../components/core/Button/Button.svelte';
  import Group from './Group.svelte';
  import Region from './Region.svelte';
  import { REGION_GROUPS, REGION_NOTES, regionProps, type RegionArgs } from './Region.fixtures';

  interface Props extends RegionArgs {
    story: 'Groups' | 'Plain' | 'Headless';
  }

  let { story, ...args }: Props = $props();
</script>

<div style:max-width="560px">
  {#if story === 'Groups'}
    <Region {...regionProps(args, true)}>
      {#each REGION_GROUPS as g (g.name)}
        <Group name={g.name}>
          {#each g.labels as label, i (label)}<Button {label} variant={g.name === 'Transport' && i === 1 ? 'primary' : undefined} />{/each}
        </Group>
      {/each}
    </Region>
  {:else}
    <Region {...regionProps(args)}><p style:margin="0" style:color="var(--text-2)">{REGION_NOTES[story]}</p></Region>
  {/if}
</div>
