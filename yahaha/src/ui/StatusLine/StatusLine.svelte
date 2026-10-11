<!--
  StatusLine: the one line between the band and the keys that says what the app just did or
  refused (`state.message`). An error leads with the ⚠; a click, Enter or Space asks the parent to
  clear it (`onclear`). Empty, the 20px row stays so the keys never move. The contents are keyed
  on `seq`, so the same text sent twice is announced twice while the button keeps its focus.
  With a `hint` (the hovered or focused control's tooltip) the line shows the hint instead; the
  message stays in the live region, visually hidden, so a new one is still announced (D13).
-->
<script lang="ts" module>
  /** A control's tooltip, shown in the line's place while the control is hovered or focused. */
  export type StatusHint = {
    /** The entry's title. */
    title: string
    /** What the control does. */
    body: string
    /** Its keys, already labelled ("Y", "Shift+Y / F5"). */
    keys?: string | null
    /** Where it is on the Launchkey. */
    launchkey?: string | null
  }
</script>

<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The hovered or focused control's tooltip: shown in place of the message while set. */
    hint?: StatusHint | null
    /** `message.text`. `null` or `''`: no message, the line is empty. */
    text?: string | null
    /** `message.error`: the ⚠ shows before the text. Ignored while there is no text. */
    error?: boolean
    /** `message.seq`. A new value re-creates the button's contents, so a repeat is announced again. */
    seq?: number
    /** A fixed width in px. Unset, the line fills its container. */
    width?: number
    /** The tooltip key from `app/src/help/tooltips.ts`, as `data-tip` on the button. `null` turns it off. */
    tip?: string | null
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called on click, Enter or Space on the line's button; the parent sends `clearMessage`. */
    onclear?: () => void
  }

  let { hint = null, text = null, error = false, seq = 0, width, tip = 'display.status', tipAction, onclear }: Props = $props()

  /** Applies the parent's tooltip action when both it and a key are given. */
  const tipped: Action<HTMLElement, string | null | undefined> = (node, key) => {
    if (!tipAction || key == null) return
    const handle = tipAction(node, key)
    return {
      update: (next) => {
        if (next != null) handle?.update?.(next)
      },
      destroy: () => handle?.destroy?.(),
    }
  }
</script>

<!-- The hint is hidden from the live region: the focused control already points
     aria-describedby at its own entry, and hovering shouldn't read out every control the
     pointer crosses. The blocks touch, so an empty line has no text at all. -->
<p class="status" role="status" aria-live="polite" style:width={width === undefined ? undefined : `${width}px`}>
  {#if hint}
    <span class="hint" aria-hidden="true">
      <span class="hint-title">{hint.title}</span>
      <span class="hint-body">{hint.body}</span>
      {#if hint.keys || hint.launchkey}
        <span class="hint-meta">
          {#if hint.keys}<span>Key {hint.keys}</span>{/if}
          {#if hint.launchkey}<span>Launchkey: {hint.launchkey}</span>{/if}
        </span>
      {/if}
    </span>
  {/if}{#if text}
    <button type="button" class="line" class:under={hint} data-tip={tip ?? undefined} use:tipped={tip} onclick={() => onclear?.()}>
      {#key seq}
        {#if error}
          <svg aria-hidden="true" data-hue="warn" class="warn" width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 1.5 L11 10.5 H1 Z" /><path d="M6 5 V7.4" /><circle cx="6" cy="8.9" r="0.6" />
          </svg>
        {/if}
        <!-- The space after "Error:" sits outside the hidden span: an accessible-name computation
             trims each element's text, so a space inside it would be lost ("Error:Can't"). At the
             line's start the visible space collapses away. -->
        <span class="text">{#if error}<span class="hidden-word">Error:</span>{/if}{error ? ` ${text}` : text}</span>
      {/key}
    </button>
  {/if}
</p>

<style>
  .status {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    height: var(--space-20);
    margin: 0;
    overflow: visible;
    background: transparent;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .line {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    max-width: 100%;
    min-width: 0;
    height: var(--space-20);
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--t);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .line:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .warn {
    flex: none;
    fill: none;
    stroke: var(--warn);
    stroke-width: 1;
    stroke-linejoin: round;
  }
  .warn circle {
    fill: var(--warn);
    stroke: none;
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The hint: title, then what it does (ends in "…"), then the keys and Launchkey place at the
     right, which give way first when the line is short. */
  .hint {
    display: flex;
    align-items: center;
    gap: var(--space-16);
    width: 100%;
    min-width: 0;
    height: var(--space-20);
    white-space: nowrap;
  }
  .hint-title {
    flex: none;
    color: var(--t);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .hint-body {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--t2);
  }
  .hint-meta {
    flex: 0 100 auto;
    display: flex;
    gap: var(--space-16);
    min-width: 0;
    margin-left: auto;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--m);
  }
  /* Under a hint, the message keeps its place in the live region but isn't drawn. */
  .line.under,
  .hidden-word {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
