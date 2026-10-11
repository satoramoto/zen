<!--
  ReadoutPlayground: a story-only wrapper for the Readout Playground story. It takes the same props
  as Readout, keeps the value in its own state (seeded from the props, re-seeded when a prop changes
  in the Controls panel), shows it with the given display's unit, and still calls the prop's
  onchange, so each change logs in the Actions panel.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import Readout from './Readout.svelte'
  import { splitUnit } from './readout'

  type Props = ComponentProps<typeof Readout>

  let p: Props = $props()

  let value = $derived(p.value)
  const unit = $derived(splitUnit(p.display ?? '')[1])
  const display = $derived(
    value === p.value ? p.display : unit === '%' ? `${value}%` : unit ? `${value} ${unit}` : String(value),
  )

  function onchange(next: number) {
    value = next
    p.onchange?.(next)
  }
</script>

<Readout {...p} {value} {display} {onchange} />
