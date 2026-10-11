<!--
  MultiPadsPlayground: a story-only wrapper for the Screens/MultiPads Playground story. It takes
  MultiPads' props, keeps what you change in its own state (seeded from `data`, re-seeded when it
  changes in the Controls panel), and shows the page on the Stage with it. Every change also goes
  to the `onchange` action, so it still logs in the Actions panel. No timers: a queued pad stays
  queued (the bar line never comes), so stop it or Stop all.

  - A pad press plays it (queued while the band runs); pressing an armed pad starts every armed pad.
  - Select arms and disarms; Stop and Stop all stop; Repeat and Chord Match switch.
  - A bank (the list, or ◀ ▶) loads four named pads; Clear bank darkens them.
  - The volume and Synchro Stop's switches move.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import MultiPads from './MultiPads.svelte'
  import MultiPadsOnStage from './MultiPadsOnStage.svelte'
  import type { MultiPadsChange, MultiPadsData } from './types'

  let p: ComponentProps<typeof MultiPads> = $props()

  let data = $derived<MultiPadsData>({ ...p.data, pads: p.data.pads.map((x) => ({ ...x })) })

  const NAMES = ['Groove', 'Stabs', 'Riff', 'Hits']

  function apply(c: MultiPadsChange): MultiPadsData {
    const pads = data.pads.map((x) => ({ ...x }))
    switch (c.type) {
      case 'play': {
        const start = data.running ? 'queued' : 'playing'
        if (pads[c.pad].lamp === 'armed') pads.forEach((x) => x.lamp === 'armed' && (x.lamp = start))
        else pads[c.pad].lamp = start
        return { ...data, pads }
      }
      case 'stop':
        if (pads[c.pad].lamp !== 'empty') pads[c.pad].lamp = 'ready'
        return { ...data, pads }
      case 'stopAll':
        return { ...data, pads: pads.map((x) => ({ ...x, lamp: x.lamp === 'empty' ? 'empty' : 'ready' })) }
      case 'select':
        pads[c.pad].lamp = pads[c.pad].lamp === 'armed' ? 'ready' : 'armed'
        return { ...data, pads }
      case 'repeat':
        pads[c.pad].repeat = c.on
        return { ...data, pads }
      case 'chordMatch':
        pads[c.pad].chordMatch = c.on
        return { ...data, pads }
      case 'bank': {
        const bank = data.banks.find((b) => b.id === c.id)
        if (!bank) return data
        return {
          ...data,
          bank: bank.id,
          bankName: bank.name,
          pads: pads.map((x, i) => ({ ...x, name: `${bank.name.split(' ')[0]} ${NAMES[i]}`, lamp: 'ready', repeat: i !== 1, chordMatch: true })),
        }
      }
      case 'loadFile':
        // No file picker in Storybook: Load… only logs.
        return data
      case 'clear':
        return { ...data, bank: null, bankName: '', pads: pads.map((x) => ({ ...x, name: '', lamp: 'empty' })) }
      case 'volume':
        return { ...data, volume: c.volume, volumeWaiting: false }
      case 'synchroStop':
        return { ...data, synchroStop: { styleStop: c.styleStop, ending: c.ending } }
    }
  }

  function onchange(c: MultiPadsChange) {
    data = apply(c)
    p.onchange?.(c)
  }
</script>

<MultiPadsOnStage {data} tipAction={p.tipAction} {onchange} />
