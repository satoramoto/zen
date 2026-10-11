<!--
  ChannelMix: the Channel page's Mix tab body (docs/specs/push/Channel.md, Groups › A, fitted to
  the display box's 1110×240 body): four 264px columns, 18px apart. Column 1 the Sound (the sound
  button that opens Library › Sounds, Mine, the plugin line and its Edit button), column 2 the
  Level (Level, Pan, the On and Solo lamps), columns 3–4 the Sends (sends 1–3 and 4–6), whose
  "+ Add send" swaps the rows for the twelve send kinds in place. Neutral controls draw in
  `--neutral`, which the open part's hue takes. Controlled: every edit goes out through `onchange`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import BarReadout from '../BarReadout/BarReadout.svelte'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import PartMarks from '../PartMarks/PartMarks.svelte'
  import { sectionHue } from '../Settings/hues'
  import type { ChannelChange, ChannelData, ChannelSendRow, PluginLine } from '../Channel/types'

  type Props = {
    /** Everything the Channel page shows; this tab reads the part, its sound, mix, sends and send kinds. */
    data: ChannelData
    /** The app's `use:tip` action, passed in by the wiring and applied to every control with a tooltip. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for (level, pan, on, swap, solo, send, addSend). */
    onchange?: (change: ChannelChange) => void
    /** The sound button was pressed: opens Library › Sounds. */
    onsound?: () => void
    /** The plugin's Edit button was pressed: opens the plugin editor. */
    onedit?: () => void
  }

  let { data, tipAction, onchange, onsound, onedit }: Props = $props()

  /** The On lamp's tooltip for each keyboard part. */
  const ON_TIPS = ['part.right1.on', 'part.right2.on', 'part.right3.on', 'part.left.on']
  /** The plugin status word's colour token. */
  const STATUS_HUE: Record<PluginLine['status'], string> = { loading: 'caption-ink', playing: 'ok', failed: 'ending', muted: 'warn' }

  /**
   * The Add send layer: open, the send rows are replaced by the twelve kinds and the header's
   * button reads Cancel. The tab's own state; it closes on a pick, Cancel, Esc, or another part.
   */
  let adding = $state(false)
  let layer: HTMLElement | undefined = $state()

  $effect(() => {
    void data.part
    adding = false
  })

  // Opening the layer puts focus on its first kind.
  $effect(() => {
    if (adding) layer?.querySelector<HTMLElement>('button')?.focus()
  })

  const sound = $derived(data.sound)
  const mix = $derived(data.mix)
  const plugin = $derived(sound.plugin)
  const soundLabel = $derived.by(() => {
    const parts = [`${data.partName} sound: ${sound.number ? `${sound.number} ` : ''}${sound.name}`]
    if (sound.edited) parts.push('edited')
    if (sound.off) parts.push('off')
    if (sound.missing) parts.push('plugin missing')
    else if (sound.failed) parts.push('plugin failed')
    if (sound.bass) parts.push('bass')
    return `${parts.join(', ')}. Opens Library › Sounds`
  })
  const levelTip = $derived(mix.waiting ? 'mixer.pickup' : data.keyboard ? 'mixer.channel.level' : 'mixer.style.volume')
  const onName = $derived(`${data.partName} ${mix.on ? 'on' : 'off'}${mix.onLabel === 'Swap' ? ', swap held' : ''}`)
  const onTip = $derived(data.keyboard ? (ON_TIPS[data.part] ?? 'part.right1.on') : 'mixer.style.mute')
  const present = $derived(data.sends.filter((s) => s.present).length)
  const full = $derived(data.sendKinds.length === 0)
  const addName = $derived(full ? 'Add a send effect: all six added' : `Add a send effect (${present + 1} of 6)`)
  const left = $derived(data.sends.filter((s) => s.send < 3))
  const right = $derived(data.sends.filter((s) => s.send >= 3))

  function change(c: ChannelChange) {
    onchange?.(c)
  }

  function pick(kind: string) {
    adding = false
    change({ type: 'addSend', kind })
  }

  /** Esc inside the layer closes it and goes no further. */
  const escape: Action<HTMLElement> = (node) => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      adding = false
    }
    node.addEventListener('keydown', key)
    return { destroy: () => node.removeEventListener('keydown', key) }
  }

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
</script>

