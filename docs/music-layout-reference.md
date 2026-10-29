# Music mixer: layout fidelity reference

## Source and scope

- Face: `/home/ryan/Projects/openflowfm/widgets/src/mixer/mixer.css` (all rules).
- Specimen: `widgets/src/mixer/MixerView.stories.tsx`, `Music/Four-deck mixer` → `FourDecks`; it renders `Preview` → `MixerView` directly, not the app's `PlayView`.
- Port: `src/library/Music/mixer/mixer.css`. Root contract: **`class="zen-music wdg play-example"`**. The explicit `&.play-example` styles that same root; all other rules apply below it. Keep context popovers inside this DOM subtree, including when shown in the browser's top layer.
- The `:where(.zen-music)` nesting adds **zero specificity**, preserving each original selector's specificity against controls. Original rule order and overrides are retained, including repeated `.play-*` rules; do not consolidate them by copying only the first declaration.
- Only palette literals and the context menu's 5px radius become theme-owned aliases. `transparent`, zero-radius resets and the dot's `50%` circle retain their structural meaning. Animation names gain `zen-music-` to prevent global name collisions; keyframes, durations and reduced-motion rules are unchanged.

## Fullscreen is not height-filling

The original story sets **`parameters.layout: 'fullscreen'`**, overriding the preview's `padded` default. Storybook removes its story padding; it does not size the mixer to the viewport's height. `widgets/.storybook/preview.css` sets `body { margin: 0 }`, global border-box sizing, theme background/foreground and sans typography/axes. It contains **no `.play-*`, `.mf-play`, fullscreen-sizing or mixer viewport-breakpoint rules**. Its other specimen styles do not govern this story.

The source face is a normal content-height block:

- `.play-example`: maximum width **1600px**, horizontal auto margins, no height or minimum viewport height.
- Timeline: **4px vertical margins**, 1px border; four waveform rows each **at least 48px**, with **116px** label columns. Extra viewport height is not assigned to waveforms.
- Deck grid: four intrinsic-minimum deck columns surrounding a fixed **156px** master; **980px** grid minimum. `MixerView` sets `--play-deck-min` inline to `max(200, 56 + 36 × largest stem count)px`. `widgets/stories/usePreviewMixer.ts` has **four stems per deck**, so this story uses **200px**; a six-stem host would use **272px**. These are minimums, not a promise that the complete grid fits inside 980px.
- Six shared subgrid rows: **30px + five auto rows**. The footer spans the last two rows. Transport columns are **44px**, separators are **1px + 6px margin on each side**, fader maximum is **88px** with a **75%** minimum, and meter gap is **6px**.
- `.play-scroll` provides horizontal overflow around the controls, not the timeline; the page can scroll vertically naturally. Do not scale controls or replace intrinsic sizing with equal `minmax(0,1fr)` deck tracks.

**Lead integration:** import `Music/base.css` (theme aliases and shared control anatomy) before control/mixer styles. Keep `layout: 'fullscreen'`; do not add a fixed height, `height:100vh`, a constrained-height/overflow-hidden frame, app shell, padding, or `frame: { w, h }` scaling to the baseline story. Zen's `withLibraryTheme`/Renderer integration must retain the toolbar's actual selected theme, not pin an inner `mixflow` scope. Ensure the scoped mixer inherits the source sans family/variation axes and source typography metrics from the theme/base lane rather than the field-guide body's defaults. `base.css` must retain border-box sizing on `.wdg, .wdg *` so borders are included in control dimensions; `.play-separator` deliberately overrides it to `content-box`.

In particular, `library.css` gives `.lib-scope` a **1.4 line-height** and facet tracking; the reference preview does not set either, so it uses **`normal` line-height and `normal` letter-spacing** except where a component explicitly overrides them. The theme/base lane needs to restore those inherited defaults locally for source fidelity, alongside source `font-weight:400`, sans variation axes (`'MONO' 0, 'CASL' 0.38` for mixflow), body `user-select:none` and `input/select { user-select:text }`. Do not change the global `.lib-scope` or body to accomplish this. A family alias alone cannot select Recursive's proportional/monospaced cut: the source axes inheritance must remain intact (including mixer labels that set `--mono` as the family without explicitly changing axes).

## Responsive rules that really belong to this story

These are all retained in the port:

1. Intrinsic grid sizing, deck minimums, horizontal overflow, flexible channel/fader dimensions, subgrids and `data-staggered="true"` knob stacks.
2. `.play-beat-jump { container-type: size }` and **`@container (min-aspect-ratio:1/1)`**: its own button pair becomes horizontal (`row-reverse`), changes the internal divider, hides ↑/↓ and shows ←/→. This is an element aspect-ratio query, not a viewport breakpoint.
3. Both **`prefers-reduced-motion: reduce`** rules stop queued-cell pulsing and loading-label breathing.
4. Context menu viewport bounds: width **248px**, maximum width **`100vw - 32px`**, maximum height **`min(--wdg-popup-room or 100vh, 100vh - 24px)`**.

There are no width/height media queries or `.mf-play` container queries in the widgets story.

## The 1280 × 720 target belongs to Play

