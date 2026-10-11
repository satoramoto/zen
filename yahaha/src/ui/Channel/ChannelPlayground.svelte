<!--
  ChannelPlayground: a story-only wrapper for the Channel stories that show the page on the Stage.
  It takes Channel's props and renders the Stage board (Stage.fixtures) at 1440 × 900 with the
  Channel tab chosen and the page in the display's box. With `live`, it keeps the page's data in
  its own state (seeded from the props, re-seeded when a prop changes) and applies each change, so
  tabs, parts, bars, lamps and kinds respond; every handler calls the prop's callback too, so each
  change shows in the Actions panel. No timers.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Stage from '../Stage/Stage.svelte'
  import { stageBoard } from '../Stage/Stage.fixtures'
  import { STRIP_COMP_PRESETS } from '../ChannelComp/presets'
  import Channel from './Channel.svelte'
  import type { ChannelChange, ChannelData } from './types'

  type Props = ComponentProps<typeof Channel> & {
    /** Apply each change to the page (the Playground); off, the page shows the props as given. */
    live?: boolean
  }

  let p: Props = $props()

  const clone = (d: ChannelData): ChannelData => JSON.parse(JSON.stringify(d)) as ChannelData
  let data = $derived(clone(p.data))
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

  function apply(c: ChannelChange) {
    p.onchange?.(c)
    if (!p.live) return
    const d = data
    switch (c.type) {
      case 'level':
        d.mix.level = c.value
        break
      case 'pan':
        d.mix.pan = c.value
        break
      case 'on':
        d.mix.on = !d.mix.on
        d.mix.onLabel = d.mix.on ? 'On' : 'Off'
        d.parts[d.part].off = !d.mix.on
        d.sound.off = !d.mix.on
        break
      case 'solo':
        d.mix.solo = !d.mix.solo
        break
      case 'send':
        d.sends[c.send].level = c.value
        break
      case 'addSend': {
        const row = d.sends.find((s) => !s.present)
        if (row) Object.assign(row, { present: true, label: d.sendKinds.find((k) => k.kind === c.kind)?.name ?? c.kind })
        if (d.sends.every((s) => s.present)) d.sendKinds = []
        break
      }
      case 'eq':
        d.eq[c.field] = c.value
        break
      case 'tone':
        if (d.tone) d.tone[c.control] = c.value
        break
      case 'mono':
        if (d.play) d.play.mono = !d.play.mono
        break
      case 'portamento':
        if (d.play) d.play.portamento.time = c.time
        break
      case 'portamentoOn':
        if (d.play) d.play.portamento.on = !d.play.portamento.on
        break
      case 'octave':
        if (d.play) d.play.octave = clamp(d.play.octave + c.step, -2, 2)
        break
      case 'bend':
        if (d.play && d.play.bend !== null) d.play.bend = clamp(d.play.bend + c.step, 0, 12)
        break
      case 'compOn':
        d.comp.on = !d.comp.on
        break
      case 'compPreset': {
        const preset = STRIP_COMP_PRESETS.find((x) => x.id === c.preset)
        if (preset) {
          const { threshold, ratio, attack, release, makeup } = preset
          Object.assign(d.comp, { preset: c.preset, threshold, ratio, attack, release, makeup, edited: false })
        }
        break
      }
      case 'compParam':
        d.comp[c.param] = c.value
        d.comp.edited = true
        break
      case 'insertKind': {
        const name = d.insertKinds.find((k) => k.kind === c.kind)?.name ?? c.kind
        const settings =
          c.kind === 'none'
            ? []
            : [
                { name: 'Depth', value: 64, min: 0, max: 127, default: 64, display: '64' },
                { name: 'Rate', value: 40, min: 0, max: 127, default: 40, display: '40' },
              ]
        d.inserts[c.slot] = { kind: c.kind, name, on: c.kind !== 'none', settings }
        break
      }
      case 'insertOn':
        d.inserts[c.slot].on = !d.inserts[c.slot].on
        break
      case 'insertSetting': {
        const s = d.inserts[c.slot].settings[c.setting]
        s.value = c.value
        s.display = String(c.value)
        break
      }
      case 'rotaryFast':
        d.rotaryFast = !d.rotaryFast
        break
      case 'swap':
        break
    }
    // A new object, so the page sees the change (the derived copy isn't deeply reactive).
    data = { ...d }
  }

  function part(n: number) {
    p.onpart?.(n)
    if (!p.live) return
    const entry = data.parts[n]
    data.part = n
    data.keyboard = n < 4
    data.partName = n < 4 ? ['Right 1', 'Right 2', 'Right 3', 'Left'][n] : entry.tag
    data.hue = entry.hue
    data.prevTag = data.parts[(n + 11) % 12].tag
    data.nextTag = data.parts[(n + 1) % 12].tag
    data.sound.name = entry.name || 'Standard Kit 1'
    data.sound.plugin = n === 0 ? data.sound.plugin : null
    data.mix.pan = n < 4 ? 64 : null
    data.mix.canSwap = n < 4
    data.mix.on = !entry.off
    data.mix.onLabel = entry.off ? 'Off' : 'On'
    data.tone = n < 4 ? (data.tone ?? { cutoff: 64, resonance: 64, attack: 64, decay: 64, release: 64, vibratoRate: 64, vibratoDepth: 64, vibratoDelay: 64 }) : null
    data.play = n < 4 ? (data.play ?? { mono: false, portamento: { on: false, time: 0 }, octave: 0, bend: 2 }) : null
    data = { ...data }
  }
</script>

<Stage
  {...stageBoard}
  appBar={{ ...stageBoard.appBar, chosen: 'channel' }}
  tipAction={p.tipAction}
>
  {#snippet page()}
    <Channel
      {data}
      tipAction={p.tipAction}
      onchange={apply}
      onpart={part}
      ontab={(tab) => {
        p.ontab?.(tab)
        if (p.live) data = { ...data, tab }
      }}
      onsound={p.onsound}
      onedit={p.onedit}
    />
  {/snippet}
</Stage>
