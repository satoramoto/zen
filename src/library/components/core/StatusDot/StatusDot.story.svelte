<!--
  StatusDot's Faces story in Svelte (not shipped): the same grid as StatusDot.stories.tsx, from
  StatusDot.fixtures.ts.
-->
<script lang="ts">
  import StatusDot from './StatusDot.svelte';
  import { faceWord, statusDotStories } from './StatusDot.fixtures';

  const dots = statusDotStories.Faces.items ?? [];
</script>

<div
  style:display="grid"
  style:grid-template-columns="repeat(2, auto)"
  style:gap="var(--space-2) var(--space-5)"
  style:font-family="var(--font-sans)"
  style:font-size="var(--size-label)"
  style:color="var(--text-2)"
>
  {#each dots as dot (faceWord(dot))}
    <span style:display="inline-flex" style:align-items="center" style:gap="var(--space-2)"><StatusDot {...dot} />{faceWord(dot)}</span>
  {/each}
</div>
