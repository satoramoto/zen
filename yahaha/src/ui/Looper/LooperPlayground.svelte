<!--
  LooperPlayground: a story-only wrapper for the Screens/Looper Playground. It takes the Looper's
  props, keeps what the page changes in its own state (seeded from the props), and plays the looper
  the way the engine does, on a story-only beat ticker (120 BPM, 4/4): Rec / Stop arms, recording
  starts at the next bar line and grows a bar a bar; On / Off arms the loop, which starts at the
  next bar line and wraps; a memory picked while looping takes over at the next bar line. Memory
  and Clear latch, then a number stores or clears. Every change still calls `onchange`, so it shows
  in the Actions panel. The ticker stops when the story unmounts.
-->
<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import type { ComponentProps } from 'svelte'
  import Looper from './Looper.svelte'
  import type { LoopBarItem, LooperChange, LoopMemoryItem } from './types'

  type Props = ComponentProps<typeof Looper>

  let p: Props = $props()

  // Seeded from the props once: the playground owns the state from then on.
  let s = $state(
    untrack(() => {
      const { tipAction: _tip, onchange: _change, ...data } = p
      return { ...data, memories: data.memories.map((m) => ({ ...m })), sequence: data.sequence.map((b) => ({ ...b })) }
    }),
  )

  /** Chords the "keyboard" plays while recording, one a bar. */
  const PLAYED = ['C', 'Am7', 'Dm7', 'G7', 'Em7', 'A7', 'Fmaj7', 'G']
  const BEATS = 4

  let beat = 0
  const timer = setInterval(tick, 500)
  onDestroy(() => clearInterval(timer))

  function tick() {
    beat = (beat + 1) % BEATS
    const lit = s.mode === 'looping' || s.mode === 'recording'
    s.playhead = lit ? beat / BEATS : null
    if (beat === 0) barLine()
  }

  /** What happens at a bar line. */
  function barLine() {
    if (s.mode === 'recArmed') {
      s = { ...s, mode: 'recording', bars: 1, bar: 1, sequence: [], hasData: false, playhead: 0 }
    } else if (s.mode === 'recording') {
      s.bars = Math.min(s.bars + 1, 32)
      s.bar = s.bars
    } else if (s.mode === 'loopArmed') {
      s = { ...s, mode: 'looping', bar: 1, playhead: 0 }
    } else if (s.mode === 'looping') {
      if (s.pendingMemory !== null) {
        load(s.pendingMemory)
        s.pendingMemory = null
        s.bar = 1
      } else s.bar = ((s.bar ?? 0) % s.bars) + 1
    }
  }

  /** The bars recorded, one played chord a bar. */
  function recorded(n: number): LoopBarItem[] {
    return Array.from({ length: n }, (_, i) => ({ bar: i + 1, chords: [{ chord: PLAYED[i % PLAYED.length], beat: 1 }] }))
  }

  function stopRecording() {
    s = { ...s, sequence: recorded(s.bars), hasData: s.bars > 0, bar: null, playhead: null }
  }

  /** A memory becomes the loop: its chords, one a bar. */
  function load(i: number) {
    const m = s.memories[i]
    if (!m.name) return
    const chords = m.summary.split(' ').filter(Boolean)
    s.sequence = Array.from({ length: m.bars }, (_, b) => ({ bar: b + 1, chords: chords[b] ? [{ chord: chords[b], beat: 1 }] : [] }))
    s.bars = m.bars
    s.hasData = true
    s.memory = i
  }

  let stored = 3

  function onchange(c: LooperChange) {
    p.onchange?.(c)
    switch (c.type) {
      case 'rec':
        if (s.mode === 'recording') {
          stopRecording()
          s.mode = 'off'
        } else if (s.mode === 'recArmed') s.mode = 'off'
        else s = { ...s, mode: 'recArmed', bar: null, playhead: null, memory: null }
        break
      case 'onOff':
        if (s.mode === 'recording') {
          stopRecording()
          s.mode = 'loopArmed'
        } else if (s.mode === 'looping' || s.mode === 'loopArmed') s = { ...s, mode: 'off', bar: null, playhead: null }
        else if (s.hasData) s.mode = 'loopArmed'
        break
      case 'pick':
        s.pick = c.pick
        break
      case 'memory': {
        const i = c.index
        if (s.pick === 'store') {
          if (s.hasData) {
            stored += 1
            const summary = s.sequence.map((b) => b.chords.map((x) => x.chord).join(' ')).join(' ')
            s.memories[i] = { name: `CLD_${String(stored).padStart(3, '0')}`, bars: s.bars, summary } satisfies LoopMemoryItem
            s.memory = i
          }
        } else if (s.pick === 'clear') {
          s.memories[i] = { name: null, bars: 0, summary: '' }
          if (s.memory === i) s.memory = null
        } else if (s.mode === 'looping') s.pendingMemory = s.memories[i].name ? i : null
        else load(i)
        s.pick = null
        break
      }
      case 'newBank':
        s = { ...s, memories: s.memories.map(() => ({ name: null, bars: 0, summary: '' })), memory: null, bankName: 'New Bank', bankSaved: false, bankPath: null }
        break
      case 'lanePage':
        s.laneFirst = c.first
        break
      case 'loadOpen':
        s.loadOpen = c.open
        break
      case 'loadFile':
        // The system file picker is the app's: here the list just closes.
        s.loadOpen = false
        break
      case 'load': {
        const b = s.banks.find((x) => x.path === c.path)
        if (b) s = { ...s, bankName: b.name, bankPath: b.path, bankSaved: true, loadOpen: false, memory: null }
        break
      }
      case 'saveAsOpen':
        s.saveAs = c.open ? { name: '', clash: false } : null
        s.loadOpen = false
        break
      case 'saveAsName': {
        const name = c.name
        const clash = s.banks.some((b) => b.name.toLowerCase() === name.trim().toLowerCase() && b.path !== s.bankPath)
        s.saveAs = { name, clash }
        break
      }
      case 'save': {
        const name = s.saveAs?.name.trim() || s.bankName
        if (s.saveAs?.clash && !c.overwrite) break
        const path = `/Users/me/Yahaha/ChordLooper/${name}.clb`
        const banks = s.banks.some((b) => b.path === path) ? s.banks : [...s.banks, { name, path }]
        s = { ...s, bankName: name, bankPath: path, bankSaved: true, banks, saveAs: null }
        break
      }
    }
  }
</script>

<Looper {...s} tipAction={p.tipAction} {onchange} />
