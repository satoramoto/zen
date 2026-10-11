<!--
  BusEditor: the open send's editor on the Effects page. The header names the bus and its send
  ("Delay · Send 3"); a style bus (sends 1–3) then has its source run (From style / Mine) and its
  type run, an added send a kind picker and Remove at the row's right end. Below, two columns of
  36px hairline rows: on the left the switch row (Tempo sync, Keep with rack) and the bus's
  parameters; on the right its levels (Return, Band send, Pad send) and the four parts' sends. The
  note line closes it. Fills its container's width, 288 tall. Controlled: it draws `bus` as given
  and reports each change as a `BusChange`; nothing moves until `bus` does.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import Readout from '../Readout/Readout.svelte'
  import StepValue from '../StepValue/StepValue.svelte'
  import type { BusChange, BusData } from '../Effects/types'

  type Props = {
    /** The open send: its name, source, type, switches, parameters, levels, part sends and note. */
    bus: BusData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control with its key. */
    tipAction?: Action<HTMLElement, string>
    /** A change asked for: the source, the type (kind), a switch, a parameter or level, a part's send, or Remove. */
    onchange?: (change: BusChange) => void
  }

  let { bus, tipAction, onchange }: Props = $props()

  const n = $derived(bus.send + 1)
  const sources = [
    { id: 'style', label: 'From style', tip: 'fx.follow_style' },
    { id: 'mine', label: 'Mine', tip: 'fx.mine' },
  ]

  /** Applies the parent's tooltip action when both it and a key are given. */
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

  function chooseSource(id: string) {
    const follow = id === 'style'
    if (follow !== bus.followStyle) onchange?.({ type: 'source', send: bus.send, follow })
  }

  function chooseKind(kind: string) {
    if (kind !== bus.type) onchange?.({ type: 'kind', send: bus.send, kind })
  }

  /** Reports the picker's choice, then puts it back to `bus.type` until the state moves it. */
  function picked(select: HTMLSelectElement) {
    const kind = select.value
    select.value = bus.type
    chooseKind(kind)
  }

  const param = (id: string) => (value: number) => onchange?.({ type: 'param', send: bus.send, id, value })
</script>

<section class="editor" aria-label="{bus.name}, send {n}">
  <GroupHeader title={bus.name} detail="Send {n}" level={2}>
    {#if bus.styleBus}
      <ChosenTabs
        size="compact"
        label="{bus.name} source"
        tabs={sources}
        chosen={bus.followStyle ? 'style' : 'mine'}
        {tipAction}
        onchoose={chooseSource}
      />
      <span class="caption">Type</span>
      <ChosenTabs
        size="compact"
        label="{bus.name} type"
        tabs={bus.types}
        chosen={bus.type}
        {tipAction}
        onchoose={chooseKind}
      />
    {:else}
      <span class="caption">Type</span>
      <span class="picker">
        <select
          class="field"
          value={bus.type}
          aria-label="{bus.name} type"
          data-tip={bus.typeTip}
          use:tipped={bus.typeTip}
          onchange={(e) => picked(e.currentTarget)}
        >
          {#each bus.types as kind (kind.id)}<option value={kind.id}>{kind.label}</option>{/each}
        </select>
        <span class="caret" aria-hidden="true">▾</span>
      </span>
    {/if}
    {#snippet end()}
      {#if !bus.styleBus}
        <span class="remove">
          <Button
            label="Remove"
            name="Remove send {n}"
            tip="fx.send_remove"
            {tipAction}
            onpress={() => onchange?.({ type: 'remove', send: bus.send })}
          />
        </span>
      {/if}
    {/snippet}
  </GroupHeader>

  <div class="grid">
    <div class="column">
      {#if bus.switches.length > 0}
        <div class="row switches">
          {#each bus.switches as sw (sw.id)}
            <LampButton
              size="sm"
              label={sw.label}
              on={sw.on}
              name={sw.name}
              tip={sw.tip}
              {tipAction}
              ontoggle={() => onchange?.({ type: 'switch', send: bus.send, id: sw.id, on: !sw.on })}
            />
          {/each}
        </div>
      {/if}
      {#each bus.params as row (row.id)}
        <Readout
          label={row.label}
          value={row.value}
          min={row.min}
          max={row.max}
          defaultValue={row.defaultValue}
          display={row.display}
          code={row.code}
          tip={row.tip}
          {tipAction}
          onchange={param(row.id)}
        />
      {/each}
    </div>
    <div class="column">
      {#each bus.levels as row (row.id)}
        <Readout
          label={row.label}
          value={row.value}
          min={row.min}
          max={row.max}
          defaultValue={row.defaultValue}
          display={row.display}
          code={row.code}
          tip={row.tip}
          {tipAction}
          onchange={param(row.id)}
        />
      {/each}
      <div class="row parts">
        <span class="caption">Part sends</span>
        <span class="sends">
          {#each bus.parts as p (p.part)}
            <StepValue
              tag={p.tag}
              hue={p.hue}
              dim={!p.sounding}
              value={p.value}
              name="{p.name} {bus.word} send"
              tip="fx.part_sends"
              {tipAction}
              onchange={(value) => onchange?.({ type: 'partSend', send: bus.send, part: p.part, value })}
            />
          {/each}
        </span>
        <span class="caption code">{bus.partsCode}</span>
      </div>
    </div>
  </div>

  <p class="note">{bus.note}</p>
</section>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: 288px;
    min-width: 0;
  }
  .caption {
    flex: none;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    column-gap: var(--space-24);
    margin-top: var(--space-12);
  }
  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .row {
    box-sizing: border-box;
    height: 36px;
    border-bottom: var(--line-width) solid var(--line);
  }
  .switches {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .parts {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 28px;
    align-items: center;
    column-gap: var(--space-12);
  }
  .sends {
    display: flex;
    align-items: center;
    gap: var(--space-16);
    min-width: 0;
  }
  .note {
    overflow: hidden;
    margin: var(--space-12) 0 0;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* The kind picker: square, a 1px neutral outline and the value in the neutral hue, its text on
     the header row's baseline (the row aligns its items by baseline). */
  .picker {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  /* 24 tall, its text low in the box (6 above, 2 below), so with its text on the row's baseline its
     outline stands on the rule, as the tabs' chosen block does. */
  .field {
    box-sizing: border-box;
    height: calc(var(--control-height-compact) - var(--space-4));
    margin: 0;
    padding: var(--space-6) var(--space-24) var(--space-2) var(--space-8);
    border: 0;
    border-radius: var(--radius);
    appearance: none;
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
  /* The Button (32 tall) would hang below the rule with its text on the baseline: lifted so its
     outline stands on the rule. */
  .remove {
    position: relative;
    top: calc(-1 * var(--space-6));
    display: inline-flex;
  }
</style>
