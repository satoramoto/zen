<!--
  GoldenOverlay: draws the Golden tree inside it (its children) as it is rendered: every slot's
  cut line (in a shade for its nesting depth, thinner and fainter the deeper it is), each leaf's
  inset (dashed) and a golden spiral at every level: in each phi box (wide or tall) and in each
  golden-section split (`major`, `minor`), turning from the split's `from` side. A node's
  `data-spiral-from` / `data-spiral-turn` (a primitive's `spiralFrom` / `spiralTurn`) orient its
  spiral instead, give any split one, and mark the spiral's pole with a small ring. It checks the rules
  as it goes and draws what breaks one red: a slot whose content overflows it (or has text cut
  short), and a row or column whose cells don't add up to its box. Text marked
  `data-golden-ellipsis` is cut short by design (a name truncated to its column, its full text in
  its tooltip) and isn't counted. What it finds is data: the
  wrapper carries `data-overflow` and `data-rows-off` (counts), `onreport` gets the whole report,
  and with `report` a line under the tree says it ("knob 54 × 88 · spare 0 × 27 · overflow 2
  (Retrig rate, StyMuteA) · rows add up"). It re-measures when anything inside changes size.
  A design aid, never on in the app.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    lineAddsUp,
    report as makeReport,
    spiralPath,
    spiralPole,
    summary,
    type BoxMeasure,
    type GoldenReport,
    type GroupMeasure,
    type LineMeasure,
    type Rect,
    type Side,
    type SlotMeasure,
    type SpiralMeasure,
    type Turn,
  } from './golden'

  /** The depth shades cycle through this many tokens (`--golden-overlay-depth-0` …). */
  const SHADES = 6
  const shade = (depth: number) => `d${depth % SHADES}`

  type Props = {
    /** Draw the lines (off: the tree is still checked and reported). */
    show?: boolean
    /** The report line under the tree. */
    report?: boolean
    /** The shape the report line names the size of (`knob`); the first fitted box by default. */
    reportShape?: string
    /** What the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** The Golden tree to draw and check. */
    children?: Snippet
  }

  let { show = true, report = false, reportShape, onreport, children }: Props = $props()

  let root: HTMLDivElement | undefined = $state()
  let content: HTMLDivElement | undefined = $state()
  let found: GoldenReport = $state({ slots: [], overflow: [], rowsOff: [], rows: 0, boxes: [], spirals: [], groups: [] })
  let size = $state({ w: 0, h: 0 })
  let insets: Rect[] = $state([])
  let offLines: Rect[] = $state([])

  /** A rectangle relative to the overlay. */
  function within(origin: DOMRect, el: Element): Rect {
    const r = el.getBoundingClientRect()
    return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height }
  }

  /** The text of each element in a leaf that is cut short (an ellipsis, or clipped). Visually
      hidden text (a 1px screen-reader-only box) is meant to be clipped and isn't counted. */
  function clippedIn(leaf: HTMLElement): string[] {
    const out: string[] = []
    for (const el of [leaf, ...leaf.querySelectorAll<HTMLElement>('*')]) {
      if (el.scrollWidth <= el.clientWidth + 1 || el.clientWidth <= 1) continue
      // Cut short by design: the full text is in its tooltip.
      if (el.hasAttribute('data-golden-ellipsis')) continue
      const style = getComputedStyle(el)
      if (style.overflowX === 'visible') continue
      const text = el.textContent?.trim()
      if (text && el.children.length === 0) out.push(text)
    }
    return out
  }

  function nameOf(el: HTMLElement): string {
    return (
      el.getAttribute('data-golden-name') ??
      el.getAttribute('aria-label') ??
      el.querySelector('[aria-label]')?.getAttribute('aria-label') ??
      (el.textContent?.trim().slice(0, 24) || el.getAttribute('data-golden') || 'slot')
    )
  }

  /** How many slots holders are around an element, inside the overlay: its nesting depth. */
  function depthOf(el: Element, top: Element): number {
    let n = 0
    for (let p = el.parentElement; p && p !== top; p = p.parentElement) if (p.hasAttribute('data-golden-slots')) n++
    return n
  }

  function measure() {
    if (!root || !content) return
    const origin = root.getBoundingClientRect()
    const slots: SlotMeasure[] = []
    const boxes: BoxMeasure[] = []
    const lines: LineMeasure[] = []
    const spirals: SpiralMeasure[] = []
    const pads: Rect[] = []
    const groups: GroupMeasure[] = []
    const top = content
    const named = [...content.querySelectorAll<HTMLElement>('[data-golden-name]')]

    // Each named node: its root's rect, and its fit's when the fit is shaped (its spare).
    for (const el of named) {
      const fit = el.querySelector(':scope > [data-golden-fit][data-shape]')
      groups.push({
        name: el.getAttribute('data-golden-name') ?? '',
        depth: depthOf(el, top),
        rect: within(origin, el),
        fit: fit ? within(origin, fit) : undefined,
      })
    }
    const ownerOf = (el: Element): number | undefined => {
      const owner = el.closest('[data-golden-name]')
      const i = owner ? named.indexOf(owner as HTMLElement) : -1
      return i < 0 ? undefined : i
    }

    for (const holder of content.querySelectorAll<HTMLElement>('[data-golden-slots]')) {
      const kind = holder.getAttribute('data-golden-slots')
      const depth = depthOf(holder, top)
      const cells = [...holder.children] as HTMLElement[]
      const take = holder.getAttribute('data-take')
      const spiralFrom = holder.getAttribute('data-spiral-from') as Side | null
      const spiralTurn = holder.getAttribute('data-spiral-turn') as Turn | null
      // A split set to a phi shape with its own orientation is drawn once, by its phi box (below).
      const phiOwned = holder.parentElement?.getAttribute('data-shape') === 'phi' && (spiralFrom ?? spiralTurn) !== null
      if (kind === 'cut' && !phiOwned && (take === 'major' || take === 'minor' || spiralFrom !== null)) {
        spirals.push({
          ...within(origin, holder),
          from: spiralFrom ?? (holder.getAttribute('data-from') as Side | null) ?? 'top',
          turn: spiralTurn ?? 'ccw',
          depth,
          explicit: spiralFrom !== null || spiralTurn !== null,
        })
      }
      for (const el of cells) {
        const cut = el.hasAttribute('data-golden')
        // A leaf that only wraps another Golden tree (a control cell) is checked through that tree.
        if (!cut && el.querySelector('[data-golden-slots]')) continue
        const rect = within(origin, el)
        let client = { w: el.clientWidth, h: el.clientHeight }
        let scroll = { w: el.scrollWidth, h: el.scrollHeight }
        if (cut) {
          // A nested primitive overflows when its own cells reach past its box (a square too deep
          // for it, a row that is too long); what overflows inside a leaf is that leaf's.
          const own = el.querySelector<HTMLElement>('[data-golden-slots]')
          const box = (own ?? el).getBoundingClientRect()
          let right = box.right
          let bottom = box.bottom
          for (const c of own?.children ?? []) {
            const r = c.getBoundingClientRect()
            right = Math.max(right, r.right)
            bottom = Math.max(bottom, r.bottom)
          }
          client = { w: box.width, h: box.height }
          scroll = { w: right - box.left, h: bottom - box.top }
        }
        slots.push({ rect, client, scroll, clipped: cut ? [] : clippedIn(el), name: nameOf(el), cut, depth, group: ownerOf(el) })
        if (!cut) {
          const style = getComputedStyle(el)
          const t = parseFloat(style.paddingTop) || 0
          const l = parseFloat(style.paddingLeft) || 0
          if (t > 0 || l > 0) pads.push({ x: rect.x + l, y: rect.y + t, w: rect.w - 2 * l, h: rect.h - 2 * t })
        }
      }
      if (kind === 'row' || kind === 'column') {
        const across = kind === 'row'
        const along = across ? holder.clientWidth : holder.clientHeight
        const sum = cells.reduce((n, el) => n + (across ? el.getBoundingClientRect().width : el.getBoundingClientRect().height), 0)
        const adds = holder.getAttribute('data-golden-adds')
        const name = holder.closest('[data-golden]')?.getAttribute('data-golden-name') ?? kind
        const rect = within(origin, holder)
        // Checked from the names when the row has a shape; else measured: its cells must fill it.
        lines.push({ name, rect, along, sum, declared: adds === null ? undefined : adds === 'yes' })
      }
    }

    // A grid's fitted cells are boxes, the cell their slot: listed first, as they say what room
    // the page gives a control.
    for (const holder of content.querySelectorAll<HTMLElement>('[data-golden-slots="grid"][data-cell]')) {
      const columns = Number(getComputedStyle(holder).getPropertyValue('--golden-columns')) || 1
      const rows = Number(getComputedStyle(holder).getPropertyValue('--golden-rows')) || 1
      const cellW = holder.clientWidth / columns
      const cellH = holder.clientHeight / rows
      for (const el of holder.children) {
        const rect = within(origin, el)
        boxes.push({ shape: holder.getAttribute('data-cell') ?? '', rect, slot: { x: rect.x, y: rect.y, w: cellW, h: cellH } })
      }
    }
    for (const fit of content.querySelectorAll<HTMLElement>('[data-golden-fit][data-shape]')) {
      const rect = within(origin, fit)
      const slot = fit.parentElement ? within(origin, fit.parentElement) : rect
      const shape = fit.getAttribute('data-shape') ?? ''
      boxes.push({ shape, rect, slot })
      if (shape === 'phi') {
        const own = fit.querySelector(':scope > [data-golden-slots]')
        const spiralFrom = own?.getAttribute('data-spiral-from') as Side | null | undefined
        const spiralTurn = own?.getAttribute('data-spiral-turn') as Turn | null | undefined
        const from: Side = spiralFrom ?? (fit.getAttribute('data-orient') === 'tall' ? 'top' : 'left')
        spirals.push({ ...rect, from, turn: spiralTurn ?? 'ccw', depth: depthOf(fit, top), explicit: Boolean(spiralFrom ?? spiralTurn) })
      }
    }

    const next = makeReport(slots, boxes, lines, spirals, groups)
    found = next
    size = { w: origin.width, h: origin.height }
    insets = pads
    offLines = lines.filter((l) => !lineAddsUp(l)).map((l) => l.rect)
  }

  let last = ''
  $effect(() => {
    const text = JSON.stringify({
      o: found.overflow,
      r: found.rowsOff,
      b: found.boxes.map((b) => [b.shape, Math.round(b.w), Math.round(b.h)]),
      g: found.groups.map((g) => [g.name, Math.round(g.w), Math.round(g.h), Math.round(g.spareW), Math.round(g.spareH), g.overflow.length]),
    })
    if (text === last) return
    last = text
    onreport?.(found)
  })

  $effect(() => {
    if (!content) return
    const target = content
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }
    measure()
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    const observe = () => {
      if (!resize) return
      resize.observe(target)
      for (const el of target.querySelectorAll('[data-golden-slots], [data-golden-slots] > *')) resize.observe(el)
    }
    observe()
    const mutations = new MutationObserver(() => {
      observe()
      schedule()
    })
    mutations.observe(target, { childList: true, subtree: true, characterData: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      resize?.disconnect()
      mutations.disconnect()
    }
  })

  let line = $derived(summary(found, reportShape))
