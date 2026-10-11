# GroupHeader

> **Consistent headers (owner's call, PR #550; supersedes the hairline and type below).** Every
> section header (GroupHeader, and the app bar as the same family) is one size on the line: the
> title is `--type-strong` (13 / 500) in `--header-ink`, the `detail` the same `--type-strong`, the
> tabs ChosenTabs' one tab style (`--type-text`, chosen = the `--neutral` block standing on the
> rule), and the counter `--type-text`: label in `--caption-ink`, value in `--value-ink`, tabular
> numerals. They differ by weight and colour, never size. The row's bottom border is the bold
> full-width rule, `var(--header-rule-width) solid var(--header-rule)`, inside the same 36px
> (`--group-header-height`, rule included). Each caller leaves `--band-body-gap` (= `--header-gap`,
> 12px) below the rule. Colour appears in a header only where it is the information (a hue
> legend), and a legend always goes in the `end` snippet, at the row's right end before the
> counter, so every header with a legend places it the same way. Story markup uses only the type
> roles (`font: var(--type-X); letter-spacing: var(--tracking-X)`): "Layer" in `--type-text` in
> `--caption-ink`, the pad page name in `--type-strong` in `--value-ink`. Where the text below says
> hairline, `--line`, `--m`, 14px or 12px for the row, read this note.

> **One baseline (PR #550).** The row aligns its items by baseline (`align-items: baseline`), and an
> empty `::before` strut `--header-baseline` (28px) tall puts that baseline 28px from the top, so the
> title, the ChosenTabs labels (their blocks then stand on the hairline), "Layer", an AccentBlock and
> the counter share one line in every header. A child that groups several items (FaderBank's
> "Layer" word and layer tabs) shares it when it aligns its own items by baseline and doesn't
> stretch; a short hairline stands on the row's end lifted `--separator-lift`, like Separator.

## Identity (all stations)

- **Kind:** primitive (D16; was complex, D9)
- **Built from:** — (its stories and crops mount ChosenTabs and AccentBlock as children): the component itself imports neither and takes what follows the title as one `children` snippet, which each parent fills with its own children.
- **Purpose:** The hairline row that names a group of controls ("Faders", "Knobs", "Pads", "Transport", "Tempo") and holds the group's page tabs or page counter.
- **Boards:**
  - `Stage-Dark.dc.html:224` (Faders, with the fader page and layer tabs), `:292` (Knobs, with the page block and "Page 1/6"), `:320` (Pads, with "Sections", the legend and "Bank 1/5"), `:361` (Transport), `:379` (Tempo, 20px under the transport buttons); light: `Stage-Light.dc.html:200`, `:268`, `:296`, `:337`, `:355`.
  - `Effects-Dark.dc.html:262` (Faders in the Reverb layer: "Faders · Reverb"); light: `Effects-Light.dc.html:246`.
  - The kit's rule: kit › Spacing and shape (36 tall, hairline bottom, content 8px below).
- **Not this component's job:** no store, no API, no Tauri. It draws the row, the title and the counter; what sits after the title (tabs, the knob page block, the pad page name and legend) is the parent's, passed as a snippet. It doesn't draw the 8px below it or the margin above it (the parent's column does), and it has no click of its own.

Its users (each passes its own content):

| User | `title` | `detail` | `children` | `count` |
|---|---|---|---|---|
| FaderBank | "Faders" | the layer word when `mixer.faderLayer` isn't `volume` ("Reverb") | ChosenTabs (fader page), the separator, "Layer" and ChosenTabs (layer) | — |
| KnobBank | "Knobs" | — | AccentBlock (`knobs.pageName`) | `{ label: 'Page', value: '1/6' }` |
| PadBank | "Pads" | — | the pad bank tabs (ChosenTabs); its legend on Sections goes in `end` | — |
| TransportColumn | "Transport", then a second GroupHeader "Tempo" | — | — | — |

## API (Component station)

### Props

