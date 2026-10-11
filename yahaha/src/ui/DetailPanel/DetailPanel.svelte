<!--
  DetailPanel: the details column beside a Library list (a chosen sound, instrument or rack). A
  column: the head line (an optional number, the title, an optional badge word in its hue), an
  optional subtitle, the fields (a label in a fixed 96px column, then each value in its hue),
  then rows of action Buttons (the primary one on Button's chosen face), each with an optional
  note after it, then the page's extras (`children`). With no title it shows `emptyText`
  centred. Holds no state; a press calls onaction with the action's id.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import type { DetailActionRow, DetailField, DetailHue } from './types'

  type Props = {
    /** The section's accessible name ("Sound details"). */
    label: string
    /** The chosen item's name ("Silk Strings"). Empty: the empty state. */
    title?: string
    /** A number before the title, in the caption ink ("12"). */
    number?: string
    /** A word after the title, in `badgeHue` ("Plugin", "Modified"). */
    badge?: string
    /** The badge's hue. */
    badgeHue?: DetailHue
    /** A line under the head, in `--t2` ("Strings · Sampler Deluxe"). */
    subtitle?: string
    /** The field rows: a label and one or more values, each in its hue. */
    fields?: DetailField[]
    /** Rows of action buttons, each with an optional note after it. */
    actions?: DetailActionRow[]
    /** Shown centred, in the caption ink, when `title` is empty. */
    emptyText?: string
    /** A fixed width in px. Default: fills its container. */
    width?: number
    /** The app's `use:tip` action, passed to each action Button. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the action's id when an enabled action button is pressed. */
    onaction?: (id: string) => void
    /** The page's extras after the actions (a rename field, a parts list, an inline confirm). */
    children?: Snippet
  }

  let {
    label,
    title = '',
    number,
    badge,
    badgeHue = 'a',
    subtitle,
    fields = [],
    actions = [],
    emptyText = 'Nothing chosen',
    width,
    tipAction,
    onaction,
    children,
  }: Props = $props()

  /** Between two values; an expression, so Svelte keeps the space. */
  const COMMA = ', '
  const ink = (hue: DetailHue | undefined) => (hue === undefined ? 'var(--t)' : hue === 'm' ? 'var(--caption-ink)' : `var(--${hue})`)
  let empty = $derived(title.trim() === '')
</script>

<section class="panel" class:empty aria-label={label} style:width={width === undefined ? '100%' : `${width}px`}>
  {#if empty}
    <p class="empty-text">{emptyText}</p>
  {:else}
    <div class="head">
      {#if number}<span class="number">{number}</span>{/if}
      <span class="title">{title}</span>
      {#if badge}<span class="badge" style:color={ink(badgeHue)}>{badge}</span>{/if}
    </div>
    {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
    {#if fields.length > 0}
      <dl class="fields">
        {#each fields as field, i (i)}
          <div class="field">
            <dt class="label">{field.label}</dt>
            <dd class="values">
              {#each field.values as value, j (j)}{#if j > 0}<span class="comma">{COMMA}</span>{/if}<span
                  class="value"
                  style:color={ink(value.hue)}>{value.text}</span
                >{/each}
            </dd>
          </div>
        {/each}
      </dl>
    {/if}
    {#each actions as row, i (i)}
      <div class="actions">
        {#each row.actions as action (action.id)}
          <Button
            label={action.label}
            size="md"
            hue={action.hue ?? 't'}
            chosen={action.primary ?? false}
            disabled={action.disabled ?? false}
            tip={action.tip}
            name={action.name}
            {tipAction}
            onpress={() => onaction?.(action.id)}
          />
        {/each}
      </div>
      {#if row.note}<p class="note">{row.note}</p>{/if}
    {/each}
    {@render children?.()}
  {/if}
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    box-sizing: border-box;
    min-width: 0;
    font-family: var(--font-sans);
  }
  .panel.empty {
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  p {
    margin: 0;
  }
  .empty-text {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: center;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: var(--space-8);
    min-width: 0;
    white-space: nowrap;
  }
  .number {
    flex: none;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--t);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .badge {
    flex: none;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .subtitle {
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin: 0;
  }
  .field {
    display: flex;
    align-items: baseline;
    min-width: 0;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .label {
    flex: none;
    width: 96px;
    color: var(--caption-ink);
  }
  .values {
    min-width: 0;
    margin: 0;
    color: var(--t);
  }
  .comma {
    color: var(--caption-ink);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .note {
    margin-top: calc(-1 * var(--space-6));
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
</style>
