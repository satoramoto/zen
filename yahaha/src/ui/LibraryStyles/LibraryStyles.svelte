<!--
  LibraryStyles: the Library's Styles page, the style browser. A 36px zone header (GroupHeader
  "Styles · {view name}", the count, the view tabs All / Favourites / Recent, the filter field and
  Open file…), then, 12px below, the body: the style folders (a 200px FolderList) beside the style
  list (a ListTable with the Track marks and stars) over a footer row (Preview on select, its
  caption or the preview note, Cancel while a style is queued, and the Load button for the cursor
  row). The filter field drives the list: ↑ ↓ PgUp PgDn Home End move the cursor (onselect), Enter
  loads it (onload), Shift+Enter previews or queues it (onpreview), Ctrl/⌘+D stars it (onstar).
  Controlled and store-free: it draws what the props say and only calls back; the app's model
  (panels/library/stylesModel.ts) fills it. Fills its container (or `width` × `height`).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import FolderList from '../FolderList/FolderList.svelte'
  import type { FolderItem } from '../FolderList/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import ListTable from '../ListTable/ListTable.svelte'
  import { stepSelection } from '../ListTable/step'
  import type { ListColumn, ListRow } from '../ListTable/types'
  import SearchField from '../SearchField/SearchField.svelte'
  import type { StyleLoad, StyleView, StyleViewTab } from './types'

  type Props = {
    /** The chosen category's name after the title: a folder's name, "All styles", "Favourites" or "Recent". */
    viewName: string
    /** The header count: "212", "9 of 212" with a filter, " · 40 indexing" while styles are being read; "—" before the library arrives. */
    count: string
    /** The view tabs, left to right, each with its count. */
    views: StyleViewTab[]
    /** The chosen view; `null` while a folder is chosen. */
    view?: StyleView | null
    /** The style folders (top-level), each with its count. */
    folders: FolderItem[]
    /** The chosen folder's `id`; `null` while a view is chosen. */
    folder?: string | null
    /** The style rows, in Track order (Recent: newest first); cells are Track #, Name, Folder, BPM, Time, File. */
    rows: ListRow[]
    /** The cursor row's `id`; `null` when the list is empty. */
    cursor?: string | null
    /** The filter text. */
    query?: string
    /** Shown in the list when it has no rows ("No style matches “waltz”"). */
    emptyText?: string
    /** Preview on select is on (the lamp lit). */
    autoPreview?: boolean
    /** The band is running: Preview on select is drawn absent, with "While stopped" after it. */
    running?: boolean
    /** The preview note after the lamp while stopped ("Previewing Sunday Drive Pop · bar 2/4 · Am"); '' for none. */
    note?: string
    /** A style is queued for the next bar: the Cancel button shows. */
    queued?: boolean
    /** Cancel can unqueue the style. False draws it absent (the engine has no command to unqueue yet). */
    canCancel?: boolean
    /** The Load button for the cursor row. */
    load: StyleLoad
    /** Open file… can open the system file picker. False draws it absent. */
    canOpenFile?: boolean
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px. Default: fills its container's height. */
    height?: number
    /** The app's tooltip action (`use:tip`), passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A view tab was chosen. */
    onview?: (view: StyleView) => void
    /** A folder was chosen, with its `id`. */
    onfolder?: (id: string) => void
    /** The filter text changed. */
    onquery?: (query: string) => void
    /** The cursor moves to a row: a click, or a list key in the filter field or the list. */
    onselect?: (id: string) => void
    /** Load this row: Enter, a double-click, or the Load button (with the cursor row). */
    onload?: (id: string) => void
    /** Shift+Enter on the cursor row: preview it while stopped, queue it while running. */
    onpreview?: (id: string) => void
    /** A row's star was pressed (or Ctrl/⌘+D on the cursor row), with its new state. */
    onstar?: (id: string, on: boolean) => void
    /** Preview on select asks to switch to `on`. */
    onautopreview?: (on: boolean) => void
    /** Cancel was pressed: unqueue the queued style. */
    oncancel?: () => void
    /** Open file… was pressed. */
    onopenfile?: () => void
  }

  let {
    viewName,
    count,
    views,
    view = null,
    folders,
    folder = null,
    rows,
    cursor = null,
    query = '',
    emptyText = '',
    autoPreview = false,
    running = false,
    note = '',
    queued = false,
    canCancel = false,
    load,
    canOpenFile = false,
    width,
    height,
    tipAction,
    onview,
    onfolder,
    onquery,
    onselect,
    onload,
    onpreview,
    onstar,
    onautopreview,
    oncancel,
    onopenfile,
  }: Props = $props()

  const ROW_HEIGHT = 28
  const HEAD_HEIGHT = 24
  const COLUMNS: ListColumn[] = [
    { key: 'track', label: 'Track', width: 56, align: 'end' },
    { key: 'name', label: 'Name' },
    { key: 'folder', label: 'Folder', width: 160 },
    { key: 'bpm', label: 'BPM', width: 52, align: 'end' },
    { key: 'time', label: 'Time', width: 52, align: 'end' },
    { key: 'file', label: 'File', width: 56 },
  ]
  const VIEW_TIPS: Record<StyleView, string> = {
    all: 'browser.all',
    favourites: 'browser.favourites',
    recents: 'browser.recents',
  }

  const tabs = $derived<TabItem[]>(
    views.map((v) => ({ id: v.id, label: `${v.label} ${v.count}`, name: `${v.label}, ${v.count} styles`, tip: VIEW_TIPS[v.id] })),
  )

  /** The list's height when it can't be measured (jsdom). */
  const DEFAULT_LIST_HEIGHT = 480
  let list: HTMLDivElement | undefined = $state()
  let listHeight = $state(DEFAULT_LIST_HEIGHT)
  /** PgUp / PgDn from the filter: the rows in view, less one. */
  const page = $derived(Math.max(1, Math.floor((listHeight - HEAD_HEIGHT) / ROW_HEIGHT) - 1))

  // Measure the list: ResizeObserver where there is one, else the window's resize event.
  $effect(() => {
    const el = list
    if (!el) return
    const measure = () => {
      listHeight = el.clientHeight > 0 ? el.clientHeight : DEFAULT_LIST_HEIGHT
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

  function filterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (cursor === null) return
      if (event.shiftKey) onpreview?.(cursor)
      else onload?.(cursor)
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      const row = cursor === null ? undefined : rows.find((r) => r.id === cursor)
      if (row && row.star !== undefined) onstar?.(row.id, !row.star)
      return
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const to = stepSelection(
      rows.map((r) => r.id),
      cursor,
      event.key,
      page,
    )
    if (to === null) return
    event.preventDefault()
    onselect?.(to)
  }
</script>

<div
  class="page"
  style:width={width === undefined ? '100%' : `${width}px`}
  style:height={height === undefined ? '100%' : `${height}px`}
>
  <GroupHeader title="Styles" detail={viewName}>
    <span class="count">{count}</span>
    <span class="views">
      <ChosenTabs {tabs} chosen={view} size="header" label="Views" {tipAction} onchoose={(id) => onview?.(id as StyleView)} />
    </span>
    <span class="tools">
      <SearchField
        value={query}
        label="Filter styles"
        placeholder="Filter by name, tempo or time"
        width={220}
        tip="browser.filter"
        {tipAction}
        oninput={(q) => onquery?.(q)}
        onkeydown={filterKey}
      />
      <Button
        label="Open file…"
        name="Open a style file from anywhere: it is added to the library and loaded"
        popup="dialog"
        disabled={!canOpenFile}
        tip="library.open_file"
        {tipAction}
        onpress={() => onopenfile?.()}
      />
    </span>
  </GroupHeader>
  <div class="body">
    <div class="folders">
      <span class="col-head" aria-hidden="true">Folder</span>
      <FolderList items={folders} chosen={folder} label="Style folders" width={200} {tipAction} onchoose={(id) => onfolder?.(id)} />
    </div>
    <div class="main">
      <div class="list" bind:this={list}>
        <ListTable
          columns={COLUMNS}
          {rows}
          selected={cursor}
          label={`Styles in ${viewName}`}
          marks
          stars
          rowHeight={ROW_HEIGHT}
          {emptyText}
          rowTip="library.style_row"
          starTip="browser.favourite"
          {tipAction}
          onselect={(id) => onselect?.(id)}
          onactivate={(id) => onload?.(id)}
          onstar={(id, on) => onstar?.(id, on)}
        />
      </div>
      <div class="foot">
        <LampButton
          label="Preview on select"
          on={autoPreview}
          disabled={running}
          tip="browser.auto_preview"
          {tipAction}
          ontoggle={(on) => onautopreview?.(on)}
        />
        <span class="note" class:caption={running} role="status" aria-live="polite">{running ? 'While stopped' : note}</span>
        {#if queued}
          <Button label="Cancel" name="Cancel the style queued for the next bar" disabled={!canCancel} tip="library.style_cancel" {tipAction} onpress={() => oncancel?.()} />
        {/if}
        <Button
          label={load.label}
          name={load.name}
          hue="a"
          waiting={load.face === 'waiting'}
          disabled={load.disabled}
          tip={load.queues ? 'browser.queue' : 'library.style_load'}
          {tipAction}
          onpress={() => {
            if (cursor !== null) onload?.(cursor)
          }}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
  }
  .count {
    flex: none;
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .views {
    display: flex;
    flex: none;
    align-items: baseline;
    margin-left: auto;
  }
  .tools {
    display: flex;
    flex: none;
    align-items: center;
    align-self: center;
    gap: var(--space-12);
  }
  .body {
    display: flex;
    flex: 1 1 0;
    gap: var(--space-24);
    min-height: 0;
  }
  /* The folders, under a column heading drawn as the list's own (24px, --m, the hairline), so each
     28px folder row lines up with a style row. */
  .folders {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 200px;
    min-height: 0;
  }
  .folders > :global(nav) {
    flex: 1 1 0;
  }
  .col-head {
    display: flex;
    flex: none;
    align-items: center;
    box-sizing: border-box;
    height: 24px;
    padding: 0 var(--space-8);
    border-bottom: var(--line-width) solid var(--line);
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .main {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: var(--space-12);
    min-width: 0;
    min-height: 0;
  }
  .list {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
  }
  .foot {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-16);
    height: 44px;
  }
  .note {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .note.caption {
    color: var(--caption-ink);
  }
</style>
