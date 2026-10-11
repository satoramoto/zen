<!--
  FolderList: a vertical one-of-many list (the Library's style folders, its sound categories). A
  nav of 28px button rows: the label at the left in --t2 (ellipsis), the count at the right in --m;
  the chosen row on a solid --neutral fill with its label and count in --on-ink, aria-current. A
  disabled row is --absent and can't be chosen. The list fills its parent's height (or `height`)
  and scrolls vertically. One tab stop: ↑ ↓ Home End move focus along the rows and choose the row
  they land on. Controlled: it draws `chosen` as given and only calls onchoose; the parent moves it.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import type { FolderItem } from './types'

  type Props = {
    /** The rows, top to bottom. */
    items: FolderItem[]
    /** The `id` of the chosen row; `null` = none. A click never moves it: the parent does. */
    chosen?: string | null
    /** The nav's accessible name ("Style folders"). */
    label: string
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px. Default: fills its container's height. */
    height?: number
    /** The app's tooltip action (`use:tip`), applied to every row whose item has a `tip`. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a row's `id` on a click, or when ↑ ↓ Home End move to it. */
    onchoose?: (id: string) => void
  }

  let { items, chosen = null, label, width, height, tipAction, onchoose }: Props = $props()

  const buttons: HTMLButtonElement[] = $state([])

  // The row holding tabindex 0: follows focus, reset to `chosen` when it changes.
  let active = $derived(chosen)

  const enabled = $derived(items.flatMap((item, i) => (item.disabled ? [] : [i])))

  const stop = $derived.by(() => {
    const i = items.findIndex((item) => item.id === active)
    if (i >= 0 && !items[i].disabled) return i
    return enabled[0] ?? -1
  })

  function tipOn(node: HTMLElement, key: string | undefined) {
    if (!tipAction || !key) return
    return tipAction(node, key)
  }

  function onkeydown(event: KeyboardEvent, index: number) {
    const { key } = event
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End') return
    event.preventDefault()
    event.stopPropagation()
    if (enabled.length === 0) return
    const at = enabled.indexOf(index)
    let target: number
    if (key === 'Home') target = enabled[0]
    else if (key === 'End') target = enabled[enabled.length - 1]
    else if (key === 'ArrowDown') target = enabled[Math.min(at + 1, enabled.length - 1)]
    else target = enabled[Math.max(at - 1, 0)]
    if (target === index) return
    const item = items[target]
    active = item.id
    buttons[target]?.focus()
    onchoose?.(item.id)
  }

  function onfocusout(event: FocusEvent) {
    const next = event.relatedTarget
    if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) active = chosen
  }
</script>

<nav
  class="list"
  aria-label={label}
  style:width={width === undefined ? '100%' : `${width}px`}
  style:height={height === undefined ? '100%' : `${height}px`}
  {onfocusout}
>
  {#each items as item, i (item.id)}
    <button
      type="button"
      class="row"
      class:chosen={item.id === chosen}
      bind:this={buttons[i]}
      aria-current={item.id === chosen ? 'true' : undefined}
      disabled={item.disabled}
      tabindex={i === stop ? 0 : -1}
      data-tip={item.tip}
      use:tipOn={item.tip}
      onclick={() => onchoose?.(item.id)}
      onfocus={() => (active = item.id)}
      onkeydown={(event) => onkeydown(event, i)}
    >
      <span class="label">{item.label}</span>
      {#if item.count !== undefined}<span class="count">{item.count}</span>{/if}
    </button>
  {/each}
</nav>

<style>
  .list {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .row {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-8);
    box-sizing: border-box;
    width: 100%;
    height: 28px;
    margin: 0;
    padding: 0 var(--space-8);
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: start;
    cursor: pointer;
  }
  .label {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    flex: none;
    color: var(--m);
    font-variant-numeric: tabular-nums;
  }
  .chosen {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .chosen .count {
    color: var(--on-ink);
  }
  .row:disabled,
  .row:disabled .count {
    color: var(--absent);
    cursor: default;
  }
  .row:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
</style>
