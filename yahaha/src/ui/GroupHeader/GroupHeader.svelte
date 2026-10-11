<!--
  GroupHeader: the row that names a group of controls ("Faders", "Knobs", "Pads",
  "Transport", "Tempo"). The title is a real heading; what follows it (tabs, the knob page block,
  the pad page name) is the parent's `children` snippet, rendered straight into the row; the
  optional `end` snippet (THE place a header's hue legend goes, so every header with a legend
  places it the same way) and then the optional page counter sit at the right end. A bright
  `--type-strong` title over a bold full-width rule (`--header-rule-width` in `--header-rule`);
  one size on the line: the title, the tabs and the counter are all 13px, differing by weight and
  colour. The parent leaves `--band-body-gap` below it. Not a control: no click, no focus of its own.
  Every text in the row sits on one baseline, `--header-baseline` from the top: the row aligns its
  items by baseline and an empty strut fixes where that baseline is, so the title, ChosenTabs'
  labels (whose blocks then stand on the rule), an AccentBlock and the counter share a line in
  every header, with or without tabs. A child that is a group of its own (a word and a tab run)
  shares the line when it aligns its items by baseline too.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    /** The group's name, the heading's text ("Faders"). */
    title: string
    /** A word that qualifies the title, drawn after it as " · {detail}" ("Faders · Reverb"). */
    detail?: string
    /** The page counter at the right end: label in `--caption-ink`, value in `--value-ink` ("Page 1/6"). */
    count?: { label: string; value: string }
    /** The heading level of the title. */
    level?: 2 | 3 | 4
    /** The id put on the heading, for the parent's `aria-labelledby`. */
    id?: string
    /** A fixed width in px (the band's 646, 610, 88). Default: fills its container. */
    width?: number
    /** What follows the title; each top-level element is a flex item 12px after the one before. */
    children?: Snippet
    /** What sits at the row's right end, before the counter: the header's hue legend, if it has one. */
    end?: Snippet
  }

  let { title, detail, count, level = 2, id, width, children, end }: Props = $props()
</script>

<div class="row" style:width={width === undefined ? '100%' : `${width}px`}>
  <svelte:element this={`h${level}`} class="title" {id}
    >{title}{#if detail} · <span class="detail">{detail}</span>{/if}</svelte:element
  >
  {@render children?.()}
  {#if end}
    <span class="end">{@render end()}</span>
  {/if}
  {#if count}
    <span class="count">{count.label} <span class="value">{count.value}</span></span>
  {/if}
</div>

<style>
  .row {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    box-sizing: border-box;
    height: var(--group-header-height);
    padding: 0;
    border-bottom: var(--header-rule-width) solid var(--header-rule);
    white-space: nowrap;
    font-family: var(--font-sans);
  }
  /* The strut: its bottom is the row's baseline. No width, and the negative margin cancels the
     gap after it, so the title still starts at the row's left edge. */
  .row::before {
    content: '';
    flex: none;
    width: 0;
    height: var(--header-baseline);
    margin-right: calc(-1 * var(--space-12));
  }
  .title {
    flex: none;
    margin: 0;
    color: var(--header-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .detail {
    color: var(--t);
  }
  /* The right end: `end` (the legend), then the counter; whichever comes first takes the slack. */
  .end {
    display: flex;
    flex: none;
    align-items: baseline;
    gap: var(--space-12);
    margin-left: auto;
  }
  .count {
    flex: none;
    margin-left: auto;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .end ~ .count {
    margin-left: 0;
  }
  .value {
    color: var(--value-ink);
  }
</style>
