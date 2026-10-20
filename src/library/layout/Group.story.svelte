<!--
  Group's Svelte stories (not shipped): the same specimens as Group.stories.tsx, from
  Group.fixtures.ts. The React stories draw Pads (no Svelte twin yet); these draw Buttons.
-->
<script lang="ts">
  import Button from '../components/core/Button/Button.svelte';
  import Group from './Group.svelte';
  import Region from './Region.svelte';
  import { LABELS, UTILITY_GROUP, aligned, groupProps, type GroupArgs } from './Group.fixtures';

  interface Props extends GroupArgs {
    story?: 'Group' | 'InRegion';
  }

  let { story = 'Group', ...args }: Props = $props();
</script>

<div style:width="{args.width}px">
  {#if story === 'InRegion'}
    <Region name="Pads" label="Pads" gap={4}>
      <Group name="Sections" direction={args.direction} wrap={args.wrap} gap={args.gap} align={aligned(args.align)}>
        {#each LABELS.slice(0, args.count) as label, i (label)}<Button {label} variant={i === 1 ? 'primary' : 'secondary'} />{/each}
      </Group>
      <Group name={UTILITY_GROUP.name} aside={UTILITY_GROUP.aside} gap={args.gap} align={aligned(args.align)}>
        {#each UTILITY_GROUP.labels as label (label)}<Button {label} />{/each}
      </Group>
    </Region>
  {:else}
    <Group {...groupProps(args)}>
      {#each LABELS.slice(0, args.count) as label, i (label)}<Button {label} variant={i === 1 ? 'primary' : 'secondary'} />{/each}
    </Group>
  {/if}
</div>
