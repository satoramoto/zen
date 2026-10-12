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
13. **visual[flow] is rebuilt in zen** (`src/library/visuals/`) on the glass system, checked against the original Storybook for drift; the app itself is then wired to zen on a branch in openflowfm/visuals, opened as a draft PR without auto-merge, because that repo is mid-1.0 with its own decision log (#105).
