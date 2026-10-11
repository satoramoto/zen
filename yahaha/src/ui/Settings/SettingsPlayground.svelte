<!--
  SettingsPlayground: a story-only wrapper for the Settings Playground story. It takes the same props
  as Settings, keeps what the controls change in its own state (seeded from the props, re-seeded when
  a prop changes in the Controls panel), and renders Settings with that state. Every handler calls
  the prop's callback too, so each change still shows in the Actions panel. No timers.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Settings from './Settings.svelte'
  import type {
    ChordChange,
    ChordPageData,
    KeyboardChange,
    LaunchkeyChange,
    PadPageRow,
    PedalsChange,
    PedalRow,
    SettingsPageId,
    StyleChange,
    SystemChange,
  } from './types'

  type Props = ComponentProps<typeof Settings>

  let p: Props = $props()

  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  /** Yamaha numbering: C3 is MIDI 60. */
  const noteName = (n: number) => `${NOTES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 2}`
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

  let page = $derived(p.page)
  let chord = $derived({ ...p.chord })
  let style = $derived({ ...p.style })
  let keyboard = $derived({ ...p.keyboard })
  let pedals = $derived({ ...p.pedals, pedals: p.pedals.pedals.map((x) => ({ ...x })), parts: p.pedals.parts.map((x) => ({ ...x })) })
  let system = $derived({ ...p.system, inputs: p.system.inputs.map((x) => ({ ...x })) })
  let launchkey = $derived({ ...p.launchkey, pages: p.launchkey.pages.map((x) => ({ ...x })) })
  let appBar = $derived({ ...p.appBar })

  // The keys follow the split, and set it: drag the line, or arm the pick and click a key.
  let keys = $derived({
    ...p.keys,
    split: chord.split,
    splitMin: chord.splitMin,
    splitMax: chord.splitMax,
    splitLocked: chord.splitLocked,
    picking: chord.picking,
    tipAction: p.tipAction,
    onsplit: (note: number) => {
      if (!chord.splitLocked) chord = setSplit(chord, note)
      keyboard = { ...keyboard, splitName: chord.splitName }
    },
    onpick: (armed: boolean) => onchord({ type: 'pick', armed }),
  })

  function onpage(id: SettingsPageId) {
    page = id
    p.onpage?.(id)
  }

  function setSplit(next: ChordPageData, note: number) {
    const split = clamp(note, next.splitMin, next.splitMax)
    return { ...next, split, splitName: noteName(split) }
  }

  function onchord(c: ChordChange) {
    p.onchord?.(c)
    if (c.type === 'fingering') chord = { ...chord, fingering: c.id }
    else if (c.type === 'upper') chord = { ...chord, upper: c.on, manualBass: c.on && chord.manualBass }
    else if (c.type === 'manualBass') chord = { ...chord, manualBass: c.on }
    else if (c.type === 'leftHold') chord = { ...chord, leftHold: c.on }
    else if (c.type === 'settle') chord = { ...chord, settleMs: c.ms }
    else if (c.type === 'splitStep') chord = setSplit(chord, chord.split + c.delta)
    else if (c.type === 'pick') chord = { ...chord, picking: c.armed && !chord.splitLocked }
    else if (c.type === 'splitReset') chord = setSplit(chord, chord.splitDefault)
    else if (c.type === 'openKeyboard') page = 'keyboard'
    keyboard = { ...keyboard, splitName: chord.splitName }
  }

  function onstyle(c: StyleChange) {
    p.onstyle?.(c)
    style = { ...style, [c.key]: c.value }
  }

  function hear(k: number, m: number) {
    return NOTES[(((k + m) % 12) + 12) % 12]
  }

  function onkeyboard(c: KeyboardChange) {
    p.onkeyboard?.(c)
    let { transposeKeyboard: k, transposeMaster: m } = keyboard
    if (c.type === 'keyboardStep') k = clamp(k + c.delta, -12, 12)
    else if (c.type === 'masterStep') m = clamp(m + c.delta, -12, 12)
    else if (c.type === 'reset') k = m = 0
    else if (c.type === 'lock') {
      keyboard = c.item === 'splitPoint' ? { ...keyboard, lockSplit: c.on } : { ...keyboard, lockFingering: c.on }
      if (c.item === 'splitPoint') chord = { ...chord, splitLocked: c.on, picking: chord.picking && !c.on }
      return
    }
    keyboard = { ...keyboard, transposeKeyboard: k, transposeMaster: m, youHear: hear(k, m) }
  }

  function setPedal(i: number, change: Partial<PedalRow>) {
    pedals = { ...pedals, pedals: pedals.pedals.map((x, j) => (j === i ? { ...x, ...change } : x)) }
  }

  function onpedals(c: PedalsChange) {
    p.onpedals?.(c)
    if (c.type === 'cc') setPedal(c.pedal, { cc: c.cc, learning: false })
    else if (c.type === 'function') setPedal(c.pedal, { fn: c.fn })
    else if (c.type === 'controlType') setPedal(c.pedal, { controlType: c.value })
    else if (c.type === 'reverse') setPedal(c.pedal, { reverse: c.on })
    else if (c.type === 'range') setPedal(c.pedal, { range: c.value })
    else if (c.type === 'learn')
      pedals = { ...pedals, pedals: pedals.pedals.map((x, j) => ({ ...x, learning: j === c.pedal ? !x.learning : false })) }
    else if (c.type === 'reach')
      pedals = { ...pedals, parts: pedals.parts.map((x, j) => (j === c.part ? { ...x, [c.controller]: c.on } : x)) }
    else if (c.type === 'bendStep')
      pedals = { ...pedals, parts: pedals.parts.map((x, j) => (j === c.part ? { ...x, bendRange: clamp(x.bendRange + c.delta, 0, 12) } : x)) }
  }

  function onsystem(c: SystemChange) {
    p.onsystem?.(c)
    if (c.type === 'synth') {
      system = { ...system, synthOn: c.on }
      appBar = { ...appBar, synthOn: c.on }
    } else if (c.type === 'outputPair') system = { ...system, outputFirst: c.first }
    else if (c.type === 'buffer') system = { ...system, buffer: c.frames, latencyMs: ((c.frames / 48000) * 1000).toFixed(1) }
    else if (c.type === 'master') system = { ...system, master: c.volume }
    else if (c.type === 'allInputs') system = { ...system, allInputs: c.all }
    else if (c.type === 'input')
      system = { ...system, allInputs: false, inputs: system.inputs.map((x) => (x.name === c.name ? { ...x, listening: c.on } : x)) }
    else if (c.type === 'paletteLeds') system = { ...system, paletteLeds: c.on }
    else if (c.type === 'rescan') system = { ...system, scanning: true }
    else if (c.type === 'theme') system = { ...system, theme: c.theme }
  }

  const DEFAULT_ORDER = ['racks', 'chord', 'multiPads', 'setup']

  function onlaunchkey(c: LaunchkeyChange) {
    p.onlaunchkey?.(c)
    let shown = launchkey.pages.filter((x) => x.shown)
    let hidden = launchkey.pages.filter((x) => !x.shown)
    if (c.type === 'move') {
      const i = shown.findIndex((x) => x.id === c.id)
      const j = i + c.delta
      if (i < 0 || j < 0 || j >= shown.length) return
      ;[shown[i], shown[j]] = [shown[j], shown[i]]
    } else if (c.type === 'shown') {
      const row = launchkey.pages.find((x) => x.id === c.id)
      if (!row) return
      if (c.on) {
        hidden = hidden.filter((x) => x.id !== c.id)
        shown = [...shown, { ...row, shown: true }]
      } else {
        shown = shown.filter((x) => x.id !== c.id)
        hidden = [...hidden, { ...row, shown: false }]
      }
    } else if (c.type === 'reset') {
      const all = launchkey.pages
      shown = DEFAULT_ORDER.flatMap((id) => all.filter((x) => x.id === id).map((x) => ({ ...x, shown: true })))
      hidden = []
    }
    const rows: PadPageRow[] = [...shown, ...hidden]
    launchkey = { ...launchkey, pages: rows, isDefault: hidden.length === 0 && shown.every((x, i) => x.id === DEFAULT_ORDER[i]) }
  }
</script>

<div data-theme={system.theme === p.system.theme ? undefined : system.theme} style="display: contents">
  <Settings
    {...p}
    {appBar}
    {page}
    {keys}
    {chord}
    {style}
    {keyboard}
    {pedals}
    {system}
    {launchkey}
    {onpage}
    {onchord}
    {onstyle}
    {onkeyboard}
    {onpedals}
    {onsystem}
    {onlaunchkey}
  />
</div>
