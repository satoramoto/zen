<!--
  Stack's Svelte story (not shipped): the same specimen as Stack.stories.tsx, from Stack.fixtures.ts.
-->
<script lang="ts">
  import Button from '../components/core/Button/Button.svelte';
  import Stack from './Stack.svelte';
  import { LABELS, stackProps, type StackArgs } from './Stack.fixtures';

  let args: StackArgs = $props();
</script>

<div style:width="{args.width}px">
  <Stack {...stackProps(args)}>
    {#each LABELS.slice(0, args.count) as label, i (label)}<Button {label} variant={i === 0 ? 'primary' : 'secondary'} />{/each}
  </Stack>
</div>
