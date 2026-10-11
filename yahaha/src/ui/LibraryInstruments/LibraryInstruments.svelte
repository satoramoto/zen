<!--
  LibraryInstruments: Library › Instruments. A 36px zone header (GroupHeader "Instruments" with
  the counts as its detail, the Show tabs and Rescan), then the body: the instrument list
  (ListTable: Kind, Name, Status, Sounds, Racks; "New" in the accent for a plugin not opened yet,
  ⚠ for a missing or failed one, a missing one in the absent ink) with the SoundFont folder line
  and a hint under it, and beside it the details of the chosen instrument (DetailPanel, 300px:
  title, AU/SoundFont, maker · version, the counts, the parts playing it in their hues, Browse
  sounds, + New sound, Edit…, Replace… and Show racks for a missing plugin, and the In process
  lamp). Controlled: it draws what it's given and calls back; no state of its own.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import DetailPanel from '../DetailPanel/DetailPanel.svelte'
  import type { DetailActionRow } from '../DetailPanel/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import ListTable from '../ListTable/ListTable.svelte'
  import type { ListColumn, ListRow } from '../ListTable/types'
  import type { InstrumentDetail, InstrumentRow, InstrumentShow } from './types'

  type Props = {
    /** The header's detail after the title ("3 plugins, 1 SoundFont"). */
    summary: string
    /** Which instruments the list shows (the Show tabs). */
    show?: InstrumentShow
    /** How many instruments need attention (missing or failed); the count on that tab. */
    attention?: number
    /** The rows, already filtered by `show`. */
    rows: InstrumentRow[]
    /** The chosen row's id; `null` = none. */
    selected?: string | null
    /** The chosen instrument's details; `null` shows the panel's empty text. */
    detail?: InstrumentDetail | null
    /** Plugins can be hosted (the built-in synth runs): Rescan is offered; otherwise it's drawn absent. */
    canRescan?: boolean
    /** A plugin scan is running: Rescan wears the waiting face. */
    scanning?: boolean
    /** The SoundFont folder line's value (the .sf2 files found there). */
    folder?: string
    /** The hint under the folder line. */
    hint?: string
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px. Default: fills its container. */
    height?: number
    /** The app's tooltip action (`use:tip`). */
    tipAction?: Action<HTMLElement, string>
    /** A Show tab was chosen. */
    onshow?: (show: InstrumentShow) => void
    /** A row was chosen (click or arrow keys). */
    onchoose?: (id: string) => void
    /** Rescan was pressed. */
    onrescan?: () => void
    /** Browse sounds was pressed (or a row double-clicked / Enter), with the instrument's id. */
    onbrowse?: (id: string) => void
    /** + New sound was pressed, with the instrument's id. */
    onnewsound?: (id: string) => void
    /** Edit… was pressed, with the instrument's id. */
    onedit?: (id: string) => void
    /** Replace… was pressed, with the missing instrument's id. */
    onreplace?: (id: string) => void
    /** Show racks was pressed, with the missing instrument's id. */
    onshowracks?: (id: string) => void
    /** The In process lamp asked for `on`, with the instrument's id. */
    oninprocess?: (id: string, on: boolean) => void
  }

  let {
    summary,
    show = 'all',
    attention = 0,
    rows,
    selected = null,
    detail = null,
    canRescan = true,
    scanning = false,
    folder = '',
    hint = '',
    width,
    height,
    tipAction,
    onshow,
    onchoose,
    onrescan,
    onbrowse,
    onnewsound,
    onedit,
    onreplace,
    onshowracks,
    oninprocess,
  }: Props = $props()

  const COLUMNS: ListColumn[] = [
    { key: 'kind', label: 'Kind', width: 40 },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', width: 200 },
    { key: 'sounds', label: 'Sounds', width: 52, align: 'end' },
    { key: 'racks', label: 'Racks', width: 52, align: 'end' },
  ]

  const tabs = $derived([
    { id: 'all', label: 'All', tip: 'library.inst_show' },
    { id: 'plugins', label: 'Plugins', tip: 'library.inst_show' },
    { id: 'fonts', label: 'SoundFonts', tip: 'library.inst_show' },
    {
      id: 'attention',
      label: `Needs attention ${attention}`,
      name: `Needs attention: ${attention} instrument${attention === 1 ? '' : 's'}`,
      tip: 'library.inst_show',
    },
  ])

  const listRows: ListRow[] = $derived(
    rows.map((r) => ({
      id: r.id,
      cells: [r.kind, r.name, r.status, r.sounds, r.racks],
      name: [
        r.kind,
        r.name,
        r.fresh ? 'new, not opened yet' : '',
        r.status,
        `${r.sounds} sounds`,
        `${r.racks === '—' ? 'racks unknown' : `${r.racks} racks`}`,
      ]
        .filter(Boolean)
        .join(', '),
      badge: r.fresh ? 'New' : undefined,
      badgeHue: 'a',
      warn: r.missing || r.failed,
      dim: r.missing,
    })),
  )

  const actions: DetailActionRow[] = $derived.by(() => {
    if (!detail) return []
    const first = [
      { id: 'browse', label: 'Browse sounds', primary: true, disabled: !detail.canBrowse, tip: 'library.inst_browse' },
      ...(detail.newSound
        ? [{ id: 'new', label: '+ New sound', tip: 'library.inst_new', name: `New sound from ${detail.title} on ${detail.newSound.part}` }]
        : []),
    ]
    const second = [
      ...(detail.edit ? [{ id: 'edit', label: 'Edit…', disabled: !detail.edit.enabled, tip: 'part.plugin_edit' }] : []),
      ...(detail.replace
        ? [{ id: 'replace', label: 'Replace…', disabled: !detail.replace.enabled, tip: 'library.inst_replace' }]
        : []),
      ...(detail.showRacks ? [{ id: 'racks', label: 'Show racks', tip: 'library.inst_show_racks' }] : []),
    ]
    return [{ actions: first }, ...(second.length ? [{ actions: second }] : [])]
  })

  function act(action: string) {
    if (!detail) return
    const id = detail.id
    if (action === 'browse') onbrowse?.(id)
    else if (action === 'new') onnewsound?.(id)
    else if (action === 'edit') onedit?.(id)
    else if (action === 'replace') onreplace?.(id)
    else if (action === 'racks') onshowracks?.(id)
  }