{#snippet sendRow(row: ChannelSendRow)}
  <BarReadout
    label={row.label}
    value={row.level}
    min={0}
    max={127}
    default={0}
    disabled={!row.present}
    absent="not added"
    name={row.present ? `Send ${row.send + 1}, ${row.label.toLowerCase()}` : `Send ${row.send + 1}`}
    tip="mixer.strip.send"
    {tipAction}
    onchange={(value) => change({ type: 'send', send: row.send, value })}
  />
{/snippet}

<div class="mix" style={data.hue ? sectionHue(data.hue) : undefined}>
  <section class="group" aria-labelledby="channel-mix-sound">
    <GroupHeader title="Sound" level={3} id="channel-mix-sound" />
    <div class="body">
      {#if data.keyboard}
        <div class="row">
          <button
            type="button"
            class="sound"
            aria-label={soundLabel}
            data-tip="mixer.channel.sound"
            use:tipped={'mixer.channel.sound'}
            onclick={() => onsound?.()}
          >
            {#if sound.number}<span class="number">{sound.number}</span>{/if}
            <span class="name">{sound.name}</span>
            <PartMarks edited={sound.edited} missing={sound.missing} failed={sound.failed} off={sound.off} bass={sound.bass} />
          </button>
        </div>
        <div class="row line">
          {#if plugin}
            <span class="caption">{plugin.name} · </span>
            {#if plugin.missing}
              <span class="status" data-hue="warn" style:color="var(--warn)">missing</span>
            {:else}
              <span class="status" data-hue={STATUS_HUE[plugin.status]} style:color={`var(--${STATUS_HUE[plugin.status]})`}
                >{plugin.status}</span
              >
            {/if}
            {#if plugin.inProcess}
              <span class="caption"
                >&nbsp;·&nbsp;{#if plugin.fallback}<span class="warn" data-hue="warn">⚠</span>&nbsp;{/if}in process</span
              >
            {/if}
          {:else}
            <span class="caption">SoundFont voice</span>
          {/if}
        </div>
        {#if sound.mine || plugin?.editor}
          <div class="row split">
            {#if sound.mine}<span class="mine" data-hue="a">Mine</span>{/if}
            {#if plugin?.editor}
              <span class="end">
                <Button label="Edit" name="Open the plugin editor" tip="part.plugin_edit" {tipAction} onpress={() => onedit?.()} />
              </span>
            {/if}
          </div>
        {/if}
      {:else}
        <div class="row">
          {#if sound.name}
            <span class="name">{sound.name}</span>
          {:else}
            <span class="name empty">—</span>
          {/if}
        </div>
        <div class="row"><span class="caption">the style's voice</span></div>
      {/if}
    </div>
  </section>

  <section class="group" aria-labelledby="channel-mix-level">
    <GroupHeader title="Level" level={3} id="channel-mix-level" />
    <div class="body">
      <BarReadout
        label="Level"
        value={mix.level}
        min={0}
        max={127}
        default={100}
        waiting={mix.waiting}
        tip={levelTip}
        {tipAction}
        onchange={(value) => change({ type: 'level', value })}
      />
      <BarReadout
        label="Pan"
        value={mix.pan ?? 64}
        min={0}
        max={127}
        kind="pan"
        bipolar
        default={64}
        disabled={mix.pan === null}
        tip="mixer.channel.pan"
        {tipAction}
        onchange={(value) => change({ type: 'pan', value })}
      />
      <div class="row lamps">
        <LampButton
          label={mix.onLabel}
          on={mix.on}
          size="cell"
          width={72}
          name={onName}
          tip={onTip}
          {tipAction}
          ontoggle={() => change({ type: 'on' })}
          onlongpress={mix.canSwap ? () => change({ type: 'swap' }) : undefined}
        />
        <LampButton
          label="Solo"
          on={mix.solo}
          size="cell"
          width={72}
          name={`Solo ${data.partName}`}
          tip="mixer.solo"
          {tipAction}
          ontoggle={() => change({ type: 'solo' })}
        />
      </div>
    </div>
  </section>

  <section class="group sends" aria-labelledby="channel-mix-sends">
    <GroupHeader title="Sends" detail="1–6" level={3} id="channel-mix-sends">
      {#snippet end()}
        <span class="head-slot"
          ><span class="head-button">
            {#if adding}
              <Button
                label="Cancel"
                name="Cancel adding a send"
                tip="mixer.channel.add_send"
                {tipAction}
                onpress={() => (adding = false)}
              />
            {:else}
              <Button
                label="+ Add send"
                name={addName}
                tip="mixer.channel.add_send"
                disabled={full}
                {tipAction}
                onpress={() => (adding = true)}
              />
            {/if}
          </span></span
        >
      {/snippet}
    </GroupHeader>
    <div class="body">
      {#if adding}
        <div class="kinds" role="group" aria-label="Send kinds" bind:this={layer} use:escape>
          {#each data.sendKinds as item (item.kind)}
            <Button
              label={item.name}
              size="cell"
              name={`Add a ${item.name} send`}
              tip="mixer.channel.add_send"
              {tipAction}
              onpress={() => pick(item.kind)}
            />
          {/each}
        </div>
      {:else}
        <div class="pair">
          <div class="column">
            {#each left as row (row.send)}{@render sendRow(row)}{/each}
          </div>
          <div class="column">
            {#each right as row (row.send)}{@render sendRow(row)}{/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
</div>

<style>
  .mix {
    --channel-column: 264px;
    --channel-column-gap: 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: var(--channel-column-gap);
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    max-width: calc(4 * var(--channel-column) + 3 * var(--channel-column-gap));
    max-height: 240px;
    overflow: hidden;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: var(--header-gap);
    min-width: 0;
  }
  .sends {
    grid-column: span 2;
  }
  .body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    height: var(--row-height, var(--control-height));
    min-width: 0;
    white-space: nowrap;
  }
  .split .end {
    margin-left: auto;
  }
  .sound {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
    max-width: 100%;
    height: var(--row-height, var(--control-height));
    padding: 0;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .sound:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
  .number,
  .caption {
    color: var(--caption-ink);
  }
  .number {
    flex: none;
  }
  .name {
    overflow: hidden;
    min-width: 0;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name.empty {
    color: var(--absent);
  }
  .line {
    gap: 0;
    overflow: hidden;
  }
  .line .caption,
  .line .status {
    flex: none;
  }
  .warn {
    color: var(--warn);
  }
  .mine {
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .lamps {
    gap: var(--space-8);
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--channel-column-gap);
  }
  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kinds {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: var(--control-height);
  }
  /* The header's button: an empty, zero-height slot on the header's baseline, the button hung
     from it so it is centred between the row's top and its rule (a 32px button would else sit
     on the text baseline and cross the rule), as ChannelComp's On lamp. */
  .head-slot {
    position: relative;
    display: inline-block;
    width: 1px;
    height: 0;
  }
  .head-button {
    position: absolute;
    right: 0;
    bottom: calc(
      var(--header-baseline) + var(--header-rule-width) +
        (var(--group-header-height) - var(--header-rule-width) - var(--control-height)) / 2 - var(--group-header-height)
    );
    display: flex;
    height: var(--control-height);
    white-space: nowrap;
  }
</style>
