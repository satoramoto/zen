<!--
  LibraryRacks: the Library's Racks page. A 36px zone header ("Racks · 9 racks", the search, the
  Needs attention lamp, + New rack), then three columns:
  - the rack list (flex): "Loaded now", the live rack's line (a green dot, its name, the modified
    dot and word, ⚠ when a part's plugin is missing, its Quick Rack slot, Save and Save as…, which
    opens an inline name field), a line per part whose plugin is missing, then the ListTable of
    your racks (Name, Sounds, Quick; ⚠ on a rack that needs attention). A click selects a rack, a
    double-click or Enter loads it; ↑ ↓ in the search move the selection, Enter loads it.
  - the chosen rack (280): a DetailPanel whose extras are the rename field (Enter renames, Esc
    puts the name back), the parts (tag in its hue, sound, an On/Off chip), Load / Duplicate /
    Delete, and the inline delete confirm (Cancel the chosen default, Delete in red text).
  - Style racks (232): the loaded style's One Touch settings 1-4, each with a picker (Style's own,
    or one of your racks), the One Touch Link lamp and the Link timing tabs.
  Controlled: every value is a prop, every change a callback; the only own state is the rename
  field's text while typing. Fills its container (or `width` × `height`).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import DetailPanel from '../DetailPanel/DetailPanel.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import ListTable from '../ListTable/ListTable.svelte'
  import { stepSelection } from '../ListTable/step'
  import type { ListColumn, ListRow } from '../ListTable/types'
  import SearchField from '../SearchField/SearchField.svelte'
  import StatusDot from '../StatusDot/StatusDot.svelte'
  import type { ChosenRack, LinkTiming, LoadedRack, MissingPart, StyleRacks } from './types'

  type Props = {
    /** How many racks you have, in the header ("9 racks"). */
    count: number
    /** The search over the racks' names and sounds. */
    query?: string
    /** The Needs attention filter is on: only racks with a missing plugin are listed. */
    attention?: boolean
    /** How many racks need attention; 0 draws the filter absent. */
    attentionCount?: number
    /** The live rack, on the "Loaded now" line. */
    loaded: LoadedRack
    /** The live rack's parts whose plugin is missing, one line each. */
    missing?: MissingPart[]
    /** The Save as… name field's text; null: the field is closed. */
    saveAsName?: string | null
    /** Your racks, as the list shows them (Name, Sounds, Quick). */
    rows: ListRow[]
    /** The id of the selected rack; null: none. */
    selected?: string | null
    /** Shown in the list when it has no rows. */
    emptyText?: string
    /** The rack the details column shows; null: its empty text. */
    chosen?: ChosenRack | null
    /** The inline delete confirm is open for the chosen rack. */
    confirming?: boolean
    /** The Style racks column. */
    styleRacks: StyleRacks
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** A fixed height in px. Default: fills its container. */
    height?: number
    /** The app's tooltip action (`use:tip`), applied to every control with a tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** The search text changed. */
    onquery?: (query: string) => void
    /** The Needs attention filter was toggled. */
    onattention?: (on: boolean) => void
    /** + New rack. */
    onnew?: () => void
    /** Save the live rack. */
    onsave?: () => void
    /** Save as… was pressed (opens or closes the name field). */
    onsaveasopen?: () => void
    /** The Save as… name was edited. */
    onsaveasname?: (name: string) => void
    /** Save the live rack as a new rack with this name. */
    onsaveas?: (name: string) => void
    /** The Save as… field was cancelled. */
    onsaveascancel?: () => void
    /** A rack was selected (click, ↑ ↓). */
    onselect?: (id: string) => void
    /** Load a rack (double-click, Enter, Load). */
    onload?: (id: string) => void
    /** Rename the chosen rack. */
    onrename?: (name: string) => void
    /** Duplicate the chosen rack. */
    onduplicate?: () => void
    /** Delete was pressed: open the confirm. */
    onaskdelete?: () => void
    /** The delete confirm was cancelled. */
    oncanceldelete?: () => void
    /** Delete the chosen rack for good. */
    ondelete?: () => void
    /** One Touch `index` (0-3) loads rack `id`; null: the style's own. */
    onotsrack?: (index: number, id: string | null) => void
    /** One Touch Link was toggled. */
    onotslink?: (on: boolean) => void
    /** The Link timing was chosen. */
    onotstiming?: (timing: LinkTiming) => void
  }

  let {
    count,
    query = '',
    attention = false,
    attentionCount = 0,
    loaded,
    missing = [],
    saveAsName = null,
    rows,
    selected = null,
    emptyText = 'No racks yet.',
    chosen = null,
    confirming = false,
    styleRacks,
    width,
    height,
    tipAction,
    onquery,
    onattention,
    onnew,
    onsave,
    onsaveasopen,
    onsaveasname,
    onsaveas,
    onsaveascancel,
    onselect,
    onload,
    onrename,
    onduplicate,
    onaskdelete,
    oncanceldelete,
    ondelete,
    onotsrack,
    onotslink,
    onotstiming,
  }: Props = $props()

  const COLUMNS: ListColumn[] = [
    { key: 'name', label: 'My racks' },
    { key: 'sounds', label: 'Sounds' },
    { key: 'quick', label: 'Quick', width: 48 },
  ]
  const PART_HUE = { R1: 'r1', R2: 'r2', R3: 'r3', L: 'l' } as const
  const TIMINGS = [
    { id: 'immediate', label: 'Immediate', tip: 'ots.link_timing' },
    { id: 'mainChange', label: 'At Main change', tip: 'ots.link_timing' },
  ]
  const uid = $props.id()

  function tipped(node: HTMLElement, key: string) {
    return tipAction?.(node, key)
  }

  /** ↑ ↓ PgUp PgDn in the search move the list's selection; Enter loads the selected rack. */
  function searchKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (selected !== null && rows.some((r) => r.id === selected)) {
        event.preventDefault()
        onload?.(selected)
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

  function renameKey(event: KeyboardEvent) {
    const el = event.currentTarget as HTMLInputElement
    if (event.key === 'Enter') {
      event.preventDefault()
      const name = el.value.trim()
      if (chosen && name && name !== chosen.name) onrename?.(name)
      else if (chosen) el.value = chosen.name
    } else if (event.key === 'Escape' && chosen) {
      event.preventDefault()
      event.stopPropagation()
      el.value = chosen.name
      el.blur()
    }
  }

  function saveAsKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const name = (saveAsName ?? '').trim()
      if (name) onsaveas?.(name)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onsaveascancel?.()
    }
  }

  function focusOnMount(node: HTMLInputElement) {
    node.focus()
    node.select()
  }
