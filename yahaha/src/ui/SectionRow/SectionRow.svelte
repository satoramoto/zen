<!--
  SectionRow: the toolbar between the app bar and the display (`groups` can draw one group alone,
  and `orientation` vertical makes it a list: the golden Stage's transport block). The transport at the left, in this
  order: Start / Stop (first; the same control as pad 16), Accomp, Sync Start, Reset, Fill ▲,
  Fill ▼ and Fade. The helpers at the right: Metronome joined with its ▾ settings caret, Unison,
  Panic and help mode's ?. With `cells` there is no wrapper: each control is a top-level element
  for its parent's grid to place, one a cell, drawn as outlined faces (see the `cells` prop). The count (bar, beat, sections) lives on the display, not here. Every
  switch is controlled: a press only calls back.

  The controls are in the display's language, at `--tab-block` with no boxes: each switch a dot and a word (the dot filled in the switch's hue
  when on, a hollow muted ring when off; the size of the display's part dots),
  actions plain words, and Start / Stop "● Playing" in the running hue or "○ Stopped". Words
  brighten on hover; names, pressed state, tooltips and the metronome's ▾ stay as they are.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** Which groups to draw: both (the section row), the transport alone, or the helpers alone (the golden Stage puts the transport on the display and the helpers in the app bar). */
    groups?: 'all' | 'transport' | 'helpers'
    /** `horizontal`: one row, the screen wide with `groups` all. `vertical`: a list, one control a line (Fill ▲ and Fill ▼ share one), as wide as its words. */
    orientation?: 'horizontal' | 'vertical'
    /**
     * Cells: no wrapper, and the faces are the state language (square, off a 1px outline and the
     * word in the hue, on solid in the hue with --on-ink, armed a 2px ring that pulses once a beat;
     * no dots). Each control is one top-level element, in order: the transport's seven keys, all in
     * the hue of time (`--transport`, cyan), each a glyph over its word on one shared baseline, the
     * glyph showing the state: Start / Stop (▶ outlined while stopped, ■ solid while playing; its
     * legend the action, as on the pads), Sync Start (a bar before ▶: wait, then play; armed while
     * on), Accomp (a chord stack), Fill Up (▲) and Fill Down (▼), each its own key and word (armed
     * while its fill is queued, `fillQueued`), Fade (◢ fade in while stopped, ◣ fade out while
     * playing; solid while fading, its wedge draining with `fadeProgress`; armed while a fade-in
     * waits for Start), Reset (⟲, set apart by `--reset-gap`, a fib-13 unless the parent sets it),
     * grouped by job, [Start / Stop · Sync Start] [Accomp] [Fill Up · Fill Down · Fade] [Reset]: a
     * fib-8 between the keys of a group, a fib-13 between groups. Each fills its parent's cell. The
     * helpers: Metronome with its ▾ (one group, two halves) in the hue of time, Unison and ? in the
     * lamp's lime, then Panic in the warning hue, set apart, each sized to its words and the
     * parent's height (for a max-content column grid). `groups` still picks which; `orientation` is
     * unused. The parent supplies the toolbar role and its name.
     */
    cells?: boolean
    /** Cells: the current beat (1 … the bar's beats; 0 or unset when stopped). An armed key pulses once on each. */
    beat?: number
    /** Cells: the tempo, for the length of a pulse (and the pulse rate while stopped, when no beat comes). */
    bpm?: number
    /** Cells: a fill is queued, up or down: that Fill key is armed (outlined, pulsing on the beat). */
    fillQueued?: 'up' | 'down'
    /**
     * Cells: a queued Fill keeps the plain off face (the outline), its queue told only in its
     * spoken name (a fill is never latched, so there is no on state to show; the golden Stage,
     * designer pass). Off (the default): the queued Fill is armed.
     */
    plainQueue?: boolean
    /**
     * Cells: the six keys after Start / Stop (Sync Start, Accomp, Fill Up, Fill Down, Fade, Reset)
     * one width, a fib-8 between each (no wider gaps between groups, no gutter before Reset), laid
     * over the cells after Start / Stop, which keeps its key; every glyph a 21px square standing on
     * the band's foot. The parent says how many units Reset's cell is (`--reset-units`, 1 unless
     * set; every other cell after Start / Stop is one unit). Off (the default): each key in its own
     * cell less the groups' gaps.
     */
    evenKeys?: boolean
    /**
     * Cells: Start / Stop's legend says what the band is doing, "Playing" or "Stopped" (its glyph,
     * fill and size unchanged; the golden Stage, designer pass). Off (the default): the legend is
     * the action, "Start / Stop".
     */
    stateLegend?: boolean
    /**
     * Cells: a fib-8 between every two transport keys (no wider gap between groups), Fade's right
     * side included, so keys in equal cells are one width; Reset keeps its `--reset-gap` (the
     * golden Stage on the owner's wireframe). Off (the default): a fib-13 between groups.
     */
    evenGaps?: boolean
    /**
     * Cells: each transport key an icon alone, its words in its name and tooltip (the golden Stage,
     * the owner's mockup): ▶ Start / Stop (the key solid while playing), Sync Start (loop arrows),
     * Accomp (a beamed note), Fill ▲, Fill ▼, Fade (falling bars), Reset (⟲). The faces, names and
     * pulses are the cells' own; the parent sizes the keys (`--golden-key-width`, its row's
     * height) and lays them out in a row. A fade's drain is a bar along the foot of Fade. Off (the
     * default): a glyph over each word, in the parent's cells.
     */
    iconKeys?: boolean
    /** Cells: how far the fade has gone, 0 to 1, while `fading` and running: Fade's wedge drains by as much. */
    fadeProgress?: number
    /** Cells: the fade under way (or waiting for Start) is a fade-in: Fade shows ◢ while fading even as the band plays. */
    fadeIn?: boolean
    /** The style is running: Start / Stop is solid (green; in `cells`, the transport hue) and aria-pressed. */
    running?: boolean
    /** Accompaniment (ACMP) on. */
    accomp?: boolean
    /** Sync Start armed: the style starts with the first chord. */
    syncStart?: boolean
    /** A fade in or out is under way: Fade is lit. */
    fading?: boolean
    /** The metronome on. */
    metronome?: boolean
    /** The metronome's settings popover is open (the caret's ▾ turns `--t`). */
    metronomeOpen?: boolean
    /** The id of the metronome's settings popover, for `aria-controls`. */
    metronomeControls?: string
    /** Unison on. */
    unison?: boolean
    /** Help mode on: the ? is lit. */
    help?: boolean
    /** The app's tooltip action (`use:tip`), applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called when Start / Stop is pressed. */
    onstartstop?: () => void
    /** Called with the state asked for when Accomp is pressed. */
    onaccomp?: (on: boolean) => void
    /** Called with the state asked for when Sync Start is pressed. */
    onsyncstart?: (on: boolean) => void
    /** Called when Reset is pressed (restart the section from its first bar). */
    onreset?: () => void
    /** Called when Fill ▲ is pressed. */
    onfillup?: () => void
    /** Called when Fill ▼ is pressed. */
    onfilldown?: () => void
    /** Called when Fade is pressed. */
    onfade?: () => void
    /** Called with the state asked for when Metronome is pressed. */
    onmetronome?: (on: boolean) => void
    /** Called when the metronome's ▾ caret is pressed (opens or closes its settings). */
    onmetronomesettings?: () => void
    /** Called with the state asked for when Unison is pressed. */
    onunison?: (on: boolean) => void
    /** Called when Panic is pressed (all notes off). */
    onpanic?: () => void
    /** Called with the state asked for when ? is pressed. */
    onhelp?: (on: boolean) => void
  }

  let {
    groups = 'all',
    orientation = 'horizontal',
    cells = false,
    beat = 0,
    bpm = 120,
    fillQueued,
    plainQueue = false,
    evenKeys = false,
    stateLegend = false,
    evenGaps = false,
    iconKeys = false,
    fadeProgress,
    fadeIn = false,
    running = false,
    accomp = false,
    syncStart = false,
    fading = false,
    metronome = false,
    metronomeOpen = false,
    metronomeControls,
    unison = false,
    help = false,
    tipAction,
    onstartstop,
    onaccomp,
    onsyncstart,
    onreset,
    onfillup,
    onfilldown,
    onfade,
    onmetronome,
    onmetronomesettings,
    onunison,
    onpanic,
    onhelp,
  }: Props = $props()

  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }

  /**
   * A transport key's glyph, one a key, showing its state: ▶ or ■ (Start / Stop), a bar before ▶
   * (Sync Start), a chord stack (Accomp), ▲ ▼ (the Fills), ◢ fade in or ◣ fade out (Fade), ⟲ (Reset).
   */
  type Shape = 'play' | 'stop' | 'sync' | 'chord' | 'up' | 'down' | 'fade-in' | 'fade-out' | 'reset'
  /** A key's face: off (the outline), on (solid), armed (a 2px ring that pulses on the beat). */
  type Face = 'off' | 'on' | 'armed'
  /** The gap a key leaves to its neighbour: none (the row's end), in a group (fib-8), between groups (fib-13). */
  type Gap = 0 | 'in' | 'between'

  const gapOf = (gap: Gap) => (gap === 0 ? '0px' : `calc(var(--fib-${gap === 'in' || evenGaps ? 8 : 13}) / 2)`)
  /** Restarts the pulse on every beat (two identical animations, alternating); free-running while stopped. */
  const pulse = $derived(beat > 0 ? (beat % 2 ? 'a' : 'b') : 'free')
  const syncFace: Face = $derived(syncStart ? 'armed' : 'off')
  /** A Fill's face: armed while its fill is queued, unless `plainQueue`. */
  const fillFace = (dir: 'up' | 'down'): Face => (fillQueued === dir && !plainQueue ? 'armed' : 'off')
  /** With `evenKeys`: a glyph wider than its 21px square fits it, standing on its foot. */
  const fit = $derived(evenKeys ? 'xMidYMax meet' : undefined)
  /** With `evenKeys`: each key's place after Start / Stop (0 … 5). */
  const SLOTS: Record<string, number> = { sync: 0, accomp: 1, 'fill-up': 2, 'fill-down': 3, fade: 4, reset: 5 }
  /** Fade: armed while a fade-in waits for Start, solid while fading. */
  const fadeFace: Face = $derived(fading ? (running ? 'on' : 'armed') : 'off')
  /** Fade's direction: out (◣) while playing, in (◢) while stopped or while a fade-in runs. */
  const fadeOut = $derived(running && !(fading && fadeIn))
  /** How much of Fade's wedge is left, 1 when nothing drains: it drains from the left, as time runs. */
  const fadeLeft = $derived(fading && running && fadeProgress !== undefined ? 1 - Math.min(1, Math.max(0, fadeProgress)) : 1)
  /** The wedge's filled part, its right `left` of it, in the glyph's 21 × 21 box. */
  function wedge(out: boolean, left: number): string {
    const s = 21 * (1 - left)
    return out ? `M${s} ${s}L21 21H${s}Z` : `M${s} 21H21V0L${s} ${21 - s}Z`
  }

  const transport = $derived(groups !== 'helpers')
  const helpers = $derived(groups !== 'transport')
  const vertical = $derived(orientation === 'vertical')
  const toolbarName = $derived(
    groups === 'transport' ? 'Transport' : groups === 'helpers' ? 'Helpers' : 'Transport, switches and helpers',
  )
