<!--
  SettingsRow: one setting on a Settings page. Its name in a fixed label column, then the control
  (a lamp, a run of tabs, a slider, a readout), then an optional hint in the caption ink. No box:
  rows stack under their group's header. One text size for the whole row.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    /** The setting's name, in the label column ("Main timing"). */
    label: string
    /** A short note after the control ("Fader button 7"). Empty: none. */
    hint?: string
    /** The label column's width in px (the boards' 120). */
    labelWidth?: number
    /** The control. */
    children?: Snippet
  }

  let { label, hint = '', labelWidth = 120, children }: Props = $props()
</script>

<div class="row" style:--settings-label-width={`${labelWidth}px`}>
  <span class="label">{label}</span>
  <span class="control">{@render children?.()}</span>
  {#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: var(--settings-label-width) auto minmax(0, 1fr);
    align-items: center;
    column-gap: var(--space-12);
    min-height: var(--group-header-height);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .label {
    min-width: 0;
    overflow: hidden;
    color: var(--value-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .control {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
  }
  .hint {
    min-width: 0;
    overflow: hidden;
    color: var(--caption-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
