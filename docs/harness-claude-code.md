# Harness: Claude Code

How to make a Claude Code mod with zen: the kit it draws with, the rules its look follows, what the engine accepts, how a zen theme pack becomes its colours, and how to check it. This is the reference; awesome-claude's skills (`mod-authoring`, `storybook-prototyping`, `headless-verification`) point here. For the engine's API itself (events, `$`, elements, `ui.render`, `$.state`), use the engine's own `plugin-authoring` skill and grep the types it names; don't guess the API.

## What the harness is

A **mod** is a Claude Code plugin that adds interface to Claude Code itself: a pane, a slash command, a hook on tool calls or prompts. Its panes draw on four surfaces: the terminal (text cells), the desktop app (a side pane, laid out by flexbox), VS Code and mobile. The terminal and the desktop are the two that matter in practice; VS Code and mobile take the desktop's tree.

A **harness** is what zen gives one agent's plugin system: a kit of components written in that engine's own JSX, the mapping from zen's theme packs onto what that engine's surfaces can draw, a browser bench that draws engine trees as each surface lays them out, and Storybook stories. Claude Code is the first. Its users are:

- **awesome-claude** (`satoramoto/awesome-claude`): the overview, issues, launcher, lab, filetree and blast-radius mods. The kit lived there first (`kit/`); it now lives here and is copied in at build time.
- **syns** (`satoramoto/syns`): its session tooling, built the same way.

## Layout

```
src/harness/
  shared/              what every harness shares (colour maths: color.ts)
  claude-code/
    kit/               engine code, copied verbatim into each plugin
      ui.tsx           the components, grid constants, terminal glyph tables, holdButtons, flow
      tokens.ts        colours (C, INK, RAMP, MUTED, GRAY, FILL, TRACK, FILE_TYPE), GLYPH, STATUS, TREE, the terminal mapping, wear()
      icons.ts         stroked icons and GitHub Octicons as crisp SVG (iconSvg, ICON_PX)
      format.ts        tokens, duration, short, ago, bytes, money, pct, middle, basename
      perf.ts          timing a mod's own work, for the perf footer
      skin.ts          the Skin type: one colour per meaning
      skins.ts         every pack's skin as plain data (generated)
    skins.ts           how a zen palette becomes a skin (zen-only, never copied)
    skins.test.ts      checks kit/skins.ts is current and every skin keeps its meanings apart
    bench/             the browser bench: render, text, client, engine, host and show, ported from awesome-claude's playground
    stories/           Storybook, under Harness/Claude Code/…: Kit, Skins, Sample mod
    sample/            a sample mod
    storybook.ts       the toolbar globals (Surface, Pane theme, Pane frame, Width, Skin) and the decorator
    engine.d.ts        a loose stand-in for the engine's types, so zen type-checks
    tsconfig.json      the engine-JSX project
```

- **`kit/`** is the only part a plugin carries. It imports nothing outside itself except types from `claude-code`, so it runs as is inside the engine.
- **`skins.ts`**, **`bench/`**, **`stories/`**, **`storybook.ts`** stay in zen. `skins.ts` and `storybook.ts` read zen's React library and live in the root TypeScript project.
- **`engine.d.ts`** names only the shapes the harness reads (`RenderSurface`, `RenderElement`, `RenderNode`, the global `h` and `Fragment`, JSX over the element table), as loosely as the engine allows. It is never copied into a plugin: a mod is type-checked against the engine's real types, which the engine lays beside a mod it loads.
- **Two TypeScript projects.** The engine compiles JSX classically against its global `h` and `Fragment`, never React's runtime, so `src/harness/claude-code/tsconfig.json` (`"jsx": "react"`, `jsxFactory: "h"`, `jsxFragmentFactory: "Fragment"`) covers `kit`, `sample`, `stories`, `bench` and `engine.d.ts`, and the root `tsconfig.json` leaves them out. `npm run typecheck` checks both.
- **A second harness** (Codex, or any other agent) sits beside it the same way: `src/harness/<name>/` with its own kit, mapping, bench and stories, and anything both need moves to `src/harness/shared/`.

### How a consumer gets the kit

The engine loads a plugin's own source files only and refuses any import from outside the plugin's folder (symlinks included). So the kit can't be imported from a package: it is **copied** into each plugin at build time.

- **awesome-claude** depends on `"@satoramoto/zen": "github:satoramoto/zen#<sha>"`. Its `build.ts` copies `node_modules/@satoramoto/zen/src/harness/claude-code/kit/` into `plugins/<mod>/kit/` and rewrites each `@kit/…` import in the mod to a relative path. For live work against a zen checkout, `ZEN=~/Code/satoramoto/zen bun build.ts` copies from there instead.
- **syns**' `build.ts` copies from a zen checkout beside it (`../zen`, or `$ZEN`).

The kit is reached by path (`package.json` exports `./harness/*` as `./src/harness/*`, and `files` includes `src/harness`), not through zen's built `lib/` entries. That's an exception to AGENTS.md's public-entries rule, because the engine needs source, not a bundle.

## Making a mod with zen

From an empty folder to a validated, tested plugin. awesome-claude's layout and `build.ts` are the reference; copy them rather than inventing another.

