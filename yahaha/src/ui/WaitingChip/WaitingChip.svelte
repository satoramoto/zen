<!--
  WaitingChip: names what comes next (the next section, a style waiting for the bar line). Round 2
  draws it as plain light text, quieter than what plays: no outline, no fill; neutral (`t`) is the
  muted grey of Round 2's "Main C", a hue tints it. A readout, not a control: no click, focus or
  tooltip. An empty or whitespace-only label renders nothing.
-->
<script lang="ts">
  type Props = {
    /** The text, drawn as given (a section's shown name or a style's name). Blank: nothing renders. */
    label: string
    /** The text's colour: `t` neutral, drawn in the muted grey (Round 2's next section); a section hue, or `a` for a queued style, tints it. */
    hue?: 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'a' | 't'
    /** `count` `--chip-height` (32) tall, `--type-text` (count row); `line` the same, at most 200 wide (style line); `display` 44 tall, `--type-display` (display). */
    size?: 'count' | 'line' | 'display'
  }

  let { label, hue = 't', size = 'count' }: Props = $props()
</script>

{#if label.trim() !== ''}
  <span
    class="chip {size}"
    style:--hue={hue === 't' ? 'var(--m)' : `var(--${hue})`}
    data-face="waiting"
    data-hue={hue}
    data-size={size}>{label}</span
  >
{/if}

<style>
  .chip {
    display: inline-block;
    box-sizing: border-box;
    flex: none;
    height: var(--chip-height);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    line-height: var(--chip-height);
    white-space: nowrap;
  }
  .line {
    flex: 0 1 auto;
    min-width: 0;
    max-width: var(--chip-max);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .display {
    height: var(--chip-height-display);
    font: var(--type-display);
    letter-spacing: var(--tracking-display);
    font-variant-numeric: tabular-nums;
    line-height: var(--chip-height-display);
  }
</style>
