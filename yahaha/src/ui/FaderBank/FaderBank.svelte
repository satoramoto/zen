<!--
  FaderBank: the band's Faders section. A GroupHeader with the title, the fader page tabs, a
  separator, the "Layer" word and the layer tabs, every text 13px and every tab in the one header
  tab style; nine strips, each a Fader over its name button with PartMarks (an off part's name in
  its hue's absent face); the "Part on/off" and "Functions" caption row; and one 32px lamp row:
  the part lamps under faders 1–4 (in the part's hue), the Launchkey function lamps under 5–8
  (neutral), and the Panel page button under 9 (a tap flips the page; a hold calls `onpagelong`,
  its release `onpagerelease`). Holds no state: every change is a callback with
  the strip's or lamp's id.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import Fader from '../Fader/Fader.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import PartMarks from '../PartMarks/PartMarks.svelte'
  import Separator from '../Separator/Separator.svelte'
  import type { BankLamp, FaderStrip } from './types'

  type Props = {
    /** The nine strips, left to right. */
    strips: FaderStrip[]
    /** The fader page tabs (Panel, Style). */
    pageTabs: TabItem[]
    /** The chosen page's id. */
    page: string
    /** The fader layer tabs (Vol, Pan, Reverb, Chorus, Delay). */
    layerTabs: TabItem[]
    /** The chosen layer's id; any but the first gives strips 1–4 the layer look and the header its word. */
    layer: string
    /** The part lamps under faders 1–4. */
    partLamps: BankLamp[]
    /** The Launchkey function lamps under faders 5–8. */
    functionLamps: BankLamp[]
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A page tab was chosen. */
    onchoosePage?: (id: string) => void
    /** A layer tab was chosen. */
    onchooseLayer?: (id: string) => void
    /** A fader asked for a level (0–127). */
    onlevel?: (id: string, level: number) => void
    /** A strip's name button was pressed (open Channel, Effects, …). */
    onopen?: (id: string) => void
    /** A lamp asked to be switched to `on`. */
    onlamp?: (id: string, on: boolean) => void
    /** A lamp with `long` was held. */
    onlamplong?: (id: string) => void
    /** The hold on a `long` lamp ended. */
    onlamprelease?: (id: string) => void
    /** The Panel page button under fader 9 (flips the page). */
    onpagebutton?: () => void
    /** The page button was held (as holding the Launchkey's master fader button: the fader picker on the pads). */
    onpagelong?: () => void
    /** The hold on the page button ended. */
    onpagerelease?: () => void
  }

  let {
    strips,
    pageTabs,
    page,
    layerTabs,
    layer,
    partLamps,
    functionLamps,
    tipAction,
    onchoosePage,
    onchooseLayer,
    onlevel,
    onopen,
    onlamp,
    onlamplong,
    onlamprelease,
    onpagebutton,
    onpagelong,
    onpagerelease,
  }: Props = $props()

  let layered = $derived(layerTabs.length > 0 && layer !== layerTabs[0].id)
  let layerWord = $derived(layered ? layerTabs.find((tab) => tab.id === layer)?.label : undefined)
  let pageLabel = $derived(pageTabs.find((tab) => tab.id === page)?.label ?? '')
  let otherLabel = $derived(pageTabs.find((tab) => tab.id !== page)?.label ?? '')

  const isPart = (strip: FaderStrip) => strip.kind === 'part' || strip.kind === 'off'
  const isLive = (strip: FaderStrip) => strip.kind !== 'off' && strip.kind !== 'parked'
  /** An off strip's name colour: its hue's absent face (`t2` and `t` have none of their own: neutral). */
  const absent = (hue: FaderStrip['hue']) =>
    hue === 't' || hue === 't2' ? 'var(--absent-neutral)' : `var(--absent-${hue})`

  /** Applies the parent's tooltip action to a name button that has a key. */
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

{#snippet lamp(item: BankLamp)}
  <LampButton
    label={item.label}
    on={item.on}
    hue={item.hue}
    rec={item.rec}
    waiting={item.waiting}
    size="cell"
    name={item.name}
    tip={item.tip}
    {tipAction}
    ontoggle={(on) => onlamp?.(item.id, on)}
    onlongpress={item.long ? () => onlamplong?.(item.id) : undefined}
    onlongrelease={item.long ? () => onlamprelease?.(item.id) : undefined}
  />
{/snippet}

<section class="bank" aria-label="Faders">
  <GroupHeader title="Faders" detail={layerWord}>
    <ChosenTabs size="header" label="Fader page (master button)" tabs={pageTabs} chosen={page} {tipAction} onchoose={onchoosePage} />
    <Separator />
    <span class="layer">
      <span class="layer-word">Layer</span>
      <ChosenTabs size="header" label="Fader layer" tabs={layerTabs} chosen={layer} {tipAction} onchoose={onchooseLayer} />
    </span>
  </GroupHeader>

  <div class="body">
    <div class="strips">
      {#each strips as strip (strip.id)}
        <div class="strip">
          <Fader
            name={strip.faderName}
            value={strip.value}
            level={strip.level}
            meter={strip.meter}
            meter2={strip.meter2}
            peak={strip.peak}
            away={strip.away}
            kind={strip.kind}
            hue={strip.hue}
            layered={layered && isPart(strip)}
            tip={strip.tip}
            {tipAction}
            onlevel={(level) => onlevel?.(strip.id, level)}
          />
          {#if strip.kind === 'parked'}
            <span class="name" style:--hue="var(--d)" data-contrast="dim" aria-hidden="true">
              <span class="tag">{strip.tag}</span>
            </span>
          {:else}
            <button
              type="button"
              class="name"
              style:--hue={isLive(strip) ? `var(--${strip.hue})` : absent(strip.hue)}
              aria-label={strip.openName ?? strip.tag}
              data-tip={strip.openTip}
              use:tipped={strip.openTip}
              onclick={() => onopen?.(strip.id)}
            >
              <span class="tag">{strip.tag}</span>
              <PartMarks size="strip" edited={strip.edited} missing={strip.missing} failed={strip.failed} />
            </button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="captions">
      <span class="caption parts">Part on/off</span>
      <span class="caption functions">Functions<span class="hint">Launchkey fader buttons 5–9</span></span>
    </div>

    <div class="lamps">
      {#each partLamps as item (item.id)}{@render lamp(item)}{/each}
      {#each functionLamps as item (item.id)}{@render lamp(item)}{/each}
      <Button
        label={pageLabel}
        size="cell"
        name={`Fader page is ${pageLabel}: click for ${otherLabel}`}
        tip="mixer.page"
        {tipAction}
        onpress={onpagebutton}
        onlongpress={onpagelong}
        onlongrelease={onpagerelease}
      />
    </div>
  </div>
</section>

<style>
  .bank {
    display: flex;
    flex-direction: column;
    width: var(--band-faders-width);
    height: var(--band-height);
    font-family: var(--font-sans);
  }
  .layer {
    display: flex;
    align-items: baseline;
  }
  .layer-word {
    margin-right: var(--space-4);
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .body {
    display: flex;
    flex-direction: column;
    margin-top: var(--band-body-gap);
  }
  .strips,
  .captions,
  .lamps {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    column-gap: var(--band-strip-gap);
  }
  .strip {
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: var(--fader-strip-height);
  }
  .name {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    box-sizing: border-box;
    width: 100%;
    height: var(--fader-name-height);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    white-space: nowrap;
    cursor: pointer;
  }
  span.name {
    cursor: default;
  }
  .tag {
    color: var(--hue);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .captions {
    height: var(--band-caption-height);
    margin-top: var(--band-caption-gap);
    white-space: nowrap;
  }
  .caption {
    box-sizing: border-box;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .parts {
    grid-column: 1 / 5;
  }
  .functions {
    display: flex;
    grid-column: 5 / 10;
  }
  .hint {
    margin-left: auto;
  }
  .lamps {
    height: var(--control-height);
    margin-top: var(--band-lamp-gap);
  }
  .name:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
