<!--
  Display's Svelte story (not shipped): the hero in its Stage region (`DISPLAY_REGIONS`, the grid
  the React stories' `inRegion` decorator draws), or, with `forms`, the three forms side by side,
  each in a frame exactly its least, as the React Forms story.
-->
<script lang="ts">
  import { scopePrinciples } from '../../layout/assembly/principles.svelte';
  import { resolveNeed } from '../../layout/assembly/units';
  import Display from './Display.svelte';
  import { DISPLAY_FORMS } from './Display.forms';
  import { DISPLAY_REGIONS, type DisplayRegion } from './Display.fixtures';
  import type { DisplayModelProps } from './Display.model';

  interface Props extends DisplayModelProps {
    /** The region it is drawn in. */
    region?: DisplayRegion;
    /** The three forms at their least instead. */
    forms?: boolean;
  }

  let { region = 'large', forms = false, ...args }: Props = $props();
  const size = $derived(DISPLAY_REGIONS[region]);
  const p = scopePrinciples();
</script>

<div style:display="grid" style:width="{size.width}px" style:min-height="{size.height}px" style:max-width="100%">
  {#if forms}
    <div style:display="flex" style:flex-wrap="wrap" style:align-items="flex-start" style:gap="24px" style:padding="16px">
      {#each DISPLAY_FORMS as f (f.id)}
        {@const need = resolveNeed(f.min, p.current)}
        <figure style:margin="0" style:display="grid" style:gap="8px">
          <figcaption style:font="inherit" style:opacity="0.7">
            {f.id}: {Math.round(need.w)} × {Math.round(need.h)} ({(need.w / p.current.scale.control).toFixed(1)} × {(need.h / p.current.scale.control).toFixed(1)} control heights)
          </figcaption>
          <div data-testid="form-{f.id}" style:display="flex" style:width="{need.w}px" style:height="{need.h}px">
            <Display {...args} form={f.id} />
          </div>
        </figure>
      {/each}
    </div>
  {:else}
    <Display {...args} />
  {/if}
</div>
