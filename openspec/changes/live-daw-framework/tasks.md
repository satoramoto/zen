# Tasks

## 1. The document and the applier (framework-free)

- [ ] 1.1 `surface.ts`: `knownVersion`; the applier returns an unknown version as given; `readTab` and `duplicateTab` keep unknown fields; leaves deduped in `tabRegions` (D1–D3)
- [ ] 1.2 `checkDocument` and `SurfaceIssue`; `intentKind` and `IntentKind` (D2, D4)
- [ ] 1.3 `resolveSettings` reads a value that no longer fits as the default (D8)
- [ ] 1.4 Unit tests for each in `surface.test.ts`; exports from `layout/index.ts` (and so `svelte.ts`)

## 2. The surface

- [ ] 2.1 The unknown-version notice; a repeated leaf drawn once (D1, D2)
- [ ] 2.2 The unbound placeholder for a fixed target that is gone (D5)
- [ ] 2.3 `Contain` in `view/` for both renderers, registered; each region's content inside it; `onPaneError` (D6)
- [ ] 2.4 The story host uses `intentKind`

## 3. Parameters and touch

- [ ] 3.1 `ControlPanel`: `onTouch`, bracketed for fader, knob and XY by pointer and by keyboard, ended on removal (D7)
- [ ] 3.2 The live set's stand-in host records touches

## 4. The scenarios

- [ ] 4.1 `live-surface-document` and `live-surface-editing`: merged requirements, the new integrity, id and intent scenarios
- [ ] 4.2 `live-host-contract`: gestures, containment, the minimal host, two surfaces
- [ ] 4.3 `live-pane-registry`, `live-pane-settings`, `live-panel-layout`: the author's contract, the missing target, invalid values, cramped, lock while editing
- [ ] 4.4 `live-parameters` (moved and new) and `live-control-panels`
- [ ] 4.5 `live-reference-kit` (moved)

## 5. The showcase DAWs

- [ ] 5.1 `Music/live/daws/`: the four documents built by intents, their packs and frames (D9)
- [ ] 5.2 `Music/Live/DAWs` stories and a play each; the `live-reference-kit` scenarios for them
- [ ] 5.3 Each looked at in a browser at its frame size

## 6. Docs and checks

- [ ] 6.1 `docs/workspace.md`, `docs/live-views.md`
- [ ] 6.2 `story-spec sync --change live-daw-framework`, then `--check`; `openspec validate live-daw-framework --strict`
- [ ] 6.3 Every check in the proposal's Validation, with the real output
