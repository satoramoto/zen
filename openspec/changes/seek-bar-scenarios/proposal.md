# Proposal

## Why

The seek bar's stories check how it behaves, but nothing states that behaviour as a spec, so a
change to it has no written contract to be checked against. A trial on 2026-11-07 wrote these
stories as scenarios, then left `main` because story-spec could only be installed from a sibling
checkout. story-spec is now a pinned dependency that zen's scenario stories already use, so the
trial can land.

## What Changes

- `src/library/music/components/SeekBar/SeekBar.stories.tsx` is rewritten with story-spec's
  `scenario()`. Today's six stories become one story per scenario, each with one When and one
  Then, and they keep every assertion the six make today.
- The stories that press or drag the pointer measure the slider's box, so they stay tagged
  `browser`. Keys, the inert states and an out-of-range position play on the virtual DOM.
- `story-spec sync --change seek-bar-scenarios` writes this change's delta from the stories.
- No component code changes.
- The change was planned in the zen-flow store when zen planned there. It now lives in zen's own
  `openspec/`, and the store's copy is removed.

## Capabilities

### New Capabilities

- `music-seek-bar`: seeking by pointer and keyboard, what the bar shows while the host moves,
  and the states in which it is inert.

### Modified Capabilities

None.

## Impact

- zen only: the SeekBar stories file, this change, and `openspec/specs/music-seek-bar` once it is
  archived.
- In Storybook, Music/Components/SeekBar lists one story per scenario, named for it. Each story's
  play shows its Given, When and Then as steps, and the Svelte renderer plays the same steps.

## Validation

**Before merging:**

- `STORY_FILTER=music-seek-bar npm run test:stories`: every SeekBar story passes, on the virtual
  DOM and, for the stories tagged `browser`, in the browser.
- `node scripts/music-stories.mjs music-seek-bar --url <this checkout's Storybook>`: every story
  passes in React and in Svelte.
- `npm run typecheck`.
- `npx story-spec sync --change seek-bar-scenarios --check` reports nothing, and
  `openspec validate seek-bar-scenarios --strict` passes.
- zen's `checks` workflow passes on the pull request.

**Review:** `look`. Once it merges, read the new `music-seek-bar` spec, whose scenario names and
Then lines become the seek bar's manual page.
