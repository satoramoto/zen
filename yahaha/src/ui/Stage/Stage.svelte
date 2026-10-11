<!--
  Stage: the Stage page at 1440 × 900. A thin layout of components: the app bar, the section row
  (the transport at its left, the helpers at its right), the display (with Tempo − / + and Style
  tempo on its tempo line), the hardware band (faders; knobs above pads), the status line in the
  gap above the keys, and the keys. Each region takes its data as one object; callbacks pass
  through.

  Every region sits on the layout grid (tokens/grid.css: 15 columns, an 18px gutter, the 24px
  margins, a 6px rhythm). It changes no component: it sets the
  regions' size tokens for the screen's subtree. Rows, in rhythm units from the top: margin 4, app
  bar 6, gap 2, section row 4, gap 2, display 48, gap 4, band 62, status line 4, keys 10, margin 4
  (150 units, 900px). The display's thirds sit on columns 1-5, 6-10 and 11-15 with a shared top
  line; the band splits 3/5 (faders, one strip per column) to 2/5 (knobs over pads). `overlay`
  draws the columns and the rhythm over it. `layout="golden"` renders StageGolden instead (the
  same props, laid out by the Golden primitives); there `overlay` draws the Golden cuts.

  `page`: a display page (Channel, Effects, …) in the display's box, in place of the Display. The
  app bar, section row, band, status line and keys stay as they are; the box never grows or
  shrinks the band. The box's size is `--page-width` × `--page-height` (1392 × 288 on the grid),
  set on the box for the page to lay out against. The grid layout only.
-->
<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte'
  import type { Action } from 'svelte/action'
  import AppBar from '../AppBar/AppBar.svelte'
  import Display from '../Display/Display.svelte'
  import FaderBank from '../FaderBank/FaderBank.svelte'
  import Keys from '../Keys/Keys.svelte'
  import KnobBank from '../KnobBank/KnobBank.svelte'
  import PadBank from '../PadBank/PadBank.svelte'
  import SectionRow from '../SectionRow/SectionRow.svelte'
  import StageGolden from '../StageGolden/StageGolden.svelte'
  import StatusLine from '../StatusLine/StatusLine.svelte'
  import type TransportColumn from '../TransportColumn/TransportColumn.svelte'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Any = Component<any>
  /** A region's data: its props without `tipAction` and the `on…` callbacks (a data prop such as `oneTouch` stays). */
  type DataOf<P> = {
    [K in keyof P as K extends 'tipAction'
      ? never
      : K extends `on${string}`
        ? NonNullable<P[K]> extends (...args: never[]) => unknown
          ? never
          : K
        : K]: P[K]
  }
  type Data<C extends Any> = DataOf<ComponentProps<C>>
  type On<C extends Any, K extends keyof ComponentProps<C>> = Pick<ComponentProps<C>, K>

  type Props = {
    /** `grid`: the 15-column grid (this file). `golden`: the golden-section proposal (StageGolden, a tree of the Golden layout primitives), a Storybook-only mock for now. */
    layout?: 'grid' | 'golden'
    /** A design aid. In the grid layout, draws the 15 columns and the rhythm lines over the screen, to check the alignment; in the golden layout, wraps the screen in a GoldenOverlay that draws its cuts, insets and spiral and checks them. */
    overlay?: boolean
    /** The app bar: pages, Launchkey, audio health. */
    appBar: Data<typeof AppBar>
    /** The section row: the transport (running, Accomp, Sync Start, fading) and the helpers. */
    sectionRow: Data<typeof SectionRow>
    /** The display, in thirds: the style line and chord, the section and tempo, the parts and One Touch. */
    display: Data<typeof Display>
    /** A display page shown in the display's box instead of the Display (its size: `--page-width`, `--page-height`). */
    page?: Snippet
    /** The band's faders: strips, page and layer tabs, lamps. */
    faders: Data<typeof FaderBank>
    /** The band's knobs and their page tabs. */
    knobs: Data<typeof KnobBank>
    /** The band's pads and their bank tabs. */
    pads: Data<typeof PadBank>
    /** Deprecated: the transport column left the Stage. Its `running` and `fading` still feed the section row when `sectionRow` doesn't set them. */
    transport?: Data<typeof TransportColumn>
    /** The status line above the keys (empty when `text` is null). */
    status: Data<typeof StatusLine>
    /** The keys: range, split, held notes. */
    keys: ComponentProps<typeof Keys>
    /** The app's tooltip action (`use:tip`), passed to every region. */
    tipAction?: Action<HTMLElement, string>
    /** A knob was clicked (KnobBank `onpress`). */
    onknobpress?: ComponentProps<typeof KnobBank>['onpress']
    /** A knob page tab was chosen (KnobBank `onpage`, with its index). */
    onknobpage?: ComponentProps<typeof KnobBank>['onpage']
    /** A pad was pressed (PadBank `onpress`). */
    onpadpress?: ComponentProps<typeof PadBank>['onpress']
    /** A pad bank tab was chosen (PadBank `onbank`, with its index). */
    onpadbank?: ComponentProps<typeof PadBank>['onbank']
  } & On<typeof AppBar, 'onchoose' | 'onhealth'> &
    On<
      typeof SectionRow,
      | 'onstartstop'
      | 'onaccomp'
      | 'onsyncstart'
      | 'onreset'
      | 'onfillup'
      | 'onfilldown'
      | 'onfade'
      | 'onmetronome'
      | 'onmetronomesettings'
      | 'onunison'
      | 'onpanic'
      | 'onhelp'
    > &
    On<
      typeof Display,
      | 'onprev'
      | 'onnext'
      | 'onbrowse'
      | 'ononetouch'
      | 'onsound'
      | 'ontempoup'
      | 'ontempodown'
      | 'onstyletempo'
      | 'ontempo'
    > & {
      /** Tap pressed (the golden Stage's hero Tap key: tap tempo). The grid Stage has no Tap key. */
      ontaptempo?: () => void
      /** Deprecated: the band sends left the display (Effects has them); accepted, unused. */
      onsends?: () => void
      /** Deprecated: the rack left the display (Library › Racks, the fader layers); accepted, unused. */
      onrack?: () => void
      /** Deprecated: a part's tag left the display (its fader strip's name opens Channel); accepted, unused. */
      onpart?: (id: 'right1' | 'right2' | 'right3' | 'left') => void
    } &
    On<
      typeof FaderBank,
      | 'onchoosePage'
      | 'onchooseLayer'
      | 'onlevel'
      | 'onopen'
      | 'onlamp'
      | 'onlamplong'
      | 'onlamprelease'
      | 'onpagebutton'
      | 'onpagelong'
      | 'onpagerelease'
    > &
    On<typeof KnobBank, 'onpageup' | 'onpagedown' | 'onstep'> &
    On<typeof PadBank, 'onbankup' | 'onbankdown'> &
    /** Deprecated: Stop and its hold left with the transport column; accepted, unused. */
    On<typeof TransportColumn, 'onstop' | 'onstoplong'> &
    On<typeof StatusLine, 'onclear'>

  let p: Props = $props()

  const running = $derived(p.sectionRow.running ?? p.transport?.running)
  const fading = $derived(p.sectionRow.fading ?? p.transport?.fading)
  /** One entry per overlay column; the count is the grid's (tokens/grid.css). */
  const COLUMNS = Array.from({ length: 15 }, (_, i) => i)
