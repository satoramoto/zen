# Tasks

## 1. Stories as scenarios

- [ ] 1.1 Rewrite `SeekBar.stories.tsx` with `scenario()`: one When and one Then per story, every assertion of today's six stories kept, and the pointer stories tagged `browser`. Verified by `STORY_FILTER=music-seek-bar npm run test:stories`, with every story passing, and by `npm run typecheck`
- [ ] 1.2 Write the delta with `npx story-spec sync --change seek-bar-scenarios`. Verified by `openspec validate seek-bar-scenarios --strict`, and by no Given, When or Then in the delta reading `undefined`
- [ ] 1.3 Play the SeekBar stories in both renderers with `node scripts/music-stories.mjs music-seek-bar` against this checkout's Storybook. Verified by every step passing in React and in Svelte

## 2. Merge

- [ ] 2.1 Remove the store's copy of the change from the zen-flow store. Verified by `openspec list --store zen-flow` no longer listing it
- [ ] 2.2 Before merging: `npx story-spec sync --change seek-bar-scenarios --check` reports nothing, the change is archived into `openspec/specs/music-seek-bar`, and zen's `checks` workflow passes. The pull request then merges itself, its branch is deleted and the worktree is removed