`widgets/docs/mixer.md:317–323` documents **1280 × 720 as Play's minimum supported viewport**, with normal-size controls and scrolling below it. This is a host-level target, **not a `min-width:1280px` / `min-height:720px` declaration** on `MixerView`, and not a fixed frame on the Four-deck story. Use 1280 × 720 as a browser fidelity checkpoint, plus a larger viewport and a narrow overflow checkpoint. Do not claim that this CSS-only port has browser-verified that fit.

`mix/src/play/PlayView.tsx` imports `play.css` and wraps the face in **`.mf-play`**, which the reference story never renders. Consequently **none** of `mix/src/play/play.css` is copied into the baseline story or mixer stylesheet. Applying these app rules would change the reference composition. If the lead adds a separate **Play-host** specimen later, scope its host rules to that specimen's own wrapper and stylesheet, not `.zen-music` or Storybook's global preview.

For that separate host only, the source behavior to preserve is:

| Host rule | Source effect (not the Four-deck story) |
| --- | --- |
| `.mf-play` | Flex child, size container, `min-width/min-height:0`, clipped host; mixer max-width removed, fills host height as a column. Deck backgrounds use the well; app drag feedback remains distinct. |
| Spare height | Timeline flexes into spare height; scrolling controls use `height:min(690px,calc(100% - 204px))`. Waveform canvases fill their lane. |
| Grid | 38px header row, 28px track header with 14px text rows; six rows are `38px minmax(136px,1fr) max-content minmax(248px,max-content) minmax(--play-routing-min,max-content) 64px`; 58px transport columns. |
| Deck sizing | Grid height 100%; deck minimum `--mf-deck-min` or 260px; grid minimum `4 × deck minimum + 158px`. Performance grid max-height 198px, scrolls vertically, with sticky labels/last control row. |
| Container width ≤1490px | Loop controls become a three-column grid. |
| Container height ≤780px | Shared rows become `38px minmax(126px,1fr) max-content minmax(211px,max-content) minmax(--play-routing-min,max-content) 58px`; transport 52px; knob row/gap 52px/2px; FX vertical padding zero; actions gap/padding-bottom 2px; FX picker gap 3px; separator margin 5px; all knob stacks stagger into two columns. |
| Container width ≤1250px | First performance-grid column gets a 44px minimum; cells and last-row widgets fill available width. |
| Container width ≤960px | Master narrows to 140px; grid minimum becomes `4 × deck minimum + 142px`; route gap 4px. |
| Container height ≤700px | Waveform/timeline minimum heights clear; scrolling controls use `height:calc(100% - 172px)`. |
| Container height 600–780px | Scrolling controls retain a 576px minimum height. Final `.play-scroll { overflow-y:auto }` supersedes the earlier hidden overflow so controls scroll rather than collapse separators. |

These conditions use the **`.mf-play` content box**, not window dimensions; app chrome reduces its available room.

## Theme-lane alias requirements

Define these aliases in the scoped **`Music/theme.css` / theme facets**, inherited by the mixer and its context popovers. The port intentionally has no literal fallback colors, so missing aliases are an integration blocker. Values below are the exact source values for `mixflow`; other packs may derive equivalents from their own tokens.

| Local alias consumed by `mixer.css` | Exact source value | Source use |
| --- | --- | --- |
| `--play-deck-sheen` | `#ffffff02` | Deck's 90° gradient midpoint |
| `--play-fader-highlight` | `white` / `#ffffff` | White term in the fader's 10% `color-mix` (the 10% remains in component CSS) |
| `--play-wave-grid-ink` | `#ffffff26` | Static waveform's 12.5% repeating grid |
| `--play-wave-bar-faint` | `#ffffff16` | Scrolling grid, faint bar mode |
| `--play-wave-bar` | `#ffffff33` | Scrolling grid, bars/beats modes |
| `--play-wave-beat` | `#ffffff1a` | Scrolling grid, beat mode |
| `--play-wave-loading-stripe` | `#ffffff08` | Loading lane's 135° 7px stripes |
| `--play-wave-source-divider` | `#ffffff10` | 1px line between waveform sources |
| `--play-context-shadow` | `#0009` / `#00000099` | Context popover's `0 8px 28px` shadow color |
| `--play-context-radius` | `5px` | Context popover radius; not the ordinary 2px control radius |

Keep the original reference aliases available too: **`--wdg-{text,text-strong,caption,edge,face,well,radius,knob-size}`, `--mono`, `--primary`, `--amber`, `--green`, `--caution`, `--caution-hover`, `--shadow-edge`**. Deck/stem/loop scope owns **`--deck-ink`, `--stem-ink`, `--stem-label`, `--loop-ink`**; the model sets these per source/deck as before. Mixer rules still set geometry aliases (`--play-*`, `--wdg-track`, `--wdg-thumb`, etc.) in the original places so inherited control defaults cannot reset their layout meaning.

## Lane delivery and evidence

This lane owns only `src/library/Music/mixer/mixer.css` and this document; it does not modify themes, component CSS, models, registries or Storybook config. No unit tests, commits, worktrees or servers are created/run by this lane. Lead/theme follow-up is the alias table and root/import/typography integration above; actual browser evidence remains the lead's responsibility.

**Actually checked:** a one-off PostCSS structural comparison of the source and port passed for **238 rules and 726 declarations**. After reversing only the documented root scope, animation names and ten aliases (and normalizing selector indentation), all selectors, declaration values/order/importance, media/container queries and keyframes match. This is a static source-fidelity audit, not a unit test, build or browser/layout check.
