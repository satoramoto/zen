<!--
  StageGolden: the Stage laid out as a Golden tree (a proposal; Stage renders it with
  `layout="golden"`, Storybook only for now). The same regions and data as Stage, placed by the
  Golden primitives (Golden/), so every size comes from a cut or a named token, never from a px.
  The geometry is the owner's wireframe (docs/factory/golden.md, "The Stage"); the components keep
  the hill-climb's learnings. Numbers at 1440 × 900 (the frame 1398 wide, fib-21 side margins and a
  fib-21 foot; the app bar on the screen's top edge):
  - App bar (36, the bar-height band), a fib-8, then the controls row: a control-height band one
    golden step deeper (32 × phi = 52), a fib-13 before the display. At its top, the owner's mockup
    of the top row in our face: one outlined box 36 deep: the style line, a hairline, One Touch
    (its caption, then 1–4) in the style's violet. The display's sides run up through the gap, so
    the row and the display read as one frame.
  - Display (1398 × 288): three phi boxes across the frame (`take="phi" boxes={3}`), a fib-21
    before the band, lifted into the 16 of the controls band the row leaves (304 deep). Inside
    it, the mockup's hero panel: the chord, section and tempo columns split
    by hairlines (0.329 · 0.354 · the rest of its width); the three values bold at one size,
    centred, their capitals on one line, each measured down to fit its column; under them "A · C
    · E · G … Fingered On Bass", "Next … Main C … fill after bar 4" and − Tap +; the beat bar
    across its foot. Its places are the --golden-hero-* fractions of its own box
    (stage-display.css), so it scales with the screen.
  - Band (1398 × 384), two equal halves (688 | 689) with a fib-21 gutter: the faders (a header
    band over nine strips, each with its own foot: part lamps, then the functions and the page
    button) and the knobs over the pads (a header band over eight knob cells; a header band over
    2 × 8 pads at 6:5, `take="minor-third" boxes={4}`). The transport's seven square icon keys
    (▶, Sync Start, Accomp, Fill ▲, Fill ▼, Fade, Reset; their words in their names and tooltips)
    sit at the Pads header's right end, beside the pads as on the Launchkey.
  - The status line in a label-height band a fib-5 under the band; the keys (56, the keys-height
    band) under it, the black keys 56 / phi.
  Each leaf is a size container: the components' size tokens are set from its content box (cq
  units). It changes no component's default: it uses their additive props. With `overlay`, the
  whole tree is drawn and checked by a GoldenOverlay.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import AppBar from '../AppBar/AppBar.svelte'
  import Button from '../Button/Button.svelte'
  import ChordReadout from '../ChordReadout/ChordReadout.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import type { BankLamp, FaderStrip } from '../FaderBank/types'
  import FaderCell from '../Golden/FaderCell.svelte'
  import GoldenBand from '../Golden/GoldenBand.svelte'
  import GoldenGrid from '../Golden/GoldenGrid.svelte'
  import GoldenSplit from '../Golden/GoldenSplit.svelte'
  import type { Interval } from '../Golden/golden'
  import KnobCell from '../Golden/KnobCell.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import HueLegend from '../HueLegend/HueLegend.svelte'
  import Keys from '../Keys/Keys.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import OneTouchPicker from '../OneTouchPicker/OneTouchPicker.svelte'
  import Pad from '../Pad/Pad.svelte'
  import SectionName from '../SectionName/SectionName.svelte'
  import SectionRow from '../SectionRow/SectionRow.svelte'
  import Separator from '../Separator/Separator.svelte'
  import type Stage from '../Stage/Stage.svelte'
  import StatusLine from '../StatusLine/StatusLine.svelte'
  import StyleLine from '../StyleLine/StyleLine.svelte'
  import TempoReadout from '../TempoReadout/TempoReadout.svelte'

  /** The Stage's props (the same regions and callbacks), with the running and fading Stage resolved. */
  type Props = ComponentProps<typeof Stage> & {
    /** The style is running (Stage resolves it from the section row or the old transport). */
    running?: boolean
    /** A fade is under way (as `running`). */
    fading?: boolean
    /** Draw the Golden tree's cuts, insets and spirals over the screen, and check them (GoldenOverlay). A design aid. */
    overlay?: boolean
  }

  let p: Props = $props()

  /** The keys' width in px until the keys' slot is measured (and where nothing is laid out). */
  const KEYS_FALLBACK = 1398
  /** The keys' slot's width, measured as it resizes (0 where nothing is laid out: jsdom). */
  let keysSlot = $state(0)
  let keysWidth = $derived(keysSlot > 0 ? keysSlot : KEYS_FALLBACK)

  /** Measures the keys' slot as it resizes; nothing where ResizeObserver is missing (jsdom). */
  function measureKeys(el: HTMLElement) {
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) keysSlot = Math.floor(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }

  const display = $derived(p.display)
  const now = $derived(display.nowPlaying)
  const style = $derived({
    styleName: display.styleLine.styleName,
    category: display.styleLine.category,
    timeSignature: display.styleLine.timeSignature,
    queued: display.styleLine.queued,
  })

  type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill'
  /** A section's hue from its shown name ("Main C" → main), as the pads colour it. */
  function hueOf(name: string): SectionHue | undefined {
    const word = name.trim().split(/\s+/)[0]?.toLowerCase()
    return word === 'intro'
      ? 'intro'
      : word === 'main'
        ? 'main'
        : word === 'ending'
          ? 'ending'
          : word === 'break'
            ? 'brk'
            : word === 'fill'
              ? 'fill'
              : undefined
  }
  const next = $derived((now.next ?? '').trim())
  const nextHue = $derived(hueOf(next) ?? now.hue ?? 'main')
  /**
   * The section's line after "Next" and the next section: when the change lands. With nothing
   * queued, where the section is ("bar 3 of 4": the bar shows nowhere else since the tempo's line
   * is − Tap +). Stopped: the stopped state.
   */
  const when = $derived.by(() => {
    if (!now.running) return now.syncStart ? 'Sync Start armed' : 'Stopped'
    if (next) return now.fill ?? ''
    return (now.bar ?? 0) > 0 && (now.bars ?? 0) > 0 ? `bar ${now.bar} of ${now.bars}` : ''
  })

  /**
   * The playing section's name at the largest size that fits its column: its size is the hero size
   * times `sectionFit` (at most 1). Measured on the name itself, as it resizes (a new name, the web
   * font arriving, the screen), the way ChordReadout fits the chord; width scales with the size, so
   * one measurement gives the fit. Nothing where ResizeObserver is missing (jsdom).
   */
  let sectionFit = $state(1)
  /** The tempo's numeral the same way: "288" and BPM within the tempo's column. */
  let tempoFit = $state(1)

  /**
   * Fits one value: `value` set at the hero size times the fit, in `room` less `rest` (what else
   * shares the line). Watches all three as they resize.
   */
  function fitter(get: () => number, set: (fit: number) => void, parts: (box: HTMLElement) => [HTMLElement | null, HTMLElement | null, number]) {
    return (box: HTMLElement) => {
      if (typeof ResizeObserver === 'undefined') return
      const fit = () => {
        const [room, value, rest] = parts(box)
        const width = value?.getBoundingClientRect().width ?? 0
        const space = (room?.clientWidth ?? 0) - rest
        if (width <= 0 || space <= 0) return
        const next = Math.min(1, Math.floor(((space * get()) / width) * 1000) / 1000)
        if (Math.abs(next - get()) > 0.001) set(next)
      }
      const observer = new ResizeObserver(fit)
      const [room, value] = parts(box)
      for (const el of [box, room, value]) if (el) observer.observe(el)
      return () => observer.disconnect()
    }
  }
  const fitSection = fitter(
    () => sectionFit,
    (fit) => (sectionFit = fit),
    (stand) => [stand, stand.firstElementChild as HTMLElement | null, 0],
  )
  const fitTempo = fitter(
    () => tempoFit,
    (fit) => (tempoFit = fit),
    (area) => {
      const unit = area.querySelector<HTMLElement>('.unit')
      // The unit's width and a fib-8 (8px) between it and the numeral.
      return [area.querySelector<HTMLElement>('.reading'), area.querySelector<HTMLElement>('.bpm'), (unit?.getBoundingClientRect().width ?? 0) + 8]
    },
  )
  const beats = $derived(Math.max(1, now.beats ?? 4))
  const beat = $derived(now.running ? (now.beat ?? 0) : 0)

  /** Each part, by the strip's id (right1 … left): its sound sits on top of the part's strip. */
  const parts = $derived(new Map(display.soundRow.parts.map((part) => [part.id as string, part])))

  const faders = $derived(p.faders)
  const layered = $derived(faders.layerTabs.length > 0 && faders.layer !== faders.layerTabs[0].id)
  const layerWord = $derived(layered ? faders.layerTabs.find((tab) => tab.id === faders.layer)?.label : undefined)
  const pageLabel = $derived(faders.pageTabs.find((tab) => tab.id === faders.page)?.label ?? '')
  const otherLabel = $derived(faders.pageTabs.find((tab) => tab.id !== faders.page)?.label ?? '')
  const isPart = (strip: FaderStrip) => strip.kind === 'part' || strip.kind === 'off'
  /**
   * The strips' foot, one module a strip on the strip's own column: the part lamps under the part
   * strips, then the function lamps and the page button under the rest (a sub-cut before the first
   * function, so a function never reads as a strip's state).
   */
  type Foot = BankLamp | 'page'
  const foot: Foot[] = $derived([...faders.partLamps, ...faders.functionLamps, 'page'])
  const footCut = $derived(faders.partLamps.length)
  /** Every knob cell one width, assigned or not. */
  const knobWeights: Interval[] = $derived(p.knobs.knobs.map(() => 'unison'))
  /** The app's tooltip action on Tap, when there is one. */
  function tipOn(node: HTMLElement, key: string) {
    if (!p.tipAction) return
    return p.tipAction(node, key)
  }
  /**
   * A queued fill: what comes next lands after a fill ("fill after bar 4"), from one Main to
   * another, so Fill Up (to a later Main) or Fill Down is queued: said in its spoken name, its face
   * plain off (SectionRow `plainQueue`). The section row's own `fillQueued` wins.
   */
  const fillQueued = $derived.by((): 'up' | 'down' | undefined => {
    if (p.sectionRow.fillQueued) return p.sectionRow.fillQueued
    const from = /^main\s+([a-d])$/i.exec((now.playing ?? '').trim())?.[1]?.toUpperCase()
    const to = /^main\s+([a-d])$/i.exec(next)?.[1]?.toUpperCase()
    if (!now.running || !from || !to || from === to || !/fill/i.test(now.fill ?? '')) return undefined
    return to > from ? 'up' : 'down'
  })
  /** The pads on the Sections bank: its utility pads are the transport's twins (Start / Stop, Sync Start, Sync Stop, Tap, Auto Fill). */
  const sectionsBank = $derived(
    ((p.pads.banks?.length ? p.pads.banks[p.pads.bank ?? 0] : p.pads.bankName) ?? 'Sections') === 'Sections',
  )

  const knobTabs: TabItem[] = $derived(
    (p.knobs.pages?.length ? p.knobs.pages : [p.knobs.pageLabel ?? '']).map((label, i) => ({
      id: String(i),
      label,
      tip: 'knobs.page',
    })),
  )
  const BANK_TIPS = ['padpage.sections', 'padpage.racks', 'padpage.chord', 'padpage.multi_pads', 'padpage.setup']
  const bankTabs: TabItem[] = $derived(
    (p.pads.banks?.length ? p.pads.banks : [p.pads.bankName ?? '']).map((label, i) => ({
      id: String(i),
      label,
      tip: p.pads.bankTips?.[i] ?? BANK_TIPS[i],
    })),
  )
