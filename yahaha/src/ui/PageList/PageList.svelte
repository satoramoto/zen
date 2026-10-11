<!--
  PageList: a vertical list of pages, one row each, with the page's name alone (no summary: the
  owner found them more confusing than useful). The open page is the chosen block (a solid neutral fill, its text in the on
  ink), as a chosen tab is; the others are plain rows on hairlines. Page navigation: buttons with
  `aria-current="page"`, ↑ ↓ Home End move between them. A click never moves the choice itself:
  the parent does.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Item = {
    /** What `onchoose` carries and `chosen` names. */
    id: string
    /** The page's name ("Chord & Split"). */
    label: string
    /** The tooltip key. */
    tip?: string
  }

  type Props = {
    /** The pages, top to bottom. */
    pages: Item[]
    /** The open page's `id`; null: none. */
    chosen?: string | null
    /** The list's accessible name ("Settings pages"). */
    label?: string
    /** The app's tooltip action (`use:tip`), applied to every row whose item has a `tip`. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a page's `id` on a click, or when ↑ ↓ Home End move to it. */
    onchoose?: (id: string) => void
  }

  let { pages, chosen = null, label = 'Pages', tipAction, onchoose }: Props = $props()

  const buttons: HTMLButtonElement[] = $state([])

  function tipOn(node: HTMLElement, key: string | undefined) {
    if (!tipAction || !key) return
    return tipAction(node, key)
  }

  function keydown(event: KeyboardEvent, index: number) {
    const to: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: pages.length - 1 }
    if (!(event.key in to) || pages.length === 0) return
    event.preventDefault()
    const target = (to[event.key] + pages.length) % pages.length
    buttons[target]?.focus()
    onchoose?.(pages[target].id)
  }
</script>

<nav class="list" aria-label={label}>
  {#each pages as page, i (page.id)}
    <button
      type="button"
      class="row"
      class:chosen={page.id === chosen}
      aria-current={page.id === chosen ? 'page' : undefined}
      data-tip={page.tip}
      bind:this={buttons[i]}
      use:tipOn={page.tip}
      onclick={() => onchoose?.(page.id)}
      onkeydown={(e) => keydown(e, i)}
    >
      <span class="name">{page.label}</span>
    </button>
  {/each}
</nav>

<style>
  .list {
    --page-row-height: 38px;
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-8);
    box-sizing: border-box;
    width: 100%;
    height: var(--page-row-height);
    margin: 0;
    padding: 0 var(--space-10);
    border: 0;
    border-bottom: var(--line-width) solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--tab-rest);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .name {
    flex: none;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .row.chosen {
    background: var(--neutral);
  }
  .chosen .name {
    color: var(--on-ink);
  }
  .row:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--focus-offset));
  }
</style>