1. **The repo.** Two folders: `mods/<name>/` (a mod's source, importing the kit as `@kit/…`) and `plugins/<name>/` (the compiled mod, generated, committed, what Claude Code loads and a marketplace installs). Add zen as a dependency, `"@satoramoto/zen": "github:satoramoto/zen#<sha>"`, and gitignore `.claude-plugin/types/` (laid by the engine) and `node_modules/`.
2. **The build.** A `build.ts` that, for each `mods/<name>/` with a `.claude-plugin/plugin.json`: copies every file to `plugins/<name>/`; copies the kit (from `node_modules/@satoramoto/zen/src/harness/claude-code/kit/`, or `$ZEN/src/harness/claude-code/kit/`) to `plugins/<name>/kit/`, leaving out `*.test.ts`; rewrites `from '@kit/x'` and `import('@kit/x')` in `.ts`/`.tsx` files to the relative path from that file to `plugins/<name>/kit/x`; writes only files that changed (so a loaded mod reloads only for real changes); removes files the sources no longer have; and never touches `.claude-plugin/types/`. Nothing else changes, so `plugins/` stays readable source. A `--watch` flag rebuilds on save.
3. **The mod's files** (awesome-claude's `mods/issues/` is the smaller template):

   | File | What it holds |
   | --- | --- |
   | `.claude-plugin/plugin.json` | `{ "name", "version", "description", "author", "types": "./types/index.d.ts" }` |
   | `hooks/hooks.json` | `{ "modules": ["./register.tsx"] }` |
   | `hooks/register.tsx` | `export const register: Register = on => { ... }`: every hook |
   | `hooks/view.tsx` (any name) | the drawing, as pure functions of elements and data, so stories and tests can call them |
   | `hooks/<name>.test.ts` | render and behaviour tests for `claude plugin test` |
   | `types/index.d.ts` | the state contract: value types, and `declare module 'claude-code' { interface PluginState { <name>: { ... } } }` |
   | `tsconfig.json` | `{ "extends": "./.claude-plugin/types/tsconfig.json" }` |

