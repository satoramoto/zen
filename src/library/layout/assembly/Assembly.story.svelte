<!--
  The Assembly demo's Svelte story (not shipped): the same specimen as Assembly.stories.tsx, from
  Assembly.fixtures.ts. Each demo part declares its forms (Assembly.fixtures.ts) and reads the
  chosen one with `getForm`; a part must be a component of its own to read the slot's context, so
  this file draws a part when given `part` (it renders itself in each region).
-->
<script lang="ts">
  import Text from '../../primitives/Text.svelte';
  import Stack from '../../primitives/Stack.svelte';
  import Region from '../Region.svelte';
  import Screen from '../Screen.svelte';
  import Self from './Assembly.story.svelte';
  import { DEMO_NAME, DEMO_SPECS, NOW_FORMS, PAD_FORMS, SIDE_FORMS, type DemoArgs } from './Assembly.fixtures';
  import { getForm } from './forms.svelte';
  import type { Placement } from './types';

  interface Props extends Partial<DemoArgs> {
    /** Draw one demo part instead of the demo. */
    part?: 'now' | 'side' | 'pads';
  }

  let { width = 900, height = 420, aspect = 'none', part }: Props = $props();

  const now = getForm(NOW_FORMS);
  const side = getForm(SIDE_FORMS);
  const pads = getForm(PAD_FORMS);

  let placement = $state<Placement | null>(null);
  const caption = $derived(
    placement
      ? `room ${Math.round(placement.room.w)} × ${Math.round(placement.room.h)}${placement.scale !== 1 ? ` at ${placement.scale.toFixed(3)}` : ''} · zoom ${placement.zoom.toFixed(3)}${placement.overflow ? ' (overflow)' : ''} · ${Object.values(
          placement.regions,
        )
          .map((r) => `${r.id} ${r.form}`)
          .join(' · ')}${placement.steps.length ? ` · steps: ${placement.steps.join('; ')}` : ''}`
      : '…',
  );
</script>

{#snippet bar()}<Text role="label">Bar</Text>{/snippet}
{#snippet nowRegion()}<Region name="Now"><Self part="now" /></Region>{/snippet}
{#snippet sideRegion()}<Region name="Library"><Self part="side" /></Region>{/snippet}
{#snippet padsRegion()}<Region name="Pads"><Self part="pads" /></Region>{/snippet}

{#if part === 'now'}
  <Stack gap={1}>
    <Text role="caption" tone="muted">Now playing · {now.current}</Text>
    <Text role={now.current === 'full' ? 'display' : 'heading'}>Main B</Text>
    {#if now.current === 'full'}<Text role="body">Next: Main C, fill after bar 4</Text>{/if}
  </Stack>
{:else if part === 'side'}
  {#if side.current === 'docked'}
    <Stack gap={1}>
      <Text role="caption" tone="muted">Library · docked</Text>
      <Text role="body">Styles</Text>
      <Text role="body">Sounds</Text>
    </Stack>
  {:else}
    <Text role="caption" tone="muted">rail</Text>
  {/if}
{:else if part === 'pads'}
  <Stack gap={1}>
    <Text role="caption" tone="muted">Pads · {pads.current}</Text>
    {#each Array.from({ length: pads.current === 'two-rows' ? 2 : 1 }, (_, r) => r) as r (r)}
      <Stack direction="row" gap={1}>
        {#each Array.from({ length: 8 }, (_, i) => r * 8 + i + 1) as n (n)}<Text role="label">{n}</Text>{/each}
      </Stack>
    {/each}
  </Stack>
{:else}
  <div style="padding: 16px; display: grid; gap: 12px">
    <Text role="caption" tone="muted">{caption}</Text>
    <!-- The frame is the room: resize it by its corner, or with the width and height controls. -->
    {#key `${width}x${height}`}
      <div style="width: {width}px; height: {height}px; resize: both; overflow: hidden; outline: 1px dashed var(--border)">
        <Screen
          name={DEMO_NAME}
          spec={DEMO_SPECS[aspect]}
          onPlacement={(next) => (placement = next)}
          regions={{ bar, now: nowRegion, side: sideRegion, pads: padsRegion }}
        />
      </div>
    {/key}
  </div>
{/if}
