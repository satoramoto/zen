<!--
  SettingsLaunchkey: the Settings screen's Launchkey page, the pad page order, in two sections,
  each in its own hue (`SECTION_HUES.launchkey`). A table of the pad pages Pad Bank ▲ ▼ steps
  through: Sections first and fixed, then the others, each with what its pads do, a Shown lamp and
  ▲ ▼ to move it. Shown pages are numbered 2 on in their order; a page left out sits last,
  unnumbered, and doesn't move. Below, under its own header: the run Pad Bank steps through, its
  page count and Default order at the right end (shown, not pressable, while the order is the
  default), then how One Touch reaches the pads. Moving is ▲ ▼ only (no drag grip). The Screen
  draws the page's title and caption. Controlled: every press is reported through `onchange`; the
  data never changes here.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import { SECTION_HUES, sectionHue } from '../Settings/hues'
  import type { LaunchkeyChange, LaunchkeyPageData } from '../Settings/types'

  type Props = {
    /** The pages after Sections (shown ones in order, then the ones left out), what Sections' pads do, and whether the order is the default. */
    data: LaunchkeyPageData
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A control was pressed: a page moved, shown or left out, or Default order. */
    onchange?: (change: LaunchkeyChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  let shown = $derived(data.pages.filter((page) => page.shown))
  /** Each listed page with its number (2 on, shown pages only) and whether ▲ and ▼ can move it. */
  let rows = $derived(
    data.pages.map((page) => {
      const at = shown.indexOf(page)
      return {
        page,
        number: at < 0 ? '' : String(at + 2),
        canUp: at > 0,
        canDown: at >= 0 && at < shown.length - 1,
      }
    }),
  )
  let run = $derived(['Sections', ...shown.map((page) => page.label)])
</script>

<div class="page">
  <div class="pages" style={sectionHue(SECTION_HUES.launchkey.pages)}>
    <GroupHeader title="Launchkey pad pages" level={3} />
    <table class="order">
      <caption class="hidden">Pad page order</caption>
      <thead>
        <tr>
          <th scope="col" class="num">#</th>
          <th scope="col">Pad page</th>
          <th scope="col">On the pads</th>
          <th scope="col">Shown</th>
          <th scope="col">Move</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="num">1</td>
          <td class="name">Sections</td>
          <td class="pads">{data.sectionsPads}</td>
          <td class="caption">Always · fixed</td>
          <td>
            <span class="move">
              <Button
                symbol="up"
                size="icon"
                name="Sections is fixed as page 1"
                tip="settings.pad_pages.up"
                disabled
                {tipAction}
              />
              <Button
                symbol="down"
                size="icon"
                name="Sections is fixed as page 1"
                tip="settings.pad_pages.down"
                disabled
                {tipAction}
              />
            </span>
          </td>
        </tr>
        {#each rows as row (row.page.id)}
          <tr class:out={!row.page.shown}>
            <td class="num">{row.number}</td>
            <td class="name">{row.page.label}</td>
            <td class="pads">{row.page.pads}</td>
            <td>
              <LampButton
                label={row.page.shown ? 'On' : 'Off'}
                on={row.page.shown}
                size="sm"
                width={64}
                name={`Show the ${row.page.label} page`}
                tip="settings.pad_pages.shown"
                {tipAction}
                ontoggle={(on) => onchange?.({ type: 'shown', id: row.page.id, on })}
              />
            </td>
            <td>
              <span class="move">
                <Button
                  symbol="up"
                  size="icon"
                  name={`Move ${row.page.label} up`}
                  tip="settings.pad_pages.up"
                  disabled={!row.canUp}
                  {tipAction}
                  onpress={() => onchange?.({ type: 'move', id: row.page.id, delta: -1 })}
                />
                <Button
                  symbol="down"
                  size="icon"
                  name={`Move ${row.page.label} down`}
                  tip="settings.pad_pages.down"
                  disabled={!row.canDown}
                  {tipAction}
                  onpress={() => onchange?.({ type: 'move', id: row.page.id, delta: 1 })}
                />
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="steps" style={sectionHue(SECTION_HUES.launchkey.bank)}>
    <GroupHeader title="Pad Bank ▲ ▼ steps through" level={3} />
    <div class="run">
      <p class="chain">
        {#each run as label, i (label)}{#if i > 0}<span class="caption" aria-hidden="true"> → </span>{/if}<span
            class="value">{label}</span
          >{/each}
      </p>
      <span class="caption">{run.length} pages</span>
      <Button
        label="Default order"
        tip="settings.pad_pages.reset"
        disabled={data.isDefault}
        {tipAction}
        onpress={() => onchange?.({ type: 'reset' })}
      />
    </div>
    <p class="help">
      Sections is always page 1. Holding Sound (fader button 6) shows the Racks pads from any page. On the Launchkey,
      Shift + pads 9–12 apply One Touch 1–4 from any page; in the app, use the app bar’s One Touch 1–4.
    </p>
  </div>
</div>

<style>
  .page {
    --settings-page-width: 1048px; /* the Settings screen's page area */
    --pad-order-num: 32px; /* the # column */
    --pad-order-name: 120px; /* the Pad page column */
    --pad-order-shown: 112px; /* the Shown column */
    --pad-order-move: 80px; /* the Move column: two 32px buttons and their gap */
    display: flex;
    flex-direction: column;
    gap: var(--space-24);
    box-sizing: border-box;
    width: var(--settings-page-width);
    max-width: 100%;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  p {
    margin: 0;
  }
  .caption {
    color: var(--caption-ink);
  }
  .value {
    color: var(--value-ink);
  }
  .hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .order {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }
  /* Header and body cells share one left edge per column (no left padding, the same right
     padding) and one height, so every heading sits over its cells and every row is as tall. */
  th,
  td {
    box-sizing: border-box;
    height: var(--group-header-height);
    padding: 0 var(--space-12) 0 0;
    text-align: left;
  }
  th:last-child,
  td:last-child {
    padding-right: 0;
  }
  /* The header row, under the section's GroupHeader: column names in the caption ink on a hairline. */
  th {
    padding-bottom: calc(var(--group-header-height) - var(--header-baseline) - var(--line-width));
    border-bottom: var(--line-width) solid var(--line);
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    vertical-align: bottom;
  }
  th:nth-child(1) {
    width: var(--pad-order-num);
  }
  th:nth-child(2) {
    width: var(--pad-order-name);
  }
  th:nth-child(4) {
    width: var(--pad-order-shown);
  }
  th:nth-child(5) {
    width: var(--pad-order-move);
  }
  td {
    border-bottom: var(--line-width) solid var(--line);
    vertical-align: middle;
  }
  .num {
    color: var(--caption-ink);
  }
  .name {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .pads {
    overflow: hidden;
    color: var(--caption-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* A page left out: its name in the caption ink too. */
  .out .name {
    color: var(--caption-ink);
  }
  .move {
    display: flex;
    gap: var(--space-4);
  }
  .steps {
    display: flex;
    flex-direction: column;
  }
  /* The run, then its count and Default order at the right end, flush with the table's Move column. */
  .run {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    min-height: var(--group-header-height);
    margin-top: var(--space-4);
    white-space: nowrap;
  }
  .chain {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .help {
    margin-top: var(--space-12);
    color: var(--caption-ink);
  }
</style>
