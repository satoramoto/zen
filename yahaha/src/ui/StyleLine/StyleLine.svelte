<!--
  StyleLine: the small line at the top of the display's left third. ‹ the style's name › (‹ › step
  styles, the name opens Library › Styles), then its category and time signature, or, while a
  style waits for the bar line, "→" and that style's name. One small size (--type-text) for every
  word and glyph; no boxes: each control is plain text that brightens on hover and shows the focus
  ring on keyboard focus. A long style name ends in an ellipsis (its full name in `title`); the
  category and metre keep their width up to half the line.

  `cells` (the grid Stage): the line fills its container (width and height 100%; give it a size,
  about a control-height band), ‹ › become squares as tall as the line (the golden Stage: the
  glyph alone in the style's hue, the square outlined only on hover and keyboard focus), and the
  category and metre (or the waiting style) follow › on the same line, so the style and what
  qualifies it read as one phrase.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The style's name ("Sunday Drive Pop"). Empty: "No style". */
    styleName: string
    /** The style's category ("Pop & Rock"). */
    category?: string
    /** The style's time signature ("4/4"). */
    timeSignature?: string
    /** A style waiting for the bar line, in the accent after "→". Empty: none. */
    queued?: string
    /** The app's tooltip action (`use:tip`), applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called when ‹ is pressed (the previous style). */
    onprev?: () => void
    /** Called when › is pressed (the next style). */
    onnext?: () => void
    /** Called when the style's name is pressed (opens Library › Styles). */
    onbrowse?: () => void
    /** Fill the container (the golden Stage's band), ‹ › as squares as tall as the line, outlined only on hover and focus. */
    cells?: boolean
  }

  let {
    styleName,
    category = '',
    timeSignature = '',
    queued = '',
    tipAction,
    onprev,
    onnext,
    onbrowse,
    cells = false,
  }: Props = $props()

  const name = $derived(styleName.trim() || 'No style')
  const hasQueued = $derived(queued.trim() !== '')
  const meta = $derived([category, timeSignature].filter(Boolean).join(' · '))

  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }
</script>

<div class="line" class:cells data-cells={cells || undefined}>
  <button
    type="button"
    class="glyph"
    aria-label="Previous style (Track left)"
    data-tip="style.prev"
    use:tipOn={'style.prev'}
    onclick={() => onprev?.()}><span aria-hidden="true">‹</span></button
  >
  <button
    type="button"
    class="name"
    title={name}
    aria-label="{name}: open the Browser"
    data-tip="browser.open"
    use:tipOn={'browser.open'}
    onclick={() => onbrowse?.()}>{name}</button
  >
  <button
    type="button"
    class="glyph"
    aria-label="Next style (Track right)"
    data-tip="style.next"
    use:tipOn={'style.next'}
    onclick={() => onnext?.()}><span aria-hidden="true">›</span></button
  >
  {#if hasQueued}
    <span class="meta queued" title="Next: {queued}"><span class="arrow" aria-hidden="true">→</span> {queued}</span>
  {:else if meta}
    <span class="meta" title={meta}>{meta}</span>
  {/if}
</div>

<style>
  /* A third of the display's content width (Display's grid), at most its container. */
  .line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    box-sizing: border-box;
    width: calc((var(--stage-row-width) - 2 * var(--display-border-width) - 2 * var(--display-pad-left) - 2 * var(--display-thirds-gap)) / 3);
    max-width: 100%;
    height: var(--tab-block);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  button {
    height: var(--tab-block);
    margin: 0;
    border: 0;
    border-radius: var(--radius);
    background: none;
    font: inherit;
    letter-spacing: inherit;
    cursor: pointer;
  }
  button:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
  .glyph {
    flex: none;
    padding: 0 var(--space-6);
    color: var(--m);
  }
  .glyph:first-child {
    margin-left: calc(-1 * var(--space-6));
  }
  .glyph:hover {
    color: var(--t);
  }
  /* The name in the accent; it gives way first, ending in an ellipsis. */
  .name {
    flex: 0 1 auto;
    min-width: 0;
    padding: 0 var(--space-2);
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--a);
    text-align: left;
  }
  .name:hover {
    color: var(--t);
  }
  /* Keeps its width (the name gives way), up to half the line. */
  .meta {
    flex: none;
    max-width: 50%;
    margin-left: var(--space-12);
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
    color: var(--m);
  }
  .queued {
    color: var(--a);
  }
  .arrow {
    color: var(--m);
  }

  /* Cells: the whole container; ‹ › squares as tall as the line, the glyph alone in the style's
     hue (--a, as the name), the square's outline drawn only on hover and keyboard focus (the
     owner's exception to "every clickable outlined": a boxed arrow read apart from its line). */
  .line.cells {
    width: 100%;
    max-width: none;
    height: 100%;
  }
  .cells button {
    height: 100%;
  }
  .cells .glyph {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 0;
    color: var(--a);
  }
  .cells .glyph:hover,
  .cells .glyph:focus-visible {
    box-shadow: inset 0 0 0 var(--outline-width) var(--a);
    color: var(--a);
  }
  .cells .glyph:first-child {
    margin-left: 0;
  }
</style>