</script>

{#if p.layout === 'golden'}
  <StageGolden {...p} {running} {fading} />
{:else}
<div class="screen grid">
  <AppBar {...p.appBar} tipAction={p.tipAction} onchoose={p.onchoose} onhealth={p.onhealth} />
  <div class="row">
    <SectionRow
      {...p.sectionRow}
      {running}
      {fading}
      tipAction={p.tipAction}
      onstartstop={p.onstartstop}
      onaccomp={p.onaccomp}
      onsyncstart={p.onsyncstart}
      onreset={p.onreset}
      onfillup={p.onfillup}
      onfilldown={p.onfilldown}
      onfade={p.onfade}
      onmetronome={p.onmetronome}
      onmetronomesettings={p.onmetronomesettings}
      onunison={p.onunison}
      onpanic={p.onpanic}
      onhelp={p.onhelp}
    />
  </div>
  {#if p.page}
    <div class="display page" data-slot="page">{@render p.page()}</div>
  {:else}
  <div class="display">
    <Display
      {...p.display}
      tipAction={p.tipAction}
      onprev={p.onprev}
      onnext={p.onnext}
      onbrowse={p.onbrowse}
      ononetouch={p.ononetouch}
      onsound={p.onsound}
      ontempoup={p.ontempoup}
      ontempodown={p.ontempodown}
      onstyletempo={p.onstyletempo}
      ontempo={p.ontempo}
    />
  </div>
  {/if}
  <div class="band">
    <FaderBank
      {...p.faders}
      tipAction={p.tipAction}
      onchoosePage={p.onchoosePage}
      onchooseLayer={p.onchooseLayer}
      onlevel={p.onlevel}
      onopen={p.onopen}
      onlamp={p.onlamp}
      onlamplong={p.onlamplong}
      onlamprelease={p.onlamprelease}
      onpagebutton={p.onpagebutton}
      onpagelong={p.onpagelong}
      onpagerelease={p.onpagerelease}
    />
    <div class="middle">
      <KnobBank {...p.knobs} tipAction={p.tipAction} onpage={p.onknobpage} onpress={p.onknobpress} onstep={p.onstep} />
      <div class="pads">
        <PadBank {...p.pads} tipAction={p.tipAction} onbank={p.onpadbank} onpress={p.onpadpress} />
      </div>
    </div>
  </div>
  <div class="status">
    <StatusLine {...p.status} tipAction={p.tipAction} onclear={p.onclear} />
  </div>
  <Keys {...p.keys} />
  {#if p.overlay}
    <div class="overlay" aria-hidden="true">
      {#each COLUMNS as i (i)}<span class="column"></span>{/each}
    </div>
  {/if}
</div>
{/if}

<style>
  .screen {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: var(--screen-width);
    height: var(--screen-height);
    padding: var(--screen-pad);
    overflow: hidden;
    /* The ground, unless a backdrop (Blooms) sits behind the screen: then transparent. */
    background: var(--backdrop-ground);
    color: var(--t);
    font-family: var(--font-sans);
  }
  .row,
  .display,
  .band {
    display: flex;
    flex: none;
  }
  .row {
    margin-top: var(--stage-gap-row);
  }
  .display {
    margin-top: var(--stage-gap-display);
  }
  /* The page slot: the Display's box, exactly; the page lays out against its size. */
  .page {
    --page-width: var(--stage-row-width);
    --page-height: var(--display-height);
    position: relative;
    flex-direction: column;
    box-sizing: border-box;
    width: var(--page-width);
    height: var(--page-height);
    overflow: hidden;
  }
  .band {
    gap: var(--band-gap);
    height: var(--band-height);
    margin-top: var(--stage-gap-band);
  }
  .middle {
    display: flex;
    flex: none;
    flex-direction: column;
  }
  .pads {
    display: flex;
    margin-top: var(--band-pads-gap);
  }
  /* The board's status line is a plain flex item between the band and the keys. */
  .status {
    display: contents;
  }

  /* The grid layout: the regions' size tokens, set for this subtree only, from tokens/grid.css. */
  .screen.grid {
    --screen-pad: var(--grid-margin);
    /* Rows on the rhythm (see the comment at the top). */
    --stage-gap-row: calc(2 * var(--grid-unit));
    --stage-gap-display: calc(2 * var(--grid-unit));
    --stage-gap-band: calc(4 * var(--grid-unit));
    --display-height: calc(48 * var(--grid-unit));
    --band-height: calc(62 * var(--grid-unit));
    --keys-height: calc(10 * var(--grid-unit));
    /* The display: no padding or border, so its thirds are columns 1-5, 6-10 and 11-15, and the
       beat bar spans 1-15. The thirds share one top line (the style line, the section, the first
       part row), a rhythm line from the display's top; the beat bar is its last line. */
    --display-border-width: 0px;
    --display-pad-left: 0px;
    --display-pad-top: calc(6 * var(--grid-unit));
    --display-pad-bottom: calc(2 * var(--grid-unit));
    --display-thirds-gap: var(--grid-gutter);
    --display-thirds-align: start;
    --display-song-top: 0px;
    /* The chord and the tempo share a baseline and a bottom line: 5 units under the style line, 4
       under the "then …" line. */
    --display-chord-gap: calc(5 * var(--grid-unit));
    --now-tempo-gap: calc(4 * var(--grid-unit));
    /* The band: faders on columns 1-9 (3/5, one strip per column), knobs and pads on 10-15 (2/5). */
    --band-gap: var(--grid-gutter);
    --band-faders-width: var(--grid-span-9);
    --band-middle-width: var(--grid-span-6);
    --band-strip-gap: var(--grid-gutter);
    /* Eight square pads across the two fifths: 63px. */
    --pad-size: calc((var(--grid-span-6) - 7 * var(--pad-gap)) / 8);
    position: relative;
  }
  /* The status line, centred in its 4-unit row above the keys. */
  .grid .status {
    display: flex;
    flex: none;
    align-items: center;
    height: calc(4 * var(--grid-unit));
  }

  /* The overlay: the columns as faint bands inside the margins, the rhythm as hairlines across the
     screen, every fourth one stronger. Never takes a pointer. */
  .overlay {
    position: absolute;
    inset: 0 var(--grid-margin);
    display: grid;
    grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
    column-gap: var(--grid-gutter);
    background:
      repeating-linear-gradient(
        to bottom,
        var(--grid-overlay-line-major) 0 var(--line-width),
        transparent var(--line-width) calc(4 * var(--grid-unit))
      ),
      repeating-linear-gradient(
        to bottom,
        var(--grid-overlay-line) 0 var(--line-width),
        transparent var(--line-width) var(--grid-unit)
      );
    pointer-events: none;
  }
  .column {
    background: var(--grid-overlay-column);
  }
</style>
