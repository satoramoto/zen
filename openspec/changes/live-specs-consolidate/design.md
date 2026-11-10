# Design

## Context

Follows `live-daw-framework` (design D11). story-spec now reads `parameters.spec.retires` on a
stories file's meta and writes REMOVED and RENAMED sections from it.

## Decisions

### D1. A move is an add and a retirement

A requirement moves when stories in the receiving capability's file cover it (ADDED there) and
the file it left retires it, saying where it went. The scenarios move with their stories:
`Kit.stories.tsx` for the kit, `Parameters.stories.tsx` for the asks.

### D2. A merge keeps every scenario

The surviving requirement takes the other's scenarios under its own text; the other is retired
with "Merged into …". No play is dropped.

### D3. Renaming a capability

OpenSpec has no capability rename. `Learn.stories.tsx` names `live-control-learn` and retires
both requirements from `live-midi-learn` by naming that capability in the entries. The archive
leaves `live-midi-learn` with no requirements; its folder is deleted in the archive commit.

### D4. Purposes

Written by `story-spec sync --specs` in the archive commit, from the stories' `purpose`.

### D5. The retirements stay in the stories

A retirement whose requirement the spec no longer has is spent and writes nothing, so the
declarations stay as the record of the decision until a later tidy.

## Risks / Trade-offs

- Story ids change for the moved stories (`Music/Live/Reference kit`, `Music/Live/Parameters`).
  Nothing links to them by id.
