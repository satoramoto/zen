# LampButton

> **The state language (Stage screen cleanup, PR #550).** The lime face, the grey `--btn` tile and
> the bar under the label are gone; the lamp draws the one state language every clickable control
> shares. `hue: 't' | 'r1' | 'r2' | 'r3' | 'l' | 'ok' | 'm'` (default `t`) colours every face: `t`
> is `--neutral` (Accomp, Metronome and the function lamps), a part its part hue, `ok` `--ok`; it
> replaces D13/D19's `hue: 'lamp' | 'rec'`. No lamp is grey (owner): `m` stays in the type for
> callers that still pass it, but is a deprecated alias of `t` and draws exactly as it
> (`data-hue="t"`). With `rec`, on and waiting draw in `--rec` (`data-hue="rec"` when `rec` and
> not off).
>
> **The Looper lamp (UI rewrite cleanup, owner's rule).** `hue: 'lamp'` is back as the lime hue:
> outline, label and waiting ring in `--lamp-line`, the lit fill `--lamp` with the label in
> `--lamp-ink`, disabled `--absent-lamp` (all existing tokens). The band's Looper lamp is lime
> while looping (`on`, `lamp`), red while recording (`on`, `rec`), the waiting outline when armed
> (`recArmed`: `waiting` + `rec`; `loopArmed`: `waiting` + `lamp`) and white (`t`, `--neutral`)
> when off. The band's `BankLamp` (`ui/FaderBank/types.ts`) carries `rec` and `waiting`.
> - **Off (rest):** no fill, a 1px inset outline (`box-shadow: inset 0 0 0 var(--outline-width) var(--hue)`,
>   so the size never changes) and the label in the hue. Off keeps its colour; it never goes grey.
>   The code is the label's colour at `--code-opacity`.
> - **On, record:** a solid fill in the hue, label and code in `--on-ink` at full opacity. No bar,
>   no glow.
> - **Waiting (armed):** a 2px inset ring (`--outline-width-wait`) in the hue over a faint fill of
>   it (a `::before` under the label: `background: var(--hue); opacity: var(--wait-fill-opacity)`),
>   label in the hue.
> - **Disabled (absent):** the lamp's own hue at reduced strength, never grey: a 1px outline and the
>   label and code in `--absent-<hue>` (`t` → `--absent-neutral`, `r1` → `--absent-r1`, `ok` →
>   `--absent-ok`, `rec` → `--absent-rec`; set per hue as `--hue-absent`), no fill, in every face;
>   `data-contrast="dim"`. The focus ring stays full strength.
> - **Type:** every size's label and code are `--type-text` / `--tracking-text` with tabular
>   numerals; no weight changes between faces, so a lit lamp is as wide as an off one (D12 no
>   longer holds). Corners are square (`--radius: 0`); `join` keeps its classes.
>
> Where the sections below disagree, this note wins.

## Identity (all stations)

- **Kind:** primitive
- **Built from:** — (uses the shared `longpress` action, `app/src/ui/actions/longpress`, spec `app/src/ui/actions/longpress/SPEC.md`)
- **Purpose:** Turns a part, a mode or a function on or off, and shows at a glance which it is.
- **Boards:**
  - `Stage-Dark.dc.html:97` (Accomp, lit, with the ACMP code), `:115` (Metronome, off, joined to its ▾ caret), `:116` (Unison, off), `:277-284` (the band's lamp row: part On/Off with long press, Harm/Arp, Sound, L Hold, Looper with long press); light: `Stage-Light.dc.html:73`, `:91`, `:92`, `:253-260`.
  - `Stage-Metronome-Dark.dc.html:123` (Metronome lit, joined); light: `Stage-Metronome-Light.dc.html:94`.
  - `SettingsChord-Dark.dc.html:178` (Manual Bass, disabled, 64 × 28); light: `SettingsChord-Light.dc.html:161`.
  - `Looper-Dark.dc.html:175` (Rec / Stop, the record lamp); light: `Looper-Light.dc.html:154`.
  - The kit's lamp rules: `Stage-Dark.dc.html:66`, `Stage-Light.dc.html:42`.
  - The armed (waiting) face: no board draws a LampButton armed (Looper draws `looping`; its armed outlines appear only in the state readout, which is not a LampButton), so it has no crop (D10). Its rules come from the Looper board notes (`Looper-Dark.dc.html:25-31`) and kit › Lamp row ("`recArmed` → waiting face in `--rec`; `loopArmed` → waiting face in `--lamp`").
- **Not this component's job:** no store, no API, no Tauri. It doesn't know what it switches: the parent passes `on` and `waiting` and acts on `ontoggle`, `onlongpress` and `onlongrelease`. The tooltip is the parent's key passed in as `tip`, wired by the `tipAction` the parent passes (L3); the library never imports `use:tip`. Long press comes only from the shared `use:longpress` action, never a timer of its own; Shift-click stays the parent's (it reads `ui.shift` and decides what a click means). Not the white "chosen" block, the waiting chips of the display or the ▾ caret beside Metronome: those are other components (`Button`, `WaitingChip`). Its own waiting face is only the armed lamp (Looper's Rec armed / Loop armed in the band's lamp row).

## API (Component station)

### Props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `label` | `string` | — | The word on the face. |
| `on` | `boolean` | `false` | Lit (lamp face) or off. Controlled: the face and `aria-pressed` follow `on` alone; a click calls `ontoggle(!on)` and changes nothing until the parent passes a new `on` (Stage D49, D17). |
| `code` | `string \| undefined` | — | Small code after the label, e.g. `ACMP`. |
| `disabled` | `boolean` | `false` | Shown, not pressable (`aria-disabled="true"`, stays focusable; no `aria-disabled` attribute at all when enabled, L5). No toggle and no long press. |
| `rec` | `boolean` | `false` | The record lamp: on and waiting draw in `--rec` instead of `hue`. |
| `waiting` | `boolean` | `false` | The waiting (armed) face while not pressed: a 2px ring over a faint fill of the hue, the label in the hue (Visual rules). Precedence: on (or record) > waiting > off, so it shows only while `on` is false. It never changes `aria-pressed`. |
| `hue` | `'t' \| 'r1' \| 'r2' \| 'r3' \| 'l' \| 'ok' \| 'lamp' \| 'm'` | `'t'` | The colour of every face: `t` `--neutral`, a part its hue, `ok` `--ok`, `lamp` lime (`--lamp-line` outline and label, `--lamp` fill with `--lamp-ink`); disabled draws the same hue's `--absent-<hue>`. `m` is a deprecated alias of `t` (draws as `t`). |
| `size` | `'md' \| 'sm' \| 'cell'` | `'md'` | `md`: 32px tall, 16px side padding (section row). `sm`: 28px, 14px padding (settings and strip rows). `cell`: 32px, no padding, fills its container's width (the band's lamp row). Every size's label is `--type-text`. |
| `width` | `number \| undefined` | — | A fixed width in px with the label centred and no side padding (settings rows' 64px On/Off, strips' 72px). It wins over the size's width and padding: with `md` or `sm` the padding becomes 0 and the width is `width`; with `cell` the button is `width` px instead of filling its container. Height and label size still come from `size` (D11). |
| `join` | `'start' \| 'end' \| undefined` | — | Joined to a neighbour with no gap between their faces: `start` rounds only the left corners (`border-radius: var(--radius) 0 0 var(--radius)`, i.e. `4px 0 0 4px`), `end` only the right (`0 var(--radius) var(--radius) 0`, i.e. `0 4px 4px 0`). Undefined: all four corners `--radius`. The Metronome lamp is `join: 'start'` beside its caret (the parent, `MetronomeSplit`, sets the 1px gap). |
| `name` | `string \| undefined` | — | The accessible name when the label alone isn't enough (`Right 1 on`). Default: the label, plus the code if any. |
| `tip` | `string \| undefined` | — | The tooltip key from `app/src/help/tooltips.ts` (e.g. `transport.acmp`), rendered as `data-tip` on the `<button>`; no attribute when undefined (L3). |
| `tipAction` | `Action<HTMLElement, string> \| undefined` | — | The app's `use:tip`, passed in by the wiring. When both it and `tip` are set the `<button>` gets `use:tipAction={tip}`; otherwise nothing (L3). |

### Events

| Callback | Fires when | Payload |
|---|---|---|
| `ontoggle` | click, Space or Enter, unless disabled; not for the click that ends a long press (it is swallowed) | `(on: boolean)` the state asked for, `!on` (the button doesn't change until the parent passes it, D17) |
| `onlongpress` | the button is held 350 ms (`--long-press`) without moving more than 4px, while still held; or right-clicked; unless disabled (longpress SPEC) | `()` |
| `onlongrelease` | the press that fired `onlongpress` ends (pointer up or cancelled; a right-click's release) | `()` |

**Long press wiring.** The `<button>` carries `use:longpress={{ onlongpress, onlongrelease, disabled: disabled || onlongpress === undefined }}`. With no `onlongpress` the action is off, so clicks behave exactly as before. A long press never toggles: `ontoggle` isn't called, and `aria-pressed` stays what it was until the parent changes `on` (D1).

### Slots / snippets

| Snippet | What goes in it |
|---|---|
| — | |

### Visual rules

- **Tokens used:** `--neutral`, `--r1`, `--r2`, `--r3`, `--l`, `--ok`, `--rec`, `--lamp`, `--lamp-line`, `--lamp-ink`, `--on-ink`, `--absent-neutral`, `--absent-lamp`, `--absent-r1`, `--absent-r2`, `--absent-r3`, `--absent-l`, `--absent-ok`, `--absent-rec`, `--code-opacity`, `--wait-fill-opacity`, `--outline-width`, `--outline-width-wait`, `--focus`, `--radius`, `--type-text`, `--tracking-text`, `--space-6`, `--space-14`, `--space-16`, `--control-height`, `--control-height-compact`, `--line-width`, `--focus-offset`; and, through the action, `--long-press`.
- **Size:** height 32 (`md`, `cell`) or 28 (`sm`); width from the label plus side padding, or `width`, or the container (`cell`); `width` wins over both (see Props). Never wraps. `join` changes only the corner radii, never the size. Every face uses the same weight and the outlines are inset, so the width never changes with the face.
- **States drawn by** (`--hue` is the hue token, or `--rec` with `rec` on and waiting):
  - off: transparent, `box-shadow: inset 0 0 0 var(--outline-width) var(--hue)`, label in `--hue`, code in `--hue` at `--code-opacity`. `data-face="off"`.
  - on: `background: var(--hue)`, label and code in `--on-ink` at full opacity. `data-face="on"`.
  - on, `rec`: the same in `--rec`. `data-face="record"`.
  - on, `hue: 'lamp'`: `background: var(--lamp)`, label and code in `--lamp-ink` (the component's `--hue-fill` and `--hue-ink`, which default to `--hue` and `--on-ink`). `data-face="on"`, `data-hue="lamp"`.
  - waiting (`waiting` true and not pressed): `box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue)` over a `::before` filling the box in `--hue` at `--wait-fill-opacity` (the button isolates, the `::before` sits at `z-index: -1` under the label); label and code in `--hue`. `data-face="waiting"`.
  - disabled: transparent, a 1px outline, label and code at full opacity, all in `--hue-absent` (the hue's `--absent-<hue>`), no waiting fill, in every face; `cursor: default`, no press (D14); `data-face="disabled"` and `data-contrast="dim"` on the `<button>` (D18).
  - joined (`join`): the radii above; the face is otherwise unchanged in every state.
  - long press held: no change of its own (the parent may change `on` in answer).
  - keyboard focus: a `--line-width` outline in `--focus`, `--focus-offset` outside the face.
  - No bar, glow or hover change.
- **Test hook:** `data-face` on the `<button>`: `off`, `on`, `record` or `waiting` from the face as drawn, or `disabled` while disabled (D18); `data-hue` is the hue drawn (`t` for `m`), or `rec` when `rec` and not off.
- **Type:** `font: var(--type-text); letter-spacing: var(--tracking-text)` then `font-variant-numeric: tabular-nums`, sentence case as given, at every size and in every face; the code the same, `--space-6` after the label.

#### New tokens

Not in `app/src/ui/tokens/*` today; they land in the orchestrator's tokens contract PR before this component is built (L1). The component uses them by name and never their values.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--long-press` | `350ms` | `350ms` | the long-press time, through the action (`scale.css`) |
| `--lamp-line` | `var(--lime-400)` (`#9fe04a`, the same as `--lamp`) | `var(--lime-750)`, a new palette step `--lime-750: #477b0c` in `palette.css` | the lime of a waiting face's outline and label on the ground (`hue: 'lamp'`); `--lamp` itself stays the fill (D15) |

- **Contrast (AA 4.5:1, `tokens/contrast.test.ts`):** existing rows `--lamp-ink` on `--lamp`, and at `--code-opacity`; `--solid-ink` on `--rec`. New rows: `--rec` on `--g` ("armed record lamp label (LampButton)": 5.67:1 dark, 5.27:1 light, passes) and `--lamp-line` on `--g` ("armed loop lamp label (LampButton)": 13.24:1 dark; light 4.53:1 with the new value). With today's tokens the light pair would be `--lamp` (`#4f8a0e`) on `--g` (`#f2f1ee`) at 3.74:1, which fails, and no single `--lamp` passes both it and `--lamp-ink` (black) on `--lamp` (that needs `#4b820d` or lighter, which is at most 4.13:1 on `--g`), hence the separate token (L2). The tokens contract PR lands before this component is built (D7), so `ArmedLoop` passes axe like every other story; no story carries an a11y exemption. A disabled lamp's `--absent-<hue>` is exempt (`data-contrast="dim"`, `aria-disabled`). (`join` adds no pair.)
- **Motion:** none.

### Accessibility

- **Role and name:** a `button` with `aria-pressed` (`"true"` or `"false"`, from `on`; the waiting face is `"false"`); the accessible name is `name`, or the label plus the code, set as `aria-label`. `aria-disabled="true"` only when disabled; enabled buttons have no `aria-disabled` attribute (L5). When the button has a long press or is armed, the parent says so in `name` or the tooltip ("Right 1 on. Long press: swap mode", "Looper, rec armed").
- **Keyboard:** Tab focuses it (also when disabled); Space or Enter toggles it. The long press from the keyboard is the platform's context-menu key (Menu or Shift+F10), via the action.
- **Tooltip id:** the parent's control id passed as `tip` (e.g. `transport.acmp`, `part.right1.on`, `looper.rec`), with `tipAction` (L3).

## Stories (Story station)

Title `Primitives/LampButton`, `layout: 'centered'` unless the row says otherwise. Every story renders in dark and light (the toolbar theme). The meta's `args` are `{ ontoggle: fn(), onlongpress: fn(), onlongrelease: fn(), tipAction: fn() }` (axiom 7; `tipAction` an action so the story test accepts it, L3), so every story has a long press; a short click still toggles. The table below is the story file as it stands after the Round 2 restyle (PR #550).

**Controls (argTypes):** `label`, `code`, `name`, `tip` text; `on`, `disabled`, `rec`, `waiting` boolean; `size` a select of `md` / `sm` / `cell`; `hue` a select of `t` / `r1` / `r2` / `r3` / `l` / `ok` / `lamp` (the deprecated `m` draws as `t`, so it isn't offered); `join` a select with an empty option for undefined, `start`, `end`; `width` a number (cleared = undefined); `ontoggle`, `onlongpress`, `onlongrelease`, `tipAction` actions.

**Timing in plays (L4):** pointer events are `fireEvent.pointerDown` / `pointerUp(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })` (jsdom 30 has `PointerEvent`). Plays use real time: "wait 500 ms" is `await new Promise((r) => setTimeout(r, 500))`, and a long press is awaited with `waitFor(…, { timeout: 1000 })`. The action's fake-timer cases are in its own unit tests.

| Story | Args | Shows | Crop | Play (interaction check) |
|---|---|---|---|---|
| `Board` | `{ label: 'Accomp', code: 'ACMP', on: true, tip: 'transport.acmp' }` | the first LampButton on the Stage board at the board fixture (`transport.acmp` true): lit, with the code | `Board-{dark,light}.png` (Stage 24,68 127×32; the same box as `On`) | the button named `Accomp ACMP` has `aria-pressed="true"`, `data-face="on"`, `data-tip="transport.acmp"`; `tipAction` was called with the button and `'transport.acmp'` |
| `On` | `{ label: 'Accomp', code: 'ACMP', on: true }` | lit: the solid `--neutral` fill, label and code in `--on-ink` | `On-{dark,light}.png` (Stage 24,68 127×32) | the button named `Accomp ACMP` has `aria-pressed="true"` and `data-face="on"` |
| `Toggles` | `{ label: 'Unison' }` | — | — | click → `ontoggle` called once with `true`, and `aria-pressed` is still `false` and `data-face` still `off` (controlled: the args don't change, D17); focus it, Space → called with `true` again; Enter → again; 3 calls, every one `true`; `onlongpress` not called |
| `Disabled` | `{ label: 'Off', size: 'sm', width: 64, disabled: true, name: 'Manual Bass, works with Upper on' }` | the `--absent-neutral` outline and label, no fill, 64 × 28 | `Disabled-{dark,light}.png` (SettingsChord 858,234 64×28) | `aria-disabled` is `true`, `data-face="disabled"`, `data-contrast="dim"`; click → still not pressed and `ontoggle` not called; `fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })`, wait 500 ms (real time) → `onlongpress` not called; `fireEvent.pointerUp` (same init) → `onlongrelease` not called |
| `Off` | `{ label: 'Metronome' }` | the off face: a 1px `--neutral` outline and label, no fill | `Off-{dark,light}.png` (Stage 1114,68 107×32; see D4) | — |
| `PartOn` | `{ label: 'On', size: 'cell', on: true, hue: 'r1', name: 'Right 1 on' }`, `layout: 'padded'` | a part lamp, lit: the solid Right 1 fill, `--on-ink` label | — (the band's cells are fractional widths) | — |
| `PartOnR2` | `{ label: 'On', size: 'cell', on: true, hue: 'r2', name: 'Right 2 on' }`, `layout: 'padded'` | the same in Right 2's pink | — | — |
| `PartOff` | `{ label: 'Off', size: 'cell', hue: 'r3', name: 'Right 3 off' }`, `layout: 'padded'` | a part lamp, off: the outline and label in Right 3's hue, no fill | — | — |
| `LeftOn` | `{ label: 'On', size: 'cell', on: true, hue: 'l', name: 'Left on' }`, `layout: 'padded'` | the Left part lamp, lit, in teal | — | — |
| `PartDisabled` | `{ label: 'On', size: 'cell', hue: 'r1', disabled: true, name: 'Right 1 on (no sound loaded)' }`, `layout: 'padded'` | a part lamp, absent: the outline and label in `--absent-r1`, no fill, fainter than `PartOff`, never grey | — | `data-face="disabled"`, `data-hue="r1"`, `data-contrast="dim"` |
| `FunctionOff` | `{ label: 'Harm/Arp', size: 'cell' }`, `layout: 'padded'` | a function lamp, off: the neutral outline and label | — | — |
| `FunctionOn` | `{ label: 'Sound', size: 'cell', on: true }`, `layout: 'padded'` | a function lamp, latched: the solid neutral fill, `--on-ink` label | — | — |
| `Running` | `{ label: 'Start / Stop', on: true, hue: 'ok' }` | the running lamp: the solid `--ok` fill | — | — |
| `Recording` | `{ label: 'Looper', size: 'cell', on: true, rec: true, name: 'Looper, recording' }`, `layout: 'padded'` | the record lamp, lit: the solid `--rec` fill | — | — |
| `Looping` | `{ label: 'Looper', size: 'cell', on: true, hue: 'lamp', name: 'Looper, looping' }`, `layout: 'padded'` | the Looper looping: the solid lime `--lamp` fill, the label in `--lamp-ink` | — | `data-face="on"`, `data-hue="lamp"` |
| `ArmedLoop` | `{ label: 'Looper', size: 'cell', waiting: true, hue: 'lamp', name: 'Looper, loop armed' }`, `layout: 'padded'` | Loop armed: a 2px `--lamp-line` ring over a faint lime fill, the label in `--lamp-line` | — (D10) | `data-face="waiting"`, `data-hue="lamp"` |
| `Armed` | `{ label: 'Looper', size: 'cell', waiting: true, rec: true, name: 'Looper, rec armed. Long press: loop rec', tip: 'looper.rec' }`, `layout: 'padded'` | Looper's Rec armed in the lamp row: a 2px `--rec` ring over a faint `--rec` fill, the label in `--rec` | — (no board draws an armed LampButton, D10) | `data-face="waiting"`, `data-hue="rec"`, `aria-pressed="false"`; click → `ontoggle` called once with `true`, and the face is still `data-face="waiting"` (the parent, not the click, lights it, D17) |

Not built yet: `LongLabel`, `JoinStart`, `JoinStartOn` and `JoinEnd` (their `JoinStart` and `JoinStartOn` crops are already cut), `LongPress`, `RightClick` and `Focused`. When they are built: `LongPress` presses with `fireEvent.pointerDown` / `pointerUp` (init `{ pointerId: 1, button: 0, clientX: 0, clientY: 0 }`), waits for `onlongpress` with `waitFor(…, { timeout: 1000 })`, then checks a following `fireEvent.click` doesn't toggle and a `userEvent.click` does; `RightClick` fires `fireEvent.contextMenu` and expects `onlongpress` then `onlongrelease`, no toggle; `Focused` uses `pseudo: { focusVisible: true }`.

Crop positions are `board x,y w×h` in the 1440×900 renders, the same box in the dark and light render; each crop is exactly the button's own box (the focus ring, outside it, is never in a crop; L6).

## Done when (Inspect station)

- Every story in the table exists, renders in dark and light, and its play passes (`npx vitest run src/ui`).
- Each cropped story's screenshot matches its crop (`npm run shots -- LampButton`: score at most 0.02, or the Inspect agent judges any difference to be render noise), and axe finds no violation on any story, except `ArmedLoop` in light until the tokens contract PR (D7, D15) lands.
- The long press comes only from `use:longpress`; the component has no `setTimeout`.
- Only listed tokens are used; no inline colours, no literal sizes outside the Visual rules.
- svelte-check and lint pass on the folder.

## Decisions

- **D1 · A long press never toggles.** The click that ends a long press is swallowed by the action, so `ontoggle` isn't called; what the long press does (swap, Loop rec, Sound held) is the parent's, through `onlongpress` and `onlongrelease`.
- **D2 · `data-face` on the lamp.** The button carries `data-face="off|on|record|waiting"` (kit D41; `waiting` from D13) so page tests read the face without computed colours. While disabled it is `disabled` (D18 replaces this decision's earlier "keeps the face it would have").
- **D3 · `join` covers both ends.** Stage.md lists only `join: 'start'`; `end` is added for symmetry (a lamp to the right of a joined neighbour) and costs one radius rule; it has no board instance, so no crop.
- **D4 · The `Off` crop predates the caret.** `Off-{dark,light}.png` was cut from the #499 render, where Metronome stood alone at 1114,68; in today's render (#536) Metronome is joined at 1093,68, which `JoinStart` crops. The `Off` crop is kept unchanged (it is still a true picture of the unjoined off face); recutting it from Unison (Stage 1229,68 76×32) is a follow-up if the orchestrator wants every crop traceable to the current render.
- **D5 · Board story.** The first LampButton in reading order on the Stage board is Accomp, lit at the board fixture (`transport.acmp` true), so `Board` has `On`'s args and box.
- **D6 · The action is off without `onlongpress`.** Passing only `onlongrelease` does nothing; with no `onlongpress` the button behaves exactly as it did before long press existed.
- **D7 · L1, new tokens.** `--long-press` (350ms) and `--lamp-line` (dark `--lime-400`, light new `--lime-750: #477b0c`) and the two new contrast rows land in the orchestrator's tokens contract PR before the build; this spec never edits `tokens/*`.
- **D8 · L3, tooltip props.** LampButton takes `tip` (rendered as `data-tip`) and `tipAction` (applied as `use:tipAction={tip}` when both are set); stories pass `tipAction: fn()` in the meta and real keys (`transport.acmp`, `part.right1.on`, `looper.rec`, `looper.on_off`), all of which exist in `tooltips.ts` today.
- **D9 · L5, `aria-disabled`.** Rendered as `"true"` only when disabled and left off entirely when enabled (today's component renders `"false"`; the build changes that).
- **D10 · The armed face has no crop.** The Looper board is drawn `looping` and its armed outlines are in the state readout, not on a LampButton, and the Stage lamp row's Looper is off, so `Armed` and `ArmedLoop` are checked by `data-face`/`data-hue` and by eye, not by shots.
- **D11 · `width` wins.** A set `width` replaces the size's width and side padding (padding 0, label centred) and stops `cell` from filling its container; height and label size still follow `size`.
- **D12 · Width follows the weight (superseded, PR #550).** Every face now uses the same weight, so lighting a lamp no longer widens it; `width` still fixes a width where a parent needs one.
- **D13 · The waiting face (lead's call).** `waiting` (default false) and `hue: 'lamp' | 'rec'` (default `lamp`) draw transparent fill, a 1px inset-shadow outline (so the box never changes size) and the label in the hue, with `data-face="waiting"` and `data-hue`; precedence on (or record) > waiting > off; used by LampRow for Looper's Rec armed (`rec`) and Loop armed (`lamp`).
- **D14 · Disabled code.** When disabled, the code turns the hue's `--absent-<hue>` at full opacity with the label, in every face.
- **D15 · L2, the lime on the ground.** `--lamp` on `--g` in light is 3.74:1 and no one lime passes both that and black ink on the lamp face, so the waiting lime is a new token `--lamp-line` (light `#477b0c`, 4.53:1; dark the same lime as `--lamp`, 13.24:1); `--rec` on `--g` passes in both themes (5.67:1, 5.27:1). `ArmedLoop` (light) fails axe until it lands.
- **D16 · L4, plays.** Pointer plays use `fireEvent.pointerDown/Up` with `{ pointerId: 1, button: 0, clientX: 0, clientY: 0 }` and real time (`waitFor` timeout 1000, or a 500 ms real wait); LampButton calls no pointer-capture API.
- **D17 · Controlled (review; Stage D49).** `aria-pressed` and the face follow `on` alone; a click, Space or Enter calls `ontoggle(!on)` and draws nothing new until the parent passes the next `on`, so a lamp lit from `sounding` or `surface.layer` never shows a state the engine refused. Today's local flip goes; `Toggles` and `Armed` check `ontoggle`'s payload and an unchanged face, which a local flip would fail.
- **D18 · `data-face="disabled"` and `data-contrast="dim"` (review).** Stage D49 lists `disabled` among the lamp's `data-face` values, as Stage.md › The base Button and kit D41 do for every faced control; Button D25 takes the same rule. A disabled lamp's `--absent-<hue>` label carries `data-contrast="dim"` (Stage.md › The base Button, D47).
- **D20 · No grey lamps; absent keeps its hue (owner, Stage screen).** No lamp draws a grey hue at rest, on or waiting: `m` is a deprecated alias of `t` (kept in the type so existing callers type-check). Disabled is the lamp's own hue at reduced strength (`--absent-<hue>`, state.css), not one grey for every lamp, so an absent part lamp still reads as that part's.
- **D19 · `waiting` is a boolean plus `hue` (review).** Stage.md row 2 and D49 write `waiting: 'lamp' | 'rec'`; this spec keeps D13's `waiting: boolean` with `hue: 'lamp' | 'rec'` (the same two faces, and Button's waiting/hue pair has the same shape). Stage's `waiting="rec"` is `waiting hue="rec"` here.

Follow-ups: Stage.md row 2 and D49 could adopt D19's prop shape; kit.md › Dimmed text's carriers list needs a row for disabled controls (Button D26).
