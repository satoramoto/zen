# visual[flow] on zen

**Where does this go?** This is the app tier and its screens and regions: data, behaviour, which regions go where. A look is a primitive, an interaction a control in `components/`, spacing a Group's `gap`; a folder here arranges them. See [`docs/tiers.md`](../../../docs/tiers.md); `src/library/tiers.test.ts` counts breaches per folder against `../tiers.baseline.json`, and a folder's `--vs-*` properties are listed under **Tuning knobs** in its component's doc comment.

visual[flow] 1.0's UI (openflowfm/visuals, `app/src/`), rebuilt on zen's contract, layout primitives and generic controls, worn in the `visuals` pack (palette `frost`, faces `instrument`, scale `roomy`, materials `frost`). The rules for the look are `../themes/principles/visuals.md`. Lab is not ported.

## Layout of this folder

```
visuals/
  model/      the original's non-UI modules, ported 1:1 (same names and exports)
    ipc.ts    the bridge in place of Tauri: invoke, listen, emit, window, webview, openUrl
  fixtures/   the original's app/src/stories/: fixtures, the fake backend, the starter set, story.tsx
  visuals.css visuals-level tokens on .vs-root, each mapped onto contract variables
  <Name>/     one folder per screen or part: <Name>.tsx, <Name>.css, <Name>.stories.tsx
```

## The convention