4. **State.** Every value a drawing reads lives in `$.state`, declared in `types/index.d.ts` under the mod's name; `claude plugin validate` holds each key the module names to that contract. Declare atoms once at module top (`const list = atom({ plugin: 'issues', key: 'list' } as const, null)`), read with `await read($, list)` inside `ui.render`, write with `await update($, list, old => next)` from handlers and timers. A write redraws every reader, so write only on a real change. Module variables (timers, caches) start over on each reload; `$.state` survives it.
5. **The pane.** Open it with `$.ui.open({ id, title })` (from `session.start` and from the mod's `/command`), and draw it in `on('ui.render', { component: 'Pane', requestId: id }, async ($, e) => …)`. In the render: do the awaits first (state, `$.clock.now()`), then `const els = holdButtons($.ui.resolve(e), e)` and `const k = kit(els, e.surface, e.props.bodyColumns, { focused: e.props.isFocused })`, and build the tree. Draw the terminal and the app surfaces separately where they differ (`renderTerminal` / `renderApp` in awesome-claude's issues mod).
6. **A skin.** To wear a zen pack other than the default, call `wear('<pack id>')` at the top of the hooks module, before anything draws (see "Skins").
7. **Work only while shown.** Copy issues' pattern: an `isShown($)` check over `$.ui.panes()` cached for 2 s; one `$.clock.every(5_000, …)` started in `session.start` (cancel the previous one first: it fires again on reload); events only mark data stale and never fetch themselves; watching hooks end in `.catch(($, e, next) => next(e))` so a failure never blocks the tool call.
8. **Handing work to the session.** A button that asks Claude to do something submits a prompt as the person: `void $.prompt.submit({ text, asUser: true }).catch(() => $.ui.toast('…'))`. Build the text in an exported function so it can be read and tested alone.
9. **Build and check.** `bun build.ts`, then `bunx tsc -p plugins/<name>` (after laying the engine's types; see "Checks"), `claude plugin validate plugins/<name>`, and `claude plugin test plugins/<name>`. Load it for real with `claude --plugin-dir plugins/<name>`.
10. **Publish.** A marketplace lists each plugin in `.claude-plugin/marketplace.json` (`name`, `source: ./plugins/<name>`, `description`, `version` equal to `plugin.json`'s); `claude plugin validate .` checks it. Installs only update when the version changes, so any change to a plugin's compiled output, a kit change included, raises its version in both places.

## The inspector: design rules

The look is an instrument inspector (think Premiere's Effect Controls):

- **One column of sections** per flow column, each a collapsible header row: icon, title, figures, then the fold arrow last, flush right. Its properties sit indented under it. A reading is label, thin flat gauge, value, dim unit, in fixed columns.
- **Containers are quiet rounded fills, never outlines.** On the app surfaces a section's header band, a `collapsibleList`'s header band, a `tile` and the footer band are `card`s: a see-through fill with corners rounded at `RADIUS_PX` (6px, the Claude Code pack's card radius). A section's or list's body has no fill of its own: a list's items sit on the pane under its header, each padded alike, with a `TRACK` hairline (grey, never a hue) under the header and between items, and a single-line row never takes a tile. Structure comes from space and fill, never a coloured line; sections sit `SPACE.group` apart. No bubbles, borders or game words (HP, LV, party). The one border in awesome-claude's mods is blast-radius's warning hold, a band that must stop the person.
- **Bars are rounded only by SVG end caps** (`capped`, `gauge`, `bar`), never borders on thin bars.
- **Colours only from `kit/tokens.ts`, each meaning one thing:** grey labels and icons, slate quantity, blue live or in progress, amber needs attention (near a limit, 75%+; waiting on the person, as an approval; top priority, as a P1), red failed (90%+), green done well, purple merged. Colour only where it carries meaning. Cyan and orchid only tint parts within one chart. Nothing else is coloured. On the terminal no fixed hex is drawn at all.
- **One contrast ladder, by role, not by component** (`TEXT_ROLES`, drawn with `k.role(r)`; `k.press(key, label, r, onPress)` for a press in a role):
  - **L0 primary** (default foreground): section titles (bold), item titles. The title is the brightest thing in its row.
  - **L1 secondary** (`GRAY.light`): what's read after a title: a subtitle (a `next:` step, a decision, a repo name), a link.
  - **L2 meta** (`GRAY.mid`): what's scanned past: header figures (number and word together), ages, notes ("N not shown", "No agents running."), every action's label, an inactive tab. Actions are quieter than content: on the app surfaces `action` draws its label as meta Text under a Button of `BLANK`s, since the desktop draws a Button's own label uncoloured at full brightness.
  - **L3 mark** (`GRAY.dark`): structure: fold arrows (▶/▼), a ⋮, a waiting ◌, and a section icon without an identity colour.
  - **Glance colour.** The ladder is for text; colour and icons carry meaning so a pane reads at a glance. Every list item leads with an icon in its state's colour (a running agent blue, a done ✓ green, a PR's state icon in its colour). A header count is coloured when it signals something (approvals waiting amber, failing PRs red, live agents blue) and stays grey at zero.
  - **Wayfinding colour** is the one colour that isn't a state, and it's allowed on a section's header icon only (`iconColor` on `section` and `collapsibleList`): never a stripe, a fill or the title. Each section takes its own from `WAYFINDING` (the skin's palette hues and role hues, cyan and orchid, less any within reach of a state colour or of one another), none twice, so the icon says "this is Doing" at a glance. A skin offers five or six; past that, the rest go without. On the terminal no fixed hex is drawn, so an `iconColor` draws the icon plain, in the default foreground: a step brighter than the default dim mark, not a hue.
  - **Status** (`C.*`): colour means state only: a CI mark, a live count (a `summary` figure the caller colours), a done ✓ (`C.ok`).
  On the terminal, primary is plain and the other roles dim (`TERM_ROLES`). Say each thing once.
- **Text:** bold only titles (and a header's first figure on the terminal), uppercase only captions. Section and list titles are one step up the engine's type scale (`size="heading"`) on the app surfaces; everything else is body size.
- **Spacing only from `SPACE` and `EDGE`** on the app surfaces, `k.space` and `k.edge` on the terminal; never raw numbers.
- **Draw with the kit's components** rather than raw boxes and colours. A `renderTerminal` that only calls `Text` with glyph strings means something is missing from the kit: add it there.
- **Text never wraps; it truncates:** `wrap="truncate"` on the `Text` and `minWidth={0}` (with `flexShrink={1}`) on every Box between it and the row, or the box refuses to shrink below its content and overflows.
- **Columns on a wide desktop pane.** Draw sections through `k.flow('sections', [...])` (or `flow(Box, e.surface, columns, key, blocks)` without the kit). From 82 reported columns two, from 124 three (`FLOW_MIN` 40, `FLOW_MAX` 3), each section whole, read down then across, balanced by estimated rows; narrower, and always on the terminal, the blocks come back unchanged. Size anything cut by hand to `k.flowColumns(n).width`. The column view has a switch: keep `columns: boolean` (initial `true`) in the state contract, pass `kit(els, surface, columns, { flow: { on, toggle } })`, and end the desktop pane with `k.perf(...)` or `k.footer()`, which draw the quiet `columns` / `single column` action where the pane is wide enough to split.
- **Say each fact once.** A header's figures restate a folded body; when they only restate the readings under them, pass `restated: true` so they show only while the body is hidden. Keep a row's actions beside what they act on (`item`'s `after`).

## The kit

Read each component's doc comment in `kit/ui.tsx` before using it; this is the map.

**Getting it.** `kit(els, surface, columns, opts)` returns the components for one drawing. `els` is `$.ui.resolve(e)` (through `holdButtons`), `surface` is `e.surface` (`terminal`, `desktop`, `vscode`, `mobile`), `columns` is `e.props.bodyColumns`. Options (`KitOptions`): `focused` (the pane has the keyboard; left out, it counts as focused; read back as `k.focused`), `measure` (the widest the terminal draws sections: `MEASURE`, 72, for a dashboard of readings; leave it out for a list that wants every cell), `flow` (the column switch).

**Components** (`k.<name>`):

| Group | Components |
| --- | --- |
| Structure | `section` (collapsible header row, figures on the right, body indented; `restated`, `keepRight`, `loading`), `card` (a container's rounded fill), `summary` (a header's figures, meta, a number coloured only when the caller marks it live, and its loading, stale or failed state), `flow`, `flowColumns`, `flowToggle`, `footer`, `caption`, `pinned` |
| Readings | `reading` (label, gauge, value, unit), `gauge`, `bar` (parts, `room` parts for free space), `capped`, `rounded`, `rail`, `prop` (label and value; `path: true` cuts in the middle), `legend` (`{ bar: true }` to key a bar), `swatch`, `pill` (a label's own colour on one swatch) |
| Charts | `columns` (counts per bucket), `spark` (a series over time), `scale`, `axis` |
| Lists | `item` (`[tree][lead] text  note ……… right`, with `after`, `selected`, ranked `RightPart`s that drop in order, `path`), `status` (a status's glyph and word), `collapsibleList` (a list's section: its header band the one fill, `iconColor` for its icon's identity hue, its items under it on the pane, a `TRACK` hairline under the header and between items; `section` stays for bodies that aren't lists, and takes `iconColor` too), `listItem` (its two-line item: a fixed lead slot, icon or short badge, centred on the title's line; the title primary, cut to one line, `bold`, or `dim` for secondary; `right` figures (meta) and controls on that line; a secondary `subtitle` (`subtitleRole: 'meta'` for one waiting its turn) that cuts, or wraps on the desktop (two lines on the terminal), with `meta` and an end `mark`, `subtitleLead` for a ✓ before it; an optional fold over `children`, its arrow a mark), `tree`, `tile`, `note` (`empty`, `loading`, `error`; `lines: 2` for a message that names the fix) |
| Controls | `action`, `actions` (plain Buttons, `quiet`, `hotkey`, `autoFocus`, `tone: 'danger'`), `tabs` (a pane's tab row; the caller holds the active tab in its state and draws its body under it), `hints` (the terminal's key-hint line, only while focused) |
| Footer | `perf` (the mod's own timing, from `kit/perf.ts`), `share` |
| Pieces | `icon(key, color)` (SVG where the surface has it, the glyph on the terminal), `ink(color)` (Text props for a colour on this surface), `role(r)` (Text props for a rung of the ladder: `primary`, `secondary`, `meta`, `mark`), `press(key, label, r, onPress)` (a press drawn in a role: on the app surfaces its label as Text under a Button of `BLANK`s), `space`, `edge`, `width` (the section body's width on the terminal), `terminal` |

**Module exports** besides `kit` (`kit/ui.tsx`):

- `holdButtons(els, scope)`: call once per render, after its awaits, and draw every Button of that render with the table it returns (pass it to `kit` too). The engine gives each Button a new handle per drawing and frees the old one when a drawing leaves it out; a press reaches `onPress` by handle alone, so a redraw between drawing and click left the press on a freed handle. `holdButtons` keeps a Button whose key, props and children match the last render's as the same element, so its handle survives and its press runs the latest `onPress`.
- Grid: `SPACE` (`pair` 0.75, `item` 1.25, `group` 2, `block` 0.8) and `EDGE` (`left` 1.6, `right` 1) for the app surfaces; `CELLS` (`pair` 1, `item` 1, `group` 2, `block` 1) for the terminal; `MIN_COLUMNS` 30; `MEASURE` 72; `BAND_ROWS` 1.3 (a header's or footer's fixed height on the app surfaces); `FLOW_MIN`, `FLOW_MAX`, `flow`, `flowColumns`, `flowSplits`, `rowsOf`.
- Terminal glyph tables: `METER`, `FOLD`, `MARK`, `SPARK`, `PERF_GLYPH`; `TERM_ROLES` (the text roles); `fold()` (the desktop's ▼ ▶︎); `BLANK` (U+2800).
- Types: `Els`, `Kit`, `KitOptions`, `FlowSwitch`, `FlowOptions`, `Part`, `RightPart`, `Hint`, `Tab`.

**`kit/tokens.ts`:** `C` (`ok`, `warn`, `bad`, `blue`, `purple`, `cyan`, `slate`, `orchid`), `INK`, `RAMP` (`blue`, `slate`: base, darker, lighter, darkest), `TRACK`, `FILL` (`head`, `tile`, `selected`, `selectedBlurred`, `pill`), `MUTED`, `GRAY` (`light`, `mid`, `dark`: the ladder's L1, L2 and L3), `WAYFINDING` (section icon colours, clear of the states), `FILE_TYPE`, `levelColor(pct)`, `tint`, `GLYPH`, `STATUS` (each status's glyph and colour), `TREE`/`treePrefix`, `THEME_KEY`, `TERM_TINT`, `termInk` (and `TermInk`), `isKitColor`, `SKIN`, `wear`.

**`kit/icons.ts`:** `iconSvg`, `ICON_PX` (13): stroked icons on a 16×16 grid keyed by `GLYPH`, drawn at one exact pixel size so they stay crisp, plus GitHub Octicons (`issue-opened`, `comment`, `pr-open`, `pr-merged`, `pr-closed`, `pr-draft`, the branch) copied unchanged into `FILLED`. Draw them through `k.icon(key, color)`. An icon button on the desktop is the icon with a Button over it labelled with two `BLANK`s; screen readers hear it as unnamed until the engine gives a Button an accessible name apart from its label, so the icon's `alt` carries the name.

**`kit/format.ts`:** `tokens` (950, 1.2k, 84k, 1M), `duration` (12s, 3m 05s), `short` (47m, 2h05), `ago` (5m, 3h, 2d), `bytes`, `money`, `pct` (whole percent, as the desktop needs), `middle` (cut in the middle: `src/…/view.tsx`), `basename`.

**`kit/perf.ts`:** `perf.start(name)`, `perf.time(name, fn)`, `perf.count(name)`. Each plugin carries its own kit copy, so these are that mod's numbers. Recording never redraws.

### Statuses and glyphs

Draw a state with `k.status(kind)` or `STATUS`, never by hand: running `◐` blue, pending `◌` blue, done `✓` green, failed `✕` red, warn `▲` amber, merged `◆` purple, stopped `■` dim, idle `○` dim. One glyph set: `✕`, never `✗`.

Every glyph is one cell wide and none has Unicode's Emoji property (no ⚠ ⚡ ⚒ ⏱ ↕ ◼ ⬛ ✅): some terminals draw those as emoji, two cells wide. Check a new one with `bun -e "console.log(/\p{Emoji}/u.test('⌘'))"` (false is right), and put it in one of the tables (`GLYPH`, `STATUS`, `TERM_GLYPH`, `METER`, `FOLD`, `TREE`, `MARK`, `PERF_GLYPH`, the spark glyphs) so the kit's glyph test sees it. No variation selectors on the terminal; `fold()` (▼ ▶︎ with U+FE0E) is the desktop's only. Some geometric glyphs (`◐ ◌ ◉ ○ ◆ ■ ▲`) are East Asian Ambiguous width, two cells in CJK-configured terminals: keep the kinds used few.

| Use | Glyphs |
| --- | --- |
| Fold | `▾` open, `▸` closed (`FOLD`), dim; the desktop keeps ▼ ▶︎ |
| Gauge | `━` fill to the half cell `╸`, on a dim `─` rail |
| Bar | each part `━` in its own solid colour to `╸`; `room` parts `─` in their colour; the rest a dim `─` rail |
| Scale | dim `╵` ticks at 0/25/50/75/100%, `▴` marker |
| Columns | `▁▂▃▄▅▆▇█`, to the eighth of a row |
| Sparkline | Braille (`SPARK`), two points a cell, four levels a row; `glyphs: 'blocks'` for the eighths |
| Legend key | `■`; keying a bar, the bar's `━`, `─` for room; `●` on the desktop |
| Selected row | `▌` (`MARK.selected`) in `suggestion`, in a one-cell gutter |
| Key hints | ` · ` between pairs, `…` when some are dropped |
| Stale figures | dim `↻` and the age; failed refresh amber `▲` |
| Tree | `├─` `└─` `│ ` (two cells a level) |
| Icons on the terminal | issue `◉`, comment `≡`, PR open `⇡`, merged `◆`, closed `✕`, draft `◌`, file `□`, folder `▸`/`▾`, commit `○`, up `↑`, alert `▲`, trash `⌫`, search `⌕`, sync `↻`, home `⌂`, eye `◎`, fold `⇕`, events `↯`, tools `⌘`; anything else `•`, never the icon's name |

Never shades or dithers (`▓ ▒ ░`, `█` runs in a bar): real terminal fonts draw them as a checkerboard. Neighbouring bar parts differ by tone (default foreground, dim, a theme key).

### The terminal: grid, look and states

The terminal draws the same inspector in cells; `kit(els, 'terminal', e.props.bodyColumns)` gives it.

- **Whole cells only.** Use `k.space` and `k.edge` (left 2, right 1), never `SPACE`, whose fractions round unevenly in cells. Figures stop one cell short of the edge.
- **Indent.** A section body starts 2 cells in (the fold-arrow gutter), under the header's icon. Each tree level adds 2.
- **A reading's columns:** label 10 | gauge (the rest) | figure 5 | unit 6, one cell apart, figures right-aligned. Under 6 cells of gauge the label narrows to 6, then the gauge goes and the figures stay.
- **Exact widths.** Bars, gauges, scales, axes and chart columns draw to `k.width` (the measure or the pane, less the gutter and the right margin). Something deeper takes `width` explicitly. Never size from a guess (`columns - 20`).
- **Rows.** Every section leaves one blank row under it, open or folded. Inside a body no blank rows except one between blocks (`k.space.block`).
- **The narrow floor.** Below `MIN_COLUMNS` (30) each section draws its header and figures only, so its figures must say what matters on their own.

**The look, "rules"** (after lazygit and gh-dash, kept quiet):

```
◕ Context     31% of 200k ─────────────────────────── ▾
  ━━━━━━━━━━━━━━━╸─────────────────────────────────────
  ━ System   17.3k   ━ MCP        6.4k   ━ Messages 37.3k
  ─ Free      106k   ─ Buffer      33k

◔ Limits      96% weekly ──────────────────────────── ▸
```

A header is the dim icon in the gutter, the bold title in a 10-cell column, 2 cells, the figures (starting on the same column in every header), one cell, a dim `─` rule taking the room left, one cell, then the dim fold arrow, flush right, which never gives way. Narrow, the title's column gives way first (down to 12 cells), then the figures are cut with `…`. `keepRight: true` keeps a right side of controls whole and cuts only the title.

The text roles are `TERM_ROLES`, the one place to tune the hierarchy: two tones and one weight. Title bold; label dim; value plain; strong (a header's first figure, the one that matters) bold; secondary dim; meta (units, ages, counts) dim. A figure in a status colour keeps its role's weight. Structure has no colour: no `claude` orange, no status colour on a title, rule or icon. No italics anywhere (real terminal fonts draw them oddly or not at all). No second accent tone. Never draw your own rule, leader dots or band.

**States**, in a section's figure slot so they show when folded: loading before the first data (`section({ loading: true })` or `summary([], { loading: true })`: the pending `◌`, and a dim `note(..., 'loading')` in the body); stale (`summary(items, { age: '2m' })`: dim `↻ 2m` before the figures); failed refresh (`{ failed: true, age }`: amber `▲` and the age; keep the figures and the body); failed with nothing to show (an error `note` whose second line names the fix: `Couldn't read issues` / `run gh auth login`).

**Lists.** Every list uses `item`. In a list that takes the keyboard pass `selected` on every row; the selected one gets `▌` in `suggestion` and bold text, dimmed while the pane isn't focused. Never mark selection with orange. `hints` draws `r refresh · ↵ open` under it, keys plain and what they do dim; never a key inside a word (`[r]efresh`).

**Checking it in a real terminal.** The bench is an emulator with a browser font. Before calling a terminal look done, run Claude Code in a tmux pty with only your build loaded (`claude --settings '{"env":{"CLAUDE_CODE_PLUGIN_DIRS":"<repo>/plugins"}}'`), open the pane (it docks beside the transcript from 110 columns; drag its divider with SGR mouse escapes), preview light themes live with `/theme`, `/reload-plugins` after a rebuild, and capture with `tmux capture-pane -e -p`, rendered with a real monospace font. Kill the tmux server when done.

## What the engine and the desktop accept

Found by probing the engine's validator (first on 2.1.293) and measuring the real desktop pane (2.1.295); awesome-claude's mods are tested on 2.1.296. awesome-claude's `lab` mod holds the experiments (`/lab`, `/lab <id>`, `/lab gallery`) and `mods/lab/verdicts.json` the engine's verdict on each per surface; re-check there when the engine changes.

**The engine:**

- It reads a plugin's source as is and refuses any import from outside the plugin's folder, symlinks included. Hence the copy.
- Hooks run in a sandbox: no filesystem, network or process except through `$` (`$.process.run` and the like).
- **Read tokens when drawing; never capture them in module-level constants.** `wear()` recolours the kit's objects in place and reassigns `INK` and `MUTED` (live `let` exports), so `const ACCENT = C.blue` at module top keeps the colour from before the skin, and on the terminal it no longer maps to its theme key. Read `C.blue`, `INK`, `STATUS.done.color` inside the render, or in a function it calls.
- **Render hooks:** do the awaits first, then build the tree; draw every Button through `holdButtons`; return a tree the surface accepts or the engine draws its own and reports the refusal in the transcript (`issues: ui.render (Pane) refused: <reason>; the engine drew its own`). Fix every such line. `session.start` fires again on each reload, so cancel timers you started before.
- `Input` doesn't exist on mobile.

**The desktop (and VS Code, mobile):**

- **Units.** Any number is accepted for margin, padding, gap, width and height, fractions included; the validator refuses only non-numbers and percentages that aren't whole (`25.5%`; use `pct()`). There's no spacing scale to snap to, so `SPACE`/`EDGE` are the scale. Horizontal units are columns, ~7.8px (width, minWidth, paddingX/Left/Right, marginX/Left/Right, columnGap, `gap` in a row). Size units are rows, ~19px (height, minHeight, top, bottom: `height={3.5}` is 66.5px). Vertical spacing is half a row, ~9.5px (marginTop/Bottom/Y, paddingTop/Bottom/Y, rowGap, `gap` between rows), so `marginTop={1}` is half a text line.
- **`flexGrow` ≤ 10000.** No Box `hover`.
- **Row heights follow content.** A native Button, a Link or an icon isn't exactly a text line tall, so bands (headers, the perf footer) take a fixed `height: BAND_ROWS` instead of vertical padding.
- **Borders.** `round`, `single`, `double`, `bold`, `classic` draw; `dashed` doesn't. A colour the desktop doesn't know, `transparent` included, draws in the text's colour, so a "transparent" border is a visible outline. There's no corner radius for a fill, and a border to round one is an outline, so the kit rounds a container's fill with SVG instead (`card`): the fill is a ground placed behind the content (`position="absolute"`, all four offsets 0), its top and bottom edges each two RADIUS_PX quarter-disc SVGs and a stretched middle, a plain fill between.
- **Backgrounds.** Hex and `rgba()` fills draw. The engine gives a render hook no desktop theme to read, so fills are see-through neutral tints that read on the light pane and the dark one.
- **SVG** is drawn as an image the page scales, so it blurs as the pane resizes: keep it to small fixed-size pieces (bar end caps, icons at `ICON_PX`) and draw the rest with boxes and text.
- **Buttons draw their `label` alone**, uncoloured (`dimColor` dims it), never their children or the children's styling. A coloured action (`tone: 'danger'`) is a coloured Text with a Button of `BLANK`s laid over it; an icon button is the icon with such a Button over it.
- **One value on both panes.** The desktop draws the same colour on its light and dark themes, so each colour is tuned on the dark pane and checked on the light one.

**The terminal:** no fills, no fixed colours (see "Skins"), whole cells, no italics, no emoji-presentation glyphs, no variation selectors. Text never wraps: a long line needs `wrap="truncate"` and `minWidth={0}` on the boxes around it.

## Skins: how a pack maps to each surface

A **skin** (`kit/skin.ts`) is the colours the kit draws with on the app surfaces, one `#rrggbb` per meaning: `ok`, `warn`, `bad`, `blue`, `purple`, `cyan`, `slate`, `orchid`, the `ramp` (blue and slate, four shades each), `muted` and `gray` (light, mid, dark). Every zen theme pack gives one.

**On the terminal, never a fixed colour.** Each meaning is drawn in the engine theme key that means it, whatever the skin, so a mod follows the person's terminal theme (dark, light, colour-blind, ANSI-only):

| Meaning | Token | Terminal |
| --- | --- | --- |
| done well | `C.ok` | `success` |
| failed, 90%+ | `C.bad` | `error` |
| near a limit, 75%+ | `C.warn` | `warning` |
| live, in progress | `C.blue` | `suggestion` |
| merged | `C.purple` | `merged` |
| labels, units, quiet marks | `MUTED`, `GRAY.*`, `TRACK` | `dimColor` |
| quantity | `INK` / slate | default foreground |
| shades of quantity in one chart | `RAMP.slate` | default foreground and dim in turn (`TERM_TINT`) |
| shades of live in one chart | `RAMP.blue` | `suggestion` and dimmed `suggestion` in turn |
| other chart parts | cyan, orchid | cyan default foreground, orchid dim |
| not a kit colour | any other hex, `rgb()`, `hsl()` | default foreground |
| a theme key's name | `success`, `claude` | itself |
| a file's type | `FILE_TYPE.*` | none: `k.icon` draws file icons dim |

`k.ink(color)` (or `termInk`) gives the Text props; the kit's components apply it themselves. `isKitColor(color)` tells a token from data (a GitHub label's hex). The one place data's own hex reaches the terminal is `pill`'s one-cell `■` swatch.

**On the desktop, VS Code and mobile: the palette's dark scheme as `#rrggbb`** (`src/harness/claude-code/skins.ts`, `skinOf`). The desktop gives no theme to read and draws one value on both panes, so the dark scheme it is.

- **States** from the palette's own: `ok` ← `success`, `warn` ← `warning`, `bad` ← `danger`.
- **Live, merged and the chart tints keep their hue.** `blue`, `purple`, `cyan` and `orchid` are each the palette colour (accent, hues, roles, selected; with OKLCH chroma ≥ 0.06 and not a state) nearest in OKLCH hue to the kit's own (`#6c8ef5`, `#9d85e8`, `#4fb3c8`, `#c58ad6`), each colour used once, within 45°, the statuses weighted above the chart tints. A meaning with no colour in reach is rotated from live to its hue.
- **Quantity ink** (`slate`) is the palette's secondary text cooled a quarter towards live.
- **Ramps** step each base darker, lighter, darkest.
- **Greys** from the palette's text 1–3 (secondary, muted, faint).
- **Fills stay neutral.** `TRACK`, `FILL.head` and `FILL.tile` are see-through greys whatever the skin; `FILL.selected` is live's blue at 13% (6.5% unfocused).
- **`FILE_TYPE`** (IntelliJ's New UI icon colours, a light and a dark value each, Apache 2.0) is not skinned.
- **One value per meaning, enforced.** The terminal finds a meaning by its value, so two meanings sharing one would draw wrong; a collision is stepped one unit apart (`apart` in `src/harness/shared/color.ts`). Statuses first, then chart shades; greys may share one another's value, as they all mean "recede".
- **Per-palette tuning (`TUNED`).** A palette may carry values the harness wears in place of the derived ones. The `claude-code` palette's keeps the kit's hand-picked purple, cyan, slate, orchid, ramps and muted, which sit closer to blue than zen's 0.12 OKLab rule allows for palette roles (the kit means them as shades of one family), so the Claude Code pack draws awesome-claude's look exactly. `skins.test.ts` holds the default skin to awesome-claude's old `kit/tokens.ts` values.

**Generated data.** The kit can't import zen's packs (the engine loads a plugin's own files only), so `kit/skins.ts` holds every pack's skin as plain data. After changing a palette, a pack or the mapping, run `npx tsx scripts/harness-skins.ts`; `skins.test.ts` fails until you do.

**Wearing one.** The kit starts in `claude-code`. A mod wears another with `wear('linear')` (a pack id, a key of `SKINS`) or a whole `Skin`, at the top of its hooks module, before the first drawing. `wear` recolours `C`, `RAMP`, `GRAY`, `FILL` and `STATUS` in place, reassigns `INK` and `MUTED`, and rebuilds the terminal mapping so each meaning keeps its theme key; the last skin's values then draw as any other raw colour. That's why tokens must be read when drawing.

## The bench and Storybook

`bench/` draws engine trees in the browser as each surface lays them out, from a mod's own `ui.render` hooks with a stand-in engine. It's the fastest loop for how things look. The stories are under **Harness/Claude Code/**: **Kit** (each component with controls, and the terminal sheets at several widths), **Skins** (every pack's skin), **Sample mod** (the sample mod's scenarios).

**The toolbar** (`storybook.ts`):

- **Surface**: desktop or terminal (the hook gets that `e.surface`).
- **Pane theme**: the pane's light or dark theme; on the terminal, also the ANSI themes.
- **Pane frame**: a copy of the desktop app's side pane beside a transcript, or a plain pane.
- **Width**: the pane's width in cells, passed as `bodyColumns`.
- **Skin**: the zen pack the kit wears.

Check every new look narrow (28, 36) and wide, on both surfaces, in the sidebar frame, in both themes, and on the terminal in all its themes.

**What it emulates:** a Box lays its children in a row unless `flexDirection="column"`; Text never wraps (unless `wrap="wrap"`) and keeps its spaces; a box doesn't shrink below its content without `minWidth={0}`; columns fit the canvas, so a too-wide width narrows the pane and tells the story the columns that fit; a desktop Button is its label alone; a desktop Input has its submit as a button beside the field (the terminal shows `↵ label` only while focused); the desktop's units (column 7.8px, row 19px, vertical spacing half a row) and borders (`transparent` draws in the text's colour); the sidebar frame's body starts 12.5px in from the divider.

**What it doesn't:** the engine's validator (a prop the desktop refuses still draws here), real data, timers, `gh`. It's built from captures of the app, so spacing, fonts and refusals can differ. The validator runs in `claude plugin test` and on CI; the real app is the final truth.

A consumer's own scenarios follow awesome-claude's pattern: fixtures (`playground/fixtures/<mod>.ts`, each export one sample state keyed by the mod's `PluginState` keys: busy, empty, error, loading as `null`, extremes) and one story per fixture. A mod that keeps its state in its module rather than in `$.state` (blast-radius) drives its real hooks with a stand-in `$` instead.

## Checks

Each must exit 0. Judge by the exit code, not by grepping the output.

**In zen, for harness work:**

| Command | When |
| --- | --- |
| `npm run typecheck` | any change: checks the root project and the engine-JSX project |
| `npx vitest run src/harness` | the kit's tokens, the skins mapping, colour maths, a palette or pack change |
| `npx tsx scripts/harness-skins.ts` | after changing a palette, a pack or `skins.ts`: rewrites `kit/skins.ts` |
| `npm run build:storybook` | stories, the bench, `storybook.ts` |

**In a consumer** (awesome-claude, syns), from the repo root:

| Command | What it checks |
| --- | --- |
| its build (`bun build.ts`) | the mods compile into `plugins/`, kit copied in |
| `bunx tsc -p plugins/<mod>` | the compiled mod, tests included, type-checks against the engine's real types |
| `claude plugin validate plugins/<mod>` | the engine accepts it: its hooks, the calls it reaches, its state reads and writes against `types/index.d.ts` |
| `claude plugin test plugins/<mod>` | its `*.test.ts`: panes mounted on each surface through the engine's test kit, acted on and read |
| `claude plugin validate .` | the marketplace lists every plugin at its version |

`bunx tsc` needs the engine's types in `plugins/<mod>/.claude-plugin/types/`, which the engine lays the first time it loads the mod (gitignored, so a fresh clone has none). Lay them by loading once headlessly (`CLAUDE_CODE_PLUGIN_DIRS=$PWD/plugins claude -p "/<mod>"`) or copy them from another mod that has them. The build leaves them alone.

**Tests** are render and behaviour tests through `claude-code/testing`: `test(name, async ($, on) => …)`, where hooks added with `on` stand for the engine beneath the mod. Nothing answers by default: answer each op the mod calls (`on('process.run', async () => ({ value: … }))`); the failure names what's missing. `mock.clock(on, { now })` holds time still. The test's `$` has no `$.state`: seed state by driving the mod. Mount on each surface, never an assumed one (`$.ui.mount({ plugin, surface, component: 'Pane', requestId, props })`), act and read by key (`ui.find`, `ui.findAll`, `ui.press`, `ui.input`, `ui.drawn()`). A mount rejects when the surface refuses the tree: that's the desktop validator, caught headlessly. Don't write tests that restate a function's code.

**The real app, last:** `claude --plugin-dir plugins` (or `CLAUDE_CODE_PLUGIN_DIRS` and `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` in settings, as of 2.1.296), `/reload-plugins` after a rebuild, read the transcript for refusals, and look at the desktop and the terminal, narrow and wide.

## Where this is going

The terminal side of the kit is a small design system for text cells: a grid, text roles, glyph tables, a theme-key colour mapping. It is heading toward a fuller TUI library later, with OpenTUI as a possible second backend for terminal apps outside Claude Code. None of that is built now; today the kit draws only through Claude Code's engine.