</script>

<div class="overlay" bind:this={root} data-golden="overlay" data-overflow={found.overflow.length} data-rows-off={found.rowsOff.length}>
  <div class="content" bind:this={content}>{@render children?.()}</div>
  {#if show}
    <svg class="lines" width={size.w} height={size.h} viewBox="0 0 {size.w || 1} {size.h || 1}" aria-hidden="true">
      {#each insets as r, i (i)}
        <rect class="inset" x={r.x} y={r.y} width={Math.max(0, r.w)} height={Math.max(0, r.h)} />
      {/each}
      {#each found.slots as slot, i (i)}
        <rect
          class="cut {shade(slot.depth)}"
          class:off={slot.off}
          style:--golden-depth={Math.min(slot.depth, SHADES - 1)}
          x={slot.rect.x}
          y={slot.rect.y}
          width={slot.rect.w}
          height={slot.rect.h}
        />
      {/each}
      {#each offLines as r, i (i)}
        <rect class="cut off" x={r.x} y={r.y} width={r.w} height={r.h} />
      {/each}
      {#each found.spirals as r, i (i)}
        <path
          class="spiral {shade(r.depth ?? 0)}"
          style:--golden-depth={Math.min(r.depth ?? 0, SHADES - 1)}
          d={spiralPath(r, 12, r.from, r.turn)}
        />
        {#if r.explicit}
          {@const [px, py] = spiralPole(r, r.from, r.turn)}
          <circle
            class="pole {shade(r.depth ?? 0)}"
            style:--golden-depth={Math.min(r.depth ?? 0, SHADES - 1)}
            data-golden-pole
            cx={px}
            cy={py}
            r="5"
          />
        {/if}
      {/each}
    </svg>
  {/if}
  {#if report}
    <p class="report" class:off={found.overflow.length > 0 || found.rowsOff.length > 0}>{line}</p>
  {/if}
</div>

<style>
  /* It fills its parent; a story showing a tree on its own sizes it with --golden-sample-width and
     --golden-sample-height (Storybook's `parameters.sample`). */
  .overlay {
    position: relative;
    box-sizing: border-box;
    width: var(--golden-sample-width, 100%);
    height: var(--golden-sample-height, 100%);
    min-width: 0;
    min-height: 0;
  }
  .content {
    width: 100%;
    height: 100%;
  }
  .lines {
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
    pointer-events: none;
  }
  .lines * {
    fill: none;
    vector-effect: non-scaling-stroke;
  }
  /* Each cut in its depth's shade (they cycle every six levels); thinner and fainter the deeper it
     is, so the top cuts dominate. */
  .cut,
  .spiral {
    stroke: var(--golden-overlay-cut);
    stroke-opacity: calc(1 - var(--golden-depth, 0) * 0.1);
  }
  .cut {
    stroke-width: calc(var(--header-rule-width) / (1 + var(--golden-depth, 0) * 0.5));
  }
  .spiral {
    stroke-width: calc(var(--header-rule-width) / (1 + var(--golden-depth, 0) * 0.35));
  }
  /* A set spiral's pole: a small ring where the eye lands, in the spiral's shade. */
  .pole {
    r: var(--fib-5);
    stroke-width: var(--header-rule-width);
  }
  .d0 {
    stroke: var(--golden-overlay-depth-0);
  }
  .d1 {
    stroke: var(--golden-overlay-depth-1);
  }
  .d2 {
    stroke: var(--golden-overlay-depth-2);
  }
  .d3 {
    stroke: var(--golden-overlay-depth-3);
  }
  .d4 {
    stroke: var(--golden-overlay-depth-4);
  }
  .d5 {
    stroke: var(--golden-overlay-depth-5);
  }
  /* Red wins over the depth shade. */
  .cut.off {
    fill: var(--golden-overlay-off-fill);
    stroke: var(--golden-overlay-off);
    stroke-opacity: 1;
    stroke-width: var(--header-rule-width);
  }
  .inset {
    stroke: var(--golden-overlay-inset);
    stroke-width: var(--line-width);
    stroke-dasharray: 4 4;
  }
  .report {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: var(--fib-5) 0 0;
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .report.off {
    color: var(--t);
  }
</style>
