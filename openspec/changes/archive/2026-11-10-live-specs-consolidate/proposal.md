# Proposal

## Why

`live-daw-framework` had to leave the Live specs with their duplicates: story-spec could not write
a removed, renamed or moved requirement (its design D11). story-spec now can (`parameters.spec.retires`),
so the rest of the review can be applied: each rule stated once, the framework's specs naming no
particular pane, and learn mode named for what it is.

## What Changes

No behaviour changes. Requirements are merged, renamed and moved; every scenario keeps its play.

- **Merged.** "Layout intents apply without a store" into "Intents can be applied without a
  store". "Mix's rig documents fit unchanged" and "Version 1 documents still draw" into "A version
  1 document draws", with mix's document as its example.
- **Renamed.** "A pane asks with one intent per gesture" becomes "A pane asks with plain intents"
  (a drag sends one per step).
- **Moved to the kit.** "The Music live panes are a ready-made set" (from the registry) and "The
  live panes declare their settings" (from the settings) to `live-reference-kit`.
- **Moved to parameters.** "A control asks; the app moves the value" from `live-control-panels`
  to `live-parameters`.
- **Renamed capability.** `live-midi-learn` becomes `live-control-learn`: zen does no MIDI; the
  app decides what a control is learned from. Its two requirements move unchanged.
- **Purposes** of the registry, the host contract, the kit and parameters say what they now hold
  (written by `story-spec sync --specs` at archive: a delta can't carry a Purpose).
- zen's `story-spec` pin moves to the version that writes retirements.

**Not in this change:** the form-step scenario stays in the registry (dropping one scenario from
a requirement that stays is refused by `openspec validate`); learn mode beyond the control panel.

## Capabilities

### New Capabilities

- `live-control-learn`: learn mode on a control (was `live-midi-learn`).

### Modified Capabilities

- `live-surface-editing`, `live-surface-document`: merged requirements.
- `live-host-contract`: one requirement renamed.
- `live-pane-registry`, `live-pane-settings`, `live-control-panels`: one requirement each leaves.
- `live-reference-kit`, `live-parameters`: the moved requirements arrive.
- `live-midi-learn`: both requirements leave; the capability is removed at archive.

## Impact

- Story metadata and a few stories moved between files under `src/library/layout/Workspace/` and
  `src/library/Music/live/`. No library source changes. `package.json` and the lockfile (the pin).

## Validation

**Before merging:** `npm run typecheck`; every play under `Design OS/Layout/Workspace` and
`Music/Live`; `story-spec sync --change live-specs-consolidate --dir src/library/layout --dir
src/library/Music/live --check` reporting nothing; `openspec validate live-specs-consolidate
--strict`; the PR's required `checks` job.

**Review:** `look`. Once merged, read `openspec/specs/live-*`: no rule is stated twice.