</script>

<div class="page" style:width={width === undefined ? '100%' : `${width}px`} style:height={height === undefined ? '100%' : `${height}px`}>
  <GroupHeader title="Racks" detail="{count} {count === 1 ? 'rack' : 'racks'}" level={2}>
    <div class="search">
      <SearchField value={query} label="Search racks" placeholder="Rack or sound" tip="library.racks_search" {tipAction} oninput={onquery} onkeydown={searchKey} />
    </div>
    <LampButton
      label="Needs attention {attentionCount}"
      on={attention && attentionCount > 0}
      disabled={attentionCount === 0}
      name="Needs attention: show only the {attentionCount} racks with a missing plugin"
      tip="library.racks_attention"
      {tipAction}
      ontoggle={onattention}
    />
    <Button label="+ New rack" size="md" name="New rack" tip="library.rack_new" {tipAction} onpress={onnew} />
  </GroupHeader>

  <div class="body">
    <div class="list-col">
      <span class="caption">Loaded now</span>
      <div class="loaded" aria-label="Loaded now: {loaded.name}{loaded.modified ? ', modified' : ''}{loaded.missing ? ', a plugin is missing' : ''}{loaded.slot ? `, on Quick Rack ${loaded.slot}` : ''}" role="group">
        <StatusDot hue="ok" glow name="Sounding" />
        <span class="live-name">{loaded.name}</span>
        {#if loaded.modified}
          <span class="mod"><StatusDot hue="t" size="sm" /><span>modified</span></span>
        {/if}
        {#if loaded.missing}
          <svg class="warn-glyph" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"
            ><path d="M6 1.5 L11 10.5 H1 Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" /><path d="M6 5 V7.4" stroke="currentColor" stroke-width="1" /><circle cx="6" cy="8.9" r="0.6" fill="currentColor" /></svg
          >
        {/if}
        {#if loaded.slot}<span class="slot" title="Quick Rack {loaded.slot}">{loaded.slot}</span>{/if}
        <span class="grow"></span>
        <Button label="Save" size="md" disabled={!loaded.canSave} name="Save {loaded.name}" tip="rack.save" {tipAction} onpress={onsave} />
        <Button label="Save as…" size="md" pressed={saveAsName !== null} name="Save {loaded.name} as a new rack" tip="rack.save_as" {tipAction} onpress={onsaveasopen} />
      </div>
      {#if saveAsName !== null}
        <div class="saveas">
          <label class="underline">
            <span class="hidden">New rack name</span>
            <input
              type="text"
              value={saveAsName}
              placeholder="New rack name"
              spellcheck="false"
              autocomplete="off"
              data-tip="rack.save_as_name"
              use:tipped={'rack.save_as_name'}
              use:focusOnMount
              oninput={(e) => onsaveasname?.(e.currentTarget.value)}
              onkeydown={saveAsKey}
            />
          </label>
          <Button label="Save" size="md" chosen disabled={!saveAsName.trim()} name="Save as {saveAsName.trim() || 'a new rack'}" tip="rack.save_as_commit" {tipAction} onpress={() => onsaveas?.(saveAsName!.trim())} />
          <Button label="Cancel" size="md" tip="rack.cancel_save" {tipAction} onpress={onsaveascancel} />
        </div>
      {/if}
      {#each missing as m (m.part)}
        <div class="missing">
          <svg class="warn-glyph" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"
            ><path d="M6 1.5 L11 10.5 H1 Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" /><path d="M6 5 V7.4" stroke="currentColor" stroke-width="1" /><circle cx="6" cy="8.9" r="0.6" fill="currentColor" /></svg
          >
          <span><span class="part">{m.part}</span> {m.plugin} missing, part silent</span>
        </div>
      {/each}
      <div class="table">
        <ListTable columns={COLUMNS} {rows} {selected} label="My racks" {emptyText} rowTip="library.rack_row" {tipAction} {onselect} onactivate={onload} />
      </div>
    </div>

    <div class="detail-col">
      <DetailPanel
        label="Rack details{chosen ? `: ${chosen.name}` : ''}"
        title={chosen?.name ?? ''}
        badge={chosen?.loaded ? 'Loaded' : undefined}
        badgeHue="ok"
        subtitle={chosen?.subtitle}
        emptyText="Choose a rack to see its details."
        width={280}
        {tipAction}
      >
        {#if chosen}
          {#key chosen.id + chosen.name}
            <label class="underline rename">
              <span class="caption">Name</span>
              <input type="text" value={chosen.name} aria-label="Rack name" spellcheck="false" autocomplete="off" data-tip="library.rack_name" use:tipped={'library.rack_name'} onkeydown={renameKey} onblur={(e) => (e.currentTarget.value = chosen?.name ?? '')} />
            </label>
          {/key}
          <ul class="parts" aria-label="Parts">
            {#each chosen.parts as p (p.tag)}
              <li class="part-row" aria-label="{p.tag} {p.name}, {p.on ? 'on' : 'off'}">
                <span class="tag" style:color="var(--{PART_HUE[p.tag]})">{p.tag}</span>
                <span class="sound">{p.name || '—'}</span>
                <span class="chip" class:on={p.on} aria-hidden="true">{p.on ? 'On' : 'Off'}</span>
              </li>
            {/each}
          </ul>
          <div class="actions">
            <Button label="Load {chosen.name}" size="md" chosen disabled={chosen.loaded} name="Load {chosen.name}" tip="library.rack_load" {tipAction} onpress={() => onload?.(chosen!.id)} />
            <Button label="Duplicate" size="md" name="Duplicate {chosen.name}" tip="library.rack_duplicate" {tipAction} onpress={onduplicate} />
            <Button label="Delete" size="md" hue="ending" disabled={chosen.loaded} name="Delete {chosen.name}" tip="library.rack_delete" {tipAction} onpress={onaskdelete} />
          </div>
          {#if confirming && !chosen.loaded}
            <div class="confirm" role="alertdialog" aria-labelledby="{uid}-confirm">
              <p id="{uid}-confirm">Delete {chosen.name}?<br /><span class="note">{chosen.deleteNote}</span></p>
              <div class="actions">
                <Button label="Cancel" size="md" chosen name="Cancel: keep {chosen.name}" tip="library.rack_delete_cancel" {tipAction} onpress={oncanceldelete} />
                <Button label="Delete" size="md" hue="ending" name="Delete {chosen.name} for good" tip="library.rack_delete_confirm" {tipAction} onpress={ondelete} />
              </div>
            </div>
          {/if}
        {/if}
      </DetailPanel>
    </div>

    <section class="style-col" aria-label="Style racks for {styleRacks.style}">
      <GroupHeader title="Style racks" detail="kept per style" level={3} />
      <span class="style-name">{styleRacks.style}</span>
      {#if styleRacks.slots.length === 0}
        <p class="caption">This style has no One Touch settings.</p>
      {/if}
      {#each styleRacks.slots as slot, i (i)}
        <div class="ots-row">
          <span class="ots-name">One Touch <span class:applied={styleRacks.applied === i + 1}>{i + 1}</span></span>
          <select
            aria-label="One Touch {i + 1} loads"
            value={slot.rack !== null && !slot.missing ? slot.rack : ''}
            disabled={styleRacks.readOnly}
            data-tip="ots.rack"
            use:tipped={'ots.rack'}
            onchange={(e) => onotsrack?.(i, e.currentTarget.value || null)}
          >
            <option value="">Style's own</option>
            {#each styleRacks.racks as r (r.id)}<option value={r.id}>{r.name}</option>{/each}
          </select>
        </div>
      {/each}
      <LampButton label="One Touch Link" code="OTS Link" on={styleRacks.link} tip="ots.link" {tipAction} ontoggle={onotslink} />
      <span class="caption">Link timing</span>
      <ChosenTabs tabs={TIMINGS} chosen={styleRacks.timing} size="header" label="One Touch Link timing" {tipAction} onchoose={(id) => onotstiming?.(id as LinkTiming)} />
      {#if styleRacks.readOnly}<p class="caption">Style racks can't be changed now.</p>{/if}
    </section>
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
  .search {
    width: 200px;
  }
  .body {
    display: flex;
    flex: 1 1 0;
    gap: var(--space-16);
    min-height: 0;
  }
  .list-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
    min-height: 0;
  }
  .caption {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  p {
    margin: 0;
  }
  .loaded,
  .saveas,
  .missing {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .loaded {
    min-height: 40px;
    border-bottom: var(--line-width) solid var(--line);
  }
  .live-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .mod {
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    color: var(--t2);
  }
  .warn-glyph {
    flex: none;
    color: var(--warn);
  }
  .slot {
    color: var(--value-ink);
    font-variant-numeric: tabular-nums;
  }
  .grow {
    flex: 1;
  }
  .missing {
    min-height: 24px;
    color: var(--t2);
  }
  .missing .part {
    color: var(--r3);
  }
  .table {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
    margin-top: var(--space-8);
  }
  .underline {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
    height: 30px;
    border-bottom: var(--line-width) solid var(--m);
  }
  .underline:focus-within {
    border-bottom-color: var(--t);
  }
  .underline input {
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--t);
    caret-color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    outline: none;
  }
  .underline input::placeholder {
    color: var(--m);
    opacity: 1;
  }
  .hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .detail-col {
    flex: none;
    width: 280px;
    min-height: 0;
    overflow-y: auto;
  }
  .rename {
    flex: none;
  }
  .parts {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .part-row {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    height: 28px;
    border-bottom: var(--line-width) solid var(--line);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .tag {
    flex: none;
    width: 24px;
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .sound {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--t2);
  }
  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 36px;
    height: 20px;
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--neutral);
  }
  .chip.on {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    padding: var(--space-12);
    box-shadow: inset 0 0 0 var(--line-width) var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .note {
    color: var(--t2);
  }
  .style-col {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: var(--space-8);
    width: 232px;
    min-height: 0;
    overflow-y: auto;
  }
  .style-name {
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .ots-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-8);
    min-height: 40px;
    border-bottom: var(--line-width) solid var(--line);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .ots-name {
    flex: none;
    color: var(--t2);
  }
  .applied {
    color: var(--a);
  }
  select {
    flex: 1 1 0;
    min-width: 0;
    max-width: 128px;
    height: 28px;
    padding: 0;
    border: 0;
    border-bottom: var(--line-width) solid var(--m);
    border-radius: 0;
    background: var(--g);
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  select:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  select:disabled {
    color: var(--absent-neutral);
  }
  option {
    background: var(--g);
    color: var(--t);
  }
</style>
