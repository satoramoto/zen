# Tasks

## 1. The document and the applier (framework-free)

- [x] 1.1 `surface.ts`: `knownVersion`; the applier returns an unknown version as given; `readTab` and `duplicateTab` keep unknown fields; leaves deduped in `tabRegions` (D1–D3)
- [x] 1.2 `checkDocument` and `SurfaceIssue`; `intentKind` and `IntentKind` (D2, D4)
- [x] 1.3 `resolveSettings` reads a value that no longer fits as the default (D8)
- [x] 1.4 Unit tests for each in `surface.test.ts`; exports from `layout/index.ts` (and so `svelte.ts`)

## 2. The surface

- [x] 2.1 The unknown-version notice; a repeated leaf drawn once (D1, D2)
- [x] 2.2 The unbound placeholder for a fixed target that is gone (D5)
- [x] 2.3 `Contain` in `view/` for both renderers, registered, with a test in each; each region's content inside it; `onPaneError` (D6)
- [x] 2.4 The story host uses `intentKind`

## 3. Parameters and touch

- [x] 3.1 `ControlPanel`: `onTouch`, bracketed for fader, knob and XY by pointer and by keyboard, ended on removal (D7)
- [x] 3.2 The live set's stand-in host records touches

## 4. The scenarios

- [x] 4.1 `live-surface-document` and `live-surface-editing`: the sharpened texts, the new integrity, id and intent scenarios (no merge: design D11)
- [x] 4.2 `live-host-contract`: gestures, containment, the minimal host, two surfaces
- [x] 4.3 `live-pane-registry`, `live-pane-settings`, `live-panel-layout`: the author's contract, the missing target, invalid values, cramped, lock while editing
- [x] 4.4 `live-parameters`: the catalogue and touch (the asks stay in `live-control-panels`: D11)
- [x] 4.5 `live-reference-kit`: the whole DAWs (the Music set's requirements stay where they are: D11)

## 5. The showcase DAWs

- [x] 5.1 `Music/live/daws/`: the four documents built by intents, their packs and frames (D9)
- [x] 5.2 `Music/Live/DAWs` stories and a play each; the `live-reference-kit` scenarios for them
- [x] 5.3 Each looked at in a browser at its frame size

## 6. Docs and checks

- [x] 6.1 `docs/workspace.md`, `docs/live-views.md`
- [x] 6.2 `story-spec sync --change live-daw-framework`, then `--check`; `openspec validate live-daw-framework --strict`
- [x] 6.3 Every check in the proposal's Validation, with the real output
