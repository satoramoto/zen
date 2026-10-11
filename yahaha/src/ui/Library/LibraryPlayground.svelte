<!--
  LibraryPlayground: a story-only wrapper for the Library Playground story. It takes the same props
  as Library, keeps what you change in its own state (seeded from the props, re-seeded when a prop
  changes in the Controls panel), and renders Library with it. Every handler also calls the prop's
  own callback, so each press still logs in the Actions panel. No timers.

  - The Library page tabs switch the page.
  - Styles: a folder or a view tab narrows the list, the filter narrows it by name or folder, a
    click or ↑ ↓ moves the cursor, Load (or Enter) loads the cursor's style: the compact block and
    the ● mark follow it. Stars toggle.
  - Sounds: the search narrows the list, Source and the categories are chosen, a click plays the
    sound on the target part: the selection and the details follow. Loads into switches.
  - Instruments: Show filters the list (Plugins, SoundFonts, Needs attention); a click chooses.
  - Racks: the search narrows the list, a click chooses a rack, Load makes it the loaded rack.
  - Quick Racks: a slot press loads it, Store arms and disarms, ◀ ▶ step the bank letter.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import type { ListRow } from '../ListTable/types'
  import Library from './Library.svelte'

  type Props = ComponentProps<typeof Library>
  type Styles = NonNullable<Props['styles']>
  type Sounds = NonNullable<Props['sounds']>
  type Instruments = NonNullable<Props['instruments']>
  type Racks = NonNullable<Props['racks']>

  let p: Props = $props()

  const has = (row: ListRow, q: string, cols: number[]) => cols.some((c) => (row.cells[c] ?? '').toLowerCase().includes(q.trim().toLowerCase()))

  // ---- Frame
  let page = $derived(p.page)
  let quick = $derived({ ...p.quickRacks, slots: p.quickRacks.slots.map((s) => ({ ...s })) })
  const BANKS = 'ABCDEFGH'

  // ---- Styles (cells: Track, Name, Folder, BPM, Time, File)
  let st = $derived(p.styles ? { ...p.styles } : undefined)
  let styleQuery = $derived(p.styles?.query ?? '')
  /** The folder picked in the playground (null: the fixture's own rows); reset when the props change. */
  let folderPicked = $derived.by((): string | null => {
    void p.styles
    return null
  })
  let loadedStyle = $derived(p.styles?.rows.find((r) => r.mark === '●')?.id ?? null)
  let starred = $derived(new Set((p.styles?.rows ?? []).filter((r) => r.star).map((r) => r.id)))
  const styleRows = $derived.by(() => {
    if (!st) return []
    let rows = p.styles?.rows ?? []
    // The fixture is the board's folder; a folder picked here keeps the rows whose folder cell is
    // one of its words ("Pop & Rock" keeps Pop and Rock).
    if (folderPicked) {
      const words = folderPicked.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      rows = rows.filter((r) => words.includes(r.cells[2].toLowerCase()))
    }
    if (st.view === 'favourites') rows = rows.filter((r) => starred.has(r.id))
    if (styleQuery.trim()) rows = rows.filter((r) => has(r, styleQuery, [1, 2]))
    return rows.map((r) => ({ ...r, mark: r.id === loadedStyle ? '●' : undefined, star: starred.has(r.id) }))
  })
  const styles = $derived.by((): Styles | undefined => {
    if (!st || !p.styles) return undefined
    const s = st
    const cursorRow = styleRows.find((r) => r.id === s.cursor)
    const all = p.styles.rows.length
    return {
      ...s,
      rows: styleRows,
      query: styleQuery,
      viewName: s.folder ?? (s.view === 'favourites' ? 'Favourites' : s.view === 'recents' ? 'Recent' : 'All styles'),
      count: styleQuery.trim() || s.folder || s.view === 'favourites' ? `${styleRows.length} of ${all}` : String(all),
      load: cursorRow
        ? { label: `Load ${cursorRow.cells[1]}`, name: `Load ${cursorRow.cells[1]}`, face: 'rest', disabled: cursorRow.id === loadedStyle, queues: false }
        : { label: 'Load', name: 'Load: nothing to load', face: 'rest', disabled: true, queues: false },
      queued: false,
      onview: (v) => {
        st = { ...s, view: v, folder: null }
        folderPicked = null
        p.styles?.onview?.(v)
      },
      onfolder: (id) => {
        st = { ...s, folder: id, view: null }
        folderPicked = id
        p.styles?.onfolder?.(id)
      },
      onquery: (q) => {
        styleQuery = q
        p.styles?.onquery?.(q)
      },
      onselect: (id) => {
        st = { ...s, cursor: id }
        p.styles?.onselect?.(id)
      },
      onload: (id) => {
        loadedStyle = id
        p.styles?.onload?.(id)
      },
      onstar: (id, on) => {
        // A new set replaces the old whole, so `starred` stays a plain reassigned value.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const next = new Set(starred)
        if (on) next.add(id)
        else next.delete(id)
        starred = next
        p.styles?.onstar?.(id, on)
      },
      onautopreview: (on) => {
        st = { ...s, autoPreview: on }
        p.styles?.onautopreview?.(on)
      },
    }
  })

  // ---- Sounds (cells: No., Name, Instrument, Source)
  let so = $derived(p.sounds ? { ...p.sounds } : undefined)
  const sounds = $derived.by((): Sounds | undefined => {
    if (!so || !p.sounds) return undefined
    const s = so
    let rows = p.sounds.rows
    const q = s.query ?? ''
    if (q.trim()) rows = rows.filter((r) => has(r, q, [0, 1, 2]))
    if (s.source === 'mine') rows = rows.filter((r) => r.cells[3] === 'Mine')
    else if (s.source === 'factory') rows = rows.filter((r) => r.cells[3] === 'Factory')
    else if (s.source === 'soundFont') rows = rows.filter((r) => r.cells[3] === 'SoundFont')
    else if (s.source === 'starred') rows = rows.filter((r) => r.star)
    return {
      ...s,
      rows,
      onquery: (q) => {
        so = { ...s, query: q }
        p.sounds?.onquery?.(q)
      },
      onsource: (src) => {
        so = { ...s, source: src }
        p.sounds?.onsource?.(src)
      },
      oncategory: (id) => {
        so = { ...s, category: id }
        p.sounds?.oncategory?.(id)
      },
      onpart: (i) => {
        so = { ...s, part: i }
        p.sounds?.onpart?.(i)
      },
      onselect: (id) => {
        const row = p.sounds?.rows.find((r) => r.id === id)
        if (row) {
          const number = row.cells[0] === '—' ? undefined : row.cells[0]
          so = {
            ...s,
            selected: id,
            edited: false,
            detail: s.detail ? { ...s.detail, id, name: row.cells[1], number, instrument: row.cells[2] } : s.detail,
          }
        }
        p.sounds?.onselect?.(id)
      },
    }
  })

  // ---- Instruments
  let ins = $derived(p.instruments ? { ...p.instruments } : undefined)
  const instruments = $derived.by((): Instruments | undefined => {
    if (!ins || !p.instruments) return undefined
    const s = ins
    let rows = p.instruments.rows
    if (s.show === 'plugins') rows = rows.filter((r) => r.kind === 'AU')
    else if (s.show === 'fonts') rows = rows.filter((r) => r.kind === 'SF')
    else if (s.show === 'attention') rows = rows.filter((r) => r.missing || r.failed)
    return {
      ...s,
      rows,
      onshow: (show) => {
        ins = { ...s, show }
        p.instruments?.onshow?.(show)
      },
      onchoose: (id) => {
        const row = p.instruments?.rows.find((r) => r.id === id)
        ins = { ...s, selected: id, detail: s.detail && row ? { ...s.detail, id, title: row.name, badge: row.kind === 'AU' ? 'AU' : 'SoundFont' } : s.detail }
        p.instruments?.onchoose?.(id)
      },
    }
  })

  // ---- Racks
  let ra = $derived(p.racks ? { ...p.racks } : undefined)
  const racks = $derived.by((): Racks | undefined => {
    if (!ra || !p.racks) return undefined
    const s = ra
    const q = s.query ?? ''
    const rows = q.trim() ? p.racks.rows.filter((r) => has(r, q, [0, 1])) : p.racks.rows
    return {
      ...s,
      rows,
      onquery: (q) => {
        ra = { ...s, query: q }
        p.racks?.onquery?.(q)
      },
      onselect: (id) => {
        const row = p.racks?.rows.find((r) => r.id === id)
        ra = { ...s, selected: id, chosen: s.chosen && row ? { ...s.chosen, name: row.cells[0] } : s.chosen }
        p.racks?.onselect?.(id)
      },
      onload: (id) => {
        const row = p.racks?.rows.find((r) => r.id === id)
        if (row) ra = { ...s, loaded: { ...s.loaded, name: row.cells[0], modified: false, missing: !!row.warn } }
        p.racks?.onload?.(id)
      },
    }
  })

  // ---- Quick Racks
  function quickSlot(i: number) {
    const slots = quick.slots.map((slot, k) => {
      if (quick.store && k === i) return { ...slot, state: 'loaded' as const, name: slot.name || 'Stored rack' }
      if (slot.state === 'loaded' && k !== i) return { ...slot, state: 'stored' as const }
      if (k === i && slot.state === 'stored') return { ...slot, state: 'loaded' as const }
      return slot
    })
    quick = { ...quick, slots, store: false }
    p.onquickslot?.(i)
  }
  function quickBank(delta: -1 | 1) {
    const at = Math.max(0, Math.min(BANKS.length - 1, BANKS.indexOf(quick.bank) + delta))
    quick = { ...quick, bank: BANKS[at] }
    p.onquickbank?.(delta)
  }
</script>

<Library
  {...p}
  {page}
  quickRacks={quick}
  {styles}
  {sounds}
  {instruments}
  {racks}
  onpage={(id) => {
    page = id
    p.onpage?.(id)
  }}
  onquickslot={quickSlot}
  onquickbank={quickBank}
  onquickstore={() => {
    quick = { ...quick, store: !quick.store }
    p.onquickstore?.()
  }}
/>
