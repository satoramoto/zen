<!--
  PadBank's Svelte story (not shipped): the region in the frame the React stories decorate it with
  (`PAD_BANK_FRAME_WIDTH`, or the story's `frameWidth`), inside the story's `box` when it has one;
  with `items`, one region per item (the Forms story); with `playground`, a working bank (tabs
  switch bank, a press toggles a pad), as React's Playground.
-->
<script lang="ts">
  import PadBankRegion from './PadBankRegion.svelte';
  import { PAD_BANK_FRAME_WIDTH, allPadsByBank, type PadBankBox } from './PadBank.fixtures';
  import type { PadBankRegionProps, PadItem } from './PadBank.model';

  interface Props extends Omit<PadBankRegionProps, 'className'> {
    class?: string;
    frameWidth?: number;
    box?: PadBankBox;
    items?: Partial<PadBankRegionProps>[];
    playground?: boolean;
  }

  let { frameWidth = PAD_BANK_FRAME_WIDTH, box, items, playground = false, ...args }: Props = $props();

  // svelte-ignore state_referenced_locally
  let bank = $state(args.bank ?? 0);
  let sets = $state<PadItem[][]>(allPadsByBank.map((set) => [...set]));

  const chooseBank = (i: number) => {
    args.onBank?.(i);
    bank = i;
  };
  const press = (i: number) => {
    args.onPress?.(i);
    sets[bank] = sets[bank].map((pad, p) => (p === i ? { ...pad, state: pad.state === 'playing' ? 'idle' : 'playing' } : pad));
  };
</script>

{#snippet region()}{#if playground}<PadBankRegion {...args} {bank} pads={sets[bank]} onBank={chooseBank} onPress={press} />{:else if items}<div
      style:display="grid"
      style:gap="24px"
    >
      {#each items as item (item.form)}<PadBankRegion {...args} {...item} />{/each}
    </div>{:else}<PadBankRegion {...args} />{/if}{/snippet}

<div style:width="{frameWidth}px">
  {#if box}<div style:width="{box.width}px" style:height={box.height ? `${box.height}px` : undefined} style:display={box.height ? 'grid' : undefined}>
      {@render region()}
    </div>{:else}{@render region()}{/if}
</div>
