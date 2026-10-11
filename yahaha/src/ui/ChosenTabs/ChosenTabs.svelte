<!--
  ChosenTabs: the one tab style, for every one-of-many choice in a header (the app's pages, the
  fader page, the fader layer, the knob page, the pad bank). A short run of plain --type-text
  labels in --tab-rest with no outline (a run, not buttons), --tab-pad-side a side; the chosen one
  on a solid --neutral block, --tab-block tall, standing on the row's bottom (the rule), its label
  in --on-ink. Every label sits on the row's one baseline (`--header-baseline`), so the chosen
  label is centred in its block and lines up with the row's other texts when the parent
  baseline-aligns them (GroupHeader, AppBar). Every size draws identically; `size` sets only the
  kind: `page` tabs are page navigation (buttons with aria-current, inside the parent's nav),
  `header` and `compact` tabs a tablist with roving focus and automatic activation. Controlled: it
  draws `chosen` as given and only calls onchoose; the parent moves it.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import type { TabItem } from './types'

  type Props = {
    /** The choices, left to right. */
    tabs: TabItem[]
    /** The `id` of the chosen tab; `null` = none is chosen. A click never moves it: the parent does. */
    chosen?: string | null
    /** The kind: `page` is page navigation (buttons with aria-current); `header` and `compact` are a tablist with roving focus. Every size draws the same: `--type-text`, `--tab-pad-side` sides, 34 tall (a 36px row minus its 2px rule), a `--tab-block` chosen block. */
    size?: 'page' | 'header' | 'compact'
    /** The tablist's accessible name (`header`, `compact`). Ignored at `page` (the parent's nav carries it). */
    label?: string
    /** The app's tooltip action (`use:tip`), applied to every tab whose item has a `tip`. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a tab's `id` on a click (the chosen tab too), or when an arrow, Home or End moves to it. */
    onchoose?: (id: string) => void
  }

  let { tabs, chosen = null, size = 'header', label, tipAction, onchoose }: Props = $props()

  const isList = $derived(size !== 'page')

  // The tab holding tabindex 0 in a tablist: follows focus, reset to `chosen` when it changes.
  let active = $derived(chosen)

  const buttons: HTMLButtonElement[] = $state([])

  const enabled = $derived(tabs.flatMap((tab, i) => (tab.disabled ? [] : [i])))

  /** The index of the tab that gets tabindex 0 (D15). */
  const stop = $derived.by(() => {
    const i = tabs.findIndex((tab) => tab.id === active)
    if (i >= 0 && !tabs[i].disabled) return i
    return enabled[0] ?? 0
  })

  function tipOn(node: HTMLElement, key: string | undefined) {
    if (!tipAction || !key) return
    return tipAction(node, key)
  }

  function choose(tab: TabItem) {
    if (tab.disabled) return
    onchoose?.(tab.id)
  }

  function onkeydown(event: KeyboardEvent, index: number) {
    const { key } = event
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return
    event.preventDefault()
    event.stopPropagation()
    if (enabled.length === 0) return
    let target: number
    if (key === 'Home') target = enabled[0]
    else if (key === 'End') target = enabled[enabled.length - 1]
    else {
      const step = key === 'ArrowRight' ? 1 : -1
      const at = enabled.indexOf(index)
      const from = at >= 0 ? at : step > 0 ? -1 : 0
      target = enabled[(from + step + enabled.length) % enabled.length]
    }
    if (target === index) return
    const tab = tabs[target]
    active = tab.id
    buttons[target]?.focus()
    onchoose?.(tab.id)
  }

  function onfocusout(event: FocusEvent) {
    const next = event.relatedTarget
    if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) active = chosen
  }

  function face(tab: TabItem): 'chosen' | 'off' | 'disabled' {
    if (tab.disabled) return 'disabled'
    return tab.id === chosen ? 'chosen' : 'off'
  }
</script>

{#if isList}
  <div
    class="run"
    data-size={size}
    role="tablist"
    aria-label={label || undefined}
    aria-orientation="horizontal"
    {onfocusout}
  >
    {#each tabs as tab, i (tab.id)}
      <button
        type="button"
        role="tab"
        class="tab"
        class:chosen={tab.id === chosen}
        bind:this={buttons[i]}
        aria-selected={tab.id === chosen}
        aria-disabled={tab.disabled ? 'true' : undefined}
        aria-label={tab.name}
        tabindex={i === stop ? 0 : -1}
        data-face={face(tab)}
        data-contrast={tab.disabled ? 'dim' : undefined}
        data-tip={tab.tip}
        use:tipOn={tab.tip}
        onclick={() => choose(tab)}
        onfocus={() => (active = tab.id)}
        onkeydown={(event) => onkeydown(event, i)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
{:else}
  <div class="run" data-size={size}>
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class="tab"
        class:chosen={tab.id === chosen}
        aria-current={tab.id === chosen ? 'page' : undefined}
        aria-disabled={tab.disabled ? 'true' : undefined}
        aria-label={tab.name}
        data-face={face(tab)}
        data-contrast={tab.disabled ? 'dim' : undefined}
        data-tip={tab.tip}
        use:tipOn={tab.tip}
        onclick={() => choose(tab)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .run {
    display: flex;
    flex: none;
    align-items: stretch;
    flex-wrap: nowrap;
  }
  /* The label sits on the row's baseline: the empty strut before it is as tall as the baseline is
     deep, and the strut's bottom is the baseline the label aligns to. */
  .tab {
    display: flex;
    align-items: baseline;
    justify-content: center;
    box-sizing: border-box;
    height: var(--tab-height-header);
    margin: 0;
    padding: 0 var(--tab-pad-side);
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--tab-rest);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
  }
  .tab::before {
    content: '';
    flex: none;
    width: 0;
    height: var(--header-baseline);
  }
  .chosen {
    background: linear-gradient(var(--neutral), var(--neutral)) left bottom / 100% var(--tab-block) no-repeat;
    color: var(--on-ink);
  }
  .tab[aria-disabled='true'] {
    color: var(--absent);
    cursor: default;
  }
  .tab:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
