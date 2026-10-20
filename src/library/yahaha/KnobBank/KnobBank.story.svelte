<!--
  KnobBank's Svelte story (not shipped): the Knobs region at the width the React stories decorate it
  with (`width`, default the board's), or, with `items` (the Forms story), one region per item in a
  grid, each at its form's width (`KNOB_BANK_FORM_WIDTHS`).
-->
<script lang="ts">
  import KnobBankRegion from './KnobBankRegion.svelte';
  import { KNOB_BANK_FORM_WIDTHS, KNOB_BANK_WIDTH } from './KnobBank.fixtures';
  import type { KnobBankRegionModelProps } from './KnobBank.model';

  interface Props extends KnobBankRegionModelProps {
    width?: number;
    items?: Partial<KnobBankRegionModelProps>[];
  }

  let { width = KNOB_BANK_WIDTH, items, ...args }: Props = $props();
</script>

{#if items}
  <div style:display="grid" style:gap="24px" style:justify-items="start">
    {#each items as item, i (i)}
      <div style:width="{KNOB_BANK_FORM_WIDTHS[item.form ?? ''] ?? KNOB_BANK_WIDTH}px" data-testid="form-{item.form}">
        <KnobBankRegion {...args} {...item} />
      </div>
    {/each}
  </div>
{:else}
  <div style:width="{width}px"><KnobBankRegion {...args} /></div>
{/if}
