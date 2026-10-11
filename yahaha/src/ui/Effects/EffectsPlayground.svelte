<!--
  EffectsPlayground: a story-only wrapper for the Effects Playground and On stage stories. It takes
  the same props as Effects, keeps what the controls change in its own state (seeded from the
  props, re-seeded when a prop changes in the Controls panel), and renders Effects with it: a list
  row opens its editor (sends 1–4 from the fixtures), every readout, part send, lamp and type
  choice moves, Add send and Remove change the list. Every handler calls the prop's callback too,
  so each change still shows in the Actions panel. With `stage`, it renders inside the Stage at
  1440 × 900 (the board's moment), as the app shows it. No timers.
-->
<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import { stageBoard } from '../Stage/Stage.fixtures'
  import { splitUnit } from '../Readout/readout'
  import Effects from './Effects.svelte'
  import { returnText } from './returnText'
  import { chorusBus, delayBus, eqBands, phaserBus, reverbBus } from './Effects.fixtures'
  import type { BusChange, BusData, EffectsBus, EffectsData, InsertsChange, MasterChange, MixChange, ParamRow } from './types'

  type Props = ComponentProps<typeof Effects> & { stage?: boolean }

  let p: Props = $props()

  const GAINS: Record<string, number[]> = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0],
    mellow: [0, 0, 0, 0, 0, 0, -2, -4],
    bright: [0, 0, 0, 0, 0, 0, 2, 4],
    loudness: [4, 1, 0, 0, 0, 0, 2, 4],
    powerful: [4, 2, 1, 1, 1, 1, 2, 3],
  }

  const seed = () => structuredClone($state.snapshot(p.data)) as EffectsData
  let data = $state<EffectsData>(untrack(seed))
  // Re-seeded when the data control changes.
  $effect.pre(() => {
    const next = seed()
    untrack(() => (data = next))
  })
  const buses = $state<BusData[]>([reverbBus, chorusBus, delayBus, phaserBus].map((b) => structuredClone(b)))

  /** A row with a new value, its shown value keeping its unit. */
  function moved(row: ParamRow, value: number): ParamRow {
    if (row.id === 'return') return { ...row, value, display: returnText(value) }
    const unit = splitUnit(row.display)[1]
    const sep = unit === '%' || unit === '' ? '' : ' '
    return { ...row, value, display: unit ? `${value}${sep}${unit}` : String(value) }
  }

  function setEditor(bus: BusData) {
    buses[bus.send] = bus
    if (data.bus === bus.send) data.editor = bus
    data.list.sends = data.list.sends.map((s) =>
      s.send === bus.send ? { ...s, returnLevel: bus.levels[0].value, setByRack: bus.switches.find((x) => x.id === 'rack')?.on ?? s.setByRack } : s,
    )
  }

  function onopen(bus: EffectsBus) {
    data.bus = bus
    data.editor = typeof bus === 'number' ? (buses[bus] ?? buses[0]) : null
    p.onopen?.(bus)
  }

  function onadd() {
    const send = data.list.sends.length
    const bus: BusData = { ...structuredClone(reverbBus), send, name: 'Hall', word: 'hall', styleBus: false, followStyle: null, types: phaserBus.types, type: 'hall', typeTip: 'fx.send_kind', switches: [], partsCode: '', note: phaserBus.note }
    buses[send] = bus
    data.list.sends = [...data.list.sends, { send, name: 'Hall', subtitle: 'Added send', returnLevel: 64, setByRack: false }]
    data.list.canAdd = data.list.sends.length < 6
    data.list.free = [4, 5, 6].filter((n) => n > data.list.sends.length).join(' and ') + ' free'
    p.onadd?.()
    onopen(send)
  }

  function onbus(change: BusChange) {
    const bus = buses[change.send]
    if (bus) {
      if (change.type === 'source') setEditor({ ...bus, followStyle: change.follow })
      else if (change.type === 'kind') setEditor({ ...bus, type: change.kind, followStyle: bus.styleBus ? false : null })
      else if (change.type === 'switch') setEditor({ ...bus, switches: bus.switches.map((s) => (s.id === change.id ? { ...s, on: change.on } : s)) })
      else if (change.type === 'param') {
        setEditor({
          ...bus,
          params: bus.params.map((r) => (r.id === change.id ? moved(r, change.value) : r)),
          levels: bus.levels.map((r) => (r.id === change.id ? moved(r, change.value) : r)),
        })
      } else if (change.type === 'partSend') setEditor({ ...bus, parts: bus.parts.map((x) => (x.part === change.part ? { ...x, value: change.value } : x)) })
      else if (change.type === 'remove') {
        data.list.sends = data.list.sends.filter((s) => s.send !== change.send).map((s, i) => ({ ...s, send: i }))
        data.list.canAdd = true
        onopen(0)
      }
    }
    p.onbus?.(change)
  }

  function onmaster(change: MasterChange) {
    const m = data.master
    if (change.type === 'compType') data.master = { ...m, compType: change.preset, compEdited: false }
    else if (change.type === 'compParam') data.master = { ...m, compEdited: true, comp: m.comp.map((r) => (r.id === change.id ? moved(r, change.value) : r)) }
    else if (change.type === 'eqType') data.master = { ...m, eqType: change.preset, eqEdited: false, bands: eqBands(GAINS[change.preset] ?? GAINS.flat) }
    else data.master = { ...m, eqEdited: true, bands: m.bands.map((b, i) => (i === change.band ? { ...b, gain: change.gain, freq: change.freq, q: change.q, shelf: change.shelf } : b)) }
    p.onmaster?.(change)
  }

  function oninserts(change: InsertsChange) {
    data.inserts = {
      ...data.inserts,
      rows: data.inserts.rows.map((r) => (r.part !== change.part ? r : change.type === 'on' ? { ...r, on: change.on } : { ...r, amount: change.amount })),
    }
    p.oninserts?.(change)
  }

  function onmix(change: MixChange) {
    const mix = data.mix
    if (change.type === 'insertsOn') {
      data.mix = { ...mix, insertsOn: change.on }
      data.inserts = { ...data.inserts, on: change.on }
    } else if (change.type === 'rotaryFast') data.mix = { ...mix, rotaryFast: !mix.rotaryFast }
    else if (change.type === 'compOn') data.mix = { ...mix, compOn: change.on }
    else data.mix = { ...mix, eqOn: change.on }
    data.master = { ...data.master, compOn: data.mix.compOn, eqOn: data.mix.eqOn }
    p.onmix?.(change)
  }
</script>

{#snippet effects()}
  <Effects {data} tipAction={p.tipAction} {onopen} {onadd} {onbus} {onmaster} {oninserts} {onmix} />
{/snippet}

{#if p.stage}
  <Stage {...stageBoard} appBar={{ ...stageBoard.appBar, chosen: 'effects' }} tipAction={p.tipAction} page={effects} />
{:else}
  {@render effects()}
{/if}
