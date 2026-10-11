<!--
  Pad: one band pad (`--pad-size` square), in the state language. The label is centred in the pad,
  horizontally and vertically (it wraps at word boundaries, each line centred), in the pad's hue,
  on a transparent face inside a 1px inset outline of that hue. No pad number on the face. Faces:
  idle (the outline), dark (the style lacks it: a 1px outline and the label in the pad's own hue at
  reduced strength, `--absent-<family>`, no fill: an absent Intro reads as a faded yellow pad),
  playing and running (a solid fill of the hue, the label in `--on-ink`), next and armed (waiting: a
  2px ring and a faint fill of the hue, the label in `--t`, and a small "NEXT" or "ARMED" tag at the
  top, placed absolutely so the label stays centred; with `tagCorner`, a solid tag in the top-right
  corner instead). Next and armed flash: the parent passes the
  phase in `lit`; unlit drops the fill and falls back to the 1px outline. Utility pads are neutral
  (`--neutral`, solid when on); Start / Stop goes solid `--ok` when running. Outlines are inset
  box-shadows, so the size never changes.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Family = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'util' | 'start' | 'r1' | 'r2' | 'r3' | 'l'

  /** The hues with a pad glow token of their own (`--pad-glow-<hue>`); the others glow none. */
  const GLOWS = new Set(['intro', 'main', 'ending', 'brk', 'fill', 't', 'ok'])

  type Props = {
    /** The label, centred in the pad ("Main B", "Sync Start"); it wraps at word boundaries. Tie a numeral to its word with a no-break space. */
    label: string
    /** The pad's number on the Launchkey ("1" … "16"). Not drawn; it only goes into the default accessible name. */
    index?: string
    /** The family: a section hue, `util` (neutral), `start` (Start / Stop, `--ok` when running), or a
        part hue (`r1` blue, `r2` pink, `r3` orange, `l` teal) for a pad the engine lights in that colour. */
    family?: Family
    /** The face. `dark` (absent) draws the family's hue at reduced strength. */
    state?: 'idle' | 'dark' | 'playing' | 'next' | 'armed' | 'running'
    /** The flash phase of `next` and `armed`: false drops the fill and draws the 1px outline. */
    lit?: boolean
    /** The accessible name. Default: "{label} (pad {index})". */
    name?: string
    /** The tooltip key, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called on a click, Space or Enter. */
    onpress?: () => void
    /**
     * Draw the NEXT / ARMED tag as a small tag in the pad's top-right corner (solid hue, `--on-ink`),
     * not a line over the label, so the pad stays one line ("Main C"). Off by default (the golden Stage sets it).
     */
    tagCorner?: boolean
    /**
     * A transport pad (Start / Stop, Sync Start, Sync Stop, Tap, Auto Fill on the Sections bank):
     * a `util` or `start` pad draws in the hue of time (`--transport`), as its twin on the screen's
     * transport, solid while running. Off by default (the golden Stage sets it on the Sections bank).
     */
    transport?: boolean
  }

  let {
    label,
    index = '',
    family = 'main',
    state = 'idle',
    lit = true,
    name,
    tip,
    tipAction,
    onpress,
    tagCorner = false,
    transport = false,
  }: Props = $props()

  let util = $derived(family === 'util' || family === 'start')
  /** The hue token: the family's (`neutral` for utilities, `ok` for a running Start / Stop; with
      `transport`, `transport` for both); a dark pad takes the same hue's absent token
      (`absent-intro`, `absent-neutral`). */
  let base = $derived(
    util && transport ? 'transport' : family === 'start' && state === 'running' ? 'ok' : util ? 'neutral' : family,
  )
  let hue = $derived(state === 'dark' ? `absent-${base}` : base)
  /** The glow token's hue: the neutral glow is the white one. */
  let glow = $derived(base === 'neutral' ? 't' : base)
  let tag = $derived(state === 'next' ? 'NEXT' : state === 'armed' ? 'ARMED' : '')
  let solid = $derived(state === 'playing' || state === 'running')
  let waiting = $derived(state === 'next' || state === 'armed')

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

<button
  type="button"
  class="pad face-{state}"
  class:util
  class:solid
  class:waiting
  class:unlit={waiting && !lit}
  style:--hue="var(--{hue})"
  style:--glow={GLOWS.has(glow) ? `var(--pad-glow-${glow})` : 'none'}
  data-face={state}
  data-hue={hue}
  data-contrast={state === 'dark' ? 'dim' : undefined}
  data-tip={tip}
  aria-label={name ?? `${label}${index ? ` (pad ${index})` : ''}`}
  onclick={() => onpress?.()}
  use:tipped={tip}
>
  {#if tag}<span class="tag" class:corner={tagCorner} aria-hidden="true">{tag}</span>{/if}
  <span class="label">{label}</span>
</button>

<style>
  .pad {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    /* Square at --pad-size; a layout may set --pad-width and --pad-height apart (the golden 4 × 4). */
    width: var(--pad-width, var(--pad-size));
    min-width: 0;
    height: var(--pad-height, var(--pad-size));
    margin: 0;
    padding: 0 var(--space-4);
    border: none;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: center;
    cursor: pointer;
  }
  /* The label: centred lines, wrapping only at word boundaries. */
  .label {
    position: relative;
    min-width: 0;
    overflow-wrap: normal;
    word-break: normal;
  }
  /* NEXT / ARMED: small, at the top, out of the flow so the label stays centred. */
  .tag {
    position: absolute;
    top: var(--space-4);
    right: 0;
    left: 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: center;
  }
  /* `tagCorner`: the tag in the top-right corner, a solid block of the hue with --on-ink, out of the
     label's line, so the label reads on its own. */
  .tag.corner {
    top: 0;
    left: auto;
    padding: 0 var(--space-4);
    background: var(--hue);
    color: var(--on-ink);
    /* As deep as the words themselves, so it clears the centred label in a short pad. */
    line-height: 1;
  }

  .solid {
    background: var(--hue);
    box-shadow:
      inset 0 0 0 var(--outline-width) var(--hue),
      var(--glow);
    color: var(--on-ink);
  }

  /* Waiting: the 2px ring over a faint fill of the hue, drawn beneath the words; the label in --t
     so it reads on the faint fill in both themes, the tag in the hue. */
  .waiting {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue);
  }
  .waiting::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--hue);
    opacity: var(--wait-fill-opacity);
    pointer-events: none;
  }
  .waiting .label {
    color: var(--t);
  }
  .face-armed {
    box-shadow:
      inset 0 0 0 var(--outline-width-wait) var(--hue),
      var(--glow);
  }
  /* The flash's off phase: no fill, no glow, the rest outline; the words stay. */
  .waiting.unlit {
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
  }
  .waiting.unlit::before {
    content: none;
  }

  .pad:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
