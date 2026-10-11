<!--
  HueLegend: a row of words, each after a short swatch line in its own hue (the pads header's
  Intro · Main · Ending · Break · Fill). Not a control.
-->
<script lang="ts">
  type Item = {
    /** The word ("Intro"). */
    label: string
    /** The colour token without `--` ("intro"). */
    hue: string
  }

  type Props = {
    /** The entries, left to right. */
    items: Item[]
  }

  let { items }: Props = $props()
</script>

<span class="legend">
  {#each items as item (item.label)}
    <span class="item" style:--hue="var(--{item.hue})" data-hue={item.hue}>
      <span class="swatch" aria-hidden="true"></span>{item.label}
    </span>
  {/each}
</span>

<style>
  .legend {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-8);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .item {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    color: var(--hue);
  }
  .swatch {
    width: var(--legend-swatch-width);
    height: var(--space-2);
    background: var(--hue);
  }
</style>