</script>

{#snippet dotSwitch(
  label: string,
  on: boolean,
  tip: string,
  press: () => void,
  name: string | undefined = undefined,
  hue: 'neutral' | 'ok' = 'neutral',
)}
  <button
    type="button"
    class="word switch"
    class:on
    style:--hue="var(--{hue})"
    aria-pressed={on}
    aria-label={name}
    data-tip={tip}
    use:tipOn={tip}
    onclick={press}><span class="dot" aria-hidden="true"></span>{label}</button
  >
{/snippet}

{#snippet action(label: string, glyph: string, name: string, tip: string, press: (() => void) | undefined)}
  <button type="button" class="word" aria-label={name} data-tip={tip} use:tipOn={tip} onclick={() => press?.()}
    >{label}{#if glyph}<span class="glyph" aria-hidden="true">{glyph}</span>{/if}</button
  >
{/snippet}

{#snippet startStop()}
  {@render dotSwitch(
    running ? 'Playing' : 'Stopped',
    running,
    'transport.start_stop',
    () => onstartstop?.(),
    `${running ? 'Playing' : 'Stopped'}: Start / Stop (Play). The same control as pad 16`,
    'ok',
  )}
{/snippet}

{#snippet fills()}
  {@render action(
    'Fill',
    '▲',
    'Fill Up: a fill, then the next Main up (at Main D, its own fill)',
    'transport.fill_up',
    onfillup,
  )}
  {@render action(
    'Fill',
    '▼',
    'Fill Down: a fill, then the next Main down (at Main A, its own fill)',
    'transport.fill_down',
    onfilldown,
  )}
{/snippet}

{#snippet metronomeWords()}
  {@render dotSwitch('Metronome', metronome, 'metronome.on', () => onmetronome?.(!metronome))}
  <button
    type="button"
    class="word caret"
    class:open={metronomeOpen}
    aria-haspopup="dialog"
    aria-expanded={metronomeOpen}
    aria-controls={metronomeControls}
    aria-label="Metronome settings: on/off, volume, bell on beat 1"
    data-tip="metronome.settings"
    use:tipOn={'metronome.settings'}
    onclick={() => onmetronomesettings?.()}><span class="glyph" aria-hidden="true">▾</span></button
  >
{/snippet}

{#snippet otherHelpers()}
  {@render dotSwitch('Unison', unison, 'transport.unison', () => onunison?.(!unison))}
  {@render action('Panic', '', 'Panic: all notes off', 'transport.panic', onpanic)}
  {@render dotSwitch(
    '?',
    help,
    'app.help',
    () => onhelp?.(!help),
    'Help mode: point at any control to learn what it does',
  )}
{/snippet}

{#snippet face(
  label: string,
  glyph: string,
  on: boolean | undefined,
  tip: string,
  press: () => void,
  name: string | undefined,
  hue: 'transport' | 'lamp' | 'warn',
  kind: string,
)}
  <!-- A cells face in the state language: off a 1px inset outline and the word in the hue, on
       solid in the hue with --on-ink (the lamp's lime: --lamp with --lamp-ink). A switch (`on` set)
       carries aria-pressed; an action doesn't. -->
  <button
    type="button"
    class="face {kind}"
    data-face={on ? 'on' : 'off'}
    data-hue={hue}
    style:--hue={hue === 'lamp' ? 'var(--lamp-line)' : `var(--${hue})`}
    aria-pressed={on}
    aria-label={name}
    data-tip={tip}
    use:tipOn={tip}
    onclick={press}>{label}{#if glyph}<span class="glyph" aria-hidden="true">{glyph}</span>{/if}</button
  >
{/snippet}

{#snippet mark(shape: Shape)}
  <!-- One transport glyph, drawn (not a font's character) so every glyph has the one height of the
       glyph band and one stroke: the solid shapes fill their band's height; ⟲'s ring is a fib-3
       stroke. Fade's wedge is a fine outline with its fill drained from the right (`fadeLeft`). -->
  {#if shape === 'play'}
    <svg class="mark" viewBox="0 0 18 21" aria-hidden="true"><path d="M0 0 18 10.5 0 21Z" /></svg>
  {:else if shape === 'stop'}
    <svg class="mark" viewBox="0 0 21 21" aria-hidden="true"><path d="M0 0H21V21H0Z" /></svg>
  {:else if shape === 'sync'}
    <svg class="mark" viewBox="0 0 23 21" preserveAspectRatio={fit} aria-hidden="true"><path d="M0 0H4V21H0Z" /><path d="M7 0 23 10.5 7 21Z" /></svg>
  {:else if shape === 'chord'}
    <!-- Three noteheads stacked on one stem: a chord. -->
    <svg class="mark" viewBox="0 0 14 21" aria-hidden="true"
      >{#each [3.5, 10.5, 17.5] as cy (cy)}<ellipse cx="5" {cy} rx="4.5" ry="2.7" transform="rotate(-20 5 {cy})" />{/each}<path
        d="M9.2 0H11.2V17H9.2Z"
      /></svg
    >
  {:else if shape === 'up'}
    <svg class="mark" viewBox="0 0 24 21" preserveAspectRatio={fit} aria-hidden="true"><path d="M12 0 24 21H0Z" /></svg>
  {:else if shape === 'down'}
    <svg class="mark" viewBox="0 0 24 21" preserveAspectRatio={fit} aria-hidden="true"><path d="M0 0H24L12 21Z" /></svg>
  {:else if shape === 'fade-in' || shape === 'fade-out'}
    {@const out = shape === 'fade-out'}
    <svg class="mark" viewBox="0 0 21 21" aria-hidden="true" data-drain={fadeLeft < 1 ? fadeLeft.toFixed(2) : undefined}
      ><path class="edge" d={out ? 'M0.75 0.75 20.25 20.25H0.75Z' : 'M20.25 0.75V20.25H0.75Z'} /><path
        d={wedge(out, fadeLeft)}
      /></svg
    >
  {:else if shape === 'reset'}
    <svg class="mark" viewBox="0 0 21 21" aria-hidden="true"
      ><path class="ring" d="M10.5 4.5A7.5 7.5 0 1 1 4 8.25" /><path d="M4.5 4.5 11 0V9Z" /></svg
    >
  {/if}
{/snippet}

{#snippet icon(kind: string)}
  <!-- `iconKeys`: one icon a key in a 24 × 24 box, in the key's ink: ▶, loop arrows, a beamed
       note, ▲, ▼, falling bars, ⟲. -->
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" data-icon={kind}>
    {#if kind === 'start'}
      <path class="solid" d="M5 2 22 12 5 22Z" />
    {:else if kind === 'sync'}
      <path d="M3 11V9a3 3 0 0 1 3-3h13" /><path d="M16 2.5 19.5 6 16 9.5" /><path d="M21 13v2a3 3 0 0 1-3 3H5" /><path
        d="M8 14.5 4.5 18 8 21.5"
      />
    {:else if kind === 'accomp'}
      <path d="M8.5 18V5l12-2.5V16" /><circle class="solid" cx="5.5" cy="18" r="3" /><circle class="solid" cx="17.5" cy="16" r="3" />
    {:else if kind === 'fill-up'}
      <path class="solid" d="M12 3 22 20H2Z" />
    {:else if kind === 'fill-down'}
      <path class="solid" d="M2 4H22L12 21Z" />
    {:else if kind === 'fade'}
      {#each [0, 1, 2, 3, 4] as i (i)}<rect class="solid" x={1 + i * 4.6} y={3 + i * 3.6} width="2.8" height={18 - i * 3.6} />{/each}
    {:else if kind === 'reset'}
      <path d="M5.6 7.5A8 8 0 1 0 12 4" /><path class="solid" d="M3 2.5 9.5 3.5 4.5 9Z" />
    {/if}
  </svg>
{/snippet}

{#snippet key(
  label: string,
  shape: Shape,
  face: Face,
  pressed: boolean | undefined,
  tip: string,
  press: () => void,
  name: string | undefined,
  kind: string,
  gaps: [Gap, Gap],
)}
  <!-- A transport key: its glyph over its word, on the row's one baseline, in the hue of time, in
       the state language; armed pulses once a beat. -->
  {@const slot = evenKeys && !iconKeys ? SLOTS[kind] : undefined}
  {@const drain = iconKeys && kind === 'fade' && fadeLeft < 1 ? fadeLeft.toFixed(2) : undefined}
  <button
    type="button"
    class="face key {kind}"
    class:icon={iconKeys}
    class:even={slot !== undefined}
    class:boxed={evenKeys && !iconKeys}
    data-drain={drain}
    style:--drain={drain}
    style:--slot={slot}
    data-face={face}
    data-pulse={face === 'armed' ? pulse : undefined}
    style:--hue="var(--transport)"
    style:--bpm={bpm}
    style:--gap-l={gapOf(gaps[0])}
    style:--gap-r={gapOf(gaps[1])}
    aria-pressed={pressed}
    aria-label={name}
    data-tip={tip}
    use:tipOn={tip}
    onclick={press}
    >{#if iconKeys}{@render icon(kind)}{:else}<span class="stack"><span class="band">{@render mark(shape)}</span><span class="key-word">{label}</span></span
      >{/if}</button
  >
{/snippet}

{#if cells}
  <!-- Cells: each control a top-level element, one a cell; the parent is the toolbar. -->
  {#if transport}
    <!-- Grouped by job: [Start / Stop · Sync Start] [Accomp] [Fill Up · Fill Down · Fade] [Reset].
         The legend names the action, as on the pads; the glyph and the fill show the state. -->
    {@render key(
      stateLegend ? (running ? 'Playing' : 'Stopped') : 'Start / Stop',
      running ? 'stop' : 'play',
      running ? 'on' : 'off',
      running,
      'transport.start_stop',
      () => onstartstop?.(),
      `${running ? 'Playing' : 'Stopped'}: Start / Stop (Play). The same control as pad 16`,
      'start',
      [0, 'in'],
    )}
    {@render key(
      'Sync Start',
      'sync',
      syncFace,
      syncStart,
      'transport.sync_start',
      () => onsyncstart?.(!syncStart),
      syncStart ? 'Sync Start, armed: the style starts with your first chord' : 'Sync Start',
      'sync',
      ['in', 'between'],
    )}
    {@render key('Accomp', 'chord', accomp ? 'on' : 'off', accomp, 'transport.acmp', () => onaccomp?.(!accomp), 'Accomp (ACMP)', 'accomp', [
      'between',
      'between',
    ])}
    {@render key(
      'Fill Up',
      'up',
      fillFace('up'),
      undefined,
      'transport.fill_up',
      () => onfillup?.(),
      `Fill Up${fillQueued === 'up' ? ', queued' : ''}: a fill, then the next Main up (at Main D, its own fill)`,
      'fill-up',
      ['between', 'in'],
    )}
    {@render key(
      'Fill Down',
      'down',
      fillFace('down'),
      undefined,
      'transport.fill_down',
      () => onfilldown?.(),
      `Fill Down${fillQueued === 'down' ? ', queued' : ''}: a fill, then the next Main down (at Main A, its own fill)`,
      'fill-down',
      ['in', 'in'],
    )}
    {@render key(
      'Fade',
      fadeOut ? 'fade-out' : 'fade-in',
      fadeFace,
      fading,
      'transport.fade',
      () => onfade?.(),
      `Fade ${fadeOut ? 'out' : 'in'}${fading ? (running ? ', fading' : ', waiting for Start') : ''}`,
      'fade',
      ['in', evenGaps ? 'in' : 0],
    )}
    {@render key(
      'Reset',
      'reset',
      'off',
      undefined,
      'transport.section_reset',
      () => onreset?.(),
      'Section reset: restart the section from its first bar',
      'reset',
      [0, 0],
    )}
  {/if}
  {#if helpers}
    <span class="halves helper" role="group" aria-label="Metronome">
      {@render face('Metronome', '', metronome, 'metronome.on', () => onmetronome?.(!metronome), undefined, 'transport', 'half word-half')}
      <button
        type="button"
        class="face half caret-half"
        data-face={metronomeOpen ? 'on' : 'off'}
        data-hue="transport"
        style:--hue="var(--transport)"
        aria-haspopup="dialog"
        aria-expanded={metronomeOpen}
        aria-controls={metronomeControls}
        aria-label="Metronome settings: on/off, volume, bell on beat 1"
        data-tip="metronome.settings"
        use:tipOn={'metronome.settings'}
        onclick={() => onmetronomesettings?.()}><span aria-hidden="true">▾</span></button
      >
    </span>
    {@render face('Unison', '', unison, 'transport.unison', () => onunison?.(!unison), undefined, 'lamp', 'helper')}
    {@render face(
      '?',
      '',
      help,
      'app.help',
      () => onhelp?.(!help),
      'Help mode: point at any control to learn what it does',
      'lamp',
      'helper',
    )}
    {@render face('Panic', '', undefined, 'transport.panic', () => onpanic?.(), 'Panic: all notes off', 'warn', 'helper panic')}
  {/if}
{:else}
  <div
    class="row dots"
    class:full={groups === 'all'}
    class:vertical
    role="toolbar"
    aria-label={toolbarName}
    aria-orientation={orientation}
  >
    {#if transport}
    <span class="group" role="group" aria-label="Transport">
      <span class="start-word" class:running>
        {@render startStop()}
      </span>
      {@render dotSwitch('Accomp', accomp, 'transport.acmp', () => onaccomp?.(!accomp), 'Accomp (ACMP)')}
      {@render dotSwitch('Sync Start', syncStart, 'transport.sync_start', () => onsyncstart?.(!syncStart))}
      {@render action('Reset', '', 'Section reset: restart the section from its first bar', 'transport.section_reset', onreset)}
      <span class="pair">
        {@render fills()}
      </span>
      {@render dotSwitch('Fade', fading, 'transport.fade', () => onfade?.(), 'Fade in/out')}
    </span>
    {/if}
    {#if helpers}
    <span class="group helpers">
      <span class="joined-word" role="group" aria-label="Metronome">
        {@render metronomeWords()}
      </span>
      {@render otherHelpers()}
    </span>
    {/if}
  </div>
{/if}

<style>
  /* The display's language. One row at the tab block's height, words in the small text role. */
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-24);
    height: var(--tab-block);
    white-space: nowrap;
  }
  /* Both groups: the screen's width, the helpers pushed to its right end. */
  .row.full {
    width: var(--stage-row-width);
  }
  .group {
    display: flex;
    align-items: center;
    gap: var(--space-24);
  }
  .full .helpers {
    margin-left: auto;
  }
  /* Fill ▲ and Fill ▼: in a row they are two items of the group; in a list they share a line. */
  .pair {
    display: contents;
  }
  /* Vertical: a list, one control a line, every word on the list's left edge. */
  .vertical,
  .vertical .group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
    height: auto;
  }
  .vertical .pair {
    display: flex;
    gap: var(--space-24);
  }
  .word {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-8);
    height: var(--tab-block);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: none;
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
    cursor: pointer;
  }
  .word:hover,
  .word.on,
  .word.open {
    color: var(--t);
  }
  .word:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .glyph {
    margin-left: var(--space-4);
    font-size: var(--glyph-sm);
  }
  /* A switch's dot, at the display's part-dot size: filled in the hue when on, a hollow muted ring
     when off (the hue's absent strength reads too faint as a 1px ring). */
  .dot {
    flex: none;
    box-sizing: border-box;
    width: var(--beat-dot);
    height: var(--beat-dot);
    border: var(--line-width) solid var(--m);
    border-radius: 50%;
  }
  .on .dot {
    border-color: var(--hue);
    background: var(--hue);
  }
  /* "● Playing" in the running hue. */
  .start-word {
    display: flex;
  }
  .start-word.running .word {
    color: var(--ok);
  }
  .joined-word {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .caret {
    padding: 0 var(--space-4);
    color: var(--m);
  }
  .caret .glyph {
    margin-left: 0;
  }
  /* Cells: the owner's state language, square corners. Off: a 1px inset outline and the word in
     the hue (--hue, set per face). On: solid in the hue, the word in --on-ink. */
  .face {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
    cursor: pointer;
  }
  .face[data-face='on'] {
    background: var(--hue);
    color: var(--on-ink);
  }
  .face:focus-visible {
    z-index: 1;
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  /* Two buttons as halves of one cell (Fill ▲ | Fill ▼, Metronome | ▾): the second overlaps the
     first by the outline's width, so the cut between them is one line. */
  .halves {
    display: grid;
    grid-template-columns: 1fr 1fr;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
  }
  .halves > .face + .face {
    width: calc(100% + var(--outline-width));
    margin-left: calc(-1 * var(--outline-width));
  }
  /* A transport key: its glyph (--glyph-key, φ × the text) a fib-5 over its word, the pair
     centred in the key as one block. Every key is the row's height and has a glyph, so every word
     stands on one baseline across the row and every glyph in one band above it. The word's box is
     trimmed to its capitals (a descender may hang into the key's padding). */
  .key {
    padding: 0 var(--fib-5);
  }
  /* The groups: each key is drawn inside its cell less half the gap to each neighbour (--gap-l,
     --gap-r, set per key), a fib-8 inside a group and a fib-13 between groups (one golden step
     wider), none at the row's ends (the cuts stay on the cell lines). Reset keeps its own wider
     gutter to the left. */
  .face.key {
    width: calc(100% - var(--gap-l) - var(--gap-r));
    margin-left: var(--gap-l);
  }
  .face.key.reset {
    width: calc(100% - var(--reset-gap, var(--fib-13)));
    margin-left: var(--reset-gap, var(--fib-13));
  }
  /* Armed (Sync Start on, a queued Fill, a fade-in waiting for Start): a 2px ring in the hue, the
     glyph and the word in the hue (nothing white: round 8, a white word inside the heavier ring
     read as a third state), and a faint fill of the hue that flashes brighter once a beat and
     settles back to faint within it, restarted by each new beat (two identical animations,
     alternating with the beat's parity); while stopped, with no beat, it runs at the tempo.
     Without motion, the faint fill stands still. Running is solid. */
  .key[data-face='armed'] {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue);
  }
  .key::before {
    position: absolute;
    inset: 0;
    background: var(--hue);
    opacity: 0;
    content: '';
    pointer-events: none;
  }
  .key[data-face='armed']::before {
    opacity: var(--wait-fill-opacity);
  }
  .key > .stack {
    position: relative;
  }
  @media (prefers-reduced-motion: no-preference) {
    .key[data-face='armed'][data-pulse='a']::before {
      animation: pulse-a calc(60s / var(--bpm)) ease-out both;
    }
    .key[data-face='armed'][data-pulse='b']::before {
      animation: pulse-b calc(60s / var(--bpm)) ease-out both;
    }
    .key[data-face='armed'][data-pulse='free']::before {
      animation: pulse-a calc(60s / var(--bpm)) ease-out infinite;
    }
  }
  @keyframes pulse-a {
    from {
      opacity: calc(var(--wait-fill-opacity) * 3);
    }
    to {
      opacity: var(--wait-fill-opacity);
    }
  }
  @keyframes pulse-b {
    from {
      opacity: calc(var(--wait-fill-opacity) * 3);
    }
    to {
      opacity: var(--wait-fill-opacity);
    }
  }
  .stack {
    display: grid;
    grid-template-rows: var(--glyph-key) 1cap;
    row-gap: var(--fib-5);
    justify-items: center;
    align-items: end;
    min-width: 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .band {
    display: flex;
    align-items: flex-end;
    gap: var(--fib-5);
    height: var(--glyph-key);
  }
  .mark {
    display: block;
    width: auto;
    height: var(--glyph-key);
    fill: currentColor;
  }
  .mark .ring {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--fib-3);
  }
  /* Fade's wedge: a fine outline of the whole wedge, and its fill, which drains as the fade runs. */
  .mark .edge {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--outline-width);
  }
  .key-word {
    display: block;
    text-box: trim-both cap alphabetic;
    white-space: nowrap;
  }
  /* The lamp's lime lights in --lamp with --lamp-ink (as LampButton's lime). */
  .face[data-hue='lamp'][data-face='on'] {
    background: var(--lamp);
    color: var(--lamp-ink);
  }
  /* The helpers size to their words and fill the parent's height (a max-content track's width). */
  .helper {
    padding: 0 var(--space-12);
  }
  .halves.helper {
    grid-template-columns: auto auto;
    padding: 0;
  }
  .word-half {
    padding: 0 var(--space-12);
  }
  .caret-half {
    padding: 0 var(--space-8);
  }
  /* Reset and Panic: last, set apart by a fib-13 gap (a slip onto them is heard). */
  .reset,
  .panic {
    width: calc(100% - var(--fib-13));
    margin-left: var(--fib-13);
  }
  /* Reset's gutter: a fib-13, or the parent's `--reset-gap` (the golden Stage: its cell's golden
     minor part, so Reset keeps one unit behind a golden step). */
  .face.reset {
    width: calc(100% - var(--reset-gap, var(--fib-13)));
    margin-left: var(--reset-gap, var(--fib-13));
  }
  /* `evenKeys`: the six keys after Start / Stop one width (--w), a fib-8 apart, spread over the
     cells after Start / Stop (--span: five one-unit cells and Reset's --reset-units), the first a
     fib-8 after Start / Stop's key (which stops half a fib-8 short of its cell). Each key is placed
     from its own cell (--u, one unit: its cell's width over its units) by its place (--slot). */
  .face.key.even {
    --u: calc(100% / var(--cell-units, 1));
    --span: calc(var(--u) * (5 + var(--reset-units, 1)));
    --w: calc((var(--span) - var(--fib-8) / 2 - 5 * var(--fib-8)) / 6);
    width: var(--w);
    margin-left: calc(var(--fib-8) / 2 + var(--slot) * (var(--w) + var(--fib-8) - var(--u)));
  }
  .face.key.even.reset {
    --cell-units: var(--reset-units, 1);
  }
  /* Every glyph a 21px square (--glyph-key), Start / Stop's too, the shape fitted in it and
     standing on its foot (`fit`), so every glyph shares one box and one baseline. */
  .boxed .mark {
    width: var(--glyph-key);
  }

  /* `iconKeys`: each key `--golden-key-width` wide and its row's height, its icon centred,
     `--golden-key-icon` high: the solid parts filled, the strokes a fib-3 line of its 24 box. No cell gaps: the
     parent's row spaces the keys. */
  .face.key.icon,
  .face.key.icon.reset {
    flex: none;
    width: var(--golden-key-width);
    margin-left: 0;
    padding: 0;
  }
  svg.icon {
    position: relative;
    display: block;
    width: auto;
    height: var(--golden-key-icon);
    fill: none;
    stroke: currentColor;
    stroke-width: var(--fib-3);
    stroke-linecap: square;
  }
  svg.icon .solid {
    fill: currentColor;
    stroke: none;
  }
  /* A fade's drain: a fib-3 bar along Fade's foot in --on-ink, as long as the part of the fade
     that has run. */
  .face.key.icon[data-drain]::after {
    position: absolute;
    bottom: 0;
    left: 0;
    width: calc((1 - var(--drain)) * 100%);
    height: var(--fib-3);
    background: var(--on-ink);
    content: '';
  }
</style>
