<!--
  ChordReadout: the display's chord, the brightest thing on the screen. The chord at the hero size
  in the accent, its extension after it in a lighter run; under it one small line: the chord's
  notes ("E · G · B · D") and the fingering mode's word. The fingering is never cut off: when the
  line is too long it wraps to a second small line (and a long fingering wraps inside itself). A
  long chord steps down the hero sizes (--hero-4 … --hero-8) until it fits its column, measured
  after each change. Held (detection unsure, the band keeps the last chord): the chord muted,
  without its glow, and "held" on the small line. A readout, not a control. Its spoken name says
  everything drawn, the whole fingering included; with `tip` and `tipAction`, the fingering takes
  the app's tooltip on hover (no native title), the whole fingering as the tip's first line
  (`data-tip-text`) above the `tip` entry, so a fingering cut off by its container still shows whole.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Note = {
    /** The note's name ("A", "C", "F♯"). */
    note: string
    /** Its interval from the root ("R", "m3", "5", "m7"). Not drawn; kept for callers. */
    interval?: string
  }

  type Props = {
    /** The chord before its extension ("Am", "C", "F♯m"). Empty: "—". */
    chord: string
    /** The extension, drawn after the chord in a lighter run ("7", "maj7", "sus4"). */
    extension?: string
    /** The chord's notes, root first. */
    notes?: Note[]
    /** The fingering mode's word ("Fingered", "Fingered On Bass", "AI Full Keyboard · played Gm7"). */
    fingering?: string
    /** Detection is unsure and the last chord is held: muted, no glow, "held" on the small line. */
    held?: boolean
    /** The readout's spoken name before the chord ("Chord"). */
    label?: string
    /** The fingering's tooltip key ("fingering.select"), set as `data-tip`. */
    tip?: string
    /** The app's tooltip action (`use:tip`), applied to the fingering when `tip` is set. */
    tipAction?: Action<HTMLElement, string>
  }

  let {
    chord,
    extension = '',
    notes = [],
    fingering = '',
    held = false,
    label = 'Chord',
    tip,
    tipAction,
  }: Props = $props()

  type TipOn = { key: string | undefined; text: string }

  /** The tooltip action with the fingering as its free text (`data-tip-text`), set before the
   * action is told, so a tip already showing follows the chord. */
  function tipOn(node: HTMLElement, p: TipOn) {
    if (!tipAction || !p.key) return
    node.dataset.tipText = p.text
    const handle = tipAction(node, p.key)
    return {
      update(next: TipOn) {
        node.dataset.tipText = next.text
        if (next.key) handle?.update?.(next.key)
      },
      destroy() {
        handle?.destroy?.()
      },
    }
  }

  const FITS = ['full', '4', '5', '6', '8']

  const none = $derived(chord.trim() === '')
  const tones = $derived(notes.map((n) => n.note).join(' · '))
  const spoken = $derived(
    `${label} ${none ? 'none' : chord + extension}${held ? ', held' : ''}` +
      (notes.length ? `: ${notes.map((n) => n.note).join(' ')}` : '') +
      (fingering ? `, ${fingering}` : ''),
  )

  let hero: HTMLDivElement
  let size = $state('full')

  /** The largest hero step at which the chord fits its column (the last step when none does). */
  function fit() {
    if (!hero) return
    for (const step of FITS) {
      hero.dataset.fit = step
      size = step
      if (hero.scrollWidth <= hero.clientWidth) return
    }
  }

  $effect(() => {
    void [chord, extension, held]
    fit()
    // Measured again once the web font has loaded: the fallback font is a different width.
    let live = true
    document.fonts?.ready.then(() => live && fit())
    return () => {
      live = false
    }
  })
</script>

<div class="readout" class:held role="img" aria-label={spoken} data-held={held ? 'true' : 'false'}>
  <div class="chord" class:none bind:this={hero} data-fit={size} aria-hidden="true">
    {none ? '—' : chord}<span class="ext">{none ? '' : extension}</span>
  </div>
  <!-- The line is drawn only: the readout's spoken name (role="img") already says it whole. -->
  <p class="line" aria-hidden="true">
    {#if tones}<span class="tones">{tones}</span>{/if}
    {#if fingering}<span class="fingering" data-tip={tip} use:tipOn={{ key: tip, text: fingering }}>{fingering}</span>{/if}
    {#if held}<span class="held-word">held</span>{/if}
  </p>
</div>

<style>
  /* A third of the display's content width (Display's grid), at most its container. */
  .readout {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: calc((var(--stage-row-width) - 2 * var(--display-border-width) - 2 * var(--display-pad-left) - 2 * var(--display-thirds-gap)) / 3);
    max-width: 100%;
    font-family: var(--font-sans);
  }
  .chord {
    height: var(--hero-height);
    overflow: hidden;
    font: var(--type-hero);
    letter-spacing: var(--tracking-hero);
    color: var(--chord);
    text-shadow: var(--chord-glow);
    white-space: nowrap;
    text-overflow: clip;
  }
  /* The extension's run: the same size, without the hero's tight tracking. */
  .ext {
    letter-spacing: var(--tracking-text);
  }
  .chord[data-fit='4'] {
    font-size: var(--hero-4);
    letter-spacing: var(--tracking-hero-4);
  }
  .chord[data-fit='5'] {
    font-size: var(--hero-5);
    letter-spacing: var(--tracking-hero-5);
  }
  .chord[data-fit='6'] {
    font-size: var(--hero-6);
    letter-spacing: var(--tracking-hero-6);
  }
  .chord[data-fit='8'] {
    font-size: var(--hero-8);
    letter-spacing: var(--tracking-hero-8);
  }
  .chord.none {
    color: var(--d);
    text-shadow: none;
  }
  .held .chord {
    color: var(--chord-held);
    text-shadow: none;
  }
  /* One small line; when it runs long the fingering wraps to a second line rather than clip. */
  .line {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--space-16);
    margin: var(--space-8) 0 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    color: var(--caption-ink);
  }
  .tones {
    white-space: nowrap;
    color: var(--t2);
  }
  .fingering {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
