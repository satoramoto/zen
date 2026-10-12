# Design OS: handoff

Where the design OS stands, and how to pick it up. The code is in [satoramoto/zen](https://github.com/satoramoto/zen) (`~/Code/satoramoto/zen`), next to the field guide. Why things are the way they are: `docs/design-os-decisions.md`. Checks: `AGENTS.md`.

## The idea

Every visual decision is a named choice in one token contract, and every widget is rebuilt from what its user needs. Components read only the contract's CSS variables (`toCssVars()` in `src/library/contract.ts`), never a literal colour or radius; `library.test.tsx` enforces it.

## Facets

A design system is four facets, mixed freely (`src/library/themes/`, one file each):

| Facet | What it holds | Sets |
|---|---|---|
| Palette | colour roles in light and dark: surfaces, text, action, selected, accent, states with their text, four categorical hues, two role hues, keys | push, elektron, ableton, linear, classic, frost |
| Faces | families, weights, tracking, label case | push, classic, elektron, ableton, linear, instrument |
| Scale | type sizes, spacing unit, control height | compact, regular, airy, roomy |
| Materials | radii, borders, fields, region spacing, tabs, part materials (well, screen, key, handle, lit), and the **layers** | push, elektron, ableton, linear, hardware, frost |

**Layers** are the depth stack: `ground`, `base`, `raised`, `float`, `overlay`, `top`, each with a fill, an opaque `solid`, texture, backdrop, cast shadow and edge, plus one light angle. Flat sets step tones; hardware casts shadows; frost is glass.

A **pack** (`themes/packs.ts`) is a named mix with its source: `yahaha-elektron`, `yahaha-classic`, `yahaha-push`, `visuals`, `elektron`, `ableton`, `linear`. The scope follows the system's light/dark preference unless a mode is chosen. The Storybook toolbar mixes facets and modes; `Design OS/Systems/Theme inspector` shows each pack's variables.

The contract tests hold, in both modes of every palette: every meaning-bearing pair at least 0.12 apart in OKLab, AA text on every solid state and role fill, keys light over dark, and every layer and material filled.

## Layout primitives

`src/library/layout/`, shared by every design system: `Screen` (fixed header and footer, regions in a named grid), `Region` (a titled area, with switchable views), `Tabs`, `Group`, and `Layer` / `Opaque` / `Hole` (draw on a layer; make everything inside solid; cut a hole for a native view). Stories: `Design OS/Layout/*`.

## Components

- **Core** (`components/core/`): Button, LampButton, ActionButton, Select, Segmented, Popover, Toggle/Switch, Checkbox, Radio, Disclosure, NumberField, Slider, Param, Modal/Sheet, SearchField, StatusDot, StepValue, LineSlider, Readout, SettingsRow, FolderList, PageList, Separator.
- **Music** (`components/music/`): Fader, Knob, Pad, Keys, Meter, BarBeat and the readouts and cells an instrument shows.

A colour slot is a hue number 1–4 or a role (`role-1`, `role-2`); the app decides what it means.

## Apps on zen

- **Yahaha** (`src/library/yahaha/`): the arranger's widgets and the Stage screen, redesigned. `README.md` is the convention, `STAGE.md` the brief, `hues.ts` what colour means. The Svelte originals are in `yahaha/`, read-only.
- **visual[flow] 1.0** (`src/library/visuals/`): every shipping screen rebuilt on the glass system (`visuals` pack), with the original's API, data through a swappable bridge (`model/ipc.ts`) and fixtures for Storybook. `README.md` lists the drift from the original. `VisualsApp` is the whole app (Home/Live, sheets, onboarding, update and crash prompts; no Lab); story `open[flow]/visuals/App`.

## Package

`@satoramoto/zen`, built by `npm run build:lib` (on `prepare`, so a GitHub install builds it) to `lib/`:

- `@satoramoto/zen` + `@satoramoto/zen/zen.css`: contract, themes, layout, core and music components.
- `@satoramoto/zen/visuals` + `@satoramoto/zen/visuals.css`: `VisualsApp`, `setBridge`, `currentBridge`, the `Bridge` type. The app installs a Tauri bridge with `setBridge`, then renders `VisualsApp`.

React is a peer dependency. The visual[flow] app is being wired to this package on a branch in openflowfm/visuals.

## Look at it

`PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev`, then Storybook at http://127.0.0.1:6022: `Design OS` (systems, layout, components), `Yahaha`, `open[flow]`, then the field guide. Viewports 1440×900, 1217×752, 900×700 and 560×800 are in the toolbar.

## Open issues

- **#26** Principles as structured data, served to agents.
- **#27** Forms: anatomy choices beyond Materials.
- **#28** Layout systems: design systems for layouts.
- **#29** Storybook composition: zen as the master Storybook.

Also open: visual[flow]'s fonts (Instrument Sans isn't loaded), a browser pass over the visuals layouts and popovers, and the moved components' `yh-` class prefix.
