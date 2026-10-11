<!--
  QuickRacksPlayground: a story-only wrapper for the Quick Racks Playground story. It takes the
  same props as QuickRacksScreen, keeps what you change in its own state (seeded from the props,
  re-seeded when a prop changes in the Controls panel), and renders the screen with it. Every
  handler also calls the prop's own callback, so each press still logs in the Actions panel. No
  timers.

  - Bank letters switch the bank (A is the props' slots, C has a stored and a missing rack, the
    rest are empty); each bank keeps its own slots.
  - A tap on a stored slot loads it (the solid block, the Lit code follows); the lit one recalls
    it clean (the modified dot goes). Rack ◀ ▶ step to the previous or next stored slot.
  - Store arms (every slot not loaded rings); a tap then stores the live rack there, or, while it
    is modified, waits for Save: Save rack stores it, Cancel lets it go.
  - A long press or right-click saves the live rack over that slot at once; "Undo store on …" then
    shows and puts the slot back as it was. ✕ empties a slot.
  - One Touch: a press applies it, the selects pick what each loads, Link and its timing switch.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { bankCSlots } from './QuickRacks.fixtures'
  import QuickRacksScreen from './QuickRacksScreen.svelte'
  import type { QuickRackSlot, StoreUndo } from './types'

  type Props = ComponentProps<typeof QuickRacksScreen>

  let p: Props = $props()

  const letter = (i: number) => String.fromCharCode(65 + i)
  const emptyBank = (b: number): QuickRackSlot[] =>
    Array.from({ length: 8 }, (_, i) => ({ code: `${letter(b)}${i + 1}`, name: '', state: 'empty', tip: `quick.${i + 1}` }))

  /** Every bank's slots, without the faces that follow from the rest of the state. */
  let banks = $derived.by(() =>
    Array.from({ length: p.bankCount ?? 8 }, (_, b) =>
      (b === p.bank ? p.slots : b === 2 ? bankCSlots : emptyBank(b)).map((s) => ({ ...s, waiting: false })),
    ),
  )
  let bank = $derived(p.bank)
  let store = $derived(p.store ?? false)
  /** The live rack: its name and whether it changed since it was loaded. */
  let live = $derived.by(() => {
    const lit = p.slots.find((s) => s.state === 'loaded')
    return { name: lit?.name ?? p.waiting?.rack ?? 'New rack', modified: lit?.modified ?? true }
  })
  /** The slot waiting for Save: its bank and index; null when none. */
  let wait = $derived.by((): { bank: number; slot: number; name: string } | null => {
    if (!p.waiting) return null
    const slot = p.slots.findIndex((s) => s.code === p.waiting?.code)
    return slot < 0 ? null : { bank: p.bank, slot, name: p.waiting.name }
  })
  let ots = $derived({ ...p.oneTouch, items: p.oneTouch.items.map((it) => ({ ...it })) })
  /** The last store, which Undo takes back: what it shows, and the banks and live rack before it (none when seeded from the props). */
  let undo = $derived.by(
    (): { shown: StoreUndo; banks?: (QuickRackSlot & { waiting: boolean })[][]; live?: { name: string; modified: boolean } } | null =>
      p.undo ? { shown: p.undo } : null,
  )

  const slots = $derived(
    banks[bank].map((s, i) => ({
      ...s,
      modified: s.state === 'loaded' && live.modified,
      waiting: wait !== null && wait.bank === bank && wait.slot === i,
    })),
  )
  const lit = $derived.by(() => {
    for (const [b, list] of banks.entries()) {
      const i = list.findIndex((s) => s.state === 'loaded')
      if (i >= 0) return `${letter(b)}${i + 1}`
    }
    return ''
  })

  /** Unlights every slot, then puts the live rack on (bank, i) and lights it. */
  function light(b: number, i: number, name: string) {
    banks = banks.map((list, bi) =>
      list.map((s, si) => {
        if (bi === b && si === i) return { ...s, name, state: 'loaded' as const }
        return s.state === 'loaded' ? { ...s, state: 'stored' as const } : s
      }),
    )
  }

  function onbank(to: number) {
    bank = to
    p.onbank?.(to)
  }
  function onslot(i: number) {
    const s = banks[bank][i]
    if (store) {
      if (live.modified) wait = { bank, slot: i, name: live.name }
      else {
        light(bank, i, live.name)
        store = false
      }
    } else if (s.state === 'stored' || s.state === 'loaded') {
      light(bank, i, s.name)
      live = { name: s.name, modified: false }
    }
    p.onslot?.(i)
  }
  function onslotlong(i: number) {
    const was = banks[bank][i]
    undo = {
      shown: {
        code: `${letter(bank)}${i + 1}`,
        name: was.state === 'empty' ? '' : was.name,
        previous: was.state === 'loaded' ? `Previous: ${was.name}` : null,
      },
      banks,
      live,
    }
    light(bank, i, live.name)
    live = { ...live, modified: false }
    store = false
    wait = null
    p.onslotlong?.(i)
  }
  function onundo() {
    if (undo?.banks) banks = undo.banks
    if (undo?.live) live = undo.live
    undo = null
    p.onundo?.()
  }
  function onclear(i: number) {
    banks = banks.map((list, bi) => (bi === bank ? list.map((s, si) => (si === i ? { ...s, name: '', state: 'empty' as const } : s)) : list))
    p.onclear?.(i)
  }
  function onstep(delta: -1 | 1) {
    const list = banks[bank]
    const stored = list.flatMap((s, i) => (s.state === 'stored' || s.state === 'loaded' ? [i] : []))
    const at = stored.indexOf(list.findIndex((s) => s.state === 'loaded'))
    const to = at < 0 ? (delta > 0 ? stored[0] : stored[stored.length - 1]) : stored[at + delta]
    if (to !== undefined) {
      light(bank, to, list[to].name)
      live = { name: list[to].name, modified: false }
    }
    p.onstep?.(delta)
  }
  function onstore() {
    store = !store
    wait = null
    p.onstore?.()
  }
  function onsave() {
    if (wait) {
      const name = wait.name.trim() || live.name
      light(wait.bank, wait.slot, name)
      live = { name, modified: false }
    }
    wait = null
    store = false
    p.onsave?.()
  }
  function oncancel() {
    wait = null
    store = false
    p.oncancel?.()
  }
  function onname(name: string) {
    if (wait) wait = { ...wait, name }
    p.onname?.(name)
  }
  function onots(i: number) {
    ots = { ...ots, applied: i + 1 }
    p.onots?.(i)
  }
  function onotsrack(i: number, rack: string) {
    const name = ots.racks.find((r) => r.id === rack)?.name ?? ''
    ots = { ...ots, items: ots.items.map((it, j) => (j === i ? { ...it, rack, rackName: name, missing: false } : it)) }
    p.onotsrack?.(i, rack)
  }
  function onlink() {
    ots = { ...ots, link: !ots.link }
    p.onlink?.()
  }
  function ontiming(t: 'immediate' | 'mainChange') {
    ots = { ...ots, timing: t }
    p.ontiming?.(t)
  }
</script>

<QuickRacksScreen
  {...p}
  {bank}
  {slots}
  {lit}
  {store}
  waiting={wait ? { code: `${letter(wait.bank)}${wait.slot + 1}`, rack: live.name, needsName: false, name: wait.name } : null}
  oneTouch={ots}
  undo={undo?.shown ?? null}
  {onundo}
  {onbank}
  {onslot}
  {onslotlong}
  {onclear}
  {onstep}
  {onstore}
  {onsave}
  {oncancel}
  {onname}
  {onots}
  {onotsrack}
  {onlink}
  {ontiming}
/>
