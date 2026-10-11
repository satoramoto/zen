<!--
  HarmArpPlayground: a story-only wrapper for the Screens/Harm Arp Playground story. It keeps what
  the page changes in its own state (seeded from the board), rebuilds the page's data from the
  fixture lists, and calls the props' callbacks too, so each change still shows in the Actions
  panel. A category tab only browses; a type picks and snaps the tabs to it, as in the app.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { harmArpFixture, type HarmArpPick } from './HarmArp.fixtures'
  import HarmArpScreen from './HarmArpScreen.svelte'
  import type { HarmArpCategory, HarmArpChange, HarmArpData } from './types'

  type Props = ComponentProps<typeof HarmArpScreen>

  let p: Props = $props()

  /** The last type picked in each list: the other list's tab keeps its own. */
  let pick = $state<HarmArpPick>({ group: 'harmony', index: 0 })
  let viewed = $state<HarmArpCategory | null>(null)
  let settings = $state<Partial<HarmArpData>>({})

  const data = $derived(harmArpFixture(pick, viewed, settings))
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)))

  function change(c: HarmArpChange) {
    p.onchange?.(c)
    const arp = data.arp
    switch (c.type) {
      case 'on':
        settings = { ...settings, on: c.on }
        break
      case 'pick':
        pick = { group: c.group, index: c.index }
        viewed = null
        break
      case 'assign':
        settings = { ...settings, assign: c.assign }
        break
      case 'volume':
        settings = { ...settings, volume: clamp(c.volume, 0, 127) }
        break
      case 'touchLimit':
        settings = { ...settings, touchLimit: clamp(c.velocity, 1, 127) }
        break
      case 'speed':
        settings = { ...settings, speed: c.speed }
        break
      case 'chordNoteOnly':
        settings = { ...settings, chordNoteOnly: c.on }
        break
      case 'quantize':
        settings = { ...settings, arp: { ...arp, quantize: c.quantize } }
        break
      case 'hold':
        settings = { ...settings, arp: { ...arp, hold: c.on } }
        break
      case 'pedalHold':
        settings = { ...settings, arp: { ...arp, pedalHold: c.on } }
        break
      case 'velocity':
        settings = { ...settings, arp: { ...arp, velocity: c.mode, fixedVelocity: clamp(c.velocity, 1, 127) } }
        break
      case 'keepKeyOn':
        settings = { ...settings, arp: { ...arp, keepKeyOn: c.on } }
        break
    }
  }

  function view(c: HarmArpCategory) {
    p.onview?.(c)
    viewed = c
  }
</script>

<HarmArpScreen {data} tipAction={p.tipAction} onchange={change} onview={view} />
