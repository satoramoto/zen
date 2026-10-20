<!--
  Text's Svelte stories (not shipped): the same three specimens as Text.stories.tsx, from Text.fixtures.ts.
-->
<script lang="ts">
  import Text from './Text.svelte';
  import { TEXT_ROLES, TEXT_TONES, type TextTone } from './Text.model';
  import { BASEL, HARMONIC, SAMPLE, textProps, type TextArgs } from './Text.fixtures';

  interface Props extends TextArgs {
    story: 'Playground' | 'AllRolesAndTones' | 'MathInText';
  }

  let { story, ...args }: Props = $props();

  /** `on-solid` is ink for a solid action fill, so it is shown on `--action`; every other tone on the page. */
  const ground = (tone: TextTone | 'inherit') =>
    tone === 'on-solid' ? 'background: var(--action); border-radius: var(--radius-control); padding: var(--space-1) var(--space-2)' : undefined;
</script>

{#if story === 'Playground'}
  <div style:width="{args.width}px" style:padding="var(--space-4)">
    <Text {...textProps(args)} as="p" style={ground(args.tone)}>{args.text}</Text>
  </div>
{:else if story === 'AllRolesAndTones'}
  <div style:padding="var(--space-4)" style:overflow-x="auto">
    <div
      style:display="grid"
      style:grid-template-columns="auto repeat({TEXT_TONES.length}, auto)"
      style:gap="var(--space-2) var(--space-3)"
      style:align-items="baseline"
    >
      <span></span>
      {#each TEXT_TONES as tone (tone)}<Text role="caption" tone="muted">{String(tone)}</Text>{/each}
      {#each TEXT_ROLES as role (role)}
        <div style:display="contents">
          <Text role="caption" tone="muted">{role}</Text>
          {#each TEXT_TONES as tone (tone)}<Text {role} {tone} style={ground(tone)}>{SAMPLE[role]}</Text>{/each}
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div style:max-width="520px" style:padding="var(--space-4)">
    <Text as="p" role="body" tone="primary"
      >The <Text tone="accent">n</Text>th harmonic of a string sounds at <Text role="math" size="inherit" data-testid="harmonic"
        >{@html HARMONIC}</Text
      >, and the reciprocal squares sum to <Text role="math" size="inherit">{@html BASEL}</Text>.</Text
    >
  </div>
{/if}
