<!--
  ListTable: the one list of every Library page (styles, sounds, instruments, racks). A 24px
  header of column labels in --m over a virtualised listbox of rows: only the rows in view (plus
  an overscan) are in the DOM, over a spacer as tall as all of them, so tens of thousands of rows
  stay fast. Rows have a hairline below; the first flex column is --type-strong in --t, the others
  --t2, every cell ellipsised with tabular digits. An optional 16px lead column carries a row's
  mark ("●", "▶") in --a, an optional 24px star column its star button. The selected row is a
  solid --neutral fill with all its text, mark, badge, ⚠ and star in --on-ink. The list is one tab
  stop: ↑ ↓ PgUp PgDn Home End select (onselect), Enter or a double-click activates (onactivate).
  A star button sits over its row but outside the listbox (an option can't hold a control), so a
  click on it stars without selecting. Controlled: it draws `selected` as given and scrolls it into
  view when it changes; the parent moves it. Fills its parent's height (or `height`).
-->
<script lang="ts">
  import { untrack } from 'svelte'
  import type { Action } from 'svelte/action'
  import { stepSelection } from './step'
  import type { ListColumn, ListRow } from './types'

  type Props = {
    /** The columns, left to right. A column without `width` flexes; the first of those is the strong one. */
    columns: ListColumn[]
    /** The rows, top to bottom; each has one cell per column. */
    rows: ListRow[]
    /** The `id` of the selected row; `null` = none. A click never moves it: the parent does. */
    selected?: string | null
    /** The listbox's accessible name ("Styles"). */
    label: string
    /** Show the 16px lead column for the rows' marks. */
    marks?: boolean
    /** Show the 24px star column (after the mark column); rows with `star` set get a star button. */
    stars?: boolean
    /** Each row's height in px. */
    rowHeight?: number
    /** Shown centred in `--m` when there are no rows ("No styles match"). */
    emptyText?: string
    /** The tooltip key on the listbox (its one tab stop) and every option (`data-tip`, passed to `tipAction`). */
    rowTip?: string
    /** The tooltip key on every star button. */
    starTip?: string
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px, header included. Default: fills its container's height. */
    height?: number
    /** The app's tooltip action (`use:tip`), applied to the options and star buttons when their key is set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a row's `id` on a click, or when ↑ ↓ PgUp PgDn Home End move to it. */
    onselect?: (id: string) => void
    /** Called with a row's `id` on a double-click, or with the selected row's on Enter. */
    onactivate?: (id: string) => void
    /** Called when a star button is pressed, with the row's `id` and the star's new state. */
    onstar?: (id: string, on: boolean) => void
  }

  let {
    columns,
    rows,
    selected = null,
    label,
    marks = false,
    stars = false,
    rowHeight = 28,
    emptyText = '',
    rowTip,
    starTip,
    width,
    height,
    tipAction,
    onselect,
    onactivate,
    onstar,
  }: Props = $props()

  /** Rows rendered above and below the view. */
  const OVERSCAN = 8
  /** The view's height when it can't be measured (jsdom). */
  const DEFAULT_HEIGHT = 480
  const MARK_WIDTH = 16
  const STAR_WIDTH = 24

  const uid = $props.id()

  let viewport: HTMLDivElement | undefined = $state()
  let listbox: HTMLDivElement | undefined = $state()
  let scrollTop = $state(0)
  let viewHeight = $state(DEFAULT_HEIGHT)

  const ids = $derived(rows.map((row) => row.id))
  const selectedIndex = $derived(selected === null ? -1 : ids.indexOf(selected))
  const firstFlex = $derived(columns.findIndex((column) => column.width === undefined))
  const page = $derived(Math.max(1, Math.floor(viewHeight / rowHeight) - 1))

  /** The indices in the DOM: the view plus the overscan, and the selected row wherever it is. */
  const visible = $derived.by(() => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
    const last = Math.min(rows.length, Math.ceil((scrollTop + viewHeight) / rowHeight) + OVERSCAN)
    const out: number[] = []
    for (let i = first; i < last; i++) out.push(i)
    if (selectedIndex >= 0 && (selectedIndex < first || selectedIndex >= last)) out.push(selectedIndex)
    return out
  })

  const optionId = (i: number) => `${uid}-row-${i}`

  // Measure the view: ResizeObserver where there is one, else the window's resize event.
  $effect(() => {
    const el = viewport
    if (!el) return
    const measure = () => {
      viewHeight = el.clientHeight > 0 ? el.clientHeight : DEFAULT_HEIGHT
    }
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(el)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  })

  // When the selection changes, scroll it into view, as little as needed.
  $effect(() => {
    const i = selectedIndex
    untrack(() => {
      if (i < 0 || !viewport) return
      const top = i * rowHeight
      const bottom = top + rowHeight
      let next = scrollTop
      if (top < next) next = top
      else if (bottom > next + viewHeight) next = bottom - viewHeight
      if (next !== scrollTop) {
        scrollTop = next
        viewport.scrollTop = next
      }
    })
  })

  function tipOn(node: HTMLElement, key: string | undefined) {
    if (!tipAction || !key) return
    return tipAction(node, key)
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (selected === null || selectedIndex < 0) return
      event.preventDefault()
      event.stopPropagation()
      onactivate?.(selected)
      return
    }
    const target = stepSelection(ids, selectedIndex < 0 ? null : selected, event.key, page)
    if (target === null) return
    event.preventDefault()
    event.stopPropagation()
    onselect?.(target)
  }

  /** Keep focus on the listbox (and the page from jumping) when a row or star is pressed. */
  function holdFocus(event: MouseEvent) {
    event.preventDefault()
    listbox?.focus({ preventScroll: true })
  }

  function name(row: ListRow): string {
    return row.name ?? row.cells.join(', ')
  }
