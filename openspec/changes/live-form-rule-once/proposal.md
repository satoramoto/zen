# Proposal

## Why

One Live rule is still stated in two specs: the scenario "Forms step down on a small window" sits
under the registry's "The app defines its pane kinds", while which form a region draws is
`live-panel-layout`'s rule ("A region draws the largest form its room fits").

## What Changes

No behaviour changes.

- The scenario moves to `live-panel-layout`, under "A region draws the largest form its room fits".
- OpenSpec refuses a modified requirement that drops a scenario, so the registry's requirement is
  retired and restated under a new name, "An app defines its own pane kinds", with its other two
  scenarios and the same text.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `live-pane-registry`: "The app defines its pane kinds" is restated as "An app defines its own
  pane kinds" without the form scenario.
- `live-panel-layout`: the form rule gains the scenario.

## Impact

- Story metadata, and one story moved from `Panes.stories.tsx` to `Layout.stories.tsx`.

## Validation

**Before merging:** `npm run typecheck`; the plays under `Music/Live/Pane registry` and
`Design OS/Layout/Workspace/Building`; `story-spec sync --change live-form-rule-once --dir
src/library/layout --dir src/library/Music/live --check` reporting nothing; `openspec validate
live-form-rule-once --strict`; the PR's required `checks` job.

**Review:** `none`.
