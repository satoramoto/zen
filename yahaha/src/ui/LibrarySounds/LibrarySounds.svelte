<!--
  LibrarySounds: the Library's Sounds page, where a keyboard part changes its sound. No header of
  its own: its Save and Save as… sit at the Library header's right end (LibrarySoundsSave). A filter row: the
  search, the Source tabs (All, Mine, Factory, SoundFont, ★ Starred), the instrument filter as a
  removable button (from Instruments › Browse sounds), and "Loads into" with the part tabs. Then
  three columns: the categories with their counts (All first), the ListTable of sounds (No., Name,
  Instrument, Source; stars; ⚠ on a sound that can't play), and the selected sound's details (280):
  Category (a select for a sound whose category can change), Playing on, Audition (only while the
  band is stopped), Use on the part, Copy to My Sounds, and for My Sounds Duplicate, Move up / down
  and Delete with its inline confirm.
  A row click plays the sound on the target part at once and selects it (`onselect`); ↑ ↓ PgUp
  PgDn in the search step and play; Enter plays the selected row again.
  Controlled: every value is a prop, every change a callback. Fills its container (or
  `width` × `height`).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import DetailPanel from '../DetailPanel/DetailPanel.svelte'
  import type { DetailActionRow, DetailField } from '../DetailPanel/types'
  import FolderList from '../FolderList/FolderList.svelte'
  import type { FolderItem } from '../FolderList/types'
  import ListTable from '../ListTable/ListTable.svelte'
  import { stepSelection } from '../ListTable/step'
  import type { ListColumn, ListRow } from '../ListTable/types'
  import SearchField from '../SearchField/SearchField.svelte'
  import type { PartHue, SoundCategoryItem, SoundDetail, SoundSourceTab } from './types'

  type Props = {
    /** The four keyboard parts' names, Right 1 to Left. */
    partNames: string[]
    /** The target part (0-3): what a row click plays on, and "Loads into". */
    part: number
    /** The search text. */
    query?: string
    /** The chosen Source tab. */
    source?: SoundSourceTab
    /** The instrument filter's name (Instruments › Browse sounds); null: none. */
    instrument?: string | null
    /** The categories in the Genos order, with their counts. */
    categories: SoundCategoryItem[]
    /** The chosen category's id; null: All. */
    category?: string | null
    /** The sounds, as the list shows them (No., Name, Instrument, Source). */
    rows: ListRow[]
    /** The selected row's id (the sound the target part plays, or the one moved to). */
    selected?: string | null
    /** Shown in the list when it has no rows. */
    emptyText?: string
    /** The selected sound, in the details column; null: its empty text. */
    detail?: SoundDetail | null
    /** The band is running: Audition is off. */
    running?: boolean
    /** The inline delete confirm is open for the selected sound. */
    confirmDelete?: boolean
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px. Default: fills its container. */
    height?: number
    /** The app's tooltip action (`use:tip`), applied to every control with a tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** The search text changed. */
    onquery?: (query: string) => void
    /** A Source tab was chosen. */
    onsource?: (source: SoundSourceTab) => void
    /** A part was chosen in "Loads into" (0-3). */
    onpart?: (part: number) => void
    /** The instrument filter was removed. */
    onclearinstrument?: () => void
    /** A category was chosen; null: All. */
    oncategory?: (category: string | null) => void
    /** A row was clicked or stepped to: play it on the target part and select it. */
    onselect?: (id: string) => void
    /** A row's star was pressed, with its new state. */
    onstar?: (id: string, on: boolean) => void
    /** Audition the selected sound. */
    onaudition?: (id: string) => void
    /** Play the selected sound on the target part. */
    onuse?: (id: string) => void
    /** Copy the selected sound to My Sounds. */
    oncopy?: (id: string) => void
    /** Duplicate the selected My Sounds sound. */
    onduplicate?: (id: string) => void
    /** Move the selected My Sounds sound one place up (-1) or down (1). */
    onmove?: (id: string, by: -1 | 1) => void
    /** Delete was pressed: open the confirm. */
    onaskdelete?: () => void
    /** The delete confirm was cancelled. */
    oncanceldelete?: () => void
    /** Delete the selected My Sounds sound for good. */
    ondelete?: (id: string) => void
    /** The selected sound's category was changed. */
    onsetcategory?: (id: string, category: string) => void
  }

  let {
    partNames,
    part,
    query = '',
    source = 'all',
    instrument = null,
    categories,
    category = null,
    rows,
    selected = null,
    emptyText = 'No sounds match.',
    detail = null,
    running = false,
    confirmDelete = false,
    width,
    height,
    tipAction,
    onquery,
    onsource,
    onpart,
    onclearinstrument,
    oncategory,
    onselect,
    onstar,
    onaudition,
    onuse,
    oncopy,
    onduplicate,
    onmove,
    onaskdelete,
    oncanceldelete,
    ondelete,
    onsetcategory,
  }: Props = $props()

  const HUES: PartHue[] = ['r1', 'r2', 'r3', 'l']
  const SHORT = ['R1', 'R2', 'R3', 'L']
  const BADGE = { mine: 'Mine', factory: 'Factory', soundFont: 'SoundFont' } as const
  const COLUMNS: ListColumn[] = [
    { key: 'num', label: 'No.', width: 44, align: 'end' },
    { key: 'name', label: 'Name' },
    { key: 'inst', label: 'Instrument' },
    { key: 'src', label: 'Source', width: 80 },
  ]
  const SOURCES = [
    { id: 'all', label: 'All', tip: 'library.src_all' },
    { id: 'mine', label: 'Mine', tip: 'library.src_mine' },
    { id: 'factory', label: 'Factory', tip: 'library.src_factory' },
    { id: 'soundFont', label: 'SoundFont', tip: 'library.src_soundfont' },
    { id: 'starred', label: '★ Starred', name: 'Starred', tip: 'library.src_starred' },
  ]
  const ALL = 'all'
  const uid = $props.id()

  const targets = $derived(partNames.slice(0, 4).map((n, i) => ({ id: String(i), label: SHORT[i], name: `Load into ${n}`, tip: 'library.target' })))
  const folders = $derived<FolderItem[]>([
    { id: ALL, label: 'All', count: categories.reduce((n, c) => n + c.count, 0).toLocaleString(), tip: 'library.category' },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: c.count.toLocaleString(), tip: 'library.category' })),
  ])
  const categoryLabel = $derived(category ? (categories.find((c) => c.id === category)?.label ?? category) : 'All')
  const partName = $derived(partNames[part] ?? '')
  const listLabel = $derived(`${categoryLabel === 'All' ? 'All' : categoryLabel} sounds. Click plays on ${partName}`)

  const fields = $derived.by<DetailField[]>(() => {
    if (!detail) return []
    const out: DetailField[] = []
    if (!detail.categoryEditable) out.push({ label: 'Category', values: [{ text: categories.find((c) => c.id === detail.category)?.label ?? detail.category }] })
    out.push({
      label: 'Playing on',
      values: detail.playingOn.length ? detail.playingOn.map((k) => ({ text: partNames[k] ?? SHORT[k], hue: HUES[k] })) : [{ text: '—', hue: 'm' }],
    })
    if (detail.warn) out.push({ label: 'Problem', values: [{ text: detail.warn, hue: 'warn' }] })
    return out
  })

  const actions = $derived.by<DetailActionRow[]>(() => {
    if (!detail) return []
    const first: DetailActionRow = {
      actions: [{ id: 'audition', label: 'Audition', disabled: running || !detail.canAudition, tip: 'sound.audition' }],
      note: running ? 'Stop the band to audition.' : detail.canAudition ? undefined : 'Copy it to My Sounds to audition it.',
    }
    if (!detail.playingOn.includes(part)) first.actions.push({ id: 'use', label: `Use on ${partName}`, primary: true, tip: 'sound.use_on_part' })
    const second: DetailActionRow = {
      actions: [{ id: 'copy', label: 'Copy to My Sounds', disabled: detail.inMySounds, tip: 'library.copy' }],
    }
    if (detail.badge === 'mine') {
      second.actions.push(
        { id: 'duplicate', label: 'Duplicate', tip: 'sound.duplicate' },
        { id: 'up', label: 'Move up', disabled: !detail.canMoveUp, tip: 'sound.move_up' },
        { id: 'down', label: 'Move down', disabled: !detail.canMoveDown, tip: 'sound.move_down' },
        { id: 'delete', label: 'Delete', hue: 'ending', tip: 'sound.delete' },
      )
    }
    return [first, second]
  })

  function act(id: string) {
    if (!detail) return
    const s = detail.id
    if (id === 'audition') onaudition?.(s)
    else if (id === 'use') onuse?.(s)
    else if (id === 'copy') oncopy?.(s)
    else if (id === 'duplicate') onduplicate?.(s)
    else if (id === 'up') onmove?.(s, -1)
    else if (id === 'down') onmove?.(s, 1)
    else if (id === 'delete') onaskdelete?.()
  }

  function tipped(node: HTMLElement, key: string) {
    return tipAction?.(node, key)
  }

  /** ↑ ↓ PgUp PgDn in the search step through the list and play; Enter plays the selected row. */
  function searchKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (selected !== null && rows.some((r) => r.id === selected)) {
        event.preventDefault()
        onselect?.(selected)
      }
      return
    }
    if (event.key === 'Home' || event.key === 'End') return
    const to = stepSelection(
      rows.map((r) => r.id),
      selected,
      event.key,
      10,
    )
    if (to === null) return
    event.preventDefault()
    onselect?.(to)
  }

