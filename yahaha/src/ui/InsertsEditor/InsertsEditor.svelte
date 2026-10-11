<!--
  InsertsEditor: the Effects page's editor for the style's insertion effects. A "Style inserts"
  header (" · On" / " · Off" after it, from the mix switch, which lives elsewhere), then a two-column
  grid of 36px hairline rows, the left column filled first (four rows a column), one row per Style
  part with an insert: its On lamp (the part's name), the style's XG type and "→ what plays it", and,
  when something plays it, its amount (a StepValue). A row whose insert doesn't play, or every row
  while the inserts are off, is drawn faded, and stays settable. No rows: one caption line. A note
  line under the grid. Controlled: each change goes out through onchange as an InsertsChange.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import StepValue from '../StepValue/StepValue.svelte'
  import type { InsertsChange, InsertsData } from '../Effects/types'

  type Props = {
    /** The style's inserts: the mix switch's state and one row per Style part with an insert. */
    inserts: InsertsData
    /** The app's `use:tip` action, passed in by the wiring; applied to each control with its tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** A part's insert switched, or its amount set. */
    onchange?: (change: InsertsChange) => void
  }

  let { inserts, tipAction, onchange }: Props = $props()

  /** Rows a column: up to four, the left column first. */
  const perColumn = $derived(Math.min(4, Math.max(1, inserts.rows.length)))
</script>

<section class="inserts" aria-label="Style inserts">
  <GroupHeader title="Style inserts" detail={inserts.on ? 'On' : 'Off'} />
  {#if inserts.rows.length === 0}
    <p class="empty">This style has no insertion effects.</p>
  {:else}
    <div class="grid" style:--rows={perColumn}>
      {#each inserts.rows as row (row.part)}
        {@const faded = !row.playing || !inserts.on}
        <div class="row" class:faded data-part={row.part}>
          <LampButton
            label={row.partName}
            size="sm"
            on={row.on}
            name="{row.partName} insert"
            tip="fx.insert_part"
            {tipAction}
            ontoggle={(on) => onchange?.({ type: 'on', part: row.part, on })}
          />
          <span class="names">
            <span class="xg">{row.xgName}</span>
            <span class="plays">→ {row.plays}</span>
          </span>
          {#if row.playing}
            <StepValue
              value={row.amount}
              defaultValue={64}
              dim={faded}
              name="{row.partName} insert amount"
              tip="fx.insert_amount"
              {tipAction}
              onchange={(amount) => onchange?.({ type: 'amount', part: row.part, amount })}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  <p class="note">Each Style part's own effect, before its sends. The mix switch at the right turns them all on or off.</p>
</section>

<style>
  .inserts {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    min-height: 288px;
  }
  .grid {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), 36px);
    column-gap: var(--space-24);
    margin-top: var(--header-gap);
  }
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-12);
    box-sizing: border-box;
    min-width: 0;
    height: 36px;
    border-bottom: var(--line-width) solid var(--line);
  }
  .names {
    display: flex;
    align-items: baseline;
    gap: var(--space-8);
    min-width: 0;
    white-space: nowrap;
  }
  .xg {
    overflow: hidden;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-overflow: ellipsis;
  }
  .plays {
    flex: none;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .faded .xg,
  .faded .plays {
    color: var(--absent);
  }
  .empty,
  .note {
    margin: var(--header-gap) 0 0;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
</style>