- **Same API as the original.** Each `<Name>.tsx` keeps the original component's exported names, props, behaviour, keyboard and focus handling, accessible names and copy. What changes is how it is built and drawn.
- **Data through the bridge.** Components still call `model/api` and friends. `model/ipc.ts` routes every command and event through one installed `Bridge`: the app installs one over Tauri; Storybook installs `fixtures/backend.ts` (the original's fake app, same `World`) from each story's `parameters.world` (the original's `parameters.tauri`).
- **Screens are `Screen`s of `Region`s.** Fixed header/footer, regions in a named grid, switchable views as `Region.View` or `Tabs`, clusters as `Group`s.
- **Depth is a layer, never a look.** Regions sit on `base`; popovers, menus and a dragged tile are `Layer level="float"`; sheets and dialogs `overlay` (core `Modal`/`Sheet`); the help overlay and toasts `top`. The native preview is a `Hole` (`Views`' `Preview`), and everything over it is in `Opaque`.
- **Contract variables only.** No literal colours or radii, no `light-dark()`; `library.test.tsx` scans every non-story file here except `model/`. Visuals-only meanings (`--vs-playing`, `--vs-line-active`, the type ramp) are declared once in `visuals.css`. Classes are prefixed `vs-`.
- **Generic controls live in `components/`**, built headless for any app: `core/` ActionButton (ButtonFace), Select, Segmented, Popover, Toggle (Toggle, Switch), Checkbox, Radio, Disclosure, NumberField, Slider, Param, Modal (Modal, Sheet), and `music/Meter`. Their APIs mirror `@openflow/widgets` and the app's macOS controls, so call sites port unchanged.
- **Stories pair one to one.** Title `open[flow]/visuals/<original title>`, the original's story names, args and fixture data, `decorators: [withVisualsFrame, withLibraryTheme]`, `globals: VISUALS_GLOBALS` (`theme: 'visuals'`), `beforeEach: visualsBeforeEach`. The frame paints the desktop behind the frost (`desk`: dark, light, solid). Every original story name exists here.

## Drift from the original

What differs and why. "Principles" is `../themes/principles/visuals.md`.

| Screen / part | Differs | Why |
|---|---|---|
| All | No animation except Esc-hold's ring and the skipped note's fade (hover lifts, hint fades, Pack's progress, the leaving card show at once). | Principles: nothing moves. |
| All | Storybook viewports `home1440`/`home900`/`narrow` and the pseudo-states addon are absent; stories size their own wrapper (`paneWidth`, args) and `Hover` doesn't force hover. | zen's Storybook doesn't have them (shared `.storybook/`). |
| All | Play functions select `vs-*` classes, roles or ids instead of the original's class names. | Class names are zen's. |
| All | Instrument Sans is not loaded yet; the `instrument` faces fall back. | Fonts belong with the faces facet (follow-up). |
| HomeLayout | As the original, the sidebar runs the full height (its top band holds the window buttons) and the header is the main column's first row beside it, so it doesn't use the Screen's fixed header. Sidebar, main column and inspector are three named Regions. Overlaid panels get `lib-opaque` on their own cell (not an `Opaque` wrapper) so they don't remount. No settings cog. | A Screen header would span the window; principles (no cog, opaque over content). |
| Home | Library sits in a `vs-home-library` wrapper; ⌘F finds any input in Home's toolbar slot; the playlist grid's focus ring and missing dimming sit on the whole tile; "next" chip and ✕ lose their blur; drop bar is `--warning`; the preview's corner paint moved into `Preview`. | Parts own their classes; glass only for floats. |
| PresetTile / LibraryGrid | Ink on pictures is `--key-white` over a `--key-black` scrim; ✓ and + chips lose their blur; drop bar `--accent` and lab selection ring `--text-1` (was amber); the grid takes the home look inside `.vs-root`. New `TileGhost` (the dragged tile, a float Layer). | Amber means caution only; glass only for floats. |
| PresetDrawer | A `raised` Layer with core `ButtonFace` toggles. | Depth as a layer. |
| Library | ↓ from search finds the grid by `role="listbox"`; PackOffer's inner button is no longer restyled as a link; credits' drag-over rule moved here. | No reaching into siblings' classes. |
| Popover (app) | Built on core `usePopover`; a wheel outside closes it and it may flip above its button; new `across` prop to open across an element's width. | The top-layer panel can't use the original's `position: static` trick. |
| Crate / StageCrate | The crate's rows are Crate's; StageCrate owns only the panel. LongLists finds the scroller by overflow. | One owner per class. |
| Inspector / Tune / Field | Sections are `Group`s; tune sliders are core `Slider` (`inside`) lit in `--success` with a 1× tick, without the macOS glass rail and knob; the field's tip is a float Layer. | Glass only for floats; kit tokens aren't in the contract. |
| Live / Stage* | StageLayout is a Screen in one `Opaque` with the preview Hole across every cell; the head row is a plain grid cell (keeps `<header>`'s banner role); StageHead no longer styles sibling panels' insides. | Never translucent over the preview. |
| Settings / More effects | Core `Sheet` (right, modal) and bottom non-modal sheet, wrapped in `Opaque`; section labels are `Group`s with `role="heading"`; sheets keep `--control-h: 44px` finger targets; access.css's focus ring and reduced-motion rules live in Settings.css. | zen Sheet; original's target size kept over the principles' 28–32px. |
| Onboarding / CrashPrompt / Update | Core `Modal` in `Opaque`; non-required dialogs gain a ✕; the required flash warning hides it; the dialog is named by `aria-label` (no `aria-describedby`); the main button is `--action`, not green. | Core Modal; green means signal only. |
| HelpOverlay | Its own dialog on `Layer level="top"` sharing the core Modal's focus-trap stack. | Modal's head has no room for the "? or Esc closes" hint. |
| Panels (Output, Link, SourcePicker, AudioInput, Status) | Advanced stays a native `<details>` with channel pickers in a float Layer; green only for signal. No original stories: new ones under `Controls/`. | — |
| Core Segmented | Arrow keys move focus with the choice. | Matches layout `Tabs`. |
| Core Slider | `live` is one lit mark (no six-mark trail, no warming); no wheel (the widget had none). | Simpler; no motion. |
| Core Modal | A `div role="dialog"` around an overlay Layer, rendered in place (no top layer, page behind not `inert`). | Keeps the theme scope's variables. |

Not yet checked in a browser: layout, the popover placement and `across` width, and the frame's desk stand-ins.
