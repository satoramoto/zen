<!--
  FaderBank's Svelte story (not shipped): the mixer's region in the box the React stories'
  decorator gives it (`region`, default the board's), the Forms story's two boxes (`forms`), or
  wired to state (`live`) as React's Live story is.
-->
<script lang="ts">
  import FaderBankRegion from './FaderBankRegion.svelte';
  import { BOARD_REGION, FORM_BOXES, faderBankStories, styleStrips } from './FaderBank.fixtures';
  import type { BankLamp, FaderBankRegionModelProps, FaderStrip } from './FaderBank.model';

  interface Props extends FaderBankRegionModelProps {
    /** The region's box. */
    region?: { width: number; height: number };
    /** Draw the Forms story's two regions, each in its form's box. */
    forms?: boolean;
    /** Wire the region to state, so faders, tabs and lamps move. */
    live?: boolean;
  }

  let { region = BOARD_REGION, forms = false, live = false, ...args }: Props = $props();

  // svelte-ignore state_referenced_locally
  let strips = $state<FaderStrip[]>(args.strips);
  // svelte-ignore state_referenced_locally
  let page = $state(args.page);
  // svelte-ignore state_referenced_locally
  let layer = $state(args.layer);
  // svelte-ignore state_referenced_locally
  let lamps = $state<BankLamp[]>(args.partLamps);
  // svelte-ignore state_referenced_locally
  let functions = $state<BankLamp[]>(args.functionLamps);

  const level = (id: string, next: number) => {
    strips = strips.map((s) => (s.id === id ? { ...s, level: next, value: String(next), away: undefined } : s));
  };
  const lamp = (id: string, on: boolean) => {
    lamps = lamps.map((l) => (l.id === id ? { ...l, on, label: on ? 'On' : 'Off' } : l));
    strips = strips.map((s) => (s.id === id ? { ...s, kind: on ? 'part' : 'off' } : s));
    functions = functions.map((l) => (l.id === id ? { ...l, on } : l));
  };
</script>

{#if forms}<div style:display="flex" style:flex-wrap="wrap" style:gap="var(--space-5)" style:align-items="flex-start">
    {#each faderBankStories.Forms.items ?? [] as item (item.form)}
      {@const box = FORM_BOXES[item.form ?? 'tall']}
      <div style:display="grid" style:width="{box.width}px" style:height="{box.height}px"><FaderBankRegion {...args} {...item} /></div>
    {/each}
  </div>
{:else}<div style:display="grid" style:width="{region.width}px" style:height="{region.height}px">
    {#if live}<FaderBankRegion
        {...args}
        strips={page === 'style' ? styleStrips : strips}
        {page}
        {layer}
        partLamps={lamps}
        functionLamps={functions}
        onLevel={level}
        onLamp={lamp}
        onChoosePage={(id: string) => (page = id)}
        onChooseLayer={(id: string) => (layer = id)}
        onPageButton={() => (page = page === 'panel' ? 'style' : 'panel')}
      />{:else}<FaderBankRegion {...args} />{/if}
  </div>
{/if}
