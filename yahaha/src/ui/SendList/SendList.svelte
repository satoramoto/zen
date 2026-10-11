<!--
  SendList: the Effects page's left column, 280 × 288. A "Effects" group header, then one hairline
  row per send (its numeral, its name over a subtitle, and its return, or the "Set by rack" badge
  when the rack keeps its type), "+ Add send" while a send is free, and, pinned to the foot after
  the space, the Style inserts and Master rows. The open bus is the chosen block (a solid
  `--neutral` fill, its text in `--on-ink`), as PageList's chosen row. ↑ ↓ Home End move focus
  between the rows without opening anything; a click asks the parent to open that bus.
  Rows are 36px, shorter when there are more of them, so everything fits under the header.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import { returnText } from '../Effects/returnText'
  import type { EffectsBus, ListData, SendRowData } from '../Effects/types'

  type Props = {
    /** The sends, Add send, and the Style inserts and Master rows' second lines. */
    list: ListData
    /** The open bus: its row is chosen. */
    bus: EffectsBus
    /** The app's tooltip action (`use:tip`), applied to every row. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a row's bus on a click. */
    onopen?: (bus: EffectsBus) => void
    /** Called when Add send is clicked. */
    onadd?: () => void
  }

  let { list, bus, tipAction, onopen, onadd }: Props = $props()

  /** The column's height under the header, and the least space between the sends and the foot rows. */
  const BODY = 252
  const GAP = 12

  let rows = $derived(list.sends.length + (list.canAdd ? 1 : 0) + 2)
  let rowHeight = $derived(Math.min(36, Math.floor((BODY - GAP) / rows)))
  /** Two lines in a row: 16px each, tighter when the row is short. */
  let lineHeight = $derived(Math.min(16, Math.floor((rowHeight - 1) / 2)))

  let nav: HTMLElement | undefined = $state()

  /** Applies the parent's tooltip action when one is given. */
  const tipped: Action<HTMLElement, string> = (node, key) => {
    if (!tipAction) return
    const handle = tipAction(node, key)
    return {
      update: (next) => handle?.update?.(next),
      destroy: () => handle?.destroy?.(),
    }
  }

  function label(row: SendRowData): string {
    const end = row.setByRack ? ', type set by the rack' : `, return ${returnText(row.returnLevel)}`
    return `Send ${row.send + 1}, ${row.name}, ${row.subtitle}${end}${bus === row.send ? ', open' : ''}`
  }

  function keydown(event: KeyboardEvent) {
    const buttons = [...(nav?.querySelectorAll<HTMLButtonElement>('button.row') ?? [])]
    const index = buttons.indexOf(event.currentTarget as HTMLButtonElement)
    const to: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: buttons.length - 1 }
    if (!(event.key in to) || index < 0) return
    event.preventDefault()
    buttons[(to[event.key] + buttons.length) % buttons.length]?.focus()
  }
</script>

{#snippet foot(target: 'inserts' | 'master', name: string, subtitle: string, tip: string)}
  <button
    type="button"
    class="row"
    class:chosen={bus === target}
    aria-current={bus === target ? 'true' : undefined}
    aria-label={`${name}, ${subtitle}${bus === target ? ', open' : ''}`}
    data-face={bus === target ? 'chosen' : undefined}
    data-tip={tip}
    use:tipped={tip}
    onclick={() => onopen?.(target)}
    onkeydown={keydown}
  >
    <span class="num"></span>
    <span class="lines">
      <span class="name">{name}</span>
      <span class="sub">{subtitle}</span>
    </span>
  </button>
{/snippet}

<nav
  class="list"
  aria-label="Effects"
  bind:this={nav}
  style:--send-row-height={`${rowHeight}px`}
  style:--send-line-height={`${lineHeight}px`}
>
  <GroupHeader title="Effects" />
  {#each list.sends as row (row.send)}
    <button
      type="button"
      class="row"
      class:chosen={bus === row.send}
      aria-current={bus === row.send ? 'true' : undefined}
      aria-label={label(row)}
      data-face={bus === row.send ? 'chosen' : undefined}
      data-tip="fx.send_open"
      use:tipped={'fx.send_open'}
      onclick={() => onopen?.(row.send)}
      onkeydown={keydown}
    >
      <span class="num">{row.send + 1}</span>
      <span class="lines">
        <span class="name">{row.name}</span>
        <span class="sub">{row.subtitle}</span>
      </span>
      {#if row.setByRack}
        <span class="badge">Set by rack</span>
      {:else}
        <span class="return">{returnText(row.returnLevel)}</span>
      {/if}
    </button>
  {/each}
  {#if list.canAdd}
    <button
      type="button"
      class="row add"
      aria-label={`Add a send effect (${list.free})`}
      data-tip="fx.send_add"
      use:tipped={'fx.send_add'}
      onclick={() => onadd?.()}
      onkeydown={keydown}
    >
      <span class="num plus">+</span>
      <span class="name">Add send</span>
      <span class="free">{list.free}</span>
    </button>
  {/if}
  <span class="space"></span>
  {@render foot('inserts', 'Style inserts', list.insertsLine, 'fx.inserts_open')}
  {@render foot('master', 'Master', list.masterLine, 'fx.master_open')}
</nav>

<style>
  .list {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 280px;
    height: 288px;
    overflow: hidden;
  }
  .row {
    display: grid;
    flex: none;
    grid-template-columns: 14px minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-8);
    box-sizing: border-box;
    width: 100%;
    height: var(--send-row-height);
    margin: 0;
    padding: 0 var(--space-10) 0 var(--space-6);
    border: 0;
    border-bottom: var(--line-width) solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .num {
    color: var(--caption-ink);
    font-family: var(--font-mono);
  }
  .plus {
    font-family: var(--font-sans);
    color: var(--value-ink);
  }
  .lines {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    overflow: hidden;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    line-height: var(--send-line-height);
    text-overflow: ellipsis;
  }
  .add .name {
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .sub {
    overflow: hidden;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    line-height: var(--send-line-height);
    text-overflow: ellipsis;
  }
  .return {
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .badge {
    padding: 0 var(--space-6);
    background: var(--past);
    color: var(--t2);
  }
  .free {
    color: var(--caption-ink);
  }
  .space {
    flex: 1 1 0;
    min-height: 0;
  }

  /* The open bus: a solid neutral block, every text in the on ink. */
  .row.chosen {
    background: var(--neutral);
  }
  .chosen .name,
  .chosen .return,
  .chosen .num,
  .chosen .sub {
    color: var(--on-ink);
  }
  .chosen .num,
  .chosen .sub {
    opacity: var(--code-opacity);
  }
  .row:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--focus-offset));
  }
</style>
