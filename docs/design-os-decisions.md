# Design OS: decisions

Decisions made without asking, for the owner to veto. Newest last. Each says what was decided and why.

## 2026-10-12

1. **Materials replace Chrome.** Parts declare a role (`well`, `screen`, `key`, `handle`, lit); a material set says how each role looks. No Forms facet yet (#27).
2. **Faces + Scale.** Type sizes, the spacing unit and control height move together in one Scale facet, so text and controls grow as one.
3. **Every palette has light and dark.** The scope follows `prefers-color-scheme`, with a Mode override. Missing modes were derived from each source's own colours and marked `// added` (Refero has Elektron, Linear and Ableton in one mode only).
4. **Generic role slots.** The contract has `--role-1`/`--role-2`; Yahaha maps them to `--style`/`--transport` (`yahaha/tokens.css`). Key faces are the instrument extension (`--key-white`, `--key-black`).
5. **Hardware materials and the classic palette/faces** come from Yahaha's pre-minimalism UI (ryangavin/yahaha@0dd53b6), as the `yahaha-classic` pack.
6. **Material shadows are never `none`** (`0 0 0 0 transparent` instead), so components can list them with their own state rings in one box-shadow.
7. **Layouts live outside design systems.** One set of layout primitives (`src/library/layout/`): `Screen` (fixed header and footer, a named grid), `Region` (tabbed views folded in), `Group`, `Tabs`, `Layer`/`Opaque`/`Hole`. Layout systems later (#28).
8. **Tabs are drawn by the materials** (`tabs`: track, tab, chosen, ink, spacing), and the region header has its own inset and rule (`plate.head`): underlines for Push and Ableton, filled for Elektron, segmented for Linear, a hardware selector for hardware.
9. **Layers: a depth stack in the contract** (`ground`, `base`, `raised`, `float`, `overlay`, `top`), each with fill, an opaque `solid`, texture, backdrop, cast and edge, plus one `light` angle per system. The old `plate` and `float` materials became the `base` and `float` layers; `plate` keeps only region spacing. `Opaque` makes every layer inside solid (for panels over a native view); `Hole` is a cut-out.
10. **The Stage's regions are `Region`s on a `Screen`:** AppBar in the header; the keys and status line in the footer; the banks' page tabs are Region views; the mixer's layers are `Tabs` in the aside.
11. **Storybook nests by title** (Field guide, Design OS, Yahaha, open[flow]); composing other repos' Storybooks with refs comes later (#29).
12. **Distribution:** apps consume zen as an npm package, via a GitHub dependency until it's published.
14. **Package `@satoramoto/zen`:** `npm run build:lib` (Vite library mode to `lib/index.js` and one `lib/zen.css`, plus declarations), run on `prepare` so a GitHub install builds it. React is a peer dependency (^19), so an app never gets a second copy. The contract's `Layer` type is exported as `LayerStyle`, because the layout `Layer` component takes the name.
15. **Layer values:**
    - Flat sets read depth as tone steps: `raised` is one surface step above `base`, so FaderBank's Master plate now shows. `overlay` and `top` are `surface-3` with a strong hairline and growing shadows.
    - Hardware keeps its float drop, with bigger casts for `overlay` and `top`.
    - Shadows are written for a light from above; they aren't computed from `light` with CSS trig.
16. **The glass system (`visuals` pack):**
    - The `frost` palette's stem and deck colours are pushed apart in chroma to meet the 0.12 distance rule. `--primary` is both accent and action, and signal green is success.
    - The light mode is all `// added`.
    - The `roomy` scale has a 4px unit and 30px controls; visuals' 40px rows can't be expressed in a scale.
    - `instrument` faces use a system mono instead of loading Recursive. Components set tabular figures themselves.
    - Region spacing is a literal 22px inset and 32px gap, so it holds under any scale.
    - Storybook paints a stand-in desktop behind translucent grounds (`pack.desktop`).
17. **Core and Music components (out of Yahaha):**
    - A hue slot is the number 1–4 everywhere. Role values are `'role-1'` and `'role-2'`.
    - Pad takes a separate `hue` and `role`, instead of part families and a `transport` flag.
    - Keys zones are a generic left and right, with the names passed in as props.
    - Yahaha maps its parts in its own callers (`PART_HUE_INDEX`).
    - Older values stay on Button, StatusDot and BarBeat for now: `t`, `t2`, `m`, `a`, `ok`, `rec`, `lamp` and the deprecated section values.
    - The moved components keep their `yh-` class prefix for now; renaming it is a follow-up.
18. **AppBar's pages are tablists** (two layout `Tabs`, "Display pages" and "Full pages") instead of buttons with `aria-current`. `Tabs.value` may be `null`, which leaves no tab chosen.
19. **Display's and SongForm's roots are plain elements,** so the Stage's Regions carry the names: "Hero", "Transport" and "Song form", or "Song form and transport" in the split layout.
13. **visual[flow] is rebuilt in zen** (`src/library/visuals/`) on the glass system, checked against the original Storybook for drift; the app itself is then wired to zen on a branch in openflowfm/visuals, opened as a draft PR without auto-merge, because that repo is mid-1.0 with its own decision log (#105).
20. **Package entry `@satoramoto/zen/visuals`** (`lib/visuals.js`, `lib/visuals.css`): `VisualsApp`, `setBridge`, `currentBridge`, `Bridge` and the other ipc types. Library code both entries share is one chunk, and a build plugin keeps every library stylesheet in `zen.css` (the build fails if one lands in `visuals.css`), so an app imports both stylesheets.
21. **`VisualsApp`** ports the original's `App` and `main.tsx` setup: a ThemeScope on the `visuals` pack (`frame`, default on), `startChrome` only when the bridge's window label is `main`, and the original's "no app behind this page" note when no bridge is installed. An `editor` view falls back to Home (no Lab).
22. **Export renames for clashes:** ActionButton's `ButtonFace` is `ActionButtonFace` and Param's `format` is `formatParam`; Param's generic `clamp` and `span` aren't exported.
23. **The old generic demo is gone** (`components/index.tsx`, `ArrangerStage`). The Theme inspector moved to `src/library/inspector/` with a local panel and `Group`s; stories that used the demo now use core `Button`, `LampButton`, `StatusDot`, layout `Tabs` and music readouts.
24. **Contract tests run per mode:** every rule (distance, AA, keys, hues, every variable filled) runs over both modes of every palette and pack. The no-literal-radius rule allows `0`/`0px` and `inherit` (BarBeat, TempoReadout and ChordReadout drop their window on a screen; Display inherits), since neither is a radius a theme chooses.
25. **CI builds the package** (`npm run build:lib` in `checks`).
26. **Tiers** (`docs/tiers.md`): every decision belongs to one tier: tokens, primitives, controls, groups, regions, screens, app. Each tier builds only from the one below.
27. **Primitives** (`src/library/primitives/`):
    - `Text`'s `role` is the type role and replaces the ARIA `role` attribute. `code` is the mono face at `--size-body`, since the scale has no code size. Numerals and code are tabular.
    - The tone colours live on one shared `.lib-tone` class, which `Icon` uses too. `on-solid` reads `--action-text`.
    - `Surface` paints one box-shadow list from five slots: border, material shadow, glow, edge, cast. With both a `layer` and a `material`, the material paints the face and the layer adds its backdrop, edge and cast. The default `radius` is `card` for a layer alone, otherwise `control`.
    - The rings are classes (`focusRing`, `pressRing`). The press ring is an inset outline, so it never fights a Surface's shadow.
    - `Step` is 0–6, where N is `var(--space-N)`.
28. **`Stack` lives in `layout/`**, beside `Group`: `tiers.md` puts it in the Groups tier, even though the brief listed it with the primitives.
    - `Group`'s body is a `Stack` with a default gap of 2, as before. `Region` takes a body `gap`, which defaults to none.
    - Stack's step rules are wrapped in `:where()`, so the existing `.x > .lib-group__body { gap }` overrides still win.
29. **The tier checks** (`src/library/tiers.ts`, `tiers.test.ts`, `npm run tiers`) count breaches per widget folder (`components/core/<Name>`, `yahaha/<Name>`, `visuals/<Name>`, `layout`, `primitives`):
    - Pixels: `0`, `1px` and `2px` are allowed, and so are media and container query preludes (variables can't go there). TSX counts px strings and bare numbers on length keys in `style={{}}`.
    - Margins: only on a control's root block (one compound selector, no `__`). Resets to zero pass.
    - Painting: `layout/Group|Stack|Screen.css` count in full. In `Region.css`, only rules other than the plate (`.lib-region`, `.lib-region__head`) count. `Layer.css` (a primitive) and `Tabs.css` (a control) are exempt. App CSS counts only in rules that name a layout primitive's class or `data-part`.
    - Knobs: `--yh-*`/`--vs-*` names declared in CSS and missing from a sibling TSX's **Tuning knobs** list (a trailing `*` lists a family). A CSS file with no TSX beside it may list its knobs in its own comments.
    - A count below its baseline passes: the baseline is a shared file, and forcing every lane to rewrite it would make them conflict. Lower it with `npm run tiers -- --write`. A folder that isn't in the baseline is held to zero.
30. **The burn-down reached zero everywhere** (433 pixel values, 2 margins, 1 painting, 245 undeclared knobs), and the baseline is now all zero, so every rule is an error in every folder. Much of it is translation, not adoption: pixel values became scale-step arithmetic (`calc(var(--space-2) * 55)`) and knobs became declared knobs. `Text` was adopted almost nowhere, and `Surface` only where it kept the look. The next round fixes the primitives so they become the short way: `Text` needs tight line-heights or a size that follows a knob, and `Surface` needs `ref`/`type` and a circle radius.
31. **Lit glow:** materials give `lit.radius` and `lit.strength`. `library.css` builds `--mat-lit-glow` on every element (`SCOPE_VARS`), because a glow declared on the scope resolved `var(--lit)` there, where no lamp colour exists, and every glow was empty.
32. **`Region fit="content"`** sizes a region to its head plus its body (rows `auto auto`, min-content floors). The Knobs region uses it, and the Stage's knobs row is `min-content`. The knobs had collapsed to 0px and drawn over the pads since the Stage moved onto `Screen`. At 1217×752 the Stage now zooms to 0.848 instead of 0.893, because the knobs take their real height.
33. **visuals' proposed tokens stay as declared knobs for now:** row, titlebar, sidebar, inspector, tile and window radius are app-frame sizes, which belong with layout systems (#28). A "measure" (text width) step and an 11px "small" size are Scale candidates (follow-up).
34. **`Text` refinements:** `leading` (`tight` 1, `snug` 1.15, `normal` the face's own, `none` 0; omitted is the role's), `size` (another role's size, or `inherit` = 1em), `weight` (one of the four contract weights), `case` (`upper`, `label`, `none`), and `tabular={false}` for normal figures. They render as namespaced `data-text-*` attributes, because controls already use `data-size` on their roots. `ariaRole` carries the ARIA role, since `role` is the type role.
35. **Text knobs:** `--text-size`, `--text-weight`, `--text-leading` and `--text-tracking` win over the role's value. Each is reset to `initial` on every Text, so a knob set on an ancestor never reaches a nested Text: it goes on the Text element's own class. There's no case or figures knob (those are props), because `text-transform` and `font-variant-numeric` are only declared when a role or prop asks for them, so a Text without them still inherits.
36. **`:where()` everywhere in `Text.css` and `Surface.css`,** tone rules included, so a component's class on the same element refines a primitive without `!important`. `Text` and `Surface` take every native attribute (`AllHTMLAttributes`) and a `ref` (React 19 passes `ref` as a prop; it's typed `Ref<any>`, since the element is whatever `as` names). `Surface` gained `radius="circle"` (`50%`).
37. **Tier rule `type`** (`components`, `layout`, `yahaha`, `visuals`): `font`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `font-variant-numeric` in CSS and in `style={{}}` keys. A bare CSS-wide keyword (`font: inherit`, `line-height: inherit`) is a reset and passes. Setting a Text knob doesn't count. Stories are not scanned. The baseline was 802 (components 290, layout 12, yahaha 103, visuals 397). It's now 0 everywhere and locked.
38. **The burn-down moved text onto Text:** 78 of 90 component folders render `Text` (2 before) and 7 render `Surface` (1 before). About 250 knob settings remain where the scale has no matching prop: sizes off the role steps (visuals' `--vs-text-*` ramp, em ratios, `calc` sizes), leadings 1.25/1.3/1.45/1.5 or `var(--control-h)`, weight 500/700, and tracking 0. Those are honest leftovers. A `leading` step for 1.25–1.5 and a weight-medium token would retire most of them (follow-up).
39. **visuals' control reset** `.vs-root :where(button, select, input, textarea) { font: inherit }` now skips `.lib-text`: it had class specificity and silently erased every Text button's role inside the visuals app. `.vs-root .vs-num` sets only the readout face and word spacing, and each `vs-num` element sets `tabular` itself.
40. **Radio's root is a body Text** like Checkbox's, since they share `.lib-check`'s type knobs. Segmented and Select pass their hooks' ARIA `role` through `ariaRole`. The visuals view switch writes its words capitalised in code instead of `text-transform: capitalize` on Segmented's part.
41. **Surface adoption only where it's the same paint:** the Slider track and thumbs, the Switch thumb, the Meter channel, Knob's well and cap, ChordReadout's screen, and CrashPrompt's report. Faces with a tint layer over the key material (Button, Toggle key, Select trigger, the Switch track, ActionButton) keep their own painting, because a Surface can't layer a tint yet (follow-up: a `--lib-surface-tint` slot).
42. **Self-assembling layout** (`docs/assembly.md`, `layout/assembly/`). Needs are declared in scale units (`control`, `target`, `space`, `unit`, `lines`, `chars`, and hairline `px`), never measured. The solver resolves them from the facets: the scale for sizes and the materials' plate for inset, head and gap. It reads the materials' CSS lengths with a small parser that throws on anything it can't read. `ROLE_LEADING` copies Text.css's leadings, and a test holds the two together. `chars` uses an average glyph width of 0.6 em.
43. **The solver's rules:**
    - The lowest priority steps down first, strictly. Within that tier, a step that shrinks the body wins.
    - Once the body fits, a take-back pass restores any step a later one made unnecessary, highest priority first.
    - Zoom comes only when no step down helps any more. That is usually when everything is at its last form, but a region whose next form isn't smaller where the body overflows isn't stepped for nothing.
    - Spare room goes first to each tier's ideal, then to the growers, highest priority first and in proportion to their ideals. Regions stretch across their row.
    - The header and footer are each region's first form at its ideal height. They never step or zoom.
44. **Density is the fit aim:** `dense` tests each form at its least, `balanced` halfway, `roomy` at its ideal. A roomy pack that runs out of steps retries as dense before zooming.
45. **Ranks:** `now, next, controls, context, chrome` (`RANKS` in the contract), scored 100, 80, 60, 40, 20. A pack may reorder them. "What's playing never shrinks first" is `now` on top.
46. **Every pack's `minTarget` is 24**, WCAG 2.2's target size minimum (`// added`: no source sets one). The zoom floor is `minTarget / control`: 0.857 at the compact scale, so the Stage's current 0.848 at 1217 × 752 would hit the floor once it is assembled. Yahaha is `dense`, visuals `roomy`, and the studio packs `balanced` (`// added`).
47. **Pairs** are two regions in rows of one stack, both first or both last, that take one width. Any other pair throws.
48. **`AssembledScreen` places each slot absolutely.** The rects go in as unitless custom properties (`--lib-at-x` … `-h`), and `Assembly.css` multiplies them by `1px`. The px come from the facets, so this is the screen tier using tokens, not a literal. The body zoom (`zoom`) sits on an inner box, so it never scales the zone's offset. The room is the one thing measured (the screen's own box); where nothing measures, it is 1440 × 900.
49. **`useForm(forms, given?)`** returns the `form` prop if given, else the region's chosen form when it is one of the component's forms, else the first. A region passes the same form id to every declaring component inside it, so a per-part mapping is a follow-up.
50. **`ThemeScope` takes `principles`** and puts its facets and principles in context (`useThemeScope`). The Storybook decorator passes the pack's. Outside a scope, the solver uses the first pack.
51. **Thinner blocks:**
    - `Layer` is a deprecated alias of `<Surface layer radius="card">`. It keeps the `lib-layer` class, because visuals' CSS names it.
    - `Opaque` and `Hole` moved to `primitives/Surface`. Layer.css is gone.
    - `Stack` is a primitive (this reverses 28). The layout index doesn't re-export it, because the library's `export *` of both folders would clash.
    - `Group` is a column `Stack` holding the label and a body `Stack`.
    - The story helper `.lib-stack` in library.css became `.lib-specimens`. It had the Stack component's class name and could outrank Stack's `:where()` gap rules.
