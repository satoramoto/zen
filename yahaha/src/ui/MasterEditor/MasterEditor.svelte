<!--
  MasterEditor: the Effects page's editor for the Master Compressor and EQ, the whole mix after the
  returns. Two columns under one header: the compressor (its type picker, then a Readout per
  setting) and the EQ (its type tabs, the response curve with a dot per band, then the eight-band
  table: gain, frequency, Q and shelf, each cell a StepValue set in place). The on/off lamps live in
  the page's Mix column, not here: an EQ that is off draws its curve faded, and either says "Off".
  Controlled: it draws `master` as given and reports each change through onchange; a band edit
  reports the whole band. Clicking or focusing a band's cell highlights its column and its dot.
  A band's frequency takes any whole Hz in its range: a drag or an arrow key moves along a fine log
  grid, and typing digits in the focused cell then Enter (or leaving it) sets that Hz exactly.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import Readout from '../Readout/Readout.svelte'
  import StepValue from '../StepValue/StepValue.svelte'
  import type { EqBandData, MasterChange, MasterData } from '../Effects/types'
  import { eqDots, eqPath, yOf } from './eqCurve'
  import { freqGrid, nearestStep, parseHz } from './freqScale'

  type Props = {
    /** The compressor's type and settings, the EQ's type and its eight bands. */
    master: MasterData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control with its tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for; the editor itself changes nothing. */
    onchange?: (change: MasterChange) => void
  }

  let { master, tipAction, onchange }: Props = $props()

  /** The curve's box: drawn at 1000 units wide, stretched to the column (the strokes don't scale;
      the dots are HTML, placed by percentage, so they stay round). */
  const CURVE_HEIGHT = 72
  const curveWidth = 1000

  /** The band whose column is highlighted: the last one touched. */
  let chosen: number | null = $state(null)

  const path = $derived(eqPath(master.bands, curveWidth, CURVE_HEIGHT))
  const dots = $derived(eqDots(master.bands, curveWidth, CURVE_HEIGHT))
  const zero = yOf(0, CURVE_HEIGHT)

  const tabs = $derived(master.eqTypes.map((t) => ({ id: t.id, label: t.label, tip: t.tip ?? 'fx.master_eq_type' })))

  const tipped: Action<HTMLElement, string | undefined> = (node, key) => {
    if (!tipAction || key === undefined) return
    const handle = tipAction(node, key)
    return {
      update: (next) => {
        if (next !== undefined) handle?.update?.(next)
      },
      destroy: () => handle?.destroy?.(),
    }
  }

  /** "0", "+4", "−6". */
  const dbText = (db: number) => (db === 0 ? '0' : db > 0 ? `+${db}` : `−${-db}`)
  /** "80", "1k", "1.2k", and a frequency between the tenths of a kHz whole: "1234". */
  const hzText = (hz: number) => (hz < 1000 || hz % 100 !== 0 ? String(hz) : `${hz / 1000}k`)
  /** "0.7" from tenths. */
  const qText = (q: number) => (q / 10).toFixed(1)

  /** Each band's frequency grid for a drag, a wheel notch or an arrow key (its own Hz among them). */
  const grids = $derived(master.bands.map((b) => freqGrid(b.freqMin, b.freqMax, b.freq)))

  /** Digits typed into a band's frequency cell, not yet set (Enter or leaving the cell sets them). */
  let typed: { band: number; text: string } | null = $state(null)

  /** A key in band `i`'s frequency cell, before the cell's own handling: digits type a frequency. */
  function typeFreq(e: KeyboardEvent, i: number) {
    const text = typed?.band === i ? typed.text : null
    if (/^\d$/.test(e.key)) {
      typed = { band: i, text: ((text ?? '') + e.key).slice(0, 5) }
    } else if (text === null) {
      return
    } else if (e.key === 'Backspace') {
      typed = text.length > 1 ? { band: i, text: text.slice(0, -1) } : null
    } else if (e.key === 'Enter') {
      setTyped(i)
    } else if (e.key === 'Escape') {
      typed = null
    } else {
      return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  /** Sets band `i` to the Hz typed into it (clamped to its range). */
  function setTyped(i: number) {
    if (typed?.band !== i) return
    const b = master.bands[i]
    const hz = parseHz(typed.text, b.freqMin, b.freqMax)
    typed = null
    if (hz !== null && hz !== b.freq) setBand(i, { freq: hz })
  }

  /** Reports band `i` with one field changed. */
  function setBand(i: number, change: Partial<EqBandData>) {
    chosen = i
    const b = { ...master.bands[i], ...change }
    onchange?.({ type: 'eqBand', band: i, gain: b.gain, freq: b.freq, q: b.q, shelf: b.shelf })
  }

  /** Reports the picker's choice, then puts the picker back to `master` until it moves. */
  function pickComp(select: HTMLSelectElement) {
    const preset = select.value
    select.value = master.compType
    if (preset !== master.compType) onchange?.({ type: 'compType', preset })
  }
</script>

<section class="master" aria-label="Master">
  <GroupHeader title="Master" detail="Whole mix" level={3} />
  <div class="columns">
    <div class="comp">
      <div class="head">
        <span class="caption">Compressor</span>
        <span class="picker">
          <select
            class="field"
            value={master.compType}
            aria-label="Master compressor type"
            data-tip="fx.master_comp_type"
            use:tipped={'fx.master_comp_type'}
            onchange={(e) => pickComp(e.currentTarget)}
          >
            {#each master.compTypes as t (t.id)}
              <option value={t.id}>{t.label}{master.compEdited && t.id === master.compType ? ' (edited)' : ''}</option>
            {/each}
          </select>
          <span class="caret" aria-hidden="true">▾</span>
        </span>
        {#if !master.compOn}<span class="caption off">Off</span>{/if}
      </div>
      <div class="rows">
        {#each master.comp as p (p.id)}
          <Readout
            label={p.label}
            value={p.value}
            min={p.min}
            max={p.max}
            defaultValue={p.defaultValue}
            display={p.display}
            code={p.code}
            tip={p.tip}
            {tipAction}
            onchange={(value) => onchange?.({ type: 'compParam', id: p.id, value })}
          />
        {/each}
      </div>
    </div>

    <div class="eq">
      <div class="head">
        <span class="caption">EQ</span>
        <ChosenTabs
          {tabs}
          chosen={master.eqType}
          size="compact"
          label="Master EQ type"
          {tipAction}
          onchoose={(preset) => {
            if (preset !== master.eqType) onchange?.({ type: 'eqType', preset })
          }}
        />
        {#if master.eqEdited}<span class="caption">edited</span>{/if}
        {#if !master.eqOn}<span class="caption off">Off</span>{/if}
      </div>

      <div class="curve" class:faded={!master.eqOn} role="img" aria-label="Master EQ response{master.eqOn ? '' : ', off'}">
        <svg viewBox="0 0 {curveWidth} {CURVE_HEIGHT}" preserveAspectRatio="none" aria-hidden="true">
          <line class="zero" x1="0" x2={curveWidth} y1={zero} y2={zero} vector-effect="non-scaling-stroke" />
          <path class="line" d={path} vector-effect="non-scaling-stroke" />
        </svg>
        {#each dots as dot, i (i)}
          <span
            class="dot"
            class:chosen={chosen === i}
            style:left="{(dot.x / curveWidth) * 100}%"
            style:top="{dot.y}px"
            aria-hidden="true"
          ></span>
        {/each}
      </div>

      <table class="bands" aria-label="Master EQ bands">
        <thead>
          <tr>
            <th scope="col" class="rowhead">Band</th>
            {#each master.bands as _, i (i)}
              <th scope="col" class:chosen={chosen === i}>{i + 1}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="rowhead">dB</th>
            {#each master.bands as b, i (i)}
              <td class:chosen={chosen === i} onfocusin={() => (chosen = i)}>
                <StepValue
                  value={b.gain}
                  min={-12}
                  max={12}
                  defaultValue={0}
                  display={dbText(b.gain)}
                  ink="t"
                  span={96}
                  name="EQ band {i + 1} gain"
                  valuetext="{dbText(b.gain)} dB"
                  tip="fx.master_eq_gain"
                  {tipAction}
                  onchange={(gain) => setBand(i, { gain })}
                />
              </td>
            {/each}
          </tr>
          <tr>
            <th scope="row" class="rowhead">Hz</th>
            {#each master.bands as b, i (i)}
              <td
                class:chosen={chosen === i}
                onfocusin={() => (chosen = i)}
                onfocusout={() => setTyped(i)}
                onkeydowncapture={(e) => typeFreq(e, i)}
              >
                <StepValue
                  value={nearestStep(grids[i], b.freq)}
                  min={0}
                  max={grids[i].length - 1}
                  display={typed?.band === i ? typed.text : hzText(b.freq)}
                  ink="t"
                  span={160}
                  name="EQ band {i + 1} frequency"
                  valuetext={typed?.band === i ? `typing ${typed.text} Hz` : `${b.freq} Hz`}
                  tip="fx.master_eq_freq"
                  {tipAction}
                  onchange={(step) => setBand(i, { freq: grids[i][step] })}
                />
              </td>
            {/each}
          </tr>
          <tr>
            <th scope="row" class="rowhead">Q</th>
            {#each master.bands as b, i (i)}
              <td class:chosen={chosen === i} onfocusin={() => (chosen = i)}>
                <StepValue
                  value={b.q}
                  min={1}
                  max={120}
                  defaultValue={7}
                  display={qText(b.q)}
                  ink="t"
                  span={240}
                  disabled={b.shelf}
                  name="EQ band {i + 1} Q"
                  tip="fx.master_eq_q"
                  {tipAction}
                  onchange={(q) => setBand(i, { q })}
                />
              </td>
            {/each}
          </tr>
          <tr>
            <th scope="row" class="rowhead">Shelf</th>
            {#each master.bands as b, i (i)}
              <td class:chosen={chosen === i} onfocusin={() => (chosen = i)}>
                {#if b.canShelf}
                  <button
                    type="button"
                    class="shelf"
                    aria-pressed={b.shelf}
                    aria-label="EQ band {i + 1} shelf"
                    data-tip="fx.master_eq_shelf"
                    use:tipped={'fx.master_eq_shelf'}
                    onclick={() => setBand(i, { shelf: !b.shelf })}
                    >{b.shelf ? (i === 0 ? 'Low' : 'High') : 'Peak'}</button
                  >
                {:else}
                  <span class="none" aria-hidden="true">—</span><span class="sr">Peak</span>
                {/if}
              </td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<style>
  .master {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-24);
    margin-top: var(--space-12);
  }
  .comp,
  .eq {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    height: var(--tab-height-header);
    white-space: nowrap;
  }
  .caption {
    flex: none;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .caption.off {
    margin-left: auto;
  }
  .rows {
    margin-top: var(--space-4);
  }

  /* The compressor type picker: square, a 1px neutral outline, the value in the neutral hue. */
  .picker {
    position: relative;
    display: flex;
    flex: none;
    width: 144px;
  }
  .field {
    appearance: none;
    box-sizing: border-box;
    width: 100%;
    height: var(--control-height-compact);
    margin: 0;
    padding: 0 var(--space-24) 0 var(--space-8);
    border: 0;
    border-radius: var(--radius);
    background: var(--g);
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--neutral);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    cursor: pointer;
  }
  .field option {
    background: var(--g);
    color: var(--value-ink);
  }
  .field:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .caret {
    position: absolute;
    top: 50%;
    right: var(--space-8);
    transform: translateY(-50%);
    color: var(--neutral);
    font-size: var(--glyph-sm);
    pointer-events: none;
  }

  /* The response curve: a hairline at 0 dB, the curve and its dots in the accent; faded when off. */
  .curve {
    position: relative;
    width: 100%;
    height: 72px;
    margin-top: var(--space-6);
  }
  .curve svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .zero {
    stroke: var(--line);
    stroke-width: var(--line-width);
  }
  .line {
    fill: none;
    stroke: var(--a);
    stroke-width: 1.5;
  }
  .dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--a);
    transform: translate(-50%, -50%);
  }
  .dot.chosen {
    width: 10px;
    height: 10px;
    background: var(--g);
    box-shadow: inset 0 0 0 1.5px var(--a);
  }
  .faded .line {
    stroke: var(--absent-a);
  }
  .faded .dot {
    background: var(--absent-a);
  }
  .faded .dot.chosen {
    background: var(--g);
    box-shadow: inset 0 0 0 1.5px var(--absent-a);
  }

  /* The band table: compact rows, the band numbers over the values, the chosen band's column lit. */
  .bands {
    --step-height: 18px;
    width: 100%;
    margin-top: var(--space-6);
    border-collapse: collapse;
    table-layout: fixed;
    font-variant-numeric: tabular-nums;
  }
  .bands th,
  .bands td {
    height: 18px;
    padding: 0;
    text-align: center;
    white-space: nowrap;
  }
  .bands th {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .bands th.rowhead {
    width: 48px;
    text-align: left;
  }
  .bands .chosen {
    background: var(--btn);
  }
  .bands thead th.chosen {
    color: var(--value-ink);
  }
  .shelf {
    box-sizing: border-box;
    height: 18px;
    margin: 0;
    padding: 0 var(--space-4);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--neutral);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    cursor: pointer;
  }
  .shelf[aria-pressed='true'] {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .shelf:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .none {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