</script>

<div
  class="table"
  style:width={width === undefined ? '100%' : `${width}px`}
  style:height={height === undefined ? '100%' : `${height}px`}
>
  <div class="head" aria-hidden="true">
    {#if marks}<span class="lead"></span>{/if}
    {#if stars}<span class="star-col"></span>{/if}
    {#each columns as column (column.key)}
      <span
        class="cell"
        class:fixed={column.width !== undefined}
        class:end={column.align === 'end'}
        style:width={column.width === undefined ? undefined : `${column.width}px`}>{column.label}</span
      >
    {/each}
  </div>
  <div class="viewport" bind:this={viewport} onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}>
    <div class="spacer" style:height={`${rows.length * rowHeight}px`}>
      <div
        class="listbox"
        bind:this={listbox}
        role="listbox"
        tabindex="0"
        aria-label={label}
        aria-activedescendant={selectedIndex >= 0 ? optionId(selectedIndex) : undefined}
        data-tip={rowTip}
        use:tipOn={rowTip}
        {onkeydown}
      >
        {#each visible as i (ids[i])}
          {@const row = rows[i]}
          <!-- The listbox holds focus and handles the keys (aria-activedescendant), so the options take neither. -->
          <!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
          <div
            class="option"
            class:selected={i === selectedIndex}
            class:dim={row.dim}
            id={optionId(i)}
            role="option"
            aria-selected={i === selectedIndex}
            aria-label={name(row)}
            aria-setsize={rows.length}
            aria-posinset={i + 1}
            data-tip={rowTip}
            use:tipOn={rowTip}
            style:top={`${i * rowHeight}px`}
            style:height={`${rowHeight}px`}
            onmousedown={holdFocus}
            onclick={() => onselect?.(row.id)}
            ondblclick={() => onactivate?.(row.id)}
          >
            {#if marks}<span class="lead mark">{row.mark ?? ''}</span>{/if}
            {#if stars}<span class="star-col"></span>{/if}
            {#each columns as column, c (column.key)}
              <span
                class="cell"
                class:fixed={column.width !== undefined}
                class:end={column.align === 'end'}
                class:strong={c === firstFlex}
                style:width={column.width === undefined ? undefined : `${column.width}px`}
              >
                <span class="text">{row.cells[c] ?? ''}</span>
                {#if c === firstFlex && row.badge}
                  <span class="badge" data-hue={row.badgeHue ?? 'a'}>{row.badge}</span>
                {/if}
                {#if c === firstFlex && row.warn}
                  <svg class="warn" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 1.2 11.2 10.6H0.8Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                    <line x1="6" y1="4.6" x2="6" y2="7.4" stroke="currentColor" stroke-width="1.2" />
                    <circle cx="6" cy="9" r="0.7" fill="currentColor" />
                  </svg>
                {/if}
              </span>
            {/each}
          </div>
        {/each}
      </div>
      {#if stars}
        {#each visible as i (ids[i])}
          {@const row = rows[i]}
          {#if row.star !== undefined}
            <button
              type="button"
              class="star"
              class:on={i === selectedIndex}
              class:dim={row.dim}
              tabindex="-1"
              aria-label={`${row.star ? 'Unstar' : 'Star'} ${name(row)}`}
              aria-pressed={row.star}
              data-tip={starTip}
              use:tipOn={starTip}
              style:top={`${i * rowHeight}px`}
              style:left={`${marks ? MARK_WIDTH : 0}px`}
              style:width={`${STAR_WIDTH}px`}
              style:height={`${rowHeight}px`}
              onmousedown={holdFocus}
              onclick={() => onstar?.(row.id, !row.star)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M6 0.9 7.5 4.1 11 4.5 8.4 6.9 9.1 10.4 6 8.6 2.9 10.4 3.6 6.9 1 4.5 4.5 4.1Z"
                  fill={row.star ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  stroke-width="1"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          {/if}
        {/each}
      {/if}
    </div>
    {#if rows.length === 0}
      <div class="empty">{emptyText}</div>
    {/if}
  </div>
</div>

<style>
  .table {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
  }
  .head {
    display: flex;
    flex: none;
    align-items: center;
    box-sizing: border-box;
    height: 24px;
    border-bottom: var(--line-width) solid var(--line);
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .viewport {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .viewport:has(.listbox:focus-visible) {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
  .spacer {
    position: relative;
    min-height: 100%;
  }
  .listbox {
    position: absolute;
    inset: 0;
    outline: none;
  }
  .option {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    border-bottom: var(--line-width) solid var(--line);
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    cursor: default;
    user-select: none;
  }
  .lead {
    flex: none;
    width: 16px;
    text-align: center;
    overflow: hidden;
  }
  .mark {
    color: var(--a);
  }
  .star-col {
    flex: none;
    width: 24px;
  }
  .cell {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    gap: var(--space-6);
    box-sizing: border-box;
    min-width: 0;
    padding: 0 var(--space-8);
    overflow: hidden;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .cell.fixed {
    flex: none;
  }
  .cell.end {
    justify-content: flex-end;
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .strong {
    color: var(--t);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }
  .badge {
    flex: none;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .badge[data-hue='a'] {
    color: var(--a);
  }
  .badge[data-hue='warn'] {
    color: var(--warn);
  }
  .badge[data-hue='ok'] {
    color: var(--ok);
  }
  .badge[data-hue='r1'] {
    color: var(--r1);
  }
  .badge[data-hue='r2'] {
    color: var(--r2);
  }
  .badge[data-hue='r3'] {
    color: var(--r3);
  }
  .badge[data-hue='l'] {
    color: var(--l);
  }
  .badge[data-hue='m'] {
    color: var(--m);
  }
  .warn {
    flex: none;
    color: var(--warn);
  }
  .option.dim,
  .option.dim .strong,
  .option.dim .mark {
    /* --m, not --absent: a dim row is still selectable text and must keep AA contrast. */
    color: var(--m);
  }
  .option.selected {
    background: var(--neutral);
  }
  .option.selected,
  .option.selected .strong,
  .option.selected .mark,
  .option.selected .badge,
  .option.selected .warn {
    color: var(--on-ink);
  }
  .star {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--m);
    cursor: pointer;
  }
  .star[aria-pressed='true'] {
    color: var(--a);
  }
  .star.dim {
    color: var(--m);
  }
  .star.on {
    color: var(--on-ink);
  }
  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    pointer-events: none;
  }
</style>
