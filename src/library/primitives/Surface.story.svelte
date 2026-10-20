<!--
  Surface's Svelte stories (not shipped): the same specimens as Surface.stories.tsx, from
  Surface.fixtures.ts. Svelte draws no shader material yet, so the Shader story shows every pane's
  CSS layer (the look React falls back to).
-->
<script lang="ts">
  import Surface from './Surface.svelte';
  import Text from './Text.svelte';
  import { GRID_LAYERS, GRID_MATERIALS, surfaceCaption, surfaceProps, surfaceStories as s, type SurfaceArgs } from './Surface.fixtures';

  interface Props extends SurfaceArgs {
    story: 'Playground' | 'LayersByMaterials' | 'Shader' | 'States';
  }

  let { story, ...args }: Props = $props();

  const specimen = 'width: calc(var(--control-h) * 3); height: calc(var(--control-h) * 2); display: flex; align-items: center; justify-content: center';
  /** Something with texture behind the panes, so their blur and tint read: the palette's hues as bands and dots. */
  const busy = [
    'radial-gradient(circle at 20% 30%, var(--hue-1) 0 12%, transparent 13%)',
    'radial-gradient(circle at 70% 60%, var(--hue-3) 0 16%, transparent 17%)',
    'repeating-linear-gradient(115deg, var(--hue-2) 0 var(--space-3), transparent var(--space-3) calc(var(--space-3) * 3))',
    'linear-gradient(var(--hue-4), var(--surface-0))',
  ].join(', ');
  const grid = s.LayersByMaterials.items ?? [];
</script>

{#if story === 'Playground'}
  <div style:padding="var(--space-6)">
    <Surface {...surfaceProps(args)} style={specimen}><Text role="label" tone="secondary">{surfaceCaption(args.layer, args.material)}</Text></Surface>
  </div>
{:else if story === 'LayersByMaterials'}
  <div style:padding="var(--space-4)" style:overflow-x="auto">
    <div
      style:display="grid"
      style:grid-template-columns="auto repeat({GRID_MATERIALS.length}, auto)"
      style:gap="var(--space-4)"
      style:align-items="center"
    >
      <span></span>
      {#each GRID_MATERIALS as m (m ?? 'none')}<Text role="caption" tone="muted">{m ?? 'no material'}</Text>{/each}
      {#each GRID_LAYERS as l, row (l ?? 'none')}
        <div style:display="contents">
          <Text role="caption" tone="muted">{l ?? 'no layer'}</Text>
          {#each grid.slice(row * GRID_MATERIALS.length, (row + 1) * GRID_MATERIALS.length) as { children, ...props } (props.material ?? 'none')}<Surface
              {...props}
              style={specimen}><Text role="caption" tone="secondary">{children}</Text></Surface
            >{/each}
        </div>
      {/each}
    </div>
  </div>
{:else if story === 'Shader'}
  <div style:padding="var(--space-6)" style:background={busy}>
    <div style:display="grid" style:grid-template-columns="repeat(auto-fill, minmax(calc(var(--control-h) * 4), 1fr))" style:gap="var(--space-4)">
      {#each s.Shader.items ?? [] as { children, ...props } (`${props.layer}-${String(props.shader)}`)}<Surface
          {...props}
          style="{specimen}; width: auto; flex-direction: column"
          ><Text role="label">{children}</Text><Text role="caption" tone="muted">{props.layer}</Text></Surface
        >{/each}
    </div>
  </div>
{:else}
  <div style:padding="var(--space-4)" style:display="flex" style:flex-wrap="wrap" style:gap="var(--space-4)">
    {#each s.States.items ?? [] as { children, ...props } (children)}<Surface {...props} style={specimen}><Text role="label">{children}</Text></Surface>{/each}
  </div>
{/if}