Every prop gets a JSDoc comment in the component.

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `title` | `string` | — | The group's name, the heading's text ("Faders"). |
| `detail` | `string \| undefined` | — | A word that qualifies the title, drawn after it as " · {detail}" with the word in `--t` ("Faders · Reverb"). Part of the heading. Empty string: treated as absent. |
| `count` | `{ label: string; value: string } \| undefined` | — | The page counter at the right end, `--type-text`: `label` in `--caption-ink`, a space, then `value` in `--value-ink` ("Page 1/6", "Bank 1/5"). After `end` when both are given. |
| `level` | `2 \| 3 \| 4` | `2` | The heading level of the title. |
| `id` | `string \| undefined` | — | The id put on the heading, so the parent's `section` can use `aria-labelledby`. |
| `width` | `number \| undefined` | — | A fixed width in px (the band's 654, 626, 88), set as an inline `width: <n>px`. Default: fills its container's width (`width: 100%`). |
| `children` | `Snippet \| undefined` | — | What follows the title (below). |
| `end` | `Snippet \| undefined` | — | What sits at the row's right end, before the counter: the header's hue legend, if it has one (below). |

### Events

| Callback | Fires when | Payload |
|---|---|---|
| — | | |

### Slots / snippets

| Snippet | What goes in it |
|---|---|
| `children` | Whatever follows the title, rendered straight into the row (`{@render children?.()}` between the heading and the counter, no wrapper element), so each top-level element is a flex item 12px after the one before (FaderBank's tabs; KnobBank's page block; PadBank's bank tabs). An element with `display: contents` passes its own children up as the flex items. Optional. |
| `end` | THE place a header's hue legend goes (PadBank's section legend, HueLegend), so every header with a legend places it the same way. Rendered in a `span class="end"` (`display: flex; align-items: baseline; gap: --space-12; flex: none; margin-left: auto`) after the children and before the counter, so it sits at the right end on the row's baseline; when `end` is given the counter follows it with the row's 12px gap (its own `margin-left: auto` is dropped). Optional. |

### Visual rules

- **Tokens used:** `--header-rule`, `--header-rule-width`, `--header-ink`, `--header-baseline`, `--caption-ink`, `--value-ink`, `--t`, `--font-sans`, `--type-strong`, `--tracking-strong`, `--type-text`, `--tracking-text`, `--space-12`, and `--group-header-height`.

#### New tokens

Not in `app/src/ui/tokens/*` today. It lands in the orchestrator's tokens contract PR (in `scale.css`) before this component is built; the builder uses it by name and never hard-codes the value (L1).

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--group-header-height` | `36px` | `36px` | the header row's height, hairline included (kit › Spacing and shape) |

- **Row:** a `div`, height `--group-header-height` (36), `box-sizing: border-box`, `border-bottom: var(--line-width) solid var(--line)` (so the content box is 35 tall), `display: flex`, `align-items: center`, gap `--space-12`, `white-space: nowrap`, `font-family: var(--font-sans)` (the snippet's text inherits it), no padding, no background, no `overflow` clipping (a tab's focus ring must not be cut, D6). Width: `width` px, else 100% of its container. No `data-face` or `data-hue`: nothing in the row's own drawing comes from state.
- **Order in the row:** the heading; the `children` snippet's elements; then, at the right end, the `end` snippet and the counter, the first of them pushed there with `margin-left: auto`.
- **Heading:** an `h2` (or `h3`, `h4` by `level`), `margin: 0`, `flex: none`, `--type-strong`, `--header-ink`, with `id` when given. Its markup is exactly, on one template line with no whitespace between the parts: `<h2 {id}>{title}{#if detail}{' · '}<span class="detail">{detail}</span>{/if}</h2>`, so its text content (and accessible name) is exactly `title`, then " · " (space, U+00B7 middle dot, space), then `detail`: "Faders · Reverb". The " · " is a text node in `--m`; the detail `span` is `--t`, same size and weight; no gap but the two spaces (D10).
- **Counter:** a `span`, `flex: none`, `margin-left: auto` (none after `end`), `--type-text` with tabular numerals, `--caption-ink`: `{label}`, one space, then `<span>{value}</span>` in `--value-ink`, on one template line (text content "Page 1/6"). Absent when `count` is undefined.
- **Children:** drawn as given. A child taller than the content box would overflow the row; the band's tallest are ChosenTabs at 34 (`--tab-height-header`), which fill the content box and stand on the rule (their `--tab-block` chosen block touches it).
- **States drawn by:** only `detail`, `end` and `count` change what's drawn; no hover, focus or pressed look (it isn't a control).
- **Type:** DM Sans, sentence case as given, tabular numerals (the counter's "1/6"); one size on the line: title and detail `--type-strong` (13 / 500), counter `--type-text` (13 / 400).
- **Contrast (AA 4.5:1, `tokens/contrast.test.ts`):** `--m` on `--g` (title, " · ", counter label) and `--t` on `--g` (detail, counter value); both rows exist. The `Pads` story's legend (HueLegend in `end`, section-hue text on `--g`) uses the section-hue rows of Stage C6 (new rows, tokens contract PR); with today's tokens light `--intro` (3.87), light `--main` (4.42) and dark `--brk` (4.48) fail, fixed by C6's changed values (light `--main` #19733a, light `--intro` #6e651a, dark `--brk` #986faf; L2, D15).
- **Not checkable in jsdom:** the row's height and hairline, the colours, the counter's right alignment and the children's layout; the six cropped stories and `npm run shots -- GroupHeader` cover them.
- **Motion:** none.

### Accessibility

- **Role and name:** the title is a real heading (`h2` by default), so a screen reader can jump between the band's groups; its name is the title plus " · {detail}" (above). The row itself has no role. The counter is plain text, read after the children.
- **Keyboard:** not focusable; the children's controls are, in DOM order.
- **Tooltip id:** none; the children carry theirs (`mixer.page`, `mixer.layer`).

## Stories (Story station)

Title `Primitives/GroupHeader` (D16), `layout: 'centered'`. Every story renders in dark and light (the toolbar theme). No `Focused` story: it isn't focusable (a tab inside it is ChosenTabs' to show).

**Snippet args (D7, D11).** `GroupHeader.stories.ts` imports `ChosenTabs`, `AccentBlock`, `HueLegend` and ChosenTabs' fixtures `faderPageTabs` and `layerTabs` (from `app/src/ui/ChosenTabs/ChosenTabs.fixtures.ts`, so the tabs carry their `tip` keys), plus `createRawSnippet`, `mount` and `unmount` from `svelte`. The meta's `render(args)` returns `{ Component: GroupHeader, props }` where `props` holds only GroupHeader's own props (`title`, `detail`, `count`, `level`, `id`, `width`) plus `children`, built from the story's `content` arg, and `end`, built from its `endContent` arg (`'legend'`: HueLegend `{ items: args.legendItems }` mounted into a `display: contents` root; `'none'`: no `end`), with the child args below; the child args never reach GroupHeader.

Every snippet is `createRawSnippet(() => ({ render: () => html, setup }))` where `html` is **one root element**, written without whitespace between tags. The root is `<span style="display: contents">` (except `pads`, whose root is its one item), so its children become the row's flex items and take the row's 12px gap. Where a library component goes, the markup has an empty host `<span data-mount="<name>" style="display: contents"></span>`; `setup(root)` mounts the component into `root.querySelector('[data-mount="<name>"]')` with `mount(Component, { target, props })` and returns `() => { unmount(each mounted instance) }`. Plain content uses token values only, no literal sizes or colours:

- **`content: 'faders'`** (`Board`, `FadersLayer`), the root holds three items in this order:
  1. host `page`: ChosenTabs `{ size: 'header', label: 'Fader page (master button)', tabs: faderPageTabs, chosen: args.pageChosen, onchoose: args.onchoosePage, tipAction: args.tipAction }`;
  2. the separator: `<span aria-hidden="true" style="flex: none; width: var(--line-width); height: var(--space-16); background: var(--line)"></span>`;
  3. `<span style="display: flex; align-items: baseline">` holding `<span style="margin-right: var(--space-4); font: var(--type-text); letter-spacing: var(--tracking-text); color: var(--caption-ink)">Layer</span>` then host `layer`: ChosenTabs `{ size: 'header', label: 'Fader layer', tabs: layerTabs, chosen: args.layerChosen, onchoose: args.onchooseLayer, tipAction: args.tipAction }`.
- **`content: 'knobs'`** (`Knobs`): the root is itself the host (`<span data-mount="block" style="display: contents"></span>`): AccentBlock `{ label: args.knobPageLabel, size: 'knob' }` (as `span`, the default, so no `tip`).
- **`content: 'pads'`** (`Pads`): the root is the page name itself, `<span style="font: var(--type-strong); letter-spacing: var(--tracking-strong); color: var(--value-ink)">{args.padPageName}</span>` ("Sections", D12). Its legend is not in `children`: it goes in `end` (`endContent: 'legend'`, HueLegend with `legendItems`: Intro `intro`, Main `main`, Ending `ending`, Break `brk`, Fill `fill`).
- **`content: 'none'`** (`Transport`, `Tempo`, `Level3`): no `children` passed at all.

`padPageName` is never put into the HTML string: the markup holds the page-name span empty, marked `data-text="page"`, and `setup(root)` sets its `textContent` to `args.padPageName`.

`children` gets no argType at all: `app/src/ui/stories.test.ts` treats a `Snippet` prop as content, not a control, and fails any argType that is hidden or disabled, so the stories neither hide nor disable it; the `content` select above stands in for it.

**Controls (axiom 3).** GroupHeader's own props are controls in the default category. The child props a story sets are args mapped into the snippet, grouped with `argTypes.<arg>.table.category`:

| Arg | Control | Maps to | `table.category` | Default |
|---|---|---|---|---|
| `content` | select `faders \| knobs \| pads \| none` | which snippet above | `children` | per story |
| `pageChosen` | select `panel \| style` | ChosenTabs (fader page) `chosen` | `ChosenTabs · fader page` | `'panel'` |
| `onchoosePage` | action `fn()` | ChosenTabs (fader page) `onchoose` | `ChosenTabs · fader page` | `fn()` |
| `layerChosen` | select `volume \| pan \| reverb \| chorus \| delay` | ChosenTabs (layer) `chosen` | `ChosenTabs · layer` | `'volume'` |
| `onchooseLayer` | action `fn()` | ChosenTabs (layer) `onchoose` | `ChosenTabs · layer` | `fn()` |
| `tipAction` | action `fn()` | both ChosenTabs' `tipAction` (L3) | `ChosenTabs · fader page` | `fn()` |
| `knobPageLabel` | text | AccentBlock `label` | `AccentBlock` | `'Style'` |
| `padPageName` | text | the page name's text | `Pads content` | `'Sections'` |
| `endContent` | inline-radio `legend \| none` | whether `end` holds the legend | `end` | `'none'` |
| `legendItems` | object | HueLegend `items` | `HueLegend` | the five section hues |

Every story sets every arg above (the defaults), so a control always exists; only the ones its `content` uses show in its canvas.

| Story | Args (besides the defaults above) | Shows | Crop | Play (interaction check) |
|---|---|---|---|---|
| `Board` | `{ title: 'Faders', width: 654, content: 'faders' }` | the Faders header: title, Panel chosen, the separator, "Layer" and Vol chosen, both on the one `--neutral` block standing on the rule | `Board-{dark,light}.png` (Stage 24,432 654×36) | a heading level 2 named "Faders"; two tablists, "Fader page (master button)" and "Fader layer"; tab "Panel" has `data-tip="mixer.page"`; no text "Page" or "Bank"; click tab "Style" → `onchoosePage` called once with `'style'`; click tab "Pan" → `onchooseLayer` called once with `'pan'` |
| `Knobs` | `{ title: 'Knobs', width: 666, content: 'knobs' }` | Knobs and the six knob page tabs (Style chosen, the neutral block); no page block, no counter (PR #550) | `Knobs-{dark,light}.png` (stale: cut from the old violet block and counter) | a heading named "Knobs"; tab "Style" is selected; click tab "Reverb" → `onchooseBank` called with `'3'` |
| `Pads` | `{ title: 'Pads', width: 666, content: 'pads', endContent: 'legend' }` | Pads, the five pad bank tabs (Sections chosen), then at the right end the five-hue legend (`end`); no counter | `Pads-{dark,light}.png` (stale: recut for the tabs and the legend's place) | a heading named "Pads"; tab "Sections" has `data-tip="padpage.sections"`; the tabs come before the words Intro, Main, Ending, Break, Fill, in that order |

Not built yet: stories for "Faders · Reverb" (`detail`, D10; its `FadersLayer` crop, Effects 24,432 654×36, is already cut), the title alone (`Transport` and `Tempo` crops, Stage 1328,432 and 1328,642 88×36, are cut) and another heading `level`.

Crop positions are `board x,y w×h` in the 1440×900 renders, the same box in the dark and light render. Every cropped story's screenshot includes its children, so `npm run shots -- GroupHeader` also compares the ChosenTabs and AccentBlock it mounts; those must be built first (Stage's build order has them before GroupHeader).

## Done when (Inspect station)

- Every story in the table exists, renders in dark and light, and its play passes (`npx vitest run src/ui`).
- `npm run shots -- GroupHeader` passes for the cropped stories (score at most 0.02, or the Inspect agent judges any difference to be render noise), and axe finds no violation on any story once the tokens contract PR has landed (L2). Until then `Pads` is expected to fail axe in both themes (the legend: light Intro 3.87 and Main 4.42, dark Break 4.48); every other story passes today.
- Only listed tokens are used; no inline colours, no literal sizes in the component or in the story markup.
- svelte-check and lint pass on the folder.

## Decisions

- **D1 · Two snippets.** What every header has (title, the " · " detail, the right-hand page counter) is props; what differs per group (tabs, page block, page name) is the `children` snippet; a hue legend is the `end` snippet (D17).
- **D2 · The title is a heading.** It is an `h2` by default (`level` changes it, `id` lets the parent's `section` use `aria-labelledby`), so the band's groups are headings to a screen reader; the board's plain `span` gave no structure.
- **D3 · Centre, not stretch.** Superseded by the one-baseline note at the top (PR #550). The row always uses `align-items: center`; the board's Faders row uses `stretch`, but its 35-tall tabs fill the 35px content box either way, so the pixels are the same and one rule covers every header.
- **D4 · Children are flex items.** The snippet renders straight into the row, so each of its top-level elements gets the 12px gap, as the board's Faders, Knobs and Pads rows space their items.
- **D5 · Height token.** Superseded by D13: the 36px height is the new token `--group-header-height`, not a literal.
- **D6 · No clipping.** The row doesn't hide overflow, so a focused tab's ring (2px outside the tab) isn't cut at the hairline; the band's widths are fixed and the content fits.
- **D7 · Stories mount the real children.** The cropped stories mount ChosenTabs and AccentBlock into `display: contents` hosts from `createRawSnippet`, since the crops show them and copying their markup would test a fake; the legend and "Sections" are PadBank's own markup, copied as given above.
- **D8 · Counter as a prop.** "Page 1/6" and "Bank 1/5" are one `count` prop (`--type-text`, label `--caption-ink`, value `--value-ink`, at the right end) rather than snippet content, since both banks draw it identically.
- **D9 · Kind complex, title `Components/` (now a primitive, D16).** Its stories and crops are built from ChosenTabs and AccentBlock, so it is listed as complex (Built from both) and titled `Components/GroupHeader`, though the component itself imports neither and only renders `children`.
- **D10 · Heading text.** The heading is written on one template line with the separator as the text node `' · '`, so its accessible name is exactly "Faders · Reverb" with no stray whitespace; `FadersLayer` checks `textContent`.
- **D11 · Snippet shape and controls.** Each story snippet is one `display: contents` root holding the items in the order above, the mounted children get their props from story args grouped by child with `table.category` (axiom 3), and the ChosenTabs get `onchoose` and `tipAction` as `fn()` actions and their tabs from ChosenTabs' fixtures (`faderPageTabs`, `layerTabs`), not inline arrays.
- **D12 · "Sections" label.** The pad page name is a plain `span`, `--type-strong` in `--value-ink` (a name, so the stronger weight of the line's one size); the legend is HueLegend's.
- **D13 · New token (L1).** `--group-header-height: 36px` lands in the tokens contract PR, since axiom 2 allows no literal sizes in a component; story markup likewise uses only `--space-*`, the type roles (`--type-*`, `--tracking-*`), `--line-width` and colour tokens.
- **D14 · Pads fails axe until the tokens land (L2).** The legend's section-hue text uses WaitingChip's new hue-on-ground rows and changed values; `Pads` fails axe in both themes until the tokens contract PR lands.
- **D15 · Legend hues are Stage C6's (review).** The values D14 borrowed from WaitingChip (#1c7e3f, #796f1c, #9063a9) passed on `--g` only; WaitingChip D11 now uses Stage C6's (light `--main` #19733a, `--intro` #6e651a, dark `--brk` #986faf), which pass on `--g` and `--btn`, so the legend reads the same tokens at the same values as every other spec.
- **D16 · A primitive, title `Primitives/` (PR #550; replaces D9).** The component imports no other component of the library, so by axiom 11 it is a primitive and titled `Primitives/GroupHeader`. Its stories still mount ChosenTabs and AccentBlock as `children`, and HueLegend as `end`.
- **D17 · The legend's one place (owner's call, PR #550).** Colour shows in a header only where it is the information (a hue legend), and every header with a legend puts it in `end`: at the row's right end on its baseline, before the counter when both are given. A prop-level slot rather than "somewhere in `children`" keeps that placement the same in every header.