</script>

{#snippet lamp(item: BankLamp, fn: boolean)}
  <!-- A function lamp with no hue of its own lights in the lamp's lime, never white. -->
  <LampButton
    label={item.label}
    on={item.on}
    hue={fn && (item.hue === undefined || item.hue === 't' || item.hue === 'm') ? 'lamp' : item.hue}
    rec={item.rec}
    waiting={item.waiting}
    size="cell"
    name={item.name}
    tip={item.tip}
    tipAction={p.tipAction}
    ontoggle={(on) => p.onlamp?.(item.id, on)}
    onlongpress={item.long ? () => p.onlamplong?.(item.id) : undefined}
    onlongrelease={item.long ? () => p.onlamprelease?.(item.id) : undefined}
  />
{/snippet}

<div class="screen">
  <div class="page">
    <GoldenBand size="bar-height" from="top" gap="fib-8" name="page" overlay={p.overlay ?? false}>
      <div class="leaf bar">
        <!-- The bar fills its band: the grid Stage's fixed px width is dropped. -->
        <AppBar {...p.appBar} width={undefined} tipAction={p.tipAction} onchoose={p.onchoose} onhealth={p.onhealth}>
          {#snippet end()}
            <span class="helpers" role="toolbar" aria-label="Helpers">
              <SectionRow
                {...p.sectionRow}
                groups="helpers"
                cells
                running={p.running}
                fading={p.fading}
                tipAction={p.tipAction}
                onmetronome={p.onmetronome}
                onmetronomesettings={p.onmetronomesettings}
                onunison={p.onunison}
                onpanic={p.onpanic}
                onhelp={p.onhelp}
              />
            </span>
          {/snippet}
        </AppBar>
      </div>
      <GoldenBand size="control-height" times="phi" from="top" gap="fib-13" name="controls">
        <div class="leaf controls"><div class="row">
          <div class="style">
            <StyleLine {...style} cells tipAction={p.tipAction} onprev={p.onprev} onnext={p.onnext} onbrowse={p.onbrowse} />
          </div>
          <span class="rule" aria-hidden="true"></span>
          <div
            class="one-touch"
            role="group"
            aria-label="One Touch Setting (OTS). Click to apply; on the Launchkey, Shift + pads 9 to 12"
          >
            <OneTouchPicker
              cells
              hue="a"
              applied={display.styleLine.oneTouch ?? 0}
              count={display.styleLine.oneTouchCount ?? 4}
              tipAction={p.tipAction}
              onapply={p.ononetouch}
            />
          </div>
        </div></div>
        <GoldenBand size="keys-height" from="bottom" name="keys and the rest">
          <div class="leaf keys" {@attach measureKeys}>
            <Keys {...p.keys} width={keysWidth} />
          </div>
          <GoldenBand size="label-height" from="bottom" gap="fib-5" name="status and the rest">
            <div class="leaf status">
              <StatusLine {...p.status} tipAction={p.tipAction} onclear={p.onclear} />
            </div>
            <GoldenSplit take="phi" boxes={3} from="top" gap="fib-21" name="display and band">
              <!-- The hero panel: the mockup's three value columns split by hairlines, the beat bar
                   across its foot; the controls row's box closes over it. -->
              <div class="leaf hero" data-hero>
                <div class="col chord-col">
                  <div class="chord"><ChordReadout {...now.chord} tip="fingering.select" tipAction={p.tipAction} /></div>
                </div>
                <div class="col section-col">
                  <div class="stand" style:--fit={sectionFit} {@attach fitSection}>
                    <SectionName label={now.playing} hue={now.hue} idle={!now.running} />
                  </div>
                  <div class="sub next" role="group" aria-label="Next section">
                    {#if next}
                      <span class="then">Next</span>
                      <span class="next-name" style:--hue="var(--{nextHue})" data-hue={nextHue}>{next}</span>
                    {/if}
                    {#if when}<span class="when" class:sync={!now.running && now.syncStart}>{when}</span>{/if}
                  </div>
                </div>
                <div class="col tempo-col" style:--tempo-fit={tempoFit} {@attach fitTempo}>
                  <TempoReadout
                    cells
                    bpm={now.bpm}
                    tipAction={p.tipAction}
                    ontempo={p.ontempo}
                    onplus={p.ontempoup}
                    onminus={p.ontempodown}
                    onreset={p.onstyletempo}
                  />
                  <button
                    type="button"
                    class="tap"
                    aria-label="Tap tempo"
                    data-tip="tempo.tap"
                    use:tipOn={'tempo.tap'}
                    onclick={() => p.ontaptempo?.()}>Tap</button
                  >
                </div>
                <div class="beats" role="img" aria-label={beat > 0 ? `Beat ${beat} of ${beats}` : `${beats} beats, stopped`}>
                  {#each { length: beats } as _, i (i)}
                    <span class="beat" class:now={i + 1 === beat}><span class="bar"></span></span>
                  {/each}
                </div>
              </div>
              <GoldenSplit take="octave" of="length" from="left" name="band">
                <section class="half left" aria-label="Faders">
                  <GoldenBand size="group-header-height" from="top" name="faders">
                    <div class="leaf header">
                      <GroupHeader title="Faders" detail={layerWord}>
                        <ChosenTabs
                          size="header"
                          label="Fader page (master button)"
                          tabs={faders.pageTabs}
                          chosen={faders.page}
                          tipAction={p.tipAction}
                          onchoose={p.onchoosePage}
                        />
                        <Separator />
                        <span class="layer">
                          <span class="layer-word">Layer</span>
                          <ChosenTabs
                            size="header"
                            label="Fader layer"
                            tabs={faders.layerTabs}
                            chosen={faders.layer}
                            tipAction={p.tipAction}
                            onchoose={p.onchooseLayer}
                          />
                        </span>
                      </GroupHeader>
                    </div>
                    <GoldenGrid columns={faders.strips.length} name="strips">
                      {#each faders.strips as strip, i (strip.id)}
                        {@const part = parts.get(strip.id)}
                        {@const item = foot[i]}
                        {#snippet footOf()}
                          <span class="foot" class:cut={i === footCut - 1}>
                            {#if item === 'page'}
                              <Button
                                label={pageLabel}
                                size="cell"
                                hue="lamp"
                                name={`Fader page is ${pageLabel}: click for ${otherLabel}`}
                                tip="mixer.page"
                                tipAction={p.tipAction}
                                onpress={p.onpagebutton}
                                onlongpress={p.onpagelong}
                                onlongrelease={p.onpagerelease}
                              />
                            {:else if item}
                              {@render lamp(item, i >= footCut)}
                            {/if}
                          </span>
                        {/snippet}
                        <FaderCell
                          lamp={item ? footOf : undefined}
                          name={strip.faderName}
                          label={strip.tag}
                          value={strip.value}
                          level={strip.level}
                          meter={strip.meter}
                          meter2={strip.meter2}
                          peak={strip.peak}
                          away={strip.away}
                          kind={strip.kind}
                          hue={strip.hue}
                          layered={layered && isPart(strip)}
                          empty
                          tip={strip.tip}
                          sound={part?.sound ?? ''}
                          soundLines={2}
                          soundName={part ? `${part.partName} sound: ${part.sound}. Opens the quick sound list` : undefined}
                          soundTip={part ? 'launchkey.fader_sound' : undefined}
                          onsound={part ? () => p.onsound?.(part.id) : undefined}
                          onopen={() => p.onopen?.(strip.id)}
                          openName={strip.openName}
                          openTip={strip.openTip}
                          edited={strip.edited}
                          missing={strip.missing}
                          failed={strip.failed}
                          tipAction={p.tipAction}
                          onlevel={(level) => p.onlevel?.(strip.id, level)}
                        />
                      {/each}
                    </GoldenGrid>
                  </GoldenBand>
                </section>
                <section class="half right" aria-label="Knobs and pads">
                  <GoldenSplit take="minor-third" boxes={4} from="bottom" name="knobs and pads">
                    <GoldenGrid columns={8} rows={2} name="pad grid">
                      {#each p.pads.pads as pad, i (i)}
                        <div class="leaf pad">
                          <Pad
                            label={pad.label}
                            index={String(i + 1)}
                            family={pad.family}
                            state={pad.state}
                            lit={p.pads.lit ?? true}
                            tagCorner
                            transport={sectionsBank}
                            name={pad.name}
                            tip={pad.tip}
                            tipAction={p.tipAction}
                            onpress={() => p.onpadpress?.(i)}
                          />
                        </div>
                      {/each}
                    </GoldenGrid>
                    <GoldenBand size="group-header-height" from="bottom" name="pads">
                      <div class="leaf header">
                        <GroupHeader title="Pads">
                          <ChosenTabs
                            size="header"
                            label="Pad bank"
                            tabs={bankTabs}
                            chosen={String(p.pads.banks?.length ? (p.pads.bank ?? 0) : 0)}
                            tipAction={p.tipAction}
                            onchoose={(id) => p.onpadbank?.(Number(id))}
                          />
                          {#snippet end()}
                            {#if p.pads.legend?.length}<HueLegend items={p.pads.legend} />{/if}
                            <!-- The transport beside the pads, as on the Launchkey: seven square
                                 icon keys at the header's right end. -->
                            <span class="transport" role="toolbar" aria-label="Transport">
                              <SectionRow
                                {...p.sectionRow}
                                groups="transport"
                                cells
                                iconKeys
                                running={p.running}
                                fading={p.fading}
                                beat={p.sectionRow.beat ?? beat}
                                bpm={p.sectionRow.bpm ?? now.bpm}
                                {fillQueued}
                                plainQueue
                                stateLegend
                                tipAction={p.tipAction}
                                onstartstop={p.onstartstop}
                                onaccomp={p.onaccomp}
                                onsyncstart={p.onsyncstart}
                                onreset={p.onreset}
                                onfillup={p.onfillup}
                                onfilldown={p.onfilldown}
                                onfade={p.onfade}
                              />
                            </span>
                          {/snippet}
                        </GroupHeader>
                      </div>
                      <GoldenBand size="group-header-height" from="top" name="knobs">
                        <div class="leaf header">
                          <GroupHeader title="Knobs">
                            <ChosenTabs
                              size="header"
                              label="Knob page"
                              tabs={knobTabs}
                              chosen={String(p.knobs.pages?.length ? (p.knobs.page ?? 0) : 0)}
                              tipAction={p.tipAction}
                              onchoose={(id) => p.onknobpage?.(Number(id))}
                            />
                          </GroupHeader>
                        </div>
                        <GoldenGrid weights={knobWeights} name="knob row">
                          {#each p.knobs.knobs as knob, i (i)}
                            <KnobCell
                              label={knob.label}
                              code={knob.code}
                              value={knob.value}
                              unit={knob.unit}
                              fraction={knob.fraction}
                              unused={knob.unused}
                              shorten="ellipsis"
                              dial="phi"
                              tip="knobs.knob"
                              tipAction={p.tipAction}
                              onpress={() => p.onknobpress?.(i)}
                              onstep={(delta) => p.onstep?.(i, delta)}
                            />
                          {/each}
                        </GoldenGrid>
                      </GoldenBand>
                    </GoldenBand>
                  </GoldenSplit>
                </section>
              </GoldenSplit>
            </GoldenSplit>
          </GoldenBand>
        </GoldenBand>
      </GoldenBand>
    </GoldenBand>
  </div>
</div>

<style>
  /* The screen: the frame between fib-21 side margins and a fib-21 foot; the app bar on the top
     edge (the 20px the controls row grows by over the wireframe's 32 come from the top margin). */
  .screen {
    box-sizing: border-box;
    width: var(--screen-width);
    height: var(--screen-height);
    padding: 0 var(--fib-21) var(--fib-21);
    overflow: hidden;
    container-type: size;
    background: var(--g);
    color: var(--t);
    font-family: var(--font-sans);
  }

  .page {
    width: 100%;
    height: 100%;
  }

  /* Every leaf is a size container: the tokens below measure its content box (100cqw × 100cqh). */
  .leaf,
  .half {
    box-sizing: border-box;
    container-type: size;
  }

  /* The app bar fills its band, edge to edge across the frame. */
  .bar {
    --bar-height: 100cqh;
  }
  /* The helpers: outlined cells, each as wide as its words, a control-height tall. */
  .helpers {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    column-gap: var(--fib-5);
    height: var(--control-height);
  }

  /* The controls row (the mockup's top row, the transport gone to the Pads header): one outlined
     box `--golden-row-height` deep at the top of its band, a fib-3 in from its contents: the
     style line (it takes the room left), a hairline, One Touch. The rest of the band goes to the
     display (`--hero-lift`). The hero panel's sides run up through the gap to it (.hero::before),
     so the row and the panel read as one frame split by a hairline, as drawn. */
  .row {
    display: flex;
    box-sizing: border-box;
    height: var(--golden-row-height);
    padding: var(--fib-3) var(--fib-3) var(--fib-3) var(--fib-8);
    border: var(--line-width) solid var(--golden-rule);
    --type-text: var(--type-golden-row);
    --tracking-text: 0;
  }
  .one-touch {
    display: flex;
    flex: none;
    gap: var(--fib-8);
  }
  .rule {
    flex: none;
    width: var(--line-width);
    margin: 0 var(--fib-13);
    background: var(--golden-rule);
  }
  /* The style line between the hairlines: ‹ › the glyph alone in the style's hue (boxed on hover
     and focus), the name bold, a fib-13 either side of it. */
  .style {
    display: flex;
    flex: 1;
    min-width: 0;
  }
  .screen .style :global(.name) {
    padding: 0 var(--fib-13);
    font-weight: var(--weight-bold);
  }
  /* One Touch: its caption, a fib-21 before 1–4, each number a minor third wide of its height, bold. */
  .screen .one-touch :global(.label.cell) {
    width: auto;
    margin-right: calc(var(--fib-21) - var(--fib-8));
  }
  .screen .one-touch :global(.number.cell) {
    width: auto;
    aspect-ratio: var(--interval-minor-third);
    font-weight: var(--weight-bold);
  }

  /* The transport at the Pads header's right end: seven square icon keys a fib-2 apart, each
     `--golden-pad-key` (the header's 0.046, at most its height less the rule and a fib-2: 31.7 at
     1440, 28 at 1280, so the keys fit beside "Pads" and the five bank tabs), centred on the
     header's height; their icons half the key. */
  .screen .header :global(.end) {
    align-items: center;
    align-self: stretch;
  }
  .transport {
    display: flex;
    flex: none;
    gap: var(--fib-2);
    height: var(--golden-pad-key);
    --golden-pad-key: min(calc(100cqw * 0.046), calc(100cqh - var(--header-rule-width) - var(--fib-2)));
    --golden-key-width: var(--golden-pad-key);
    --golden-key-icon: calc(var(--golden-pad-key) / 2);
  }

  /* The keys fill theirs; the black keys are the keys' height over phi. */
  .keys {
    --keys-height: 100cqh;
    --keys-black-height: calc(100cqh / var(--interval-phi));
  }
  /* The status line in its label-height band. */
  .status {
    display: flex;
    align-items: center;
    overflow: hidden;
    --space-20: 100cqh;
  }

  /* The hero panel (the owner's mockup): the frame's lower part (no top line: the controls row's
     foot is it), its places fractions of its own box (100cqw × 100cqh, the --golden-hero-*
     tokens), so it scales with the screen. Three value columns split by hairlines that stop over
     the beat bar; the hero values bold, one size, centred in their columns, their capitals on one
     line; under each, one line on one baseline; no glows. */
  .hero {
    position: relative;
    border: var(--line-width) solid var(--golden-rule);
    border-top: 0;
    --golden-hero: calc(100cqh * var(--golden-hero-value-size));
  }
  /* The display takes the part of the controls band the row leaves (its control-height × phi less
     the row): it starts that much higher and is that much deeper, so the band under it keeps its
     place and size. */
  .screen .page .hero.leaf {
    --hero-lift: calc(var(--control-height) * var(--interval-phi) - var(--golden-row-height));
    flex: 0 0 calc(var(--golden-take) + var(--hero-lift));
    margin-top: calc(-1 * var(--hero-lift));
  }
  /* Its sides run on up through the gap to the controls row's foot (above the box, so no slot
     overflows). */
  .hero::before {
    position: absolute;
    bottom: 100%;
    right: calc(-1 * var(--line-width));
    left: calc(-1 * var(--line-width));
    height: var(--fib-13);
    border: solid var(--golden-rule);
    border-width: 0 var(--line-width);
    content: '';
    pointer-events: none;
  }
  .hero {
    --golden-hero: calc(100cqh * var(--golden-hero-value-size));
    --chord-glow: none;
    --section-glow-intro: none;
    --section-glow-main: none;
    --section-glow-ending: none;
    --section-glow-brk: none;
    --section-glow-fill: none;
  }
  .col {
    position: absolute;
    top: 0;
    box-sizing: border-box;
    height: calc(100cqh * var(--golden-hero-rule-foot));
  }
  .chord-col,
  .section-col {
    border-right: var(--line-width) solid var(--golden-rule);
  }
  .chord-col {
    left: 0;
    width: calc(100cqw * var(--golden-hero-col-1));
  }
  .section-col {
    left: calc(100cqw * var(--golden-hero-col-1));
    width: calc(100cqw * (var(--golden-hero-col-2) - var(--golden-hero-col-1)));
  }
  .tempo-col {
    right: 0;
    left: calc(100cqw * var(--golden-hero-col-2));
  }
  /* A hero value and the line under it: inset a fib-21 in their column, the value's box trimmed
     to its capitals and topped on the shared line. */
  .chord,
  .stand {
    position: absolute;
    top: calc(100cqh * var(--golden-hero-value-top));
    right: var(--fib-21);
    left: var(--fib-21);
  }
  .sub {
    position: absolute;
    right: var(--fib-21);
    left: var(--fib-21);
  }

  /* The chord: the hero size, centred, its long names stepping down from it. */
  .chord {
    --type-hero: var(--weight-bold) var(--golden-hero) / 1 var(--font-sans);
    --tracking-hero: var(--tracking-golden-hero);
    --hero-height: 1cap;
    --hero-4: calc(var(--golden-hero) * 0.75);
    --hero-5: calc(var(--golden-hero) * 0.62);
    --hero-6: calc(var(--golden-hero) * 0.5);
    --hero-8: calc(var(--golden-hero) * 0.4);
    --tracking-hero-4: var(--tracking-golden-hero);
    --tracking-hero-5: var(--tracking-golden-hero);
    --tracking-hero-6: var(--tracking-golden-hero);
    --tracking-hero-8: var(--tracking-golden-hero);
  }
  .screen .chord :global(.readout) {
    width: 100%;
  }
  /* Trimmed to its capitals; a descender (the j of Cmaj7) hangs below, clipped only across. */
  .screen .chord :global(.chord) {
    text-align: center;
    overflow-x: clip;
    overflow-y: visible;
    text-box: trim-both cap alphabetic;
  }
  /* Its notes, white and bold, and the fingering, muted, at the line's two ends. */
  .screen .chord :global(.line) {
    position: absolute;
    top: calc(100cqh * (var(--golden-hero-sub-foot) - var(--golden-hero-value-top)) - 1cap);
    right: 0;
    left: 0;
    flex-wrap: nowrap;
    justify-content: space-between;
    margin: 0;
    font: var(--type-golden-sub);
    white-space: nowrap;
  }
  .screen .chord :global(.line > *),
  .sub > * {
    text-box: trim-both cap alphabetic;
  }
  .screen .chord :global(.tones) {
    flex: none;
    font-weight: var(--weight-bold);
    color: var(--t);
  }
  /* A long fingering stays on the line: cut with an ellipsis (its full text in its tooltip), clipped
     only across, so its descenders still show. */
  .screen .chord :global(.fingering) {
    flex: 0 1 auto;
    min-width: 0;
    overflow-x: clip;
    overflow-y: visible;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Main B: the hero size times its measured fit (`sectionFit`), so a long name ("Ending III")
     takes the largest size that fits its column. */
  .stand {
    display: flex;
    justify-content: center;
  }
  .section-col .stand {
    --type-poster: var(--weight-bold) calc(var(--golden-hero) * var(--fit)) / 1 var(--font-sans);
    --tracking-poster: var(--tracking-golden-hero);
  }
  .stand > :global(*) {
    text-box: trim-both cap alphabetic;
  }

  /* The line under Main B: its words spread across the column, on the chord's notes' baseline. */
  .sub {
    top: calc(100cqh * var(--golden-hero-sub-foot) - 1cap);
    display: flex;
    justify-content: space-between;
    white-space: nowrap;
    font: var(--type-golden-sub);
    color: var(--caption-ink);
  }
  .next-name {
    font-weight: var(--weight-bold);
    color: var(--hue);
  }
  .when.sync {
    color: var(--ok);
  }

  /* The tempo: its reading (TempoReadout's) centred in the column, 104 at the hero size in the hue
     of time and BPM bold on its baseline, a fib-8 after it; under it − Tap + (− and + its steps),
     unboxed in the hue of time, spread across the column on their own line, each in a fib-55 ×
     control-height hit area that shows its box on hover and keyboard focus (as the style line's
     arrows). */
  .screen .hero .tempo-col :global(.tempo.cells),
  .screen .hero .tempo-col :global(.tempo .steps) {
    display: contents;
  }
  .screen .hero .tempo-col :global(.tempo .reading) {
    position: absolute;
    top: calc(100cqh * var(--golden-hero-value-top));
    right: var(--fib-21);
    left: var(--fib-21);
    justify-content: center;
  }
  .screen .hero .tempo-col :global(.tempo .bpm) {
    font: var(--weight-bold) calc(var(--golden-hero) * var(--tempo-fit)) / 1 var(--font-sans);
    letter-spacing: var(--tracking-golden-hero);
    color: var(--transport);
    text-box: trim-both cap alphabetic;
    overflow: visible;
  }
  .screen .hero .tempo-col :global(.tempo .unit) {
    font: var(--type-golden-unit);
    color: var(--transport);
  }
  .screen .hero .tempo-col :global(.tempo .step),
  .tap {
    position: absolute;
    top: calc(100cqh * var(--golden-hero-step-mid));
    display: grid;
    place-items: center;
    width: var(--fib-55);
    height: var(--control-height);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: none;
    box-shadow: none;
    color: var(--transport);
    cursor: pointer;
    translate: -50% -50%;
  }
  .screen .hero .tempo-col :global(.tempo .step) {
    font: var(--weight-bold) calc(100cqh * var(--golden-hero-step-glyph)) / 1 var(--font-sans);
  }
  .screen .hero .tempo-col :global(.tempo .step.minus) {
    left: calc(100% * var(--golden-hero-step-minus));
  }
  .screen .hero .tempo-col :global(.tempo .step.plus) {
    left: calc(100% * var(--golden-hero-step-plus));
  }
  .tap {
    left: calc(100% * var(--golden-hero-step-tap));
    font: var(--type-golden-sub);
    font-weight: var(--weight-bold);
  }
  .screen .hero .tempo-col :global(.tempo .step > span) {
    display: inline;
  }
  .screen .hero .tempo-col :global(.tempo .step)::before,
  .screen .hero .tempo-col :global(.tempo .step)::after {
    display: none;
  }
  .screen .hero .tempo-col :global(.tempo .step:hover),
  .screen .hero .tempo-col :global(.tempo .step:focus-visible),
  .tap:hover,
  .tap:focus-visible {
    box-shadow: inset 0 0 0 var(--outline-width) var(--transport);
  }
  .tap:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }

  /* The beat bar across the panel's foot, a fib-13 in at each side: one bar a beat, a fib-8
     apart, the current one the hue of time, the others its absent strength. */
  .beats {
    position: absolute;
    top: calc(100cqh * var(--golden-hero-beat-top));
    right: var(--fib-13);
    left: var(--fib-13);
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    column-gap: var(--fib-8);
  }
  .bar {
    display: block;
    height: calc(100cqh * var(--golden-hero-beat-depth));
    background: var(--absent-transport);
  }
  .beat.now .bar {
    background: var(--transport);
  }

  /* The band's halves: a fib-21 gutter between them, half on each side of the cut. */
  .half {
    --golden-inset: 0px;
  }
  .screen .half.left {
    padding-right: calc(var(--fib-21) / 2);
  }
  .screen .half.right {
    padding-left: calc(var(--fib-21) / 2);
  }

  /* The headers: the group's width. */
  .header {
    display: flex;
  }
  .header > :global(*) {
    flex: 1;
    min-width: 0;
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

  /* A strip's foot: its lamp (or the page button) filling the strip's lamp band; the last part
     lamp stops a fib-13 sub-cut short, so a function never reads as a part's state. */
  .foot {
    display: grid;
    height: 100%;
  }
  .foot > :global(*) {
    width: 100%;
    min-width: 0;
  }
  .foot.cut {
    width: calc(100% - var(--fib-13));
  }

  /* A pad fills its cell, less the pads' gap. */
  .screen .pad {
    padding: calc(var(--pad-gap) / 2);
    --pad-width: 100cqw;
    --pad-height: 100cqh;
  }
</style>
