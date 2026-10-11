<!--
  ChannelParts: the Channel page's parts list (docs/specs/push/Channel.md › Parts list). A "Parts"
  GroupHeader with the open part's counter, then the twelve parts in two columns, row-major
  (R1 | R2, R3 | L, Rhythm 1 | Rhythm 2, …). Each entry is a plain row on a hairline: the tag in
  the part's hue (a Style part: the value ink), then a keyboard part's sound name. A part that
  doesn't sound keeps its hue at absent strength, its name in the caption ink. The open part is the
  chosen block: a solid fill in its hue (a Style part: --neutral), tag and name in the on ink.
  ← → move one entry, ↑ ↓ one row, Home End to the ends; each focuses that entry and calls
  `onopen`. A click never moves `open` itself: the parent does.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import type { PartEntry } from '../Channel/types'

  type Props = {
    /** The twelve parts, in order (R1, R2, R3, L, then the eight Style parts). */
    parts: PartEntry[]
    /** The open part, 0–11. */
    open: number
    /** A fixed width in px (264 in the page). Default: fills its container. */
    width?: number
    /** The app's tooltip action (`use:tip`), applied to every entry with the key `channel.part`. */
    tipAction?: Action<HTMLElement, string>
    /** Called with a part's index on a click, or when ← → ↑ ↓ Home End move to it. */
    onopen?: (part: number) => void
  }

  let { parts, open, width, tipAction, onopen }: Props = $props()

  const TIP = 'mixer.channel.part'
  const buttons: HTMLButtonElement[] = $state([])

  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }

  /** The tag's colour name: the part's hue (a Style part: `t`), `d` when it doesn't sound and isn't open. */
  function hueName(part: PartEntry, isOpen: boolean): string {
    if (part.off && !isOpen) return 'd'
    return part.hue ?? 't'
  }

  function label(part: PartEntry, i: number): string {
    const name = part.name ? ` ${part.name}` : ''
    return `Part ${i + 1} of ${parts.length}: ${part.tag}${name}${part.off ? ', off' : ''}${i === open ? ', open' : ''}`
  }

  function keydown(event: KeyboardEvent, index: number) {
    const last = parts.length - 1
    const to: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      ArrowUp: index - 2,
      ArrowDown: index + 2,
      Home: 0,
      End: last,
    }
    if (!(event.key in to) || parts.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const target = Math.min(last, Math.max(0, to[event.key]))
    if (target === index) return
    buttons[target]?.focus()
    onopen?.(target)
  }
</script>

<nav class="parts" aria-label="Parts" style:width={width === undefined ? '100%' : `${width}px`}>
  <GroupHeader title="Parts" level={3} count={{ label: 'Part', value: `${open + 1} of ${parts.length}` }} />
  <div class="grid">
    {#each parts as part, i (i)}
      {@const isOpen = i === open}
      <button
        type="button"
        class="entry"
        class:open={isOpen}
        class:off={part.off}
        style:--part-hue={part.hue ? `var(--${part.hue})` : 'var(--neutral)'}
        style:--part-absent={part.hue ? `var(--absent-${part.hue})` : 'var(--absent)'}
        aria-current={isOpen ? 'true' : undefined}
        aria-label={label(part, i)}
        data-face={isOpen ? 'chosen' : 'off'}
        data-tip={TIP}
        bind:this={buttons[i]}
        use:tipOn={TIP}
        onclick={() => onopen?.(i)}
        onkeydown={(e) => keydown(e, i)}
      >
        <span class="tag" class:style={part.hue === null} data-hue={hueName(part, isOpen)}>{part.tag}</span>
        {#if part.hue !== null && part.name}
          <span class="name">{part.name}</span>
        {/if}
      </button>
    {/each}
  </div>
</nav>

<style>
  .parts {
    display: flex;
    flex-direction: column;
    gap: var(--header-gap);
    box-sizing: border-box;
    min-width: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: var(--row-height, var(--control-height));
    column-gap: var(--space-12);
  }
  .entry {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    box-sizing: border-box;
    min-width: 0;
    height: var(--row-height, var(--control-height));
    margin: 0;
    padding: 0 var(--space-8);
    border: 0;
    border-bottom: var(--line-width) solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .tag {
    flex: none;
    min-width: 22px;
    color: var(--part-hue);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .tag.style {
    color: var(--value-ink);
  }
  .name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .off .tag,
  .off .tag.style {
    color: var(--part-absent);
  }
  .off .name {
    color: var(--caption-ink);
  }
  /* The open face wins over off. */
  .entry.open {
    background: var(--part-hue);
  }
  .entry.open .tag,
  .entry.open .name {
    color: var(--on-ink);
  }
  .entry:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
</style>
