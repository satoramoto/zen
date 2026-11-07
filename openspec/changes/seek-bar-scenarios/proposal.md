# Proposal

## Why

The seek bar's behaviour is already exercised by its Storybook stories, but nothing states it as a spec, so a change to it has no written contract to be checked against. This change makes the stories that contract: each story declares its scenario in words, and the spec is written from them.

## What Changes

- Rewrite `SeekBar.stories.tsx` as scenarios with `story-spec`'s `scenario()`: the same assertions as before, split so each story has one When and one Then, run as named steps in React and Svelte alike.
- Generate this delta with `npx story-spec sync --change seek-bar-scenarios --dir src/library/Music`; `--check` refuses drift.

## Capabilities

### New Capabilities

- `music-seek-bar`: seeking by pointer and keyboard, and the inert states.

### Modified Capabilities

- None.

## Impact

- `src/library/Music/music/SeekBar.stories.tsx`, the `story-spec` dev dependency, `openspec/`.
- No component code changes.
