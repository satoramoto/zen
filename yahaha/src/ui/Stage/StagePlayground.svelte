<!--
  StagePlayground: a story-only wrapper for the Stage Playground story. It takes the same props as
  Stage, keeps what the controls change in its own state (seeded from the props, and re-seeded when
  a prop changes in the Controls panel), and renders Stage with that state. Every handler calls the
  prop's callback too, so each press still shows in the Actions panel. One timer, story-only: while
  the band runs, a ticker steps the beat at the tempo so the display's beat bar moves (the
  components take the beat as a prop and hold no timers). Every other change happens on a press,
  except the fade: while fading and running it counts the ticker's beats for four bars (its
  progress drains Fade's wedge in the golden layout), then the band stops. Fill ▲ / ▼ while running
  queue the next Main up or down after a fill (its pad NEXT, the transport's Fill key armed).

  Pads, deterministic: stopped, a Main (or Break) becomes the playing section at once, and an Intro
  or Ending arms (press again to disarm). Running, a section pad is queued (`next`); press the queued
  pad again and it lands (`playing`); a landed Ending plays out and the band stops. Start (pad 16 or
  the section row) turns an armed pad into the playing section and queues the Main that was
  playing. Stop clears whatever was queued or armed. Sync Start (pad 4 and the section row's lamp
  are one switch), Auto Fill and Sync Stop toggle; Tap (the pad, or Tap under the tempo) sets the
  tempo from two or more taps' interval, the last four counting (`tapTempo`). The other pad banks'
  pads toggle.
-->
<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte'
  import { displayStopped } from '../Display/Display.fixtures'
  import type { BankLamp, FaderStrip } from '../FaderBank/types'
  import type { KnobItem } from '../KnobBank/types'
  import type { PadItem } from '../PadBank/types'
  import Stage from './Stage.svelte'
  import {
    stageKnobPages,
    stageLayerValues,
    stagePadBanks,
    stageSounds,
    stageStyles,
    stageStyleTempo,
  } from './Stage.fixtures'
  import { tapTempo } from './tapTempo'

  type Props = ComponentProps<typeof Stage>
  type Hue = NonNullable<Props['display']['nowPlaying']['hue']>

  let p: Props = $props()

  /** The non-Vol layers: the word at the top of a part strip, the word in its name, its tooltip key. */
  const LAYERS: Record<string, { short: string; word: string; tip: string }> = {
    pan: { short: 'Pan', word: 'Pan', tip: 'mixer.part.pan' },
    reverb: { short: 'Rev', word: 'Reverb', tip: 'mixer.part.reverb' },
    chorus: { short: 'Cho', word: 'Chorus', tip: 'mixer.part.chorus' },
    delay: { short: 'Dly', word: 'Delay', tip: 'mixer.part.variation' },
  }
  const RATES = ['1/4', '1/8', '1/16', '1/32']
  const TEMPO_MIN = 40
  const TEMPO_MAX = 280
  const SECTIONS = new Set<PadItem['family']>(['intro', 'main', 'ending', 'brk', 'fill'])
  const NBSP = new RegExp(String.fromCharCode(0xa0), 'g')
  /** The word a section pad's accessible name gets in each waiting or playing state. */
  const PAD_WORDS: Partial<Record<PadItem['state'], string>> = { playing: 'playing', next: 'queued', armed: 'armed' }

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

  // ---- App bar and section row
  let chosen = $derived(p.appBar.chosen ?? null)
  let section = $derived({ ...p.sectionRow })

  // ---- Faders: the page, the layer, every layer's values, the lamps
  let page = $derived(p.faders.page)
  let layer = $derived(p.faders.layer)
  let values = $derived(seedValues(p.faders.strips, p.faders.layer))
  let partOn = $derived(lampState(p.faders.partLamps))
  let functionOn = $derived(lampState(p.faders.functionLamps))

  function seedValues(strips: FaderStrip[], seedLayer: string): Record<string, number[]> {
    const seeded = Object.fromEntries(Object.entries(stageLayerValues).map(([id, list]) => [id, [...list]]))
    const volume = seeded.volume ?? []
    strips.forEach((strip, i) => {
      if (seedLayer !== 'volume' && i < 4) (seeded[seedLayer] ??= [])[i] = strip.level
      else volume[i] = strip.level
    })
    seeded.volume = volume
    return seeded
  }

  function lampState(lamps: BankLamp[]): Record<string, boolean> {
    return Object.fromEntries(lamps.map((lamp) => [lamp.id, lamp.on]))
  }

  /** A part strip's value as shown on a layer ("40"; pan "C", "L24", "R24"). */
  function shown(layerId: string, value: number): string {
    if (layerId !== 'pan') return `${value}`
    return value === 64 ? 'C' : value < 64 ? `L${64 - value}` : `R${value - 64}`
  }

  let strips: FaderStrip[] = $derived(
    p.faders.strips.map((strip, i) => {
      const part = i < 4 && (strip.kind === 'part' || strip.kind === 'off')
      const kind = part ? (partOn[strip.id] === false ? 'off' : 'part') : strip.kind
      const base = strip.faderName.split(',')[0]
      const look = i < 4 ? LAYERS[layer] : undefined
      if (look) {
        const value = values[layer]?.[i] ?? strip.level
        const text = shown(layer, value)
        return {
          ...strip,
          kind,
          level: value,
          value: `${look.short} ${text}`,
          away: undefined,
          faderName: `${base}, ${look.word} ${text}`,
          tip: look.tip,
        }
      }
      if (strip.kind === 'parked') return strip
      const value = values.volume?.[i] ?? strip.level
      const away = strip.away === undefined ? '' : ', hardware fader away (soft takeover)'
      return {
        ...strip,
        kind,
        level: value,
        value: `${value}`,
        faderName: `${base}, level ${value}${away}`,
        tip: part ? `mixer.panel.${strip.id}` : strip.tip,
      }
    }),
  )

  let partLamps: BankLamp[] = $derived(
    p.faders.partLamps.map((lamp) => {
      const on = partOn[lamp.id] ?? lamp.on
      return { ...lamp, on, label: on ? 'On' : 'Off', name: lamp.name?.replace(/ (on|off)\./, on ? ' on.' : ' off.') }
    }),
  )
  let functionLamps: BankLamp[] = $derived(
    p.faders.functionLamps.map((lamp) => ({ ...lamp, on: functionOn[lamp.id] ?? lamp.on })),
  )

  // ---- Knobs: the chosen page, and each page's knobs (the prop's on its page, the fixture's elsewhere)
  let knobPage = $derived(p.knobs.page ?? 0)
  let knobSets = $derived(
    stageKnobPages.map((set, i) => (i === (p.knobs.page ?? 0) ? p.knobs.knobs : set).map((knob) => ({ ...knob }))),
  )
  let knobs = $derived(knobSets[knobPage] ?? p.knobs.knobs)

  function stepKnob(knob: KnobItem, delta: number): KnobItem {
    if (knob.unused) return knob
    if (knob.value === 'Off' || knob.value === 'On') {
      const on = delta > 0
      return { ...knob, value: on ? 'On' : 'Off', fraction: on ? 1 : 0 }
    }
    const rate = RATES.indexOf(knob.value)
    if (rate >= 0) {
      const next = clamp(rate + delta, 0, RATES.length - 1)
      return { ...knob, value: RATES[next], fraction: next / (RATES.length - 1) }
    }
    const max = knob.unit === '%' ? 100 : 127
    const next = clamp((Number(knob.value) || 0) + delta, 0, max)
    return { ...knob, value: `${next}`, fraction: next / max }
  }

  // ---- Transport, tempo, display
  let running = $derived(p.sectionRow.running ?? p.transport?.running ?? false)
  let fading = $derived(p.sectionRow.fading ?? p.transport?.fading ?? false)
  let bpm = $derived(p.display.nowPlaying.bpm)
  let styleIndex = $derived(stageStyles.findIndex((style) => style.styleName === p.display.styleLine.styleName))
  let oneTouch = $derived(p.display.styleLine.oneTouch ?? 0)
  let status = $derived({ ...p.status })
  /** Each part's sound, as its row steps it through `stageSounds`. */
  let sounds = $derived(Object.fromEntries(p.display.soundRow.parts.map((part) => [part.id, part.sound])))
  /** Tap tempo: the taps that still count; two or more set the tempo from their interval. */
  let taps: number[] = []
  function tap() {
    const next = tapTempo(taps, performance.now())
    taps = next.taps
    if (next.bpm !== undefined) bpm = clamp(next.bpm, TEMPO_MIN, TEMPO_MAX)
  }

  // ---- The beat: a story-only ticker at the tempo while running (the components take it as a prop)
  const beatsPerBar = $derived(
    Number((styleIndex >= 0 ? stageStyles[styleIndex].timeSignature : p.display.styleLine.timeSignature)?.split('/')[0]) || 4,
  )
  let beat = $state(0)
  $effect(() => {
    if (!running) {
      beat = 0
      return
    }
    const beats = beatsPerBar
    // A tempo change keeps counting from where it was; a start begins on beat 1.
    untrack(() => {
      if (beat === 0 || beat > beats) beat = 1
    })
    const t = setInterval(() => (beat = (beat % beats) + 1), 60000 / bpm)
    return () => clearInterval(t)
  })

  // ---- The fade: while fading and running, it runs for FADE_BARS bars of the ticker's beats (its
  // progress drains Fade's wedge in the golden layout); a fade-out stops the band when it ends, a
  // fade-in (Fade pressed while stopped, then Start) just ends.
  const FADE_BARS = 4
  let fadeBeats = $state(0)
  let fadeIn = $state(false)
  $effect(() => {
    void beat
    if (!fading || !running) {
      untrack(() => (fadeBeats = 0))
      return
    }
    untrack(() => {
      fadeBeats += 1
      if (fadeBeats >= FADE_BARS * beatsPerBar) {
        fadeBeats = 0
        fading = false
        if (!fadeIn) stop()
      }
    })
  })
  let fadeProgress = $derived(fading && running ? fadeBeats / (FADE_BARS * beatsPerBar) : undefined)

  /** Queues a fill to the next Main up or down from the one playing (running only): that Main is next. */
  function queueFill(dir: 1 | -1) {
    if (!running) return
    const mains = pads.map((pad, i) => [pad, i] as const).filter(([pad]) => pad.family === 'main' && pad.state !== 'dark')
    const at = mains.findIndex(([pad]) => pad.state === 'playing')
    const to = mains[at + dir]
    if (at < 0 || !to) return
    pads = only(pads, to[1], 'next')
  }

  let knobsShown: KnobItem[] = $derived(
    knobs.map((knob) =>
      knob.code === 'Tempo'
        ? { ...knob, value: `${bpm}`, fraction: (bpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN) }
        : knob,
    ),
  )

  // ---- Pads: bank 0 (Sections) is the stateful one; the other banks' pads toggle
  let padBank = $derived(p.pads.bank ?? 0)
  let pads = $derived(p.pads.pads.map((pad) => ({ ...pad })))
  let otherPads = $derived(stagePadBanks.map((bank) => bank.pads.map((pad) => ({ ...pad }))))

  const isSection = (pad: PadItem) => SECTIONS.has(pad.family)
  const plain = (label: string) => label.replace(NBSP, ' ')

  /** Sets pad `index` to `state`, and turns every other section pad that is in `state` idle. */
  function only(list: PadItem[], index: number, state: PadItem['state']): PadItem[] {
    return list.map((pad, i) =>
      i === index ? { ...pad, state } : isSection(pad) && pad.state === state ? { ...pad, state: 'idle' } : pad,
    )
  }

  function start() {
    running = true
    const armed = pads.findIndex((pad) => pad.state === 'armed')
    if (armed < 0) return
    pads = pads.map((pad, i) =>
      i === armed ? { ...pad, state: 'playing' } : pad.state === 'playing' && isSection(pad) ? { ...pad, state: 'next' } : pad,
    )
  }

  function stop() {
    running = false
    // Stopping ends a fade under way.
    fading = false
    pads = pads.map((pad) => (pad.state === 'next' || pad.state === 'armed' ? { ...pad, state: 'idle' } : pad))
  }

  function pressPad(index: number) {
    if (padBank !== 0) {
      const pad = otherPads[padBank]?.[index]
      if (!pad || pad.state === 'dark') return
      otherPads = otherPads.map((bank, b) =>
        b === padBank
          ? bank.map((it, i) => (i === index ? { ...it, state: it.state === 'playing' ? 'idle' : 'playing' } : it))
          : bank,
      )
      return
    }
    const pad = pads[index]
    if (!pad || pad.state === 'dark') return
    if (pad.family === 'start') return running ? stop() : start()
    if (pad.family === 'util') {
      if (plain(pad.label) === 'Tap') return tap()
      if (plain(pad.label) === 'Sync Start') {
        section = { ...section, syncStart: !section.syncStart }
        return
      }
      pads = pads.map((it, i) => (i === index ? { ...it, state: it.state === 'playing' ? 'idle' : 'playing' } : it))
      return
    }
    if (!running) {
      if (pad.family === 'intro' || pad.family === 'ending') {
        if (pad.state === 'armed') pads = pads.map((it, i) => (i === index ? { ...it, state: 'idle' } : it))
        else pads = only(pads, index, 'armed')
      } else {
        pads = only(pads, index, 'playing').map((it) => (it.state === 'next' ? { ...it, state: 'idle' } : it))
      }
      return
    }
    if (pad.state === 'playing') return
    if (pad.state !== 'next') {
      pads = only(pads, index, 'next')
      return
    }
    if (pad.family === 'ending') {
      pads = pads.map((it, i) => (i === index ? { ...it, state: 'idle' } : it))
      stop()
      return
    }
    pads = only(pads, index, 'playing')
  }

  let padsShown: PadItem[] = $derived(
    padBank !== 0 ? (otherPads[padBank] ?? []) : pads.map((pad) => {
      if (pad.family === 'util' && plain(pad.label) === 'Sync Start') {
        // Armed (pulsing) while on, as the app's pads.
        return { ...pad, state: section.syncStart ? 'armed' : 'idle' }
      }
      if (pad.family === 'start') {
        const word = running ? 'running' : 'stopped'
        return {
          ...pad,
          state: running ? 'running' : 'idle',
          name: `Start / Stop, ${word} (pad 16; the transport Start / Stop is the same control)`,
        }
      }
      if (!isSection(pad) || pad.state === 'dark') return pad
      const label = plain(pad.label)
      const word = PAD_WORDS[pad.state]
      return { ...pad, name: word ? `${label}, ${word}` : undefined }
    }),
  )

  let display = $derived.by(() => {
    // Stopped swaps only the now-playing readout; the style line and the sounds stay the band's.
    const base = running ? p.display : { ...p.display, nowPlaying: displayStopped.nowPlaying }
    const playingPad = pads.find((pad) => isSection(pad) && pad.state === 'playing')
    const nextPad =
      pads.find((pad) => pad.state === 'next') ?? (running ? undefined : pads.find((pad) => pad.state === 'armed'))
    const style = styleIndex >= 0 ? stageStyles[styleIndex] : {}
    return {
      styleLine: { ...base.styleLine, ...style, oneTouch },
      nowPlaying: {
        ...base.nowPlaying,
        bpm,
        running,
        syncStart: section.syncStart ?? false,
        playing: playingPad ? plain(playingPad.label) : base.nowPlaying.playing,
        hue: playingPad ? (playingPad.family as Hue) : base.nowPlaying.hue,
        next: nextPad ? plain(nextPad.label) : '',
        fill: nextPad && running ? base.nowPlaying.fill || 'fill after bar 4' : '',
        beat,
        beats: beatsPerBar,
      },
      soundRow: {
        ...base.soundRow,
        parts: base.soundRow.parts.map((part) => ({
          ...part,
          sound: sounds[part.id] ?? part.sound,
          off: partOn[part.id] === false,
        })),
      },
    }
  })
</script>

<Stage
  {...p}
  appBar={{ ...p.appBar, chosen }}
  sectionRow={{ ...section, running, fading, fadeProgress, fadeIn: fading && fadeIn }}
  {display}
  faders={{ ...p.faders, page, layer, strips, partLamps, functionLamps }}
  knobs={{ ...p.knobs, knobs: knobsShown, page: knobPage }}
  pads={{
    ...p.pads,
    pads: padsShown,
    bank: padBank,
    legend: padBank === 0 ? p.pads.legend : (stagePadBanks[padBank]?.legend ?? []),
  }}
  {status}
  onsyncstart={(on) => {
    p.onsyncstart?.(on)
    section = { ...section, syncStart: on }
  }}
  onreset={() => {
    p.onreset?.()
    status = { ...status, text: 'Section reset: back to bar 1', error: false, seq: (status.seq ?? 0) + 1 }
  }}
  onfillup={() => {
    p.onfillup?.()
    queueFill(1)
    status = { ...status, text: 'Fill ▲: a fill, then the next Main up', error: false, seq: (status.seq ?? 0) + 1 }
  }}
  onfilldown={() => {
    p.onfilldown?.()
    queueFill(-1)
    status = { ...status, text: 'Fill ▼: a fill, then the next Main down', error: false, seq: (status.seq ?? 0) + 1 }
  }}
  onknobpage={(index) => {
    p.onknobpage?.(index)
    knobPage = index
  }}
  onpadbank={(index) => {
    p.onpadbank?.(index)
    padBank = index
  }}
  onchoose={(id) => {
    p.onchoose?.(id)
    chosen = id
  }}
  onaccomp={(on) => {
    p.onaccomp?.(on)
    section = { ...section, accomp: on }
  }}
  onmetronome={(on) => {
    p.onmetronome?.(on)
    section = { ...section, metronome: on }
  }}
  onmetronomesettings={() => {
    p.onmetronomesettings?.()
    section = { ...section, metronomeOpen: !section.metronomeOpen }
  }}
  onunison={(on) => {
    p.onunison?.(on)
    section = { ...section, unison: on }
  }}
  onhelp={(on) => {
    p.onhelp?.(on)
    section = { ...section, help: on }
  }}
  onpanic={() => {
    p.onpanic?.()
    status = { ...status, text: 'All notes off', error: false, seq: (status.seq ?? 0) + 1 }
  }}
  onprev={() => {
    p.onprev?.()
    styleIndex = (Math.max(styleIndex, 0) - 1 + stageStyles.length) % stageStyles.length
  }}
  onnext={() => {
    p.onnext?.()
    styleIndex = (styleIndex + 1) % stageStyles.length
  }}
  ononetouch={(n) => {
    p.ononetouch?.(n)
    oneTouch = n
  }}
  onchoosePage={(id) => {
    p.onchoosePage?.(id)
    page = id
  }}
  onpagebutton={() => {
    p.onpagebutton?.()
    page = p.faders.pageTabs.find((tab) => tab.id !== page)?.id ?? page
  }}
  onchooseLayer={(id) => {
    p.onchooseLayer?.(id)
    layer = id
  }}
  onlevel={(id, level) => {
    p.onlevel?.(id, level)
    const i = strips.findIndex((strip) => strip.id === id)
    if (i < 0) return
    const key = i < 4 && LAYERS[layer] ? layer : 'volume'
    values = { ...values, [key]: (values[key] ?? []).map((v, j) => (j === i ? level : v)) }
  }}
  onlamp={(id, on) => {
    p.onlamp?.(id, on)
    if (id in partOn) partOn = { ...partOn, [id]: on }
    else functionOn = { ...functionOn, [id]: on }
  }}
  onstep={(index, delta) => {
    p.onstep?.(index, delta)
    const knob = knobs[index]
    if (!knob) return
    if (knob.code === 'Tempo') bpm = clamp(bpm + delta, TEMPO_MIN, TEMPO_MAX)
    else
      knobSets = knobSets.map((set, s) =>
        s === knobPage ? set.map((it, i) => (i === index ? stepKnob(it, delta) : it)) : set,
      )
  }}
  onpadpress={(index) => {
    p.onpadpress?.(index)
    pressPad(index)
  }}
  onstartstop={() => {
    p.onstartstop?.()
    if (running) stop()
    else start()
  }}
  onstop={() => {
    p.onstop?.()
    stop()
  }}
  onstoplong={() => {
    p.onstoplong?.()
    stop()
    fading = false
  }}
  onfade={() => {
    p.onfade?.()
    fading = !fading
    if (fading) fadeIn = !running
  }}
  ontempoup={(down) => {
    p.ontempoup?.(down)
    if (down) bpm = clamp(bpm + 1, TEMPO_MIN, TEMPO_MAX)
  }}
  ontempodown={(down) => {
    p.ontempodown?.(down)
    if (down) bpm = clamp(bpm - 1, TEMPO_MIN, TEMPO_MAX)
  }}
  onstyletempo={() => {
    p.onstyletempo?.()
    bpm = stageStyleTempo
  }}
  ontaptempo={() => {
    p.ontaptempo?.()
    tap()
  }}
  ontempo={(next) => {
    p.ontempo?.(next)
    bpm = clamp(next, TEMPO_MIN, TEMPO_MAX)
  }}
  onsound={(id) => {
    p.onsound?.(id)
    const at = stageSounds.indexOf(sounds[id] ?? '')
    sounds = { ...sounds, [id]: stageSounds[(at + 1) % stageSounds.length] }
  }}
  onclear={() => {
    p.onclear?.()
    status = { ...status, text: null }
  }}
/>