</script>

<div class="page" style:width={width === undefined ? '100%' : `${width}px`} style:height={height === undefined ? '100%' : `${height}px`}>
  <div class="filters">
    <div class="search">
      <SearchField value={query} label="Search sounds" placeholder="Search sounds or a number" tip="library.search" {tipAction} oninput={onquery} onkeydown={searchKey} />
    </div>
    <ChosenTabs tabs={SOURCES} chosen={source} size="header" label="Source" {tipAction} onchoose={(id) => onsource?.(id as SoundSourceTab)} />
    {#if instrument}
      <Button label="✕ {instrument}" name="Show every instrument, not only {instrument}" tip="library.inst_clear" {tipAction} onpress={onclearinstrument} />
    {/if}
    <div class="target" role="group" aria-labelledby="{uid}-loads">
      <span class="caption" id="{uid}-loads">Loads into</span>
      <ChosenTabs tabs={targets} chosen={String(part)} size="header" label="Loads into part" {tipAction} onchoose={(id) => onpart?.(Number(id))} />
    </div>
  </div>

  <div class="body">
    <div class="cats">
      <span class="col-head" aria-hidden="true">Category</span>
      <FolderList items={folders} chosen={category ?? ALL} label="Category" {tipAction} onchoose={(id) => oncategory?.(id === ALL ? null : id)} />
    </div>
    <div class="list">
      <ListTable
        columns={COLUMNS}
        {rows}
        {selected}
        label={listLabel}
        stars
        {emptyText}
        rowTip="library.row"
        starTip="sounds.favourite"
        {tipAction}
        {onselect}
        onactivate={onselect}
        {onstar}
      />
    </div>
    <div class="detail">
      <DetailPanel
        label="Sound details"
        title={detail?.name ?? ''}
        number={detail?.number}
        badge={detail ? BADGE[detail.badge] : undefined}
        badgeHue={detail?.badge === 'mine' ? 'a' : 'm'}
        subtitle={detail?.instrument}
        {fields}
        {actions}
        emptyText="Choose a sound to see its details."
        {tipAction}
        onaction={act}
      >
        {#if detail?.categoryEditable}
          <label class="field">
            <span class="caption">Category</span>
            <select
              class="line-input"
              value={detail.category}
              data-tip="sound.edit_category"
              use:tipped={'sound.edit_category'}
              onchange={(e) => detail && onsetcategory?.(detail.id, e.currentTarget.value)}
            >
              {#each categories as c (c.id)}<option value={c.id}>{c.label}</option>{/each}
            </select>
          </label>
        {/if}
        {#if detail && confirmDelete}
          <div class="confirm" role="group" aria-label="Delete {detail.name}?">
            <span class="ask">Delete {detail.name} for good?</span>
            <Button label="Keep" chosen tip="sounds.delete_cancel" {tipAction} onpress={oncanceldelete} />
            <Button label="Delete" hue="ending" name="Delete for good" tip="sounds.delete_confirm" {tipAction} onpress={() => detail && ondelete?.(detail.id)} />
          </div>
        {/if}
      </DetailPanel>
    </div>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    box-sizing: border-box;
    min-height: 0;
    font-family: var(--font-sans);
    color: var(--t);
  }
  .confirm,
  .field {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .caption {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .ask {
    color: var(--t);
    white-space: nowrap;
  }
  .line-input {
    box-sizing: border-box;
    height: 30px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-bottom: var(--line-width) solid var(--m);
    border-radius: 0;
    background: var(--g);
    color: var(--t);
    caret-color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    outline: none;
  }
  .line-input:focus,
  .line-input:focus-visible {
    border-bottom-color: var(--t);
  }
  .line-input option {
    background: var(--g);
    color: var(--t);
  }
  .filters {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-16);
    min-width: 0;
  }
  .search {
    flex: 0 1 240px;
    min-width: 120px;
  }
  .target {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin-left: auto;
  }
  .body {
    display: flex;
    flex: 1 1 0;
    gap: var(--space-16);
    min-height: 0;
  }
  /* The categories, under a column heading drawn as the list's own (24px, --m, the hairline), so
     each 28px category row lines up with a sound row. */
  .cats {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 168px;
    min-height: 0;
  }
  .cats > :global(nav) {
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
  .list {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .detail {
    flex: none;
    width: 280px;
    min-height: 0;
    overflow-y: auto;
  }
  .field {
    justify-content: space-between;
  }
  .field select {
    flex: 1 1 0;
    max-width: 160px;
  }
  .confirm {
    flex-wrap: wrap;
    white-space: normal;
  }
</style>
