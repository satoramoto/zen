<script lang="ts">
  import type { Snippet } from 'svelte'

  /**
   * Wraps a story in the toolbar's theme and Golden tuning: the tokens apply under `data-theme` and
   * `data-tuning`, not the page. A story's `parameters.screen` (`{ width, height }`, in px) sets the
   * screen size tokens for it, to show a screen at another window size; `parameters.sample` sizes a
   * Golden tree shown on its own (its GoldenOverlay).
   */
  type Size = { width: number; height: number }
  let {
    theme,
    tuning = 'phi',
    screen,
    sample,
    children,
  }: { theme: string; tuning?: string; screen?: Size; sample?: Size; children?: Snippet } = $props()
</script>

<div
  class="theme-frame"
  data-theme={theme}
  data-tuning={tuning}
  style:--screen-width={screen ? `${screen.width}px` : undefined}
  style:--screen-height={screen ? `${screen.height}px` : undefined}
  style:--golden-sample-width={sample ? `${sample.width}px` : undefined}
  style:--golden-sample-height={sample ? `${sample.height}px` : undefined}
>
  {@render children?.()}
</div>

<style>
  /* No box of its own, so the story's layout (centered, padded, fullscreen) is unchanged. */
  .theme-frame {
    display: contents;
    color: var(--t);
    font-family: var(--font-sans);
  }
</style>
