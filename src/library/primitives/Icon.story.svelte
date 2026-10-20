<!--
  Icon's Svelte stories (not shipped): the same specimens as Icon.stories.tsx, from Icon.fixtures.ts.
-->
<script lang="ts">
  import Icon from './Icon.svelte';
  import Text from './Text.svelte';
  import { iconProps, iconStories as s, type IconArgs } from './Icon.fixtures';

  interface Props extends IconArgs {
    story: 'Playground' | 'Sizes' | 'Tones';
  }

  let { story, ...args }: Props = $props();
</script>

<!-- A play triangle and a stop square: one stroked, one filled. -->
{#snippet play()}<path d="M7 5l12 7-12 7z" />{/snippet}
{#snippet stop()}<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />{/snippet}

{#if story === 'Playground'}
  <div style:padding="var(--space-4)"><Icon {...iconProps(args)} children={play} /></div>
{:else if story === 'Sizes'}
  <div style:padding="var(--space-4)" style:display="grid" style:gap="var(--space-3)">
    {#each s.Sizes.items ?? [] as { size = 'body' } (size)}
      <div style:display="flex" style:align-items="center" style:gap="var(--space-2)">
        <Icon {size} children={play} /><Icon {size} children={stop} /><Text role={size === 'control' ? 'body' : size}>{size}</Text>
      </div>
    {/each}
  </div>
{:else}
  <div style:padding="var(--space-4)" style:display="flex" style:flex-wrap="wrap" style:gap="var(--space-4)">
    {#each s.Tones.items ?? [] as props (String(props.tone))}
      <div style:display="grid" style:justify-items="center" style:gap="var(--space-1)">
        <Icon {...props} children={play} /><Text role="caption" tone="muted">{String(props.tone)}</Text>
      </div>
    {/each}
  </div>
{/if}
