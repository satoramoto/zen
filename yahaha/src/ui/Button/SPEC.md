# Button

> **The state language (Stage screen cleanup, PR #550).** The grey `--btn` tile, the lime on face,
> the bars under the label and every weight change are gone. `hue` (default `t`, drawn as
> `--neutral`; `lamp` draws `--lamp-line`) colours every face, set on the button as `--hue` and
> `data-hue`. No button is grey (owner): `t2` and `m` stay in the type for callers that still pass
> them, but are deprecated aliases of `t` and draw exactly as it (`data-hue="t"`).
> - **Off (rest):** no fill, a 1px inset outline (`box-shadow: inset 0 0 0 var(--outline-width) var(--hue)`,
>   so the size never changes), label and symbol in the hue. The caret's rest is the same neutral
>   outline.
> - **On, chosen:** a solid fill in the hue, label and symbol in `--on-ink`. No bar, no glow.
>   `expanded` (with `popup`) draws the on face.
> - **Waiting:** a 2px inset ring (`--outline-width-wait`) in the hue over a faint fill of it (a
>   `::before` under the label at `--wait-fill-opacity`), label in the hue.
> - **Disabled (absent):** the button's own hue at reduced strength, never grey: a 1px outline and
>   the label and symbol in `--absent-<hue>` (`t` → `--absent-neutral`, `lamp` → `--absent-lamp`,
>   any other hue `--absent-<hue>`), set on the button as `--hue-absent`; no fill, whatever the
>   face; `data-contrast="dim"`. The focus ring stays full strength.
> - **`bar` (Start / Stop running, `band`):** `bar: true` is the on face in `--ok` (solid green,
>   `--on-ink` label), with `data-bar` on the `<button>` and `data-hue="ok"`; `bar: false` or
>   undefined draws the face the other props give. No span, no padding change.
> - **Type:** every size's label is `font: var(--type-text); letter-spacing: var(--tracking-text)`
>   then `font-variant-numeric: tabular-nums`. ▲ ▼ ▾ are `--glyph-sm`, ◀ ▶ `--glyph-md`, + − the
>   label's own type. `compact` and `strong` are kept for compatibility (types unchanged) and change
>   nothing. Corners are square (`--radius: 0`); `join` keeps its classes.
>
> Where the sections below disagree, this note wins.

## Identity (all stations)

- **Kind:** primitive
- **Built from:** — (uses the shared `longpress` action, `app/src/ui/actions/longpress`, spec `app/src/ui/actions/longpress/SPEC.md`)
- **Purpose:** Does one thing when pressed (Panic, Stop, a page step, a One Touch), in the plain button face, and shows when that thing is the one chosen, switched on or waiting.
- **Boards:**
  - `Stage-Dark.dc.html:115` (the Metronome ▾ caret, joined), `:117` (Panic), `:118` (? help), `:131`, `:133` (◀ ▶ styles), `:138-141` (One Touch 1–4, 2 chosen), `:285` (Panel, the lamp row's master button), `:299-300` (knob page ▲ ▼), `:334-335` (pad bank ▲ ▼), `:366-386` (transport and tempo: Start / Stop with its bar, Stop, Reset | Fade, Fill ▲ | Fill ▼, Tempo + / −, Style tempo); light: `Stage-Light.dc.html:91`, `:93`, `:94`, `:107`, `:109`, `:114-117`, `:261`, `:275-276`, `:310-311`, `:342-362`.
  - `Stage-Help-Dark.dc.html:126` (? lit in help mode); light: `Stage-Help-Light.dc.html:97`.
  - `Stage-Metronome-Dark.dc.html:123` (the caret with its popover open); light: `Stage-Metronome-Light.dc.html:94`.
  - `LibrarySounds-Dark.dc.html:266` (Audition, disabled); light: `LibrarySounds-Light.dc.html:253`.
- **Not this component's job:** no store, no API, no Tauri. It doesn't know what it does: the parent passes the face and acts on `onpress`, `onhold`, `onlongpress`, `onlongrelease`. The tooltip is the parent's key passed as `tip`, wired by the `tipAction` the parent passes (L3); the library never imports `use:tip`. No timer: long press is the shared `use:longpress` action; repeat-while-held is the parent's (`onhold` with `app/src/lib/tempoHold.ts`). Not a toggle with its own state (LampButton is): every face comes from props. Not a group: One Touch, the Fills pair and the Metronome split are their parents' (`OneTouch`, `TransportColumn`, `MetronomeSplit`), which set gaps and group roles. Not a text button (band sends, sound cells) and not a tab (`ChosenTabs`).

## API (Component station)

### Props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `label` | `string` | `''` | The word or character on the face ("Panic", "Stop", "1", "?"). May be empty when `symbol` is set. |
| `symbol` | `'prev' \| 'next' \| 'up' \| 'down' \| 'plus' \| 'minus' \| 'caret' \| undefined` | — | A glyph after the label (or alone): `prev` ◀ (U+25C0), `next` ▶ (U+25B6), `up` ▲ (U+25B2), `down` ▼ (U+25BC), `plus` + (U+002B), `minus` − (U+2212), `caret` ▾ (U+25BE). Drawn per Visual rules, `aria-hidden`. |
| `size` | `'icon' \| 'md' \| 'band' \| 'pair' \| 'cell' \| 'caret'` | `'md'` | `icon` 32 × 32, centred (◀ ▶ ▲ ▼, ?, One Touch 1–4). `md` 32 tall, 14px side padding, width from the label (Panic). `band` 88 × 32, label left-aligned, 8px side padding (the transport and tempo column). `pair` 41 × 32, centred, no padding (Reset, Fade, Fill ▲ ▼). `cell` 32 tall, fills its container's width, centred (Panel in the lamp row). `caret` 20 × 32, centred (Metronome settings). |
| `compact` | `boolean` | `false` | Kept for compatibility; changes nothing (every label is `--type-text`). |
| `strong` | `boolean` | `false` | Kept for compatibility; changes nothing (the rest label is already in its hue). |
| `bar` | `boolean \| undefined` | — | Start / Stop running, for `size: 'band'` only. `true`: the on face in `--ok`, `data-bar` on the button. `false` or undefined: the face the other props give. On any other size `bar` is ignored (D18). |
| `on` | `boolean` | `false` | The on face: switched on (help mode's ?, Fade while fading or holding), a solid fill in the hue. |
| `chosen` | `boolean` | `false` | The chosen face: the one picked from a set (the applied One Touch), a solid fill in the hue. |
| `waiting` | `boolean` | `false` | The waiting face: queued or armed (Fade armed), a 2px ring over a faint fill of the hue. |
| `hue` | `'t' \| 't2' \| 'm' \| 'a' \| 'lamp' \| 'rec' \| 'ok' \| 'r1' \| 'r2' \| 'r3' \| 'l' \| 'intro' \| 'main' \| 'ending' \| 'brk' \| 'fill'` | `'t'` | The colour token (without `--`) of every face: the rest outline and label, the on and chosen fill, the waiting ring and fill; disabled draws the hue's `--absent-<hue>`. `t` draws `--neutral`, `lamp` `--lamp-line`. `t2` and `m` are deprecated aliases of `t` (draw as `t`). |
| `pressed` | `boolean \| undefined` | — | Sets `aria-pressed` (`"true"` / `"false"`; a button that is a switch or a choice: ?, One Touch, Start / Stop, Fade). Undefined: no `aria-pressed` attribute (a plain action: Panic, Stop, ◀). Never changes the look. |
| `popup` | `'dialog' \| 'menu' \| undefined` | — | Sets `aria-haspopup` (the caret opens a dialog). |
| `expanded` | `boolean` | `false` | With `popup`: `aria-expanded`, and the on face while open. Without `popup`: ignored, no `aria-expanded`. |
| `controls` | `string \| undefined` | — | Sets `aria-controls` (the id of the popover the caret opens). |
| `join` | `'start' \| 'end' \| undefined` | — | Joined to a neighbour: `start` rounds only the left corners (`var(--radius) 0 0 var(--radius)`), `end` only the right (`0 var(--radius) var(--radius) 0`). Undefined: all four `--radius`. The caret is `join: 'end'`. |
| `disabled` | `boolean` | `false` | Shown, not pressable (`aria-disabled="true"`, stays focusable; no `aria-disabled` attribute when enabled, L5): no `onpress`, `onhold` or long press. |
| `hold` | `boolean` | `false` | A repeat-while-held button (Tempo + / −): pointer down and up call `onhold`; a pointer click then doesn't call `onpress` (a keyboard click still does); no long press. |
| `name` | `string \| undefined` | — | The accessible name. Default: the label, then the symbol's word (`prev` "previous", `next` "next", `up` "up", `down` "down", `plus` "plus", `minus` "minus", `caret` "options"), joined by a space ("Fill up", "Tempo plus"; "up" alone). Parents pass `name` for every symbol-only button. |
| `tip` | `string \| undefined` | — | The tooltip key from `app/src/help/tooltips.ts` (e.g. `transport.panic`), rendered as `data-tip` on the `<button>`; no attribute when undefined (L3). |
| `tipAction` | `Action<HTMLElement, string> \| undefined` | — | The app's `use:tip`, passed in by the wiring. When both it and `tip` are set the `<button>` gets `use:tipAction={tip}`; otherwise nothing (L3). |

Face precedence when more than one is set: `chosen`, then `on`, then `waiting`, then off.

### Events

| Callback | Fires when | Payload |
|---|---|---|
| `onpress` | click, Space or Enter, unless disabled; not for the click that ends a long press (swallowed by the action); with `hold`, only for a keyboard click (`event.detail === 0`) | `()` |
| `onhold` | with `hold` and not disabled: `true` on a primary-button (`button === 0`) `pointerdown` while no hold is down; the button records that `pointerId` and takes pointer capture with `node.setPointerCapture?.(pointerId)` inside `try`/`catch` (jsdom has no pointer capture, L4). `false` exactly once when that hold ends: the first `pointerup`, `pointercancel` or `lostpointercapture` on the button with the recorded `pointerId` (events of other pointers, and a second `pointerdown` while held, are ignored); or at once when `disabled` turns true or `hold` turns false while it is down (D19), or when the button is destroyed while down. Any later event of that pointer sends nothing. | `(down: boolean)` |
| `onlongpress` | without `hold`, not disabled: held 350 ms (`--long-press`) without moving more than 4px, still held; or right-clicked (longpress SPEC) | `()` |
| `onlongrelease` | the press that fired `onlongpress` ends | `()` |

**Long press wiring.** The `<button>` carries `use:longpress={{ onlongpress, onlongrelease, disabled: disabled || hold || onlongpress === undefined }}`. No board Button has a long press today; the props exist so a parent can add one without a timer of its own (Stage.md row 3).

### Slots / snippets

| Snippet | What goes in it |
|---|---|
| — | Icons are the `symbol` glyphs, not snippets (D2). |

### Visual rules

- **Tokens used:** `--neutral`, `--lamp-line`, `--ok`, the hue tokens named by `hue`, `--on-ink`, the absent token of the hue drawn (`--absent-neutral`, `--absent-lamp` or `--absent-<hue>`), `--wait-fill-opacity`, `--outline-width`, `--outline-width-wait`, `--type-text`, `--tracking-text`, `--glyph-sm`, `--glyph-md`, `--focus`, `--radius`, `--space-8`, `--space-14`, `--control-height`, `--button-band-width`, `--button-pair-width`, `--caret-width`, `--line-width`, `--focus-offset`. Through the action: `--long-press`.
- **Box:** a native `<button type="button">`, `box-sizing: border-box`, no border, `margin: 0`, height `--control-height` (32) in every size, radius `--radius` (or `join`'s), `white-space: nowrap`, no flex (the label, a space and the symbol are inline text, as the board draws them). `position: relative; isolation: isolate` so the waiting fill's `::before` sits at `z-index: -1` under the label. Never wraps; no ellipsis.
- **Size:**

  | Size | Width | Padding | Align |
  |---|---|---|---|
  | `icon` | `--control-height` (32) | 0 | centre |
  | `md` | from content | `0 var(--space-14)` | centre |
  | `band` | `--button-band-width` (88) | `0 var(--space-8)` | left |
  | `pair` | `--button-pair-width` (41) | 0 | centre |
  | `cell` | 100% of its container, `min-width: 0` | 0 | centre |
  | `caret` | `--caret-width` (20) | 0 | centre |

- **Symbols:** one space after a label, then the glyph in an `aria-hidden` `<span>`, inline on the label's baseline with no `line-height` of its own (D21). ▲ ▼ ▾ are `font-size: var(--glyph-sm)`, ◀ ▶ `var(--glyph-md)`, alone or after a label; + − take the label's type. Every glyph takes the label's colour in every face, and no glyph changes weight (D20, D22 superseded).
- **States drawn by** (`data-face` on the `<button>`; `--hue` the hue's colour):
  - off (`off`): transparent, `box-shadow: inset 0 0 0 var(--outline-width) var(--hue)`, label `--hue`. The caret too.
  - on (`on`; also `expanded` with `popup`, and `bar: true` in `band`): `background: var(--hue)`, label `--on-ink`.
  - chosen (`chosen`): the same solid fill and `--on-ink` label.
  - waiting (`waiting`): `box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue)` over a `::before` filling the box in `--hue` at `--wait-fill-opacity`; label `--hue`.
  - disabled: transparent, a 1px outline, label and symbol, all in `--hue-absent` (the drawn hue's `--absent-<hue>`), no waiting fill, `cursor: default`; `data-face="disabled"` and `data-contrast="dim"` on the `<button>` (D25, D26).
  - running (`bar: true`, `band` only): the on face with `--hue` `--ok` (unless `chosen`), `data-hue="ok"` and `data-bar` on the `<button>`. `bar` false or undefined: no `data-bar`.
  - joined (`join`): radii only, in every face.
  - keyboard focus: `--line-width` outline in `--focus` at `--focus-offset` on `:focus-visible`; nothing on mouse focus.
  - No hover or pressed look; `cursor: pointer` when enabled (kit D35).
- **Test hooks:** `data-face` (`off`, `on`, `chosen`, `waiting`, `disabled`), `data-hue` (the hue drawn, in every face; `t` for `t2` and `m`) and `data-bar` (running).
- **Type:** `font: var(--type-text); letter-spacing: var(--tracking-text)` then `font-variant-numeric: tabular-nums`, sentence case as given, at every size and in every face.
- **Contrast (AA 4.5:1, `tokens/contrast.test.ts`):** a rest label in its hue on `--g`, and `--on-ink` on each fill, are the token contract's rows. A disabled `--absent-<hue>` label is exempt (`data-contrast="dim"`, `aria-disabled`).
- **Motion:** none.

### Accessibility

- **Role and name:** a `button`; accessible name `name`, or the default above, set as `aria-label`. `aria-pressed` only when `pressed` is defined; `aria-haspopup` and `aria-expanded` only with `popup`; `aria-controls` only with `controls`; `aria-disabled="true"` when disabled and no `aria-disabled` attribute when enabled (L5); `data-tip` only with `tip`. The symbol and the bar are `aria-hidden`.
- **Keyboard:** Tab focuses it (also when disabled); Space or Enter calls `onpress` (with `hold` too: one step). The long press, when wired, is the platform's context-menu key (the action).
- **Tooltip id:** the parent's key passed as `tip` (e.g. `transport.panic`, `ots.2`, `metronome.settings`, `tempo.up`), with `tipAction` (L3).

## Stories (Story station)

Title `Primitives/Button`, `layout: 'centered'` unless the row says otherwise. Every story renders in dark and light. Meta `args`: `{ onpress: fn(), onhold: fn(), onlongpress: fn(), onlongrelease: fn(), tipAction: fn() }` (axiom 7; `tipAction` an action, L3).

**Controls (argTypes):** `label`, `name`, `controls`, `tip` text; `compact`, `strong`, `on`, `chosen`, `waiting`, `expanded`, `disabled`, `hold` boolean (`expanded` is a plain boolean, default `false`; it has no undefined); `size` a select of the six sizes; `hue` a select of its fourteen distinct values (the deprecated `t2` and `m` draw as `t`, so they aren't offered); `symbol`, `join` and `popup` selects with an empty option first for undefined; `bar` and `pressed` three-way selects with the options `none` / `false` / `true`, mapped to `undefined` / `false` / `true` (so the control can go back to "no attribute"); the callbacks and `tipAction` actions.

**Timing in plays (L4):** pointer events are `fireEvent.pointerDown` / `pointerUp` / `pointerCancel(button, { pointerId, button: 0, clientX: 0, clientY: 0 })` (jsdom 30 has `PointerEvent`; it has no pointer capture, so the component's guarded `setPointerCapture?.` call does nothing there). Plays use real time: "wait 500 ms" is `await new Promise((r) => setTimeout(r, 500))`, and a long press is awaited with `waitFor(…, { timeout: 1000 })`.

Built so far (PR #550): `Board`, `Icon`, `BandOn`, `On`, `Chosen`, `Band`, `Running`, `Stopped`, `Waiting`, `Disabled`, `DisabledHue`, `Hold` and `LongPress`. The other rows are not built yet. The crops predate the state language (PR #550) and no longer match its faces.

| Story | Args | Shows | Crop | Play (interaction check) |
|---|---|---|---|---|
| `Board` | `{ symbol: 'caret', size: 'caret', join: 'end', popup: 'dialog', expanded: false, name: 'Metronome settings', tip: 'metronome.settings' }` | the first Button in reading order on the Stage board: the Metronome caret, closed (D1) | `Board-{dark,light}.png` (Stage 1201,68 20×32) | the button named `Metronome settings` has `aria-haspopup="dialog"`, `aria-expanded="false"`, no `aria-pressed`, no `aria-disabled`, `data-face="off"`, `data-tip="metronome.settings"`; `tipAction` was called with the button and `'metronome.settings'`; click → `onpress` called once |
| `CaretExpanded` | `Board` args with `expanded: true` | the caret while its popover is open: the on face | `CaretExpanded-{dark,light}.png` (Stage-Metronome 1201,68 20×32) | `aria-expanded` is `true` |
| `Md` | `{ label: 'Panic', size: 'md', name: 'Panic: all notes off', tip: 'transport.panic' }` | the off face, padding 0 14, neutral outline and label | `Md-{dark,light}.png` (Stage 1313,68 63×32) | click, then Space, then Enter → `onpress` called 3 times, each with no arguments; no `aria-pressed`, no `aria-disabled`; `data-tip="transport.panic"` |
| `Icon` | `{ label: '?', size: 'icon', pressed: false, name: 'Help mode' }` | a 32 × 32 button at rest | `Icon-{dark,light}.png` (Stage 1384,68 32×32) | `aria-pressed` is `false`; `data-face="off"` |
| `BandOn` | `{ label: 'Fade', size: 'band', on: true, pressed: true }` | a band button switched on (Fade while fading): the solid neutral fill, `--on-ink` label | — | — |
| `On` | `{ label: '?', size: 'icon', on: true, pressed: true, name: 'Help mode' }` | the on face (help mode on): the solid neutral fill, "?" in `--on-ink` | `On-{dark,light}.png` (Stage-Help 1384,68 32×32) | `aria-pressed` is `true`; `data-face="on"` |
| `IconSymbol` | `{ symbol: 'prev', size: 'icon', name: 'Previous style (Track left)' }` | ◀ alone at `--glyph-md` | `IconSymbol-{dark,light}.png` (Stage 49,129 32×32) | the button's accessible name is `Previous style (Track left)`; its text "◀" is inside an `aria-hidden` element |
| `Chosen` | `{ label: '2', size: 'icon', chosen: true, pressed: true, name: 'One Touch 2, applied' }` | the chosen face: the solid neutral fill, `--on-ink` label | `Chosen-{dark,light}.png` (Stage 483,129 32×32) | `data-face="chosen"`; `aria-pressed` `true` |
| `Band` | `{ label: 'Stop', size: 'band', name: 'Stop (fade with hold)' }` | 88 × 32, label left at 8px | `Band-{dark,light}.png` (Stage 1328,514 88×32) | — |
| `Running` | `{ label: 'Start / Stop', size: 'band', compact: true, strong: true, bar: true, pressed: true, name: 'Start / Stop, running', tip: 'transport.start_stop' }` | the on face in `--ok`: solid green, `--on-ink` label | `Running-{dark,light}.png` (Stage 1328,476 88×32) | the button has `data-bar`, `data-face="on"`, `data-hue="ok"`; `aria-pressed` `true` |
| `Stopped` | `Running` args with `bar: false, pressed: false, name: 'Start / Stop'` | the rest face: neutral outline and label | — (the board draws only running) | no `data-bar`; `data-face="off"`, `data-hue="t"`; `aria-pressed` `false` |
| `BandSymbol` | `{ label: 'Tempo', symbol: 'plus', size: 'band', name: 'Tempo up (Scene Launch)', tip: 'tempo.up' }` | "Tempo" and a + on the label's baseline, in the label's type | `BandSymbol-{dark,light}.png` (Stage 1328,686 88×32) | — |
| `BandCompact` | `{ label: 'Style tempo', size: 'band', compact: true, name: 'Style tempo' }` | the band label (`compact` changes nothing) | `BandCompact-{dark,light}.png` (Stage 1328,762 88×32) | — |
| `Pair` | `{ label: 'Reset', size: 'pair', name: 'Section reset' }` | 41 × 32, centred | `Pair-{dark,light}.png` (Stage 1328,552 41×32) | — |
| `PairSymbol` | `{ label: 'Fill', symbol: 'up', size: 'pair' }` | "Fill" and a `--glyph-sm` ▲ | `PairSymbol-{dark,light}.png` (Stage 1328,590 41×32) | the accessible name is `Fill up` (the default) |
| `Waiting` | `{ label: 'Fade', size: 'pair', waiting: true, pressed: false, name: 'Fade, armed', tip: 'transport.fade' }` | a 2px neutral ring over a faint neutral fill, label `--neutral` | — (no board draws Fade armed) | `data-face="waiting"`, `data-hue="t"` |
| `FadeOn` | `{ label: 'Fade', size: 'pair', on: true, pressed: true, name: 'Fade, fading' }` | the on face in a pair | — (not drawn) | `data-face="on"` |
| `Cell` | `{ label: 'Panel', size: 'cell', name: 'Fader page is Panel: click for Style' }`, `layout: 'padded'` | fills its container, centred | — (the lamp row's cells are fractional widths) | — |
| `Disabled` | `{ label: 'Audition', size: 'md', compact: true, disabled: true, name: 'Audition (stop the band first)' }` | the `--absent-neutral` outline and label, no fill | `Disabled-{dark,light}.png` (LibrarySounds 1116,452 79×32) | `aria-disabled` `true`, `data-face="disabled"`, `data-contrast="dim"`; click and Enter → `onpress` not called; `fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })`, wait 500 ms (real time) → `onlongpress` and `onhold` not called |
| `DisabledHue` | `{ label: 'Fill', symbol: 'up', size: 'pair', hue: 'fill', disabled: true, name: 'Fill up (none in this style)' }` | a hued button, absent: outline, label and ▲ in `--absent-fill`, no fill, never grey | — | `data-face="disabled"`, `data-hue="fill"`, `data-contrast="dim"` |
| `DisabledIcon` | `{ symbol: 'up', size: 'icon', disabled: true, name: 'Knob page up' }` | ▲ in `--absent-neutral` (knob page 1) | — (the board draws it enabled, D1) | `aria-disabled` `true`, `data-face="disabled"` |
| `JoinStart` | `{ label: 'Panic', size: 'md', join: 'start' }` | the `join-start` class (corners are square anyway) | — (no board instance) | — |
| `Hold` | `{ label: 'Tempo', symbol: 'plus', size: 'band', hold: true, name: 'Tempo up (Scene Launch)', tip: 'tempo.up' }` | — | — | (init `{ button: 0, clientX: 0, clientY: 0 }` plus the `pointerId` given) `pointerDown` pointer 1 → `onhold` called with `true`; `pointerDown` pointer 2 → no new call; `pointerUp` pointer 2 → no new call; `pointerUp` pointer 1 → `onhold` last called with `false`, 2 calls in all; a second `pointerUp` pointer 1 → still 2; `pointerDown` pointer 3, then `pointerCancel` pointer 3 → 4 calls, last `false`; `fireEvent.click(button, { detail: 1 })` → `onpress` not called; focus it and press Enter → `onpress` called once; `pointerDown` pointer 4, wait 500 ms (real time) → `onlongpress` not called; `pointerUp` pointer 4 |
| `LongPress` | `{ label: 'Stop', size: 'band', tip: 'transport.stop' }` | — | — | `fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })`; `await waitFor(() => expect(onlongpress).toHaveBeenCalledTimes(1), { timeout: 1000 })` (real time); `fireEvent.pointerUp(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })` → `onlongrelease` called once; `fireEvent.click(button)` → `onpress` not called; `userEvent.click(button)` → `onpress` called once; `fireEvent.contextMenu(button)` → `onlongpress` called 2 times in all |
| `Focused` | `{ label: 'Panic', size: 'md' }`, `pseudo: { focusVisible: true }` | the focus ring | — | — |

Crop positions are `board x,y w×h` in the 1440×900 renders, the same box in dark and light; each crop is exactly the button's own box (L6).

**Component tests** (props that change mid-gesture, which a play can't do): `app/src/ui/Button/Button.test.ts` with `@testing-library/svelte` `render` and `rerender`, run with `npx vitest run src/ui/Button`. Each renders `{ label: 'Tempo', symbol: 'plus', size: 'band', hold: true, onhold: vi.fn() }`, then `fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })` (`onhold(true)`), then:

| # | Change while held | Expect |
|---|---|---|
| 1 | `rerender({ …, disabled: true })` | `onhold` called with `false` at once (2 calls); a later `pointerUp` pointer 1 adds no call |
| 2 | `rerender({ …, hold: false })` | same as 1 |
| 3 | `fireEvent(button, new PointerEvent('lostpointercapture', { pointerId: 1 }))` | `onhold` last called with `false`, 2 calls; a later `pointerUp` adds none |
| 4 | `unmount()` | `onhold` called with `false` once (2 calls) |

## Done when (Inspect station)

- Every story in the table exists, renders in dark and light, and its play passes (`npx vitest run src/ui`).
- `npm run shots -- Button` passes: each cropped story matches its crop (score at most 0.02, or the Inspect agent judges the difference render noise), and axe finds no violation on any story (no Button story uses `hue: 'lamp'`, so none waits on `--lamp-line`).
- The component tests pass (`npx vitest run src/ui/Button`).
- The new tokens and contrast rows (D13) are in the tokens contract PR, and `metronome.settings` is in `tooltips.ts` (D14), before the build.
- The long press comes only from `use:longpress`; the component has no `setTimeout`.
- Only listed tokens are used; no inline colours, no literal sizes outside the Visual rules.
- svelte-check and lint pass on the folder.

## Decisions

- **D1 · Board story is the caret, as drawn.** The first Button in reading order on the Stage is the Metronome caret; `Board` draws it enabled, as the board does. Stage.md D32 disables it in the app until the metronome popover (#509) lands; that is a prop the wiring passes (`disabled`), shown by `Disabled` / `DisabledIcon`, not the board's look. Likewise the board draws knob ▲ and pad bank ▲ enabled where the fixture disables them.
- **D2 · Icons are glyphs, not snippets.** Every icon the boards draw is a text glyph (◀ ▶ ▲ ▼ ▾ + −), so `symbol` is a fixed list with fixed sizes rather than a snippet; it stays a control, and a builder never guesses a size. `?` and the digits are plain labels.
- **D3 · Waiting outline as an inset shadow.** The kit draws waiting as a 1px border; here it is `inset 0 0 0 1px`, so a Button keeps the same box in every face (an `md` button doesn't grow 2px when queued).
- **D4 · `data-face` keeps the face when disabled.** Superseded by D25.
- **D5 · New size tokens.** Axiom 2 needs the board's fixed sizes as tokens: `--button-band-width` 88px, `--button-pair-width` 41px, `--caret-width` 20px and two running-bar offsets (scale.css), besides the kit's 9px and 10px glyph sizes and `--long-press`. (The bar offsets and glyph sizes are gone: D28.)
- **D6 · The caret is a Button size.** Stage.md builds `MetronomeSplit` from LampButton and Button, so the 20 × 32 ▾ is `size: 'caret'` with its own `--m` colour (`--t` when open, as Stage-Metronome draws it), plus `popup` / `expanded` for its ARIA.
- **D7 · Faces are props, not state.** Button has no pressed state of its own; `chosen`, `on`, `waiting` and `pressed` come from the parent (One Touch's `ots.applied`, help mode, `transport.fade`), with precedence chosen, on, waiting, off.
- **D8 · `pressed` is separate from the face.** `aria-pressed` follows `pressed` only, so a chosen One Touch says "pressed" and a plain Panic says nothing; Start / Stop is `pressed` while running, as the board marks it.
- **D9 · `compact` for 13px.** The board mixes 14px (Stop, Tempo ±, Panic) and 13px (Style tempo, Start / Stop, Audition) labels in the same sizes; `compact` picks 13, while `pair` and `cell` are always 13.
- **D10 · Start / Stop's bar.** `bar: false` keeps the bar's padding (`0 4px 3px 8px`), so the label doesn't move when the band starts or stops; undefined is a button with no bar at all.
- **D11 · `hold` is a flag.** Every callback is a story action (axiom 7), so `onhold` is always passed in stories; the mode is `hold: true`, not the presence of `onhold`. It copies today's `HwButton` hold (pointer capture, keyboard click still presses) so `tempoHold.ts` works unchanged, and turns the long press off.
- **D12 · Default names.** Without `name`, a symbol's word follows the label ("Fill up"); the parents still pass the board's longer names ("Fill Up: a fill, then the next Main up", "Previous style (Track left)").
- **D13 · L1, new tokens.** The 9px and 10px glyph sizes, `--long-press` 350ms, the five size tokens of D5 and LampButton's `--lamp-line`, plus the contrast rows `--g` on `--t` and `--t` on `--btn`, land in the orchestrator's tokens contract PR; this spec never edits `tokens/*`.
- **D14 · L3, tooltip props.** Button takes `tip` (`data-tip`) and `tipAction` (`use:tipAction={tip}` when both are set); stories use real keys, and `metronome.settings` (the `Board` caret) is not in `tooltips.ts` today: it is a contract change (Stage.md C5), title "Metronome settings", body "Opens the metronome's settings: on/off, volume and the bell on beat 1." (the board's caret label).
- **D15 · L5, `aria-disabled`.** Rendered `"true"` only when disabled, absent otherwise.
- **D16 · L4, pointer capture.** The hold calls `node.setPointerCapture?.(pointerId)` (and `releasePointerCapture?.` when a hold ends early) inside `try`/`catch`, so synthetic events in jsdom, which has no pointer capture, and in plays don't throw.
- **D17 · Running's lift is the padding.** The label rises because a native button centres its line in the 29px left by the 3px bottom padding, 1.5px above centre, as the board's markup does; there is no 3px offset.
- **D18 · `bar` is band-only.** On any size but `band`, `bar` draws nothing and changes no padding; no board draws a bar elsewhere.
- **D19 · A hold ends when it can't continue.** `disabled` turning true, `hold` turning false, `lostpointercapture` or unmount during a hold sends `onhold(false)` once at once, so `tempoHold.ts` never repeats forever; the hold follows only the `pointerId` that started it.
- **D20 · Glyph weight.** `plus` and `minus` are always light (300) and, alone, at the row's label size; every other glyph takes the label's weight (medium in on, chosen and `strong`).
- **D21 · Glyph alignment.** A smaller glyph after a label is an inline span on the label's baseline (no `vertical-align` or `line-height` of its own), as the board draws Fill ▲.
- **D22 · Caret colour by face.** The `caret` size's `--m` / `--t` (expanded) applies only on the off face; on, chosen and waiting faces draw ▾ in the face's label colour, and disabled in `--d`.
- **D23 · `hue: 'lamp'` uses `--lamp-line`.** `--lamp` on the ground fails AA in light (3.74:1), so a waiting Button in `lamp` draws in LampButton's `--lamp-line` (light `#477b0c`, 4.53:1).
- **D24 · Three-way controls.** `pressed` and `bar` are selects of none / false / true, so Storybook can return them to undefined; `expanded` is a plain boolean (default false).
- **D25 · `data-face="disabled"` (review; replaces D4).** Stage.md › The base Button ("the face, or `disabled`"), Stage D49 and kit D41 all give a disabled control `data-face="disabled"`, and the kit's Absent pad does the same; one rule for every faced control, so Button and LampButton both render `disabled` while disabled (the drawing is still the face it would have, with a `--d` label). Tests read "disabled" from `data-face` or `aria-disabled`.
- **D26 · Disabled carries `data-contrast="dim"` (review).** Stage.md › The base Button puts `data-contrast="dim"` on a disabled Button (its label is `--d`), so the screenshot tool's axe run skips it as D47 says; the `Disabled` play checks it.
- **D27 · Prop names against Stage.md › The base Button (review).** Same behaviour, these names: Stage's `face: 'off' | 'on' | 'chosen' | 'waiting'` is the `on` / `chosen` / `waiting` booleans (precedence D7; a parent passes the one that is true); `variant` is `size`; `onclick(e)` is `onpress()`; `onpointerdown` / `onpointerup` (Tempo ±) are `hold` and `onhold(down)` (D11, D19), with the keyboard click still one `onpress` (Stage D62); the label snippet for Fill ▲ is `symbol` (D2); `current` (`aria-current`) is ChosenTabs' (`size: 'page'`), not Button's; `shift` / `onshiftclick` are the parent's: the parent already has the shift state as a prop and picks what `onpress` means (Panel's Shift-click, Stage D59), so Button needs neither; `tip: TipKey` applied by the component is `tip` plus `tipAction` (L3).

- **D28 · The state language (owner, PR #550).** Superseded by it: D3 (the waiting outline is now a 2px inset ring over a faint fill), D5's bar offsets and glyph sizes (gone; glyphs use `--glyph-sm` / `--glyph-md`), D6's caret colours (the caret is a neutral outline at rest, the on face when open), D9 (`compact` changes nothing), D10, D17 and D18's padding (no bar room; `bar: true` is the `--ok` on face), D13's tokens, D20 and D22 (no weight changes; glyphs follow the label's colour), and D25's "drawing is the face it would have" (disabled is now an outline and label in the hue's `--absent-<hue>`, no fill: D29). `hue`'s default is now `t`, and it colours every face.
- **D29 · No grey buttons; absent keeps its hue (owner, Stage screen).** No button draws a grey hue at rest, on or waiting: `t2` and `m` are deprecated aliases of `t` (kept in the type so existing callers type-check; `data-hue="t"`). Disabled is the button's own hue at reduced strength (`--absent-<hue>`, state.css), not one grey for every button. Supersedes D6's and D22's `--m` / `--d` caret colours and D25's and D26's `--d` label.

Follow-ups: kit.md › Dimmed text's carriers list doesn't name disabled controls (Button, LampButton, a ChosenTabs tab), though Stage.md › The base Button marks them `data-contrast="dim"`; the list needs that row. Stage.md row 3 and The base Button could adopt D27's names so the two read the same.