</script>

<div
  class="page"
  style:width={width === undefined ? '100%' : `${width}px`}
  style:height={height === undefined ? '100%' : `${height}px`}
>
  <GroupHeader title="Instruments" detail={summary}>
    <span class="controls">
      <ChosenTabs
        {tabs}
        chosen={show}
        size="header"
        label="Show"
        {tipAction}
        onchoose={(id) => onshow?.(id as InstrumentShow)}
      />
      <Button
        label="Rescan"
        name={scanning ? 'Rescan: scanning' : 'Rescan'}
        waiting={scanning}
        disabled={!canRescan}
        tip="part.plugin_rescan"
        {tipAction}
        onpress={() => {
          if (!scanning) onrescan?.()
        }}
      />
    </span>
  </GroupHeader>

  <div class="body">
    <div class="list">
      <div class="table">
        <ListTable
          columns={COLUMNS}
          rows={listRows}
          {selected}
          label="Instruments"
          rowHeight={36}
          emptyText="No instruments to show"
          rowTip="library.inst_row"
          {tipAction}
          onselect={(id) => onchoose?.(id)}
          onactivate={(id) => onbrowse?.(id)}
        />
      </div>
      <p class="folder">
        <span class="caption">SoundFont folder</span>
        <span class="files">{folder || 'no .sf2 files'}</span>
      </p>
      {#if hint}<p class="hint">{hint}</p>{/if}
    </div>

    <div class="details">
      <DetailPanel
        label="Instrument details"
        title={detail?.title ?? ''}
        badge={detail?.badge}
        badgeHue="m"
        subtitle={detail?.subtitle}
        fields={detail?.fields ?? []}
        {actions}
        emptyText="Choose an instrument to see its details."
        {tipAction}
        onaction={act}
      >
        {#if detail && detail.inProcess !== null}
          <div class="lamp-row">
            <span class="caption">In process</span>
            <LampButton
              label={detail.inProcess ? 'On' : 'Off'}
              on={detail.inProcess}
              size="sm"
              width={64}
              name="In process: run {detail.title} inside yahaha"
              tip="part.plugin_in_process"
              {tipAction}
              ontoggle={(on) => oninprocess?.(detail.id, on)}
            />
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
    min-width: 0;
    min-height: 0;
    font-family: var(--font-sans);
  }
  .controls {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    margin-left: auto;
  }
  .body {
    display: flex;
    flex: 1;
    gap: var(--space-24);
    min-height: 0;
  }
  .list {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .table {
    flex: 1;
    min-height: 0;
  }
  p {
    margin: 0;
  }
  .folder {
    display: flex;
    flex: none;
    align-items: baseline;
    gap: var(--space-12);
    margin-top: var(--space-12);
    min-width: 0;
    white-space: nowrap;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .caption {
    flex: none;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .files {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--t2);
  }
  .hint {
    flex: none;
    margin-top: var(--space-6);
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .details {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 300px;
    min-height: 0;
    overflow: auto;
  }
  .lamp-row {
    display: flex;
    align-items: center;
    gap: var(--space-12);
  }
  .lamp-row .caption {
    width: 96px;
  }
</style>
